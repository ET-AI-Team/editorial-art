/**
 * Uploads the screened artworks to Cloudinary.
 *
 *   bun run library:upload -- --dir <collect output dir> [--style <slug>]
 *
 * Every entry of <dir>/library-manifest.json goes to
 * `${EA_CLOUDINARY_FOLDER}/library/<family>/<style>/<artist-slug>/<n>`, as WebP, tagged
 * library, style:<slug> and artist:<slug>. The Cloudinary URL, public id and size are written
 * back into the manifest. Entries already uploaded are skipped, and a re-upload of the same
 * public id overwrites, so the script is safe to run again.
 */
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { env } from '../../lib/env';
import { providers } from '../../providers';
import { LIBRARY_MANIFEST, parseFlags, pool, readJson, writeJson, type LibraryEntry } from './common';

export function artistFolder(e: Pick<LibraryEntry, 'family' | 'style' | 'artist'>): string {
  return `${env().EA_CLOUDINARY_FOLDER}/library/${e.family}/${e.style}/${e.artist.slug}`;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2), { dir: 'string', style: 'string', concurrency: 'string' });
  if (!flags.dir) throw new Error('Pass --dir <collect output directory>.');
  const dir = String(flags.dir);
  const manifestPath = join(dir, LIBRARY_MANIFEST);
  const manifest = readJson<LibraryEntry[]>(manifestPath, []);
  if (!manifest.length) throw new Error(`No entries in ${manifestPath}. Run library:screen first.`);
  const concurrency = Math.max(1, Math.min(8, Number(flags.concurrency ?? 4) || 4));

  const todo = manifest.filter((e) => !e.cloudinaryUrl && (!flags.style || e.style === flags.style));
  console.log(`${manifest.length - todo.length} already uploaded, ${todo.length} to upload.`);
  let done = 0;
  let failed = 0;
  await pool(todo, concurrency, async (entry) => {
    try {
      const uploaded = await providers().upload(
        { buffer: readFileSync(join(dir, entry.file)), mimeType: 'image/webp' },
        {
          folder: artistFolder(entry),
          publicId: basename(entry.file).replace(/\.webp$/, ''),
          format: 'webp',
          tags: ['library', `style:${entry.style}`, `artist:${entry.artist.slug}`],
        }
      );
      entry.cloudinaryUrl = uploaded.url;
      entry.publicId = uploaded.publicId;
      entry.width = uploaded.width;
      entry.height = uploaded.height;
      done++;
      if (done % 10 === 0) {
        writeJson(manifestPath, manifest);
        console.log(`  ${done}/${todo.length}`);
      }
    } catch (error) {
      failed++;
      console.error(`${entry.file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  writeJson(manifestPath, manifest);
  console.log(`Uploaded ${done}, failed ${failed}. ${manifest.filter((e) => e.cloudinaryUrl).length} of ${manifest.length} entries now have a Cloudinary URL.`);
  if (failed) process.exitCode = 1;
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
