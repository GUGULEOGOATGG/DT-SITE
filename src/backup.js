// Backups do banco: automático (1 por dia) e manual, com limpeza dos antigos.
// Funciona igual no programa desktop e no servidor/nuvem.
const path = require('node:path');
const fs = require('node:fs');
const { db, DB_PATH } = require('./db');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(path.dirname(DB_PATH), 'backups');
const MANTER_AUTO = Number(process.env.BACKUP_MANTER) || 15;
const MANTER_MANUAL = 30;
const NOME_VALIDO = /^estoque-[\w-]+\.db$/;

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const doisDig = (n) => String(n).padStart(2, '0');
function hojeLocal(d = new Date()) {
  return `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
}

function gravar(destino) {
  fs.rmSync(destino, { force: true });
  db.exec(`VACUUM INTO '${destino.replace(/'/g, "''")}'`);
}

function limpar() {
  const todos = fs.readdirSync(BACKUP_DIR).filter((f) => NOME_VALIDO.test(f)).sort().reverse();
  const auto = todos.filter((f) => /^estoque-\d{4}-\d{2}-\d{2}\.db$/.test(f)).slice(MANTER_AUTO);
  const manual = todos.filter((f) => f.startsWith('estoque-manual-')).slice(MANTER_MANUAL);
  for (const f of [...auto, ...manual]) fs.rmSync(path.join(BACKUP_DIR, f), { force: true });
}

/** Backup automático do dia (não duplica se já existir). */
function backupDiario() {
  const destino = path.join(BACKUP_DIR, `estoque-${hojeLocal()}.db`);
  if (!fs.existsSync(destino)) {
    gravar(destino);
    limpar();
    return path.basename(destino);
  }
  return null;
}

/** Backup feito na hora, pelo usuário. */
function backupManual() {
  const d = new Date();
  const nome = `estoque-manual-${hojeLocal(d)}-${doisDig(d.getHours())}${doisDig(d.getMinutes())}${doisDig(d.getSeconds())}.db`;
  gravar(path.join(BACKUP_DIR, nome));
  limpar();
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

let agendado = false;
/** Faz o backup do dia agora e confere de hora em hora (cobre o programa aberto por vários dias). */
function iniciarAgendamento() {
  if (agendado) return;
  agendado = true;
  const rodar = () => { try { backupDiario(); } catch (e) { console.error('Falha no backup automático:', e.message); } };
  rodar();
  setInterval(rodar, 60 * 60 * 1000).unref();
}

module.exports = { BACKUP_DIR, backupDiario, backupManual, listar, caminhoDe, gravar, iniciarAgendamento };
