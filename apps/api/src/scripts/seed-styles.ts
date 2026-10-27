/**
 * Loads the families and house styles in docs/STYLE_LIBRARY.md into the database.
 *
 *   bun run seed:styles
 *
 * Upserts by slug, so it is safe to run on every deploy: definitions update, but the status,
 * covers and references of a style in the file are never touched. A style that is no longer in
 * the file is retired; nothing is deleted.
 */
import { db } from '../lib/db';
import { seedStyles, styleLibraryPath } from '../library/styles';

async function main(): Promise<void> {
  const result = await seedStyles();
  console.log(`Seeded ${result.families} families and ${result.styles} styles from ${styleLibraryPath()}. Retired ${result.retired} styles no longer in the file.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
