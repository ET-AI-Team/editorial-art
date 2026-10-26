/**
 * Loads the 6 families and 24 house styles from docs/STYLE_LIBRARY.md into the database.
 *
 *   bun run seed:styles
 *
 * Upserts by slug, so it is safe to run on every deploy: definitions update, but a style's status,
 * covers and references are never touched.
 */
import { db } from '../lib/db';
import { seedStyles, styleLibraryPath } from '../library/styles';

async function main(): Promise<void> {
  const result = await seedStyles();
  console.log(`Seeded ${result.families} families and ${result.styles} styles from ${styleLibraryPath()}.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
