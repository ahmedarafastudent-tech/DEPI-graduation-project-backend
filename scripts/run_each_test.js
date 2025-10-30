const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testsDir = path.join(__dirname, '..', '__tests__');
const files = fs.readdirSync(testsDir).filter(f => f.endsWith('.test.js'));

for (const file of files) {
  const fullPath = path.join(testsDir, file);
  console.log('\n=== Running', file);
  const res = spawnSync('npm', ['test', '--', fullPath, '-i'], { stdio: 'inherit', cwd: path.join(__dirname, '..'), shell: true });
  if (res.status === 0) {
    console.log('*** PASSED:', file);
  } else {
    console.log('*** FAILED:', file, ' (exit code', res.status, ')');
  }
}
