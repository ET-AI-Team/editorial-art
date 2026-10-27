# editorial-art runbook

How to set up, check and fix the ET Article art service on the box (10.71.77.228). No secrets
appear in this file: every key lives only in `/data/products/editorial-art/.env`.

| Thing | Where |
|---|---|
| Code | `/data/products/editorial-art` (a clean git checkout; nobody edits here) |
| Service | systemd unit `editorial-art` |
| API and Socket.IO | `127.0.0.1:7202` (loopback only) |
| Health | `curl -s http://127.0.0.1:7202/health` (up) and `/ready` (Postgres and Redis answer) |
| Logs | `/data/products/editorial-art/logs/editorial-art.log`, plus `-purge`, `-health`, `-sweep` logs |
| Database | `editorial_art` on the local Postgres, role `editorial_art` |
| Queues | the shared Redis at 127.0.0.1:6379, key prefix `ea` |
| Images | Cloudinary, folder `editorial-art/` |
| bun | `/data/abhigyan.raj/.bun/bin/bun` |

Run every `bun` command below from `/data/products/editorial-art/apps/api` with the env loaded:

```bash
cd /data/products/editorial-art/apps/api
set -a; . /data/products/editorial-art/.env; set +a
```

---

## 1. First-time setup

Show each `sudo` command to the owner before running it.

### 1.1 Product slot and port

```bash
sudo /data/products/_infra/bin/new-product editorial-art https://github.com/AbhigyanRaj/editorial-art.git
```

editorial-art is part of AI Studio, so it uses AI Studio's 7200 block (7202 for the API, 7203 for an optional
worker-only health port) instead of a block of its own. Add this row to
`/data/products/_infra/registry.tsv` (tab-separated) and commit it in `_infra`:

```
7200	ai-studio	editorial-art API + Socket.IO + workers	7202	127.0.0.1	editorial-art	http://127.0.0.1:7202/health
```

### 1.2 Database

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE editorial_art LOGIN PASSWORD '<generated: openssl rand -base64 32 | tr -d /=+>';
CREATE DATABASE editorial_art OWNER editorial_art;
\c editorial_art
CREATE EXTENSION IF NOT EXISTS vector;
REVOKE ALL ON DATABASE editorial_art FROM PUBLIC;
SQL
```

The role owns only its own database and cannot read `design_pipeline` or AI Studio's database.
Confirm Redis keeps BullMQ data: `redis-cli config get maxmemory-policy` must say `noeviction`
(do not change a shared Redis setting without its owners).

### 1.3 Environment

```bash
cp .env.example /data/products/editorial-art/.env
chmod 0660 /data/products/editorial-art/.env
chgrp et-product-dev /data/products/editorial-art/.env
```

Fill in: `DATABASE_URL` (with the generated password), `EA_INTERNAL_API_KEYS`
(`openssl rand -hex 32`), and the OpenAI, Gemini and Cloudinary keys (copy from the
design-pipeline `.env` file to file; never paste them into chat or a terminal history). Keep
`EA_HOST=127.0.0.1` and `EA_PORT=7202`. AI Studio's `.env` gets `EDITORIAL_ART_API_URL`,
`EDITORIAL_ART_API_KEY` (the same internal key) and `EDITORIAL_ART_ENABLED=false` at first.

### 1.4 Install, migrate, seed

```bash
cd /data/products/editorial-art
bun install --frozen-lockfile
bun run --cwd apps/api prisma:generate
bun run --cwd apps/api prisma:deploy
bun run --cwd apps/api seed:styles
mkdir -p logs
```

### 1.5 Units and timers

```bash
sudo cp ops/editorial-art*.service ops/editorial-art-*.timer /etc/systemd/system/
cp ops/editorial-art*.service ops/editorial-art-*.timer /data/products/_infra/systemd/
sudo systemctl daemon-reload
sudo systemctl enable --now editorial-art
sudo systemctl enable --now editorial-art-purge.timer editorial-art-health.timer editorial-art-sweep.timer
```

### 1.6 Sudo rule for the deploy runner

```bash
sudo install -m 0440 -o root -g root ops/sudoers-editorial-art /tmp/editorial-art.sudoers
sudo visudo -cf /tmp/editorial-art.sudoers && sudo mv /tmp/editorial-art.sudoers /etc/sudoers.d/editorial-art
```

It allows exactly `systemctl restart editorial-art` and `systemctl status editorial-art`.

### 1.7 Deploy runner

A self-hosted GitHub Actions runner registered to this repository with the label
`editorial-art`, running as `abhigyan.raj`, the same way the AI Studio and design-pipeline
runners on this box are set up:

```bash
mkdir -p ~/actions-runner-editorial-art && cd ~/actions-runner-editorial-art
tar xzf ~/actions-runner-linux-x64-2.337.0.tar.gz
./config.sh --url https://github.com/<owner>/editorial-art --token <registration token> \
  --labels editorial-art --name editorial-art-host --unattended
sudo ./svc.sh install abhigyan.raj && sudo ./svc.sh start
```

The registration token comes from the repository's Actions settings (or the API) and expires in
an hour. After the repository is transferred, re-register the runner against the new owner.

### 1.8 Check it

- `products-status` shows editorial-art healthy.
- `ss -ltnp | grep 7202` shows `127.0.0.1:7202` only; connecting from another machine fails.
- `curl -s http://127.0.0.1:7202/ready` returns `{"status":"ready"}`.
- `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:7202/api/v1/styles` returns `401`.
- `bun run smoke:live` passes (costs about Rs 50).

---

## 2. Service down

1. `systemctl status editorial-art` and `tail -n 200 /data/products/editorial-art/logs/editorial-art.log`.
2. `curl -s http://127.0.0.1:7202/ready`: a `failing` list names Postgres or Redis.
3. A startup line `Invalid configuration:` names the variable that is missing or malformed in `.env`.
4. A migration problem: `bun run --cwd apps/api prisma:deploy`, then `npx prisma migrate status` from `apps/api`.
5. Restart: `sudo systemctl restart editorial-art`. If it keeps failing after a deploy, the CI job
   has already rolled back; check its log, or reset by hand to the previous commit, reinstall and restart.

## 3. Stuck requests

The reaper runs every minute and re-queues or fails rows left without a job. If requests stay
stuck:

```sql
-- timestamps are timestamptz in this database, so now() comparisons are safe
SELECT "publicId", status, "updatedAt" FROM "Request"
WHERE status IN ('RECEIVED', 'READING') AND "updatedAt" < now() - interval '10 minutes';

SELECT id, state, "updatedAt" FROM "Option"
WHERE state IN ('PENDING', 'GENERATING', 'FINALIZING', 'PACKING') AND "updatedAt" < now() - interval '15 minutes';
```

- Check Redis: `redis-cli ping`, and that `ea:*` keys exist.
- Check the reaper is running: look for `reaper_action` lines in the log.
- Workers stuck on one provider: see section 4.

## 4. Provider down

- `grep provider_error logs/editorial-art.log | tail` shows the stage, model and status.
- Previews already fall back from `EA_PREVIEW_MODEL` to `EA_PREVIEW_FALLBACK_MODEL`, and finals
  from Gemini to `EA_FINAL_FALLBACK_MODEL` (gpt-image-2).
- If one model is out for long, point its variable at the fallback in `.env` and restart.
- If OpenAI is down, reading articles fails; requests fail with a clear message and nothing is spent.

## 5. Cost spike

1. `bun run report:weekly` (or `GET /api/v1/admin/spend` through AI Studio) for totals.
2. Top requests by cost:
   ```sql
   SELECT "publicId", "costInr", "createdAt" FROM "Request" ORDER BY "costInr" DESC LIMIT 20;
   ```
3. Many batches on one request, or many requests from one user, point to a loop or misuse
   (`AuditEvent` has who did what).
4. Lower `EA_DAILY_SPEND_CAP_INR` or `EA_REQUEST_SPEND_CAP_INR` in `.env` and restart. The caps
   stop paid calls before they are made.

## 6. Leaked internal key

1. Generate a new key: `openssl rand -hex 32`.
2. Add it to `EA_INTERNAL_API_KEYS` (comma-separated, keep the old one for now) and restart editorial-art.
3. Put the new key in AI Studio's `EDITORIAL_ART_API_KEY` and restart AI Studio's API.
4. Remove the old key from `EA_INTERNAL_API_KEYS` and restart editorial-art.
5. Look for misuse: `SELECT "callerKeyId", count(*) FROM "Request" GROUP BY 1;` (the fingerprint
   is the first 6 hex characters of the key's sha256).

Provider keys: rotate in the provider's console, then update `.env` and restart.

## 7. Bad image published

1. Find the option from the image URL (its path contains the request id and option id):
   ```sql
   SELECT o.id, r."publicId", o.judge, o."referenceIds", o."styleId"
   FROM "Option" o JOIN "Request" r ON r.id = o."requestId"
   WHERE o."finalUrl" = '<url>' OR o."previewUrl" = '<url>';
   ```
2. Record what went wrong (the judge verdict is on the option).
3. If a reference looks responsible, reject it on the Admin style screen; it stops being picked at once.
4. If a style keeps producing problems, retire it on the Admin screen.
5. Tell the desk; replacing the published image is an editorial decision.

## 8. Routine

- Daily 02:30 IST: retention purge (`editorial-art-purge.timer`).
- Every 5 minutes: health and spend alerts (`editorial-art-health.timer`, `health_alert` log lines).
- Weekly, Monday 03:30 IST: Cloudinary orphan sweep (`editorial-art-sweep.timer`).
- Weekly: read `bun run report:weekly`; retire never-picked references. The artist library is frozen: add
  images only through the steps in section 9.
- Quarterly: rotate the internal API key (section 6).

## 9. Artist library

The style references are real artists' published images: 33 styles in 9 families, about 20 images
per style from at least four artists, every image stored with its artist and the page it came from.
A person picks every reference by hand; the scripts collect and screen candidates, and the import
loads only what was picked.

Steps 1 to 4 run on a developer machine with `apps/api/.env` pointing at the local dev database
(the screen step records its spend there) and at the Cloudinary account the box uses. Steps 0 and 5
run on the box. `<research>` is the folder of research JSON files (one per family) and `<out>` a
working folder outside the repo.

0. **Fresh start** (once, when a new library replaces the old one): seed the new styles, then
   retire every approved or candidate reference, clear every cover, move LIVE and CURATING styles
   back to DRAFT and retire styles no longer in STYLE_LIBRARY.md. Nothing is deleted (rows and
   Cloudinary images stay) and requests are not touched. It is a dry run unless `--apply` is
   passed. The gallery shows the change within 60 seconds (its cache), or at once after a restart.
   ```bash
   bun run seed:styles
   bun run library:fresh-start             # counts only
   bun run library:fresh-start -- --apply  # does it
   ```
1. **Collect** (no model calls): reads the portfolio and project pages of each style's top
   artists (ranks 1 to `--artists`, default 4, at most 10), politely (one request per second per
   host, robots.txt honoured, 403 or 429 skips the host), and saves re-encoded WebP files with
   `collect-manifest.json`. Safe to re-run; it resumes.
   ```bash
   bun run library:collect -- --in <research> --out <out> --artists 6
   ```
2. **Screen** (one gpt-4.1 call per image, plus a description and embedding for each keeper):
   keeps images that score 7 or more out of 10 on style with no text, logo, watermark, signature,
   real person (photographed or drawn), licensed character or brand, explicit content or AI look;
   the best `--max-per-artist` per artist (default 8), at most `--max-per-style` per style (default
   24). Raise both to leave more candidates to pick from. Writes `library-manifest.json`. Stops
   before `--max-inr` (default 3000); answers are cached, so a re-run only pays for new images.
   ```bash
   bun run library:screen -- --dir <out> --research <research> --max-inr 3000 --max-per-artist 15 --max-per-style 60
   ```
3. **Pick**: look through `<out>/<family>/<style>/<artist>/` and write `picks.json`, naming each
   image by its path relative to `<out>` (the `file` of its manifest entry; the path without the
   family folder also works). `covers` are up to three of the kept images, in gallery order.
   ```json
   { "grain-metaphor": { "keep": ["conceptual-flat/grain-metaphor/some-artist/1.webp"], "covers": ["conceptual-flat/grain-metaphor/some-artist/1.webp"] } }
   ```
4. **Upload** to `<EA_CLOUDINARY_FOLDER>/library/<family>/<style>/<artist>/<n>`; writes the Cloudinary
   URLs back into the manifest. Idempotent. Run it with `EA_CLOUDINARY_FOLDER=editorial-art` (the
   box's folder), and import within 7 days: an uploaded image no reference row points to counts as
   an orphan for the weekly sweep after that. Upload uploads every manifest entry, picked or not;
   images that are not picked are never imported and so also count as orphans after 7 days.
   ```bash
   EA_CLOUDINARY_FOLDER=editorial-art bun run library:upload -- --dir <out>
   ```
5. **Import** on the box: copy `<out>/library-manifest.json` and `picks.json` to the box (they hold
   URLs, text and embeddings, no image files), then import. Only the styles in `picks.json` are
   touched, and of each only the kept images, which become APPROVED artist references (a kept
   image retired by the fresh start is approved again). Covers are the picked covers, in order. A
   style with at least 15 approved artist references goes LIVE; one below 15 is listed and left as
   it was. A warning names any style whose references come from fewer than four artists. A typo
   in `picks.json` stops the run before anything is written.
   ```bash
   bun run library:import -- --dir <folder holding library-manifest.json> --picks <picks.json>
   ```
   Re-running skips what is already there. `--style <slug>` limits any step to one style. Without
   `--picks`, the import approves everything in the manifest, as before.

**Deleting the generated exemplars.** After the import has been checked in the gallery, the retired
GENERATED rows and their Cloudinary images can be deleted. It is a dry run unless `--apply` is
passed. Ask the owner before running `--apply` on the box: it deletes Cloudinary assets.
```bash
bun run library:delete-generated            # counts only
bun run library:delete-generated -- --apply # deletes
```

Editors can pin one reference when they create a request with a style (`pinnedReferenceId`) or ask
for another style; every option of that batch then uses the pin and two more by the same artist.
Instead of a pin, they can choose the references outright (`referenceIds`, 1 to 3 approved references
of the style, possibly by different artists): every option of that batch is made from exactly those,
in that order, and a "More" batch made from it keeps them. Sending both fields is refused. Every
option in the API lists the references it was made with (`references`, with the artist).
