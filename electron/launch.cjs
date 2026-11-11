const { spawn } = require('child_process');
const electron = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

if (process.argv.includes('--dev')) {
  env.VITE_DEV_SERVER_URL = env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
}

const child = spawn(electron, ['electron/main.cjs'], {
  stdio: 'inherit',
  env,
  windowsHide: false,
});

child.on('close', (code) => {
  process.exit(code || 0);
});

