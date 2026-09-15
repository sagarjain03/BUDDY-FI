import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../server');

// Removes the accounts the suite created. Never fails the run: a cleanup
// problem should be visible, not a red build on top of passing tests.
export default function globalTeardown() {
  try {
    const output = execFileSync('node', ['scripts/cleanup-test-users.js'], {
      cwd: serverDir,
      encoding: 'utf8',
      env: { ...process.env, SMOKE_DB_NAME: process.env.SMOKE_DB_NAME || 'buddyfi_test' },
    });
    process.stdout.write(output);
  } catch (err) {
    process.stdout.write(`cleanup skipped: ${err.message}\n`);
  }
}
