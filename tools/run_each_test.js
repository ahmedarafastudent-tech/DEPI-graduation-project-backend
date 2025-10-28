const { spawnSync } = require('child_process');
const glob = require('glob');
const path = require('path');

(async () => {
  const files = glob.sync('__tests__/**/*.test.js');
  const results = [];
  for (const f of files) {
    console.log('\n=== Running:', f);
    const r = spawnSync('npx', ['jest', '--runInBand', f], { stdio: 'inherit', shell: true });
    results.push({ file: f, status: r.status });
    console.log('ExitCode=', r.status);
  }
  console.log('\nSummary:');
  for (const r of results) {
    console.log(r.status === 0 ? 'PASS' : 'FAIL', r.file);
  }
  const failed = results.filter(r => r.status !== 0);
  process.exit(failed.length === 0 ? 0 : 1);
})();
