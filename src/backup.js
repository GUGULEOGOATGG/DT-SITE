// Backups do banco: automático (1 por dia) e manual, com limpeza dos antigos.
// Opcionalmente copia cada backup para uma "pasta extra" — por exemplo a pasta do
// Google Drive ou do OneDrive no computador, que sobe sozinha para a nuvem (grátis).
// Funciona igual no programa desktop e no servidor/nuvem.
const path = require('node:path');
const fs = require('node:fs');
const { db, DB_PATH } = require('./db');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups');
const MANTER_AUTO = Number(process.env.BACKUP_MANTER) || 15;
const MANTER_MANUAL = 30;
const NOME_VALIDO = /^estoque-[\w-]+\.db$/;
const NOME_AUTO = /^estoque-\d{4}-\d{2}-\d{2}\.db$/;

fs.mkdirSync(BACKUP_DIR, { recursive: true });

let pastaExtra = process.env.BACKUP_DIR_EXTRA || null;
const estadoExtra = { ultimaCopia: null, erro: null };

const doisDig = (n) => String(n).padStart(2, '0');
function hojeLocal(d = new Date()) {
  return `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
}

function gravar(destino) {
  fs.rmSync(destino, { force: true });
  db.exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
}

function limparPasta(pasta) {
  const todos = fs.readdirSync(pasta).filter((f) => NOME_VALIDO.test(f)).sort().reverse();
  const auto = todos.filter((f) => NOME_AUTO.test(f)).slice(MANTER_AUTO);
  const manual = todos.filter((f) => f.startsWith('estoque-manual-')).slice(MANTER_MANUAL);
  for (const f of [...auto, ...manual]) fs.rmSync(path.join(pasta, f), { force: true });
}

/** Copia um backup já feito para a pasta extra (Google Drive / OneDrive / pendrive). */
function copiarParaExtra(nome) {
  if (!pastaExtra) return;
  try {
    fs.mkdirSync(pastaExtra, { recursive: true });
    fs.copyFileSync(path.join(BACKUP_DIR, nome), path.join(pastaExtra, nome));
    limparPasta(pastaExtra);
    estadoExtra.ultimaCopia = new Date().toISOString();
    estadoExtra.erro = null;
  } catch (e) {
    estadoExtra.erro = `Não foi possível copiar para a pasta extra: ${e.message}`;
    console.error(estadoExtra.erro);
  }
}

/** Backup automático do dia (não duplica). Garante também a cópia na pasta extra. */
function backupDiario() {
  const nome = `estoque-${hojeLocal()}.db`;
  const destino = path.join(BACKUP_DIR, nome);
  let criado = null;
  if (!fs.existsSync(destino)) {
    gravar(destino);
    limparPasta(BACKUP_DIR);
    criado = nome;
  }
  if (pastaExtra && (criado || !fs.existsSync(path.join(pastaExtra, nome)))) copiarParaExtra(nome);
  return criado;
}

/** Backup feito na hora, pelo usuário. */
function backupManual() {
  const d = new Date();
  const nome = `estoque-manual-${hojeLocal(d)}-${doisDig(d.getHours())}${doisDig(d.getMinutes())}${doisDig(d.getSeconds())}.db`;
  gravar(path.join(BACKUP_DIR, nome));
  limparPasta(BACKUP_DIR);
  copiarParaExtra(nome);
  return nome;
}

function listar() {
  return fs.readdirSync(BACKUP_DIR)
    .filter((f) => NOME_VALIDO.test(f))
    .map((arquivo) => {
      const st = fs.statSync(path.join(BACKUP_DIR, arquivo));
      return { arquivo, tamanho: st.size, criado_em: st.mtime.toISOString(), tipo: arquivo.startsWith('estoque-manual-') ? 'manual' : 'automatico' };
    })
    .sort((a, b) => b.criado_em.localeCompare(a.criado_em));
}

/** Caminho seguro de um backup existente (impede acessar arquivos fora da pasta). */
function caminhoDe(arquivo) {
  if (!NOME_VALIDO.test(String(arquivo))) return null;
  const p = path.join(BACKUP_DIR, arquivo);
  return fs.existsSync(p) ? p : null;
}

/** Define (ou remove, com null) a pasta extra e já faz a primeira cópia. */
function definirPastaExtra(pasta) {
  pastaExtra = pasta || null;
  estadoExtra.erro = null;
  estadoExtra.ultimaCopia = null;
  if (pastaExtra) {
    try { backupDiario(); } catch (e) { estadoExtra.erro = e.message; }
    const hoje = `estoque-${hojeLocal()}.db`;
    if (fs.existsSync(path.join(BACKUP_DIR, hoje))) copiarParaExtra(hoje);
  }
}

function infoExtra() {
  return { pasta: pastaExtra, ...estadoExtra };
}

let agendado = false;
/** Faz o backup do dia agora e confere de hora em hora (cobre o programa aberto por vários dias). */
function iniciarAgendamento() {
  if (agendado) return;
  agendado = true;
  const rodar = () => { try { backupDiario(); } catch (e) { console.error('Falha no backup automático:', e.message); } };
  rodar();
  setInterval(rodar, 60 * 60 * 1000).unref();
}

module.exports = { BACKUP_DIR, backupDiario, backupManual, listar, caminhoDe, gravar, iniciarAgendamento, definirPastaExtra, infoExtra };
