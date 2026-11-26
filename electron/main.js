// Programa desktop (Windows / Mac / Linux).
// Dois modos, escolhidos na primeira abertura:
//  - PRINCIPAL: este computador guarda o banco de dados e atende os outros PCs/celulares da rede.
//  - CONECTADO: este computador só abre o sistema que está no computador principal.
const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

if (!app.requestSingleInstanceLock()) {
  app.exit(0);
  return; // eslint-disable-line no-useless-return -- encerra o módulo da 2ª instância
}

const PORTA = 47821;
const PASTA_BANCO = path.join(app.getPath('userData'), 'dados');
const DB_PATH = path.join(PASTA_BANCO, 'estoque.db');
const RESTAURAR = path.join(PASTA_BANCO, 'restaurar-pendente.db');
const ARQ_CONFIG = path.join(app.getPath('userData'), 'config.json');
const PAGINA_INICIO = path.join(__dirname, 'inicio.html');
const NOME_PASTA_NUVEM = 'Backup Controle de Estoque';

// ---------- Configuração ----------
function lerConfig() {
  try { return JSON.parse(fs.readFileSync(ARQ_CONFIG, 'utf8')); } catch { return {}; }
}
function salvarConfig(c) {
  fs.mkdirSync(path.dirname(ARQ_CONFIG), { recursive: true });
  fs.writeFileSync(ARQ_CONFIG, JSON.stringify(c, null, 2));
}
let config = lerConfig();

function normalizarEndereco(texto) {
  let e = String(texto || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
  if (!e) return null;
  if (!/:\d+$/.test(e)) e += `:${PORTA}`;
  if (!/^[\w.-]+:\d{2,5}$/.test(e)) return null;
  return e;
}

function enderecosDaRede() {
  const lista = [];
  for (const [nome, itens] of Object.entries(os.networkInterfaces())) {
    for (const i of itens || []) {
      if (i.family !== 'IPv4' || i.internal) continue;
      const tailscale = /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(i.address);
      lista.push({ ip: i.address, rede: tailscale ? 'Tailscale (acesso de fora da loja)' : nome });
    }
  }
  return lista;
}

// Pastas de nuvem já instaladas no PC (Google Drive para computador / OneDrive)
function sugestoesNuvem() {
  const s = [];
  const add = (nome, p) => { try { if (p && fs.statSync(p).isDirectory() && !s.some((x) => x.caminho === p)) s.push({ nome, caminho: p }); } catch { /* não existe */ } };
  if (process.platform === 'win32') {
    for (const letra of 'DEFGHIJKLMNOPQRSTUVWXYZ') {
      add('Google Drive', `${letra}:\\Meu Drive`);
      add('Google Drive', `${letra}:\\My Drive`);
    }
  }
  add('Google Drive', path.join(os.homedir(), 'Google Drive'));
  add('Google Drive', path.join(os.homedir(), 'Meu Drive'));
  add('OneDrive', process.env.OneDrive);
  add('OneDrive', process.env.OneDriveConsumer);
  add('OneDrive', path.join(os.homedir(), 'OneDrive'));
  return s;
}

// ---------- Modo principal: sobe o servidor e o banco local ----------
let db = null;
let backup = null;

function iniciarPrincipal() {
  fs.mkdirSync(PASTA_BANCO, { recursive: true });
  // Restauração de backup agendada: troca o arquivo antes de abrir o banco
  if (fs.existsSync(RESTAURAR)) {
    for (const sufixo of ['', '-wal', '-shm']) fs.rmSync(DB_PATH + sufixo, { force: true });
    fs.renameSync(RESTAURAR, DB_PATH);
  }
  process.env.DB_PATH = DB_PATH;
  process.env.BACKUP_DIR = path.join(PASTA_BANCO, 'backups');
  if (config.pastaExtra) process.env.BACKUP_DIR_EXTRA = config.pastaExtra;
  const servidor = require('../src/server');
  db = require('../src/db').db;
  backup = require('../src/backup');

  return new Promise((ok, erro) => {
    const s = servidor.listen(PORTA, '0.0.0.0', () => ok(`127.0.0.1:${PORTA}`));
    s.once('error', (e) => erro(e.code === 'EADDRINUSE'
      ? new Error(`A porta ${PORTA} já está em uso por outro programa. Feche-o e abra o Controle de Estoque novamente.`)
      : e));
  });
}

// ---------- Segurança das ações locais ----------
function exigirAdmin(token) {
  if (!db) throw new Error('Esta ação só funciona no computador principal.');
  const u = db.prepare(`SELECT u.perfil FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token = ? AND s.expira_em > datetime('now') AND u.ativo = 1`).get(String(token || ''));
  if (!u || u.perfil !== 'admin') throw new Error('Apenas administradores podem fazer isso.');
}
const daTelaInicial = (ev) => String(ev.senderFrame?.url || '').startsWith('file://');

function ehSqlite(arquivo) {
  const cab = Buffer.alloc(16);
  const fd = fs.openSync(arquivo, 'r');
  fs.readSync(fd, cab, 0, 16, 0);
  fs.closeSync(fd);
  return cab.toString('latin1').startsWith('SQLite format 3');
}

function reiniciar() {
  setTimeout(() => { app.relaunch(); app.exit(0); }, 300);
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
  backup.backupManual();
  fs.copyFileSync(origem, RESTAURAR);
  reiniciar();
  return { ok: true };
}

// ---------- Ações chamadas pela tela ----------
ipcMain.on('config:info-sync', (ev) => {
  ev.returnValue = { modo: config.modo || null, endereco: config.endereco || null, versao: app.getVersion() };
});

ipcMain.handle('config:info', () => ({
  modo: config.modo || null,
  endereco: config.endereco || null,
  porta: PORTA,
  versao: app.getVersion(),
  enderecosRede: config.modo === 'principal' ? enderecosDaRede() : [],
  pastaExtra: config.pastaExtra || null,
  sugestoesNuvem: config.modo === 'principal' ? sugestoesNuvem() : [],
  erroConexao: erroConexao,
}));

ipcMain.handle('config:testar', async (ev, texto) => {
  if (!daTelaInicial(ev)) throw new Error('Ação não permitida.');
  const endereco = normalizarEndereco(texto);
  if (!endereco) return { ok: false, erro: 'Endereço inválido. Exemplo: 192.168.0.10' };
  try {
    const r = await fetch(`http://${endereco}/api/status`, { signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    if (typeof d.precisaConfigurar !== 'boolean') throw new Error();
    return { ok: true, endereco };
  } catch {
    return { ok: false, erro: `Não encontrei o Controle de Estoque em ${endereco}. Confira se o computador principal está ligado, com o programa aberto, e se o Windows dele permitiu o acesso à rede.` };
  }
});

ipcMain.handle('config:escolher-modo', (ev, modo, texto) => {
  if (!daTelaInicial(ev)) throw new Error('Ação não permitida.');
  if (modo === 'principal') config = { ...config, modo: 'principal' };
  else if (modo === 'cliente') {
    const endereco = normalizarEndereco(texto);
    if (!endereco) throw new Error('Endereço inválido.');
    config = { ...config, modo: 'cliente', endereco };
  } else throw new Error('Modo inválido.');
  salvarConfig(config);
  reiniciar();
  return { ok: true };
});

ipcMain.handle('config:tentar-novamente', (ev) => {
  if (!daTelaInicial(ev)) throw new Error('Ação não permitida.');
  reiniciar();
});

// "Mudar modo" a partir da tela de Configurações: sempre pede confirmação nativa
ipcMain.handle('config:reconfigurar', async () => {
  const { response } = await dialog.showMessageBox(janela, {
    type: 'question',
    buttons: ['Cancelar', 'Mudar'],
    defaultId: 0,
    cancelId: 0,
    title: 'Mudar modo deste computador',
    message: 'Escolher de novo como este computador funciona?',
    detail: 'Nenhum dado é apagado. Os dados deste computador continuam guardados caso você volte a usá-lo como principal.',
  });
  if (response !== 1) return { cancelado: true };
  const { pastaExtra } = config;
  config = pastaExtra ? { pastaExtra } : {};
  salvarConfig(config);
  reiniciar();
  return { ok: true };
});

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
    defaultPath: config.pastaExtra || app.getPath('documents'),
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

ipcMain.handle('backup:abrir-pasta', (_ev, token, qual) => {
  exigirAdmin(token);
  return shell.openPath(qual === 'extra' && config.pastaExtra ? config.pastaExtra : backup.BACKUP_DIR);
});

// Pasta extra (Google Drive / OneDrive): escolhe uma sugestão detectada ou abre o seletor
ipcMain.handle('backup:definir-extra', async (_ev, token, sugestao) => {
  exigirAdmin(token);
  let base = null;
  if (sugestao) {
    const s = sugestoesNuvem().find((x) => x.caminho === sugestao);
    if (!s) throw new Error('Pasta não encontrada.');
    base = s.caminho;
  } else {
    const { canceled, filePaths } = await dialog.showOpenDialog(janela, {
      title: 'Escolha a pasta do Google Drive, OneDrive ou pendrive',
      defaultPath: sugestoesNuvem()[0]?.caminho || os.homedir(),
      properties: ['openDirectory', 'createDirectory'],
    });
    if (canceled || !filePaths[0]) return { cancelado: true };
    base = filePaths[0];
  }
  const destino = path.basename(base) === NOME_PASTA_NUVEM ? base : path.join(base, NOME_PASTA_NUVEM);
  fs.mkdirSync(destino, { recursive: true });
  config = { ...config, pastaExtra: destino };
  salvarConfig(config);
  backup.definirPastaExtra(destino);
  const info = backup.infoExtra();
  if (info.erro) throw new Error(info.erro);
  return { ok: true, pasta: destino };
});

ipcMain.handle('backup:remover-extra', (_ev, token) => {
  exigirAdmin(token);
  delete config.pastaExtra;
  salvarConfig(config);
  backup.definirPastaExtra(null);
  return { ok: true };
});

// ---------- Janela ----------
let janela;
let enderecoAtual = null;
let erroConexao = null;

function abrirInicio(motivo) {
  erroConexao = motivo || null;
  janela.loadFile(PAGINA_INICIO);
}

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
    const interno = url.startsWith('file://') || (enderecoAtual && url.startsWith(`http://${enderecoAtual}`));
    if (!interno) { ev.preventDefault(); shell.openExternal(url); }
  });
  // Computador principal fora do ar → tela com opções em vez de página em branco
  janela.webContents.on('did-fail-load', (_ev, codigo, descricao, url, principal) => {
    if (!principal || codigo === -3 || url.startsWith('file://')) return;
    abrirInicio(`Não foi possível conectar ao computador principal (${enderecoAtual}). Verifique se ele está ligado e com o Controle de Estoque aberto.`);
  });
}

app.on('second-instance', () => {
  if (janela) { if (janela.isMinimized()) janela.restore(); janela.focus(); }
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null); // sem a barra "Arquivo / Exibir / Ajuda"
  criarJanela();
  try {
    if (config.modo === 'principal') {
      enderecoAtual = await iniciarPrincipal();
      janela.loadURL(`http://${enderecoAtual}/`);
    } else if (config.modo === 'cliente' && config.endereco) {
      enderecoAtual = config.endereco;
      janela.loadURL(`http://${enderecoAtual}/`);
    } else {
      abrirInicio();
    }
  } catch (e) {
    dialog.showErrorBox('Não foi possível iniciar', e.message);
    app.exit(1);
  }
});

app.on('window-all-closed', () => {
  try { db?.close(); } catch { /* já fechado */ }
  app.quit();
});
