const { spawn, execSync } = require('child_process');

console.log('[Dev Supervisor] Starting Modern Mint frontend and backend...');

let frontendProcess = null;
let backendProcess = null;
let exiting = false;

function killProcess(child) {
  if (!child || !child.pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      process.kill(-child.pid, 'SIGTERM');
    }
  } catch {
    try {
      child.kill('SIGTERM');
    } catch {}
  }
}

function cleanExit(code) {
  if (exiting) return;
  exiting = true;
  console.log(`\n[Dev Supervisor] Shutting down processes...`);

  killProcess(frontendProcess);
  killProcess(backendProcess);

  setTimeout(() => {
    process.exit(code || 0);
  }, 500);
}

// 1. Backend (port 5001)
console.log('[Dev Supervisor] Starting Backend (http://localhost:5001)...');
backendProcess = spawn('npm', ['run', 'dev', '--prefix', 'backend'], {
  stdio: 'inherit',
  shell: true,
  detached: process.platform !== 'win32',
  env: { ...process.env, PORT: process.env.PORT || '5001' }
});

backendProcess.on('exit', (code) => {
  if (!exiting) {
    console.log(`[Dev Supervisor] Backend exited with code: ${code}`);
    cleanExit(code);
  }
});

// 2. Frontend (port 3000)
console.log('[Dev Supervisor] Starting Frontend (http://localhost:3000)...');
frontendProcess = spawn('npm', ['run', 'dev', '--prefix', 'frontend'], {
  stdio: 'inherit',
  shell: true,
  detached: process.platform !== 'win32',
  env: { ...process.env, PORT: '3000' }
});

frontendProcess.on('exit', (code) => {
  if (!exiting) {
    console.log(`[Dev Supervisor] Frontend exited with code: ${code}`);
    cleanExit(code);
  }
});

process.on('SIGINT', () => cleanExit(0));
process.on('SIGTERM', () => cleanExit(0));
