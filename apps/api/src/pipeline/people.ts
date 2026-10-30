import type { PeopleAction, PeopleResponse, PersonCard, RequestStatus, SensitivityLevel } from '@editorial-art/shared-types';
import type { Likeness, RequestPerson } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { audit } from '../lib/audit';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { ApiError, StageError } from '../lib/errors';
import { logger } from '../lib/logger';
import { realPeopleAllowed } from '../lib/real-people';
import { fetchRemoteImage, RemoteImageError } from '../lib/remote-image';
import { stylesByIds } from '../library/styles';
import { commonsImage, downloadCommonsImage, resolvePerson, type Candidate, type PersonContext } from '../library/wikimedia';
import { providers } from '../providers';
import { createBatch, planSlots } from './batches';
import { emitRequestStatus } from './events';
import { fold, realFacesAllowedFor } from './guard/sensitivity';
import type { PeopleEntry } from './read';
import { moveRequest } from './state';

/**
 * Real faces of public figures (EA_REAL_PEOPLE). After the read, each named public figure who
 * would be drawn with a face, and has no ACTIVE likeness yet, is looked up on Wikidata
 * (library/wikimedia.ts). Each confident match becomes a CANDIDATE likeness with its Commons photo
 * copied to our storage, and the request waits in NEEDS_PEOPLE_CONFIRM until the editor decides
 * for every person: use the photo (it becomes ACTIVE for everyone), try the next match, upload
 * their own, or show the person without a face. Then the first batch is made as usual.
 *
 * Nothing here runs when the gate is off or the actor is not allowed, when the story is sensitive,
 * or when no style of the first batch would draw a face: people are then shown symbolically,
 * exactly as before.
 */

/** People looked up per request; an option takes at most two likenesses anyway. */
const MAX_PEOPLE = 4;
/** Editor uploads come from AI Studio's own Cloudinary uploads. */
const UPLOAD_HOSTS = ['https://res.cloudinary.com/'] as const;

const Photo = z.object({ url: z.string(), publicId: z.string().optional(), width: z.number().optional(), height: z.number().optional() });
const Candidates = z.array(z.object({ wikidataId: z.string(), label: z.string(), description: z.string(), imageFile: z.string(), score: z.number() }));

/** Faces are never drawn for a sensitive story (the same line the people policy in read.ts draws). */
export function realFacesAllowedAt(level: SensitivityLevel | null | undefined): boolean {
  return level === 'NONE';
}

/** The ACTIVE likenesses the read may match names against: none unless the gate lets this actor have faces. */
export async function activeLikenessNames(actorRole: string): Promise<{ id: string; name: string; aliases: string[] }[]> {
  if (!realPeopleAllowed(actorRole)) return [];
  return db.likeness.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, aliases: true } });
}

/**
 * Leads the read's message when the gate lets this actor have real faces (empty otherwise, so the
 * read is exactly as before): the read prompt prefers ideas without people, and without this a
 * story about a boardroom fight would rarely show the people in it.
 */
export function realFacesNote(actorRole: string): string {
  if (!realPeopleAllowed(actorRole)) return '';
  return 'REAL FACES\nNamed public figures (politicians, executives, officials, celebrities; never minors or private people) can be drawn as a respectful, recognisable likeness in illustrated styles. When the story turns on such people, or a public figure among the identity cues embodies the main subject (its founder, chair or chief executive), at least one direction should show that person with "how": "illustrated", acting out the story, when it fits the story naturally. The people policy still applies.\n\n';
}

const key = (name: string) => fold(name).replace(/\s+/g, ' ').trim();

interface ReadPersonLite {
  name: string;
  role?: string;
  isPublicFigure: boolean;
  isMinor: boolean;
}

interface Entities {
  people?: ReadPersonLite[];
  orgs?: string[];
  places?: string[];
}

/**
 * Who would be drawn with a face in the first batch and still needs a likeness: illustrated, no
 * likeness matched, in a direction the first batch uses whose style allows real people, and a
 * public figure who is not a minor by the read's own account. At most MAX_PEOPLE, in story order.
 */
export function peopleToConfirm(input: {
  directions: { id: string; rank: number; suggestedStyleId: string; peopleDepicted: PeopleEntry[] }[];
  requestStyleId: string | null;
  realPeopleStyles: Set<string>;
  people: ReadPersonLite[];
}): ReadPersonLite[] {
  const slots = planSlots(
    'INITIAL',
    input.directions.map((d) => ({ ...d, idea: '', title: '' })),
    { requestStyleId: input.requestStyleId }
  );
  const drawn = new Set<string>();
  for (const slot of slots) {
    if (!input.realPeopleStyles.has(slot.styleId)) continue;
    const direction = input.directions.find((d) => d.id === slot.directionId);
    for (const p of direction?.peopleDepicted ?? []) if (p.how === 'illustrated' && !p.likenessId) drawn.add(key(p.name));
  }
  const out: ReadPersonLite[] = [];
  for (const p of input.people) {
    if (!p.isPublicFigure || p.isMinor || !drawn.has(key(p.name)) || out.some((o) => key(o.name) === key(p.name))) continue;
    out.push(p);
  }
  return out.slice(0, MAX_PEOPLE);
}

async function toWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).rotate().resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
}

async function storePhoto(likenessId: string, buffer: Buffer, tag: string): Promise<z.infer<typeof Photo>> {
  const up = await providers().upload(
    { buffer: await toWebp(buffer), mimeType: 'image/webp' },
    { folder: `${env().EA_CLOUDINARY_FOLDER}/likeness/${likenessId}`, publicId: `${tag}-${randomUUID().slice(0, 8)}`, format: 'webp', tags: ['likeness', tag] }
  );
  return { url: up.url, publicId: up.publicId, width: up.width, height: up.height };
}

function hasPhoto(l: Likeness): boolean {
  const photos = z.array(Photo).safeParse(l.photos);
  return photos.success && photos.data.length > 0;
}

/**
 * The likeness for a Wikidata match: the one already on file for that person (a retired one means
 * an admin took it down: no face), else a new CANDIDATE with the Commons photo copied to our
 * storage. Null when the file is missing, not freely licensed, or cannot be fetched.
 */
async function likenessForCandidate(c: Candidate): Promise<Likeness | null> {
  const existing = await db.likeness.findMany({ where: { wikidataId: c.wikidataId }, orderBy: { createdAt: 'desc' } });
  if (existing.some((l) => l.status === 'RETIRED')) return null;
  const usable = existing.find((l) => l.status === 'ACTIVE' && hasPhoto(l)) ?? existing.find(hasPhoto);
  if (usable) return usable;

  const image = await commonsImage(c.imageFile);
  if (!image) return null;
  const downloaded = await downloadCommonsImage(image.thumbUrl);
  const id = randomUUID();
  const photo = await storePhoto(id, downloaded.buffer, 'wikimedia');
  return db.likeness.create({
    data: {
      id,
      name: c.label,
      aliases: [],
      photos: [photo],
      consentNote: `Public figure (Wikidata ${c.wikidataId}). Photo: ${image.author}, Wikimedia Commons, ${image.licence}.`.slice(0, 500),
      approvedBy: 'wikimedia',
      status: 'CANDIDATE',
      source: 'WIKIMEDIA',
      wikidataId: c.wikidataId,
      description: c.description ? c.description.slice(0, 200) : null,
      commonsPage: image.pageUrl,
      licence: image.licence,
      licenceUrl: image.licenceUrl,
      credit: image.author,
    },
  });
}

/** The first of these candidates that yields a usable likeness. */
async function firstLikeness(candidates: Candidate[]): Promise<{ candidate: Candidate; likeness: Likeness } | null> {
  for (const candidate of candidates) {
    const likeness = await likenessForCandidate(candidate).catch((err: unknown) => {
      logger.warn({ err: err instanceof Error ? err.message : String(err), wikidataId: candidate.wikidataId }, 'likeness_candidate_failed');
      return null;
    });
    if (likeness) return { candidate, likeness };
  }
  return null;
}

/**
 * Called by the read once the brief is saved. Looks the people up and, when at least one needs
 * the editor, moves the request to NEEDS_PEOPLE_CONFIRM and returns true. False means carry on
 * exactly as before.
 */
export async function pauseForPeople(requestId: string): Promise<boolean> {
  const request = await db.request.findUnique({ where: { id: requestId } });
  if (!request || request.status !== 'READING' || !realPeopleAllowed(request.actorRole)) return false;
  const brief = await db.brief.findFirst({ where: { requestId }, orderBy: { version: 'desc' }, include: { directions: true } });
  if (!brief || !realFacesAllowedAt(brief.sensitivity)) return false;

  const directions = brief.directions.map((d) => ({ ...d, peopleDepicted: d.peopleDepicted as unknown as PeopleEntry[] }));
  const styles = await stylesByIds(directions.map((d) => d.suggestedStyleId));
  const realPeopleStyles = new Set([...styles.values()].filter((s) => realFacesAllowedFor(s, brief.sensitivity)).map((s) => s.id));
  if (!realPeopleStyles.size) return false;
  const entities = (brief.entities ?? {}) as Entities;
  const wanted = peopleToConfirm({ directions, requestStyleId: request.styleId, realPeopleStyles, people: entities.people ?? [] });
  if (!wanted.length) return false;

  const ctx: PersonContext = {
    orgs: entities.orgs ?? [],
    india: brief.desk !== 'world' || (entities.places ?? []).some((p) => /india|delhi|mumbai|bengaluru|bangalore|chennai|kolkata|hyderabad/i.test(p)),
  };
  const found = await Promise.all(
    wanted.map(async (p) => {
      const resolution = await resolvePerson(p.name, { ...ctx, role: p.role ?? '' });
      if (!resolution) return null;
      const first = await firstLikeness([resolution.best]);
      if (!first) return null;
      return { person: p, likeness: first.likeness, alternatives: resolution.alternatives, tried: [resolution.best.wikidataId] };
    })
  );

  // A retried read starts the list again; nothing is decided while the request is still READING.
  await db.requestPerson.deleteMany({ where: { requestId } });
  const rows: { name: string; otherNames: string[]; role: string; likenessId: string; candidates: Candidate[]; tried: string[] }[] = [];
  for (const f of found) {
    if (!f) continue;
    const same = rows.find((r) => r.likenessId === f.likeness.id);
    if (same) same.otherNames.push(f.person.name);
    else rows.push({ name: f.person.name, otherNames: [], role: (f.person.role ?? '').slice(0, 120), likenessId: f.likeness.id, candidates: f.alternatives, tried: f.tried });
  }
  if (!rows.length) return false;
  await db.requestPerson.createMany({ data: rows.map((r) => ({ ...r, requestId, candidates: r.candidates as object })) });

  if (!(await moveRequest(requestId, 'NEEDS_PEOPLE_CONFIRM', {}, ['READING']))) return false;
  emitRequestStatus(request.publicId, 'NEEDS_PEOPLE_CONFIRM', { directionsReady: true });
  logger.info({ eaRequestId: request.publicId, people: rows.length }, 'people_confirm_needed');
  await audit({ action: 'people.pause', targetType: 'request', targetId: request.publicId, actorUserId: request.actorUserId, metadata: { people: rows.map((r) => r.name) } });
  return true;
}

// ---- what the editor sees ------------------------------------------------------------------

type PersonRow = RequestPerson & { likeness: Likeness | null };

export function personCard(row: PersonRow): PersonCard | null {
  const l = row.likeness;
  if (!l) return null;
  const photos = z.array(Photo).safeParse(l.photos);
  const candidates = Candidates.safeParse(row.candidates);
  const untried = (candidates.success ? candidates.data : []).filter((c) => !row.tried.includes(c.wikidataId));
  const wikimedia = l.source === 'WIKIMEDIA';
  return {
    likenessId: l.id,
    name: row.name,
    role: row.role,
    label: l.name,
    description: l.description,
    photoUrl: photos.success ? (photos.data[0]?.url ?? null) : null,
    source: l.source,
    sourceLine: wikimedia && l.licence ? `Wikimedia Commons, ${l.licence}` : null,
    author: wikimedia ? l.credit : null,
    sourcePage: wikimedia ? l.commonsPage : null,
    decision: row.decision,
    canSwap: row.decision === 'PENDING' && untried.length > 0,
  };
}

export async function peopleView(request: { id: string; status: RequestStatus }): Promise<PeopleResponse> {
  const rows = await db.requestPerson.findMany({ where: { requestId: request.id }, include: { likeness: true }, orderBy: [{ createdAt: 'asc' }, { name: 'asc' }] });
  return {
    status: request.status,
    waiting: request.status === 'NEEDS_PEOPLE_CONFIRM',
    people: rows.map(personCard).filter((c): c is PersonCard => !!c),
  };
}

// ---- the editor's decisions ----------------------------------------------------------------

function withAliases(likeness: Likeness, names: string[]): string[] {
  const known = new Set([likeness.name, ...likeness.aliases].map(key));
  const added = names.filter((n) => n.trim() && !known.has(key(n)));
  return [...likeness.aliases, ...added].slice(0, 10);
}

async function settle(personId: string, data: Record<string, unknown>, actorUserId: string): Promise<void> {
  const { count } = await db.requestPerson.updateMany({ where: { id: personId, decision: 'PENDING' }, data: { ...data, decidedBy: actorUserId, decidedAt: new Date() } });
  if (count !== 1) throw ApiError.invalidState('This person has already been decided.');
}

export interface DecisionInput {
  request: { id: string; publicId: string; status: RequestStatus };
  likenessId: string;
  action: PeopleAction;
  url?: string;
  actor: { userId: string };
}

export async function decidePerson(input: DecisionInput): Promise<void> {
  if (input.request.status !== 'NEEDS_PEOPLE_CONFIRM') throw ApiError.invalidState('This article is not waiting for people to be confirmed.');
  const person = await db.requestPerson.findFirst({ where: { requestId: input.request.id, likenessId: input.likenessId }, include: { likeness: true } });
  if (!person?.likeness) throw ApiError.notFound('That person is not part of this article.');
  if (person.decision !== 'PENDING') throw ApiError.invalidState('This person has already been decided.');
  const likeness = person.likeness;

  switch (input.action) {
    case 'use': {
      await settle(person.id, { decision: 'USE' }, input.actor.userId);
      await db.likeness.update({
        where: { id: likeness.id },
        data: {
          aliases: withAliases(likeness, [person.name, ...person.otherNames]),
          ...(likeness.status === 'CANDIDATE' ? { status: 'ACTIVE', approvedBy: input.actor.userId } : {}),
        },
      });
      await audit({ action: 'likeness.use', targetType: 'likeness', targetId: likeness.id, actorUserId: input.actor.userId, metadata: { eaRequestId: input.request.publicId, name: person.name, source: likeness.source, wikidataId: likeness.wikidataId } });
      break;
    }
    case 'swap': {
      const candidates = Candidates.safeParse(person.candidates);
      const untried = (candidates.success ? candidates.data : []).filter((c) => !person.tried.includes(c.wikidataId));
      const next = await firstLikeness(untried);
      // Every candidate looked at is spent, found or not, so "Try another" never offers it again.
      const spent = next ? untried.slice(0, untried.indexOf(next.candidate) + 1) : untried;
      await db.requestPerson.updateMany({
        where: { id: person.id, decision: 'PENDING' },
        data: { tried: [...person.tried, ...spent.map((c) => c.wikidataId)], ...(next ? { likenessId: next.likeness.id } : {}) },
      });
      if (!next) throw new ApiError('NO_OTHER_MATCH', 409, 'We found no one else by this name. Upload a photo or show them without a face.');
      await audit({ action: 'people.decision', targetType: 'request', targetId: input.request.publicId, actorUserId: input.actor.userId, metadata: { action: 'swap', name: person.name, from: likeness.id, to: next.likeness.id } });
      return;
    }
    case 'upload': {
      if (!input.url) throw ApiError.validation({ fieldErrors: { url: ['required for upload'] } }, 'Attach the photo to use.');
      let image: { buffer: Buffer };
      try {
        image = await fetchRemoteImage(input.url, { allow: UPLOAD_HOSTS, timeoutMs: 15_000, maxBytes: 15 * 1024 * 1024 });
      } catch (error) {
        if (error instanceof RemoteImageError) throw new ApiError('UPLOAD_INVALID', 400, error.message);
        throw error;
      }
      const id = randomUUID();
      const photo = await storePhoto(id, image.buffer, 'upload');
      await db.likeness.create({
        data: {
          id,
          name: person.name,
          aliases: person.otherNames.slice(0, 10),
          photos: [photo],
          consentNote: 'Uploaded by an editor while confirming the people in a story.',
          approvedBy: input.actor.userId,
          status: 'ACTIVE',
          source: 'UPLOAD',
        },
      });
      await settle(person.id, { decision: 'UPLOAD', likenessId: id }, input.actor.userId);
      await audit({ action: 'likeness.create', targetType: 'likeness', targetId: id, actorUserId: input.actor.userId, metadata: { eaRequestId: input.request.publicId, name: person.name, source: 'UPLOAD' } });
      break;
    }
    case 'symbolic': {
      await settle(person.id, { decision: 'SYMBOLIC' }, input.actor.userId);
      await audit({ action: 'people.decision', targetType: 'request', targetId: input.request.publicId, actorUserId: input.actor.userId, metadata: { action: 'symbolic', name: person.name } });
      break;
    }
  }
  await resumeIfDecided(input.request.id);
}

/** Writes the decisions into the latest brief's directions, so batches pick them up as usual. */
async function applyDecisions(requestId: string): Promise<void> {
  const [people, brief] = await Promise.all([
    db.requestPerson.findMany({ where: { requestId } }),
    db.brief.findFirst({ where: { requestId }, orderBy: { version: 'desc' }, include: { directions: true } }),
  ]);
  if (!brief) return;
  for (const direction of brief.directions) {
    const entries = direction.peopleDepicted as unknown as PeopleEntry[];
    const next = entries.map((e) => {
      if (e.how !== 'illustrated') return e;
      const p = people.find((x) => [x.name, ...x.otherNames].some((n) => key(n) === key(e.name)));
      if (!p) return e;
      if (p.decision === 'SYMBOLIC') return { ...e, how: 'symbolised' as const, likenessId: null };
      if (p.decision === 'USE' || p.decision === 'UPLOAD') return { ...e, likenessId: p.likenessId };
      return e;
    });
    if (JSON.stringify(next) !== JSON.stringify(entries)) await db.direction.update({ where: { id: direction.id }, data: { peopleDepicted: next as object } });
  }
}

/** Once every person is decided, the request carries on to its first batch. True when this call moved it. */
export async function resumeIfDecided(requestId: string): Promise<boolean> {
  const pending = await db.requestPerson.count({ where: { requestId, decision: 'PENDING' } });
  if (pending) return false;
  const request = await db.request.findUnique({ where: { id: requestId } });
  if (!request || request.status !== 'NEEDS_PEOPLE_CONFIRM') return false;
  await applyDecisions(requestId);
  if (!(await moveRequest(requestId, 'DIRECTIONS_READY', {}, ['NEEDS_PEOPLE_CONFIRM']))) return false;
  emitRequestStatus(request.publicId, 'DIRECTIONS_READY');
  try {
    await createBatch({ requestId, kind: 'INITIAL', requestedBy: request.actorUserId, realPeople: realPeopleAllowed(request.actorRole) });
  } catch (error) {
    if (!(error instanceof StageError)) throw error;
    await moveRequest(requestId, 'FAILED', { failureCode: error.code, failureReason: error.message });
    emitRequestStatus(request.publicId, 'FAILED');
  }
  return true;
}

/**
 * Turning the gate off (or narrowing it) releases every request still waiting on people its
 * creator may no longer have: they carry on, drawing everyone symbolically. Run by the reaper.
 */
export async function releaseWhenGateCloses(): Promise<number> {
  const paused = await db.request.findMany({ where: { status: 'NEEDS_PEOPLE_CONFIRM' }, select: { id: true, actorRole: true } });
  let released = 0;
  for (const r of paused) {
    if (realPeopleAllowed(r.actorRole)) continue;
    await db.requestPerson.updateMany({ where: { requestId: r.id, decision: 'PENDING' }, data: { decision: 'SYMBOLIC', decidedBy: 'system', decidedAt: new Date() } });
    if (await resumeIfDecided(r.id)) released++;
  }
  return released;
}

// ---- credit --------------------------------------------------------------------------------

/** "Face reference: {author}, Wikimedia Commons, {licence}" for each Commons likeness an option used. */
export async function faceCredits(likenessIds: string[]): Promise<string[]> {
  if (!likenessIds.length) return [];
  const rows = await db.likeness.findMany({ where: { id: { in: likenessIds }, source: 'WIKIMEDIA' } });
  return likenessIds
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is Likeness => !!r)
    .map((r) => `Face reference: ${r.credit || 'Unknown author'}, Wikimedia Commons, ${r.licence ?? 'licence on file'}`);
}

export function withFaceCredits(base: string, credits: string[]): string {
  if (!credits.length) return base;
  return [base.replace(/[.\s]+$/, ''), ...credits].join('. ');
}
