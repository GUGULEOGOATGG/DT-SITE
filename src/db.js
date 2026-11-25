// Banco de dados SQLite (módulo nativo do Node 22+, sem dependências externas)
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'estoque.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash  TEXT NOT NULL,
  perfil      TEXT NOT NULL DEFAULT 'operador' CHECK (perfil IN ('admin','operador')),
  ativo       INTEGER NOT NULL DEFAULT 1,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS sessoes (
  token       TEXT PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_em   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categorias (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  setor       TEXT NOT NULL CHECK (setor IN ('eletrica','hidraulica','seguranca','outros'))
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  cnpj        TEXT,
  telefone    TEXT,
  email       TEXT,
  contato     TEXT,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo          TEXT NOT NULL UNIQUE COLLATE NOCASE,
  codigo_barras   TEXT,
  nome            TEXT NOT NULL,
  marca           TEXT,
  categoria_id    INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  fornecedor_id   INTEGER REFERENCES fornecedores(id) ON DELETE SET NULL,
  unidade         TEXT NOT NULL DEFAULT 'UN',
  preco_custo     REAL NOT NULL DEFAULT 0 CHECK (preco_custo >= 0),
  preco_venda     REAL NOT NULL DEFAULT 0 CHECK (preco_venda >= 0),
  estoque         REAL NOT NULL DEFAULT 0 CHECK (estoque >= 0),
  estoque_minimo  REAL NOT NULL DEFAULT 0 CHECK (estoque_minimo >= 0),
  localizacao     TEXT,
  ativo           INTEGER NOT NULL DEFAULT 1,
  criado_em       TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  atualizado_em   TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_produtos_barras ON produtos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  produto_id      INTEGER NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade      REAL NOT NULL,
  estoque_antes   REAL NOT NULL,
  estoque_depois  REAL NOT NULL,
  valor_unitario  REAL,
  motivo          TEXT,
  documento       TEXT,
  usuario_id      INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  criado_em       TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);
CREATE INDEX IF NOT EXISTS idx_mov_produto ON movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_mov_data ON movimentacoes(criado_em);
`);

// ---------- Senhas ----------
function hashSenha(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function conferirSenha(senha, armazenado) {
  const [salt, hash] = String(armazenado).split(':');
  if (!salt || !hash) return false;
  const teste = crypto.scryptSync(senha, salt, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === teste.length && crypto.timingSafeEqual(original, teste);
}

// ---------- Transação ----------
let profundidade = 0;
function transacao(fn) {
  // Reentrante: transações aninhadas viram SAVEPOINTs
  const sp = `sp${profundidade}`;
  db.exec(profundidade === 0 ? 'BEGIN IMMEDIATE' : `SAVEPOINT ${sp}`);
  profundidade++;
  try {
    const r = fn();
    profundidade--;
    db.exec(profundidade === 0 ? 'COMMIT' : `RELEASE ${sp}`);
    return r;
  } catch (e) {
    profundidade--;
    db.exec(profundidade === 0 ? 'ROLLBACK' : `ROLLBACK TO ${sp}; RELEASE ${sp}`);
    throw e;
  }
}

// ---------- Dados iniciais ----------
function popularSeVazio() {
  const temUsuario = db.prepare('SELECT COUNT(*) n FROM usuarios').get().n > 0;
  if (!temUsuario) {
    const email = process.env.ADMIN_EMAIL || 'admin@loja.com';
    const senha = process.env.ADMIN_SENHA || 'admin123';
    db.prepare('INSERT INTO usuarios (nome,email,senha_hash,perfil) VALUES (?,?,?,?)')
      .run('Administrador', email, hashSenha(senha), 'admin');
    console.log(`Usuário administrador criado: ${email} (troque a senha após o primeiro acesso)`);
  }

  const temCategoria = db.prepare('SELECT COUNT(*) n FROM categorias').get().n > 0;
  if (temCategoria || process.env.SEM_DADOS_EXEMPLO === '1') return;

  transacao(() => {
    const cat = db.prepare('INSERT INTO categorias (nome,setor) VALUES (?,?)');
    const cats = [
      ['Fios e Cabos', 'eletrica'], ['Disjuntores e Quadros', 'eletrica'],
      ['Tomadas e Interruptores', 'eletrica'], ['Iluminação', 'eletrica'],
      ['Eletrodutos e Conexões', 'eletrica'],
      ['Tubos PVC', 'hidraulica'], ['Conexões Hidráulicas', 'hidraulica'],
      ['Registros e Válvulas', 'hidraulica'], ['Caixas d\'Água', 'hidraulica'],
      ['Metais Sanitários', 'hidraulica'],
      ['Câmeras CFTV', 'seguranca'], ['DVR / NVR', 'seguranca'],
      ['Alarmes e Sensores', 'seguranca'], ['Controle de Acesso', 'seguranca'],
      ['Cercas Elétricas', 'seguranca'],
    ];
    const idCat = {};
    for (const [nome, setor] of cats) idCat[nome] = Number(cat.run(nome, setor).lastInsertRowid);

    const forn = db.prepare('INSERT INTO fornecedores (nome,cnpj,telefone,email,contato) VALUES (?,?,?,?,?)');
    const f1 = Number(forn.run('Distribuidora Elétrica Central', '11.111.111/0001-11', '(11) 3333-1111', 'vendas@eletricacentral.com.br', 'Carlos').lastInsertRowid);
    const f2 = Number(forn.run('Hidro Materiais Ltda', '22.222.222/0001-22', '(11) 3333-2222', 'pedidos@hidromateriais.com.br', 'Fernanda').lastInsertRowid);
    const f3 = Number(forn.run('Segtech Distribuição', '33.333.333/0001-33', '(11) 3333-3333', 'comercial@segtech.com.br', 'Rafael').lastInsertRowid);

    const prod = db.prepare(`INSERT INTO produtos
      (codigo,codigo_barras,nome,marca,categoria_id,fornecedor_id,unidade,preco_custo,preco_venda,estoque,estoque_minimo,localizacao)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const P = [
      ['ELE-001', '7890000000011', 'Cabo flexível 2,5mm² azul (rolo 100m)', 'Sil', 'Fios e Cabos', f1, 'RL', 189.9, 279.9, 12, 5, 'A1-01'],
      ['ELE-002', '7890000000028', 'Cabo flexível 4,0mm² preto (rolo 100m)', 'Sil', 'Fios e Cabos', f1, 'RL', 299.0, 429.9, 3, 4, 'A1-02'],
      ['ELE-003', '7890000000035', 'Cabo PP 3x1,5mm²', 'Corfio', 'Fios e Cabos', f1, 'M', 4.2, 7.5, 250, 100, 'A1-03'],
      ['ELE-004', '7890000000042', 'Disjuntor DIN monopolar 20A', 'Steck', 'Disjuntores e Quadros', f1, 'UN', 9.5, 18.9, 40, 15, 'A2-01'],
      ['ELE-005', '7890000000059', 'Disjuntor DIN bipolar 40A', 'Steck', 'Disjuntores e Quadros', f1, 'UN', 32.0, 59.9, 8, 10, 'A2-02'],
      ['ELE-006', '7890000000066', 'Quadro de distribuição 12 disjuntores', 'Tigre', 'Disjuntores e Quadros', f1, 'UN', 45.0, 84.9, 6, 3, 'A2-03'],
      ['ELE-007', '7890000000073', 'Tomada 2P+T 10A branca', 'Tramontina', 'Tomadas e Interruptores', f1, 'UN', 6.8, 13.9, 120, 30, 'A3-01'],
      ['ELE-008', '7890000000080', 'Interruptor simples 1 tecla', 'Tramontina', 'Tomadas e Interruptores', f1, 'UN', 5.9, 11.9, 85, 30, 'A3-02'],
      ['ELE-009', '7890000000097', 'Lâmpada LED bulbo 9W 6500K', 'Philips', 'Iluminação', f1, 'UN', 7.5, 14.9, 200, 50, 'A4-01'],
      ['ELE-010', '7890000000103', 'Refletor LED 50W IP66', 'Avant', 'Iluminação', f1, 'UN', 38.0, 69.9, 14, 5, 'A4-02'],
      ['ELE-011', '7890000000110', 'Eletroduto corrugado 3/4" (rolo 50m)', 'Tigre', 'Eletrodutos e Conexões', f1, 'RL', 42.0, 74.9, 18, 6, 'A5-01'],
      ['HID-001', '7890000001018', 'Tubo PVC soldável 25mm (barra 6m)', 'Tigre', 'Tubos PVC', f2, 'BR', 14.5, 26.9, 60, 20, 'B1-01'],
      ['HID-002', '7890000001025', 'Tubo PVC esgoto 100mm (barra 6m)', 'Amanco', 'Tubos PVC', f2, 'BR', 48.0, 84.9, 9, 10, 'B1-02'],
      ['HID-003', '7890000001032', 'Joelho 90° soldável 25mm', 'Tigre', 'Conexões Hidráulicas', f2, 'UN', 0.9, 2.5, 400, 100, 'B2-01'],
      ['HID-004', '7890000001049', 'Tê soldável 25mm', 'Tigre', 'Conexões Hidráulicas', f2, 'UN', 1.2, 3.2, 300, 100, 'B2-02'],
      ['HID-005', '7890000001056', 'Registro de gaveta 3/4" bruto', 'Docol', 'Registros e Válvulas', f2, 'UN', 28.0, 52.9, 22, 8, 'B3-01'],
      ['HID-006', '7890000001063', 'Válvula de descarga 1.1/2"', 'Docol', 'Registros e Válvulas', f2, 'UN', 89.0, 159.9, 4, 3, 'B3-02'],
      ['HID-007', '7890000001070', 'Caixa d\'água polietileno 1000L', 'Fortlev', 'Caixas d\'Água', f2, 'UN', 420.0, 649.9, 5, 2, 'PATIO'],
      ['HID-008', '7890000001087', 'Torneira de parede para cozinha', 'Lorenzetti', 'Metais Sanitários', f2, 'UN', 45.0, 89.9, 11, 4, 'B4-01'],
      ['HID-009', '7890000001094', 'Fita veda rosca 18mm x 50m', 'Tigre', 'Conexões Hidráulicas', f2, 'UN', 3.5, 8.9, 2, 20, 'B2-03'],
      ['SEG-001', '7890000002015', 'Câmera bullet 1080p infravermelho 20m', 'Intelbras', 'Câmeras CFTV', f3, 'UN', 119.0, 199.9, 25, 8, 'C1-01'],
      ['SEG-002', '7890000002022', 'Câmera dome IP 4MP PoE', 'Hikvision', 'Câmeras CFTV', f3, 'UN', 249.0, 399.9, 7, 5, 'C1-02'],
      ['SEG-003', '7890000002039', 'DVR 8 canais 1080p', 'Intelbras', 'DVR / NVR', f3, 'UN', 499.0, 799.9, 4, 2, 'C2-01'],
      ['SEG-004', '7890000002046', 'HD 1TB para CFTV', 'Seagate', 'DVR / NVR', f3, 'UN', 279.0, 399.9, 6, 3, 'C2-02'],
      ['SEG-005', '7890000002053', 'Central de alarme monitorável 18 zonas', 'JFL', 'Alarmes e Sensores', f3, 'UN', 289.0, 469.9, 3, 2, 'C3-01'],
      ['SEG-006', '7890000002060', 'Sensor infravermelho passivo sem fio', 'JFL', 'Alarmes e Sensores', f3, 'UN', 49.0, 89.9, 30, 10, 'C3-02'],
      ['SEG-007', '7890000002077', 'Fechadura eletroímã 150kg', 'Intelbras', 'Controle de Acesso', f3, 'UN', 129.0, 219.9, 1, 3, 'C4-01'],
      ['SEG-008', '7890000002084', 'Central de cerca elétrica 12.000V', 'Genno', 'Cercas Elétricas', f3, 'UN', 219.0, 359.9, 5, 2, 'C5-01'],
      ['SEG-009', '7890000002091', 'Cabo coaxial bipolar 4mm (rolo 100m)', 'Tiaflex', 'Câmeras CFTV', f3, 'RL', 119.0, 189.9, 10, 4, 'C1-03'],
    ];
    for (const p of P) prod.run(p[0], p[1], p[2], p[3], idCat[p[4]], p[5], p[6], p[7], p[8], p[9], p[10], p[11]);

    // Movimentação de "saldo inicial" para cada produto, garantindo histórico consistente
    db.prepare(`INSERT INTO movimentacoes (produto_id,tipo,quantidade,estoque_antes,estoque_depois,valor_unitario,motivo,usuario_id)
      SELECT id,'entrada',estoque,0,estoque,preco_custo,'Saldo inicial',1 FROM produtos`).run();
  });
  console.log('Dados de exemplo inseridos (defina SEM_DADOS_EXEMPLO=1 para não inserir).');
}

module.exports = { db, transacao, hashSenha, conferirSenha, popularSeVazio, DB_PATH };
