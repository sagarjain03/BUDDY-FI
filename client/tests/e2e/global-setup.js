import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../server');
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Refuses to run against anything that is not a test database.
 *
 * Playwright reuses an already-running server on the port, which once meant a
 * suite ran against the real database and left 137 accounts behind. The
 * prefixed emails made that recoverable; this check makes it not happen.
 */
async function assertTestDatabase() {
  const response = await fetch(`${API_URL}/health`).catch(() => null);
  if (!response?.ok) return; // Playwright is about to start its own server.

  const { db } = await response.json();
  if (db && !/test/i.test(db)) {
    throw new Error(
      `Refusing to run: the server on ${API_URL} is using the "${db}" database. ` +
        'Stop it, or point it at a database whose name contains "test".'
    );
  }
}

/**
 * Seeds the quiz. The questions live in the database now, so a fresh one — CI's
 * throwaway container, or a new developer's machine — has an empty quiz until
 * this runs. Idempotent.
 */
function seedQuiz() {
  try {
    const output = execFileSync('node', ['scripts/migrate-quiz.js', '--apply'], {
      cwd: serverDir,
      encoding: 'utf8',
      env: { ...process.env, MONGO_DB_NAME: process.env.SMOKE_DB_NAME || 'buddyfi_test' },
    });
    const lastLine = output.trim().split('\n').pop();
    process.stdout.write(`pre-run quiz: ${lastLine}\n`);
  } catch (err) {
    process.stdout.write(`pre-run quiz seed failed: ${err.message}\n`);
    throw err;
  }
}

/** Wipes leftover test accounts, so paginated assertions stay meaningful. */
function cleanup() {
  try {
    const output = execFileSync('node', ['scripts/cleanup-test-users.js'], {
      cwd: serverDir,
      encoding: 'utf8',
      env: { ...process.env, SMOKE_DB_NAME: process.env.SMOKE_DB_NAME || 'buddyfi_test' },
    });
    process.stdout.write(`pre-run ${output}`);
  } catch (err) {
    process.stdout.write(`pre-run cleanup skipped: ${err.message}\n`);
  }
}

export default async function globalSetup() {
  await assertTestDatabase();
  seedQuiz();
  cleanup();
}
