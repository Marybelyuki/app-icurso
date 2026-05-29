/**
 * Libera el puerto 3000 (Windows) y borra el lock de Next dev para evitar:
 * "Another next dev server is already running"
 */
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const lock = path.join(__dirname, '..', '.next', 'dev', 'lock')

if (process.platform === 'win32') {
  try {
    execSync(
      'powershell -NoProfile -ExecutionPolicy Bypass -Command "' +
        '$p = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ' +
        'Select-Object -ExpandProperty OwningProcess -Unique; ' +
        'if ($p) { $p | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }' +
        '"',
      { stdio: 'ignore' }
    )
  } catch {
    /* ignorar */
  }
}

try {
  fs.unlinkSync(lock)
  console.log('[iCurs@] Listo: lock de desarrollo anterior eliminado.')
} catch {
  /* no había lock */
}
