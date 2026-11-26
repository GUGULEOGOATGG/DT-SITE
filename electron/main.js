// Aplicativo desktop (Windows / Mac / Linux): abre o sistema numa janela própria,
// com o banco de dados salvo no próprio computador. Não precisa de internet.
const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

if (!app.requestSingleInstanceLock()) app.quit();

const PASTA_BANCO = path.join(app.getPath('userData'), 'dados');
const DB_PATH = path.join(PASTA_BANCO, 'estoque.db');
const RESTAURAR = path.join(PASTA_BANCO, 'restaurar-pendente.db');
const PORTA_PREFERIDA = 47821; // porta fixa para manter o login salvo entre aberturas

fs.mkdirSync(PASTA_BANCO, { recursive: true });

// Restauração de backup agendada: troca o arquivo antes de abrir o banco
if (fs.existsSync(RESTAURAR)) {
  for (const sufixo of ['', '-wal', '-shm']) fs.rmSync(DB_PATH + sufixo, { force: true });
  fs.renameSync(RESTAURAR, DB_PATH);
}

process.env.DB_PATH = DB_PATH;
process.env.BACKUP_DIR = path.join(PASTA_BANCO, 'backups');
const servidor = require('../src/server');
const { db } = require('../src/db');
const backup = require('../src/backup');

let janela;
let porta;

function iniciarServidor() {
  return new Promise((ok, erro) => {
    const tentar = (p) => {
      const s = servidor.listen(p, '127.0.0.1', () => ok(s.address().port));
      s.once('error', (e) => (e.code === 'EADDRINUSE' && p !== 0 ? tentar(0) : erro(e)));
    };
    tentar(PORTA_PREFERIDA);
  });
}

// ---------- Ações de backup chamadas pela tela (barra lateral → Backup) ----------
// Só administradores logados podem usar: o token da sessão é conferido no banco.
function exigirAdmin(token) {
  const u = db.prepare(`SELECT u.perfil FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token = ? AND s.expira_em > datetime('now') AND u.ativo = 1`).get(String(token || ''));
  if (!u || u.perfil !== 'admin') throw new Error('Apenas administradores podem fazer isso.');
}

function ehSqlite(arquivo) {
  const cab = Buffer.alloc(16);
  const fd = fs.openSync(arquivo, 'r');
  fs.readSync(fd, cab, 0, 16, 0);
  fs.closeSync(fd);
  return cab.toString('latin1').startsWith('SQLite format 3');
}

async function confirmarERestaurar(origem) {
  if (!ehSqlite(origem)) throw new Error('Esse arquivo não é um backup do sistema de estoque.');
  const { response } = await dialog.showMessageBox(janela, {
    type: 'warning',
    buttons: ['Cancelar', 'Restaurar e reiniciar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Restaurar backup',
    message: 'Restaurar este backup?',
    detail: 'Os dados atuais serão substituídos pelos dados do backup. Antes disso, uma cópia dos dados atuais será guardada na lista de backups.',
  });
  if (response !== 1) return { cancelado: true };
  backup.backupManual(); // cópia de segurança do estado atual
  fs.copyFileSync(origem, RESTAURAR);
  setTimeout(() => { app.relaunch(); app.exit(0); }, 300);
  return { ok: true };
}

ipcMain.handle('backup:salvar-como', async (_ev, token) => {
  exigirAdmin(token);
  const { canceled, filePath } = await dialog.showSaveDialog(janela, {
    title: 'Salvar cópia do backup',
    defaultPath: path.join(app.getPath('documents'), `estoque-backup-${new Date().toISOString().slice(0, 10)}.db`),
    filters: [{ name: 'Backup do estoque', extensions: ['db'] }],
  });
  if (canceled || !filePath) return { cancelado: true };
  backup.gravar(filePath);
  return { ok: true, caminho: filePath };
});

ipcMain.handle('backup:restaurar-arquivo', async (_ev, token) => {
  exigirAdmin(token);
  const { canceled, filePaths } = await dialog.showOpenDialog(janela, {
    title: 'Escolha o arquivo de backup',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'Backup do estoque', extensions: ['db'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths[0]) return { cancelado: true };
  return confirmarERestaurar(filePaths[0]);
});

ipcMain.handle('backup:restaurar-lista', async (_ev, token, arquivo) => {
  exigirAdmin(token);
  const origem = backup.caminhoDe(arquivo);
  if (!origem) throw new Error('Backup não encontrado.');
  return confirmarERestaurar(origem);
});

ipcMain.handle('backup:abrir-pasta', (_ev, token) => {
  exigirAdmin(token);
  return shell.openPath(backup.BACKUP_DIR);
});

// ---------- Janela ----------
function criarJanela() {
  janela = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 960,
    minHeight: 620,
    title: 'Controle de Estoque',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: '#0b1220',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  janela.once('ready-to-show', () => { janela.maximize(); janela.show(); });

  // Atalhos úteis mesmo sem menu: F5 recarrega, Ctrl +/- zoom, F11 tela cheia, F12 (só em desenvolvimento)
  janela.webContents.on('before-input-event', (ev, input) => {
    if (input.type !== 'keyDown') return;
    const wc = janela.webContents;
    const ctrl = input.control || input.meta;
    if (input.key === 'F5') { wc.reload(); ev.preventDefault(); }
    else if (input.key === 'F11') { janela.setFullScreen(!janela.isFullScreen()); ev.preventDefault(); }
    else if (ctrl && (input.key === '=' || input.key === '+')) { wc.setZoomLevel(wc.getZoomLevel() + 0.5); ev.preventDefault(); }
    else if (ctrl && input.key === '-') { wc.setZoomLevel(wc.getZoomLevel() - 0.5); ev.preventDefault(); }
    else if (ctrl && input.key === '0') { wc.setZoomLevel(0); ev.preventDefault(); }
    else if (input.key === 'F12' && !app.isPackaged) { wc.toggleDevTools(); ev.preventDefault(); }
  });

  // Links externos abrem no navegador padrão, nunca dentro do app
  janela.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  janela.webContents.on('will-navigate', (ev, url) => {
    if (!url.startsWith(`http://127.0.0.1:${porta}`)) { ev.preventDefault(); shell.openExternal(url); }
  });
  janela.loadURL(`http://127.0.0.1:${porta}/`);
}

app.on('second-instance', () => {
  if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); }
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null); // sem a barra "Arquivo / Exibir / Ajuda"
  try {
    porta = await iniciarServidor();
  } catch (e) {
    dialog.showErrorBox('Não foi possível iniciar', e.message);
    return app.quit();
  }
  criarJanela();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });
});

app.on('window-all-closed', () => {
  try { db.close(); } catch { /* já fechado */ }
  app.quit();
});
