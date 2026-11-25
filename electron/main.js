// Aplicativo desktop (Windows / Mac / Linux): abre o sistema numa janela própria,
// com o banco de dados salvo no próprio computador. Não precisa de internet.
const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

if (!app.requestSingleInstanceLock()) app.quit();

const PASTA_BANCO = path.join(app.getPath('userData'), 'dados');
const PASTA_BACKUPS = path.join(PASTA_BANCO, 'backups');
const DB_PATH = path.join(PASTA_BANCO, 'estoque.db');
const RESTAURAR = path.join(PASTA_BANCO, 'restaurar-pendente.db');
const PORTA_PREFERIDA = 47821; // porta fixa para manter o login salvo entre aberturas

fs.mkdirSync(PASTA_BACKUPS, { recursive: true });

// Restauração de backup agendada: troca o arquivo antes de abrir o banco
if (fs.existsSync(RESTAURAR)) {
  for (const sufixo of ['', '-wal', '-shm']) fs.rmSync(DB_PATH + sufixo, { force: true });
  fs.renameSync(RESTAURAR, DB_PATH);
}

process.env.DB_PATH = DB_PATH;
const servidor = require('../src/server');
const { db } = require('../src/db');

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

// Backup automático: 1 por dia, mantém os 15 mais recentes
function backupAutomatico() {
  try {
    const hoje = new Date().toISOString().slice(0, 10);
    const destino = path.join(PASTA_BACKUPS, `estoque-${hoje}.db`);
    if (!fs.existsSync(destino)) db.exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
    const antigos = fs.readdirSync(PASTA_BACKUPS).filter((f) => /^estoque-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort().reverse().slice(15);
    for (const f of antigos) fs.rmSync(path.join(PASTA_BACKUPS, f), { force: true });
  } catch (e) {
    console.error('Falha no backup automático:', e);
  }
}

async function salvarBackup() {
  const { canceled, filePath } = await dialog.showSaveDialog(janela, {
    title: 'Salvar backup do estoque',
    defaultPath: path.join(app.getPath('documents'), `estoque-backup-${new Date().toISOString().slice(0, 10)}.db`),
    filters: [{ name: 'Banco de dados', extensions: ['db'] }],
  });
  if (canceled || !filePath) return;
  try {
    fs.rmSync(filePath, { force: true });
    db.exec(`VACUUM INTO '${filePath.replace(/'/g, "''")}'`);
    dialog.showMessageBox(janela, { type: 'info', message: 'Backup salvo com sucesso.', detail: filePath });
  } catch (e) {
    dialog.showErrorBox('Erro ao salvar backup', e.message);
  }
}

async function restaurarBackup() {
  const { canceled, filePaths } = await dialog.showOpenDialog(janela, {
    title: 'Escolha o arquivo de backup',
    defaultPath: PASTA_BACKUPS,
    filters: [{ name: 'Banco de dados', extensions: ['db'] }],
    properties: ['openFile'],
  });
  if (canceled || !filePaths[0]) return;
  const cabecalho = Buffer.alloc(16);
  const fd = fs.openSync(filePaths[0], 'r');
  fs.readSync(fd, cabecalho, 0, 16, 0);
  fs.closeSync(fd);
  if (!cabecalho.toString('latin1').startsWith('SQLite format 3')) {
    return dialog.showErrorBox('Arquivo inválido', 'Esse arquivo não é um backup do sistema de estoque.');
  }
  const { response } = await dialog.showMessageBox(janela, {
    type: 'warning',
    buttons: ['Cancelar', 'Restaurar e reiniciar'],
    defaultId: 0,
    cancelId: 0,
    message: 'Restaurar este backup?',
    detail: 'Todos os dados atuais serão substituídos pelos dados do backup. Uma cópia de segurança dos dados atuais será guardada na pasta de backups.',
  });
  if (response !== 1) return;
  db.exec(`VACUUM INTO '${path.join(PASTA_BACKUPS, `antes-de-restaurar-${Date.now()}.db`).replace(/'/g, "''")}'`);
  fs.copyFileSync(filePaths[0], RESTAURAR);
  app.relaunch();
  app.exit(0);
}

function montarMenu() {
  const modelo = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Fazer backup agora…', accelerator: 'CmdOrCtrl+B', click: salvarBackup },
        { label: 'Restaurar backup…', click: restaurarBackup },
        { label: 'Abrir pasta de backups automáticos', click: () => shell.openPath(PASTA_BACKUPS) },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { type: 'separator' },
        { label: 'Aumentar zoom', role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { label: 'Diminuir zoom', role: 'zoomOut' },
        { label: 'Zoom normal', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tela cheia', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        { label: 'Onde ficam meus dados?', click: () => dialog.showMessageBox(janela, { message: 'Pasta de dados', detail: `Banco: ${DB_PATH}\nBackups automáticos: ${PASTA_BACKUPS}` }) },
        { label: 'Ferramentas do desenvolvedor', role: 'toggleDevTools', visible: !app.isPackaged },
        { label: 'Sobre', click: () => dialog.showMessageBox(janela, { message: `Controle de Estoque ${app.getVersion()}`, detail: 'Elétrica · Hidráulica · Segurança Eletrônica' }) },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(modelo));
}

function criarJanela() {
  janela = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Controle de Estoque',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    autoHideMenuBar: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  janela.once('ready-to-show', () => { janela.maximize(); janela.show(); });
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
  try {
    porta = await iniciarServidor();
  } catch (e) {
    dialog.showErrorBox('Não foi possível iniciar', e.message);
    return app.quit();
  }
  backupAutomatico();
  montarMenu();
  criarJanela();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) criarJanela(); });
});

app.on('window-all-closed', () => {
  try { db.close(); } catch { /* já fechado */ }
  app.quit();
});
