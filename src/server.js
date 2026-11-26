const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const { db, transacao, hashSenha, conferirSenha, popularSeVazio, criarCategoriasSugeridas, DB_PATH } = require('./db');
const { version: VERSAO } = require('../package.json');

const backup = require('./backup');

popularSeVazio();
backup.iniciarAgendamento();

const app = express();
app.disable('x-powered-by');
// Atrás de um proxy (Render, Railway, Caddy), use TRUST_PROXY=1 para o bloqueio de login ver o IP real
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', true);
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ---------- Utilidades ----------
class ErroHttp extends Error {
  constructor(status, msg) { super(msg); this.status = status; }
}
const rota = (fn) => (req, res, next) => {
  try { const r = fn(req, res); if (r !== undefined) res.json(r); } catch (e) { next(e); }
};
const num = (v, campo, { min = 0, obrigatorio = false } = {}) => {
  if (v === undefined || v === null || v === '') {
    if (obrigatorio) throw new ErroHttp(400, `Informe ${campo}.`);
    return null;
  }
  // Aceita "1.234,56", "1234,56" e "1234.56"
  let t = String(v).trim().replace(/^R\$\s*/i, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = t === '' ? NaN : Number(t);
  if (!Number.isFinite(n) || n < min) throw new ErroHttp(400, `Valor inválido para ${campo}.`);
  return n;
};
const txt = (v, campo, obrigatorio = false) => {
  const s = v === undefined || v === null ? '' : String(v).trim();
  if (obrigatorio && !s) throw new ErroHttp(400, `Informe ${campo}.`);
  return s || null;
};
const id = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new ErroHttp(400, 'ID inválido.');
  return n;
};

// ---------- Autenticação ----------
const HORAS_SESSAO = 12;

function novaSessao(u) {
  db.prepare("DELETE FROM sessoes WHERE expira_em < datetime('now')").run();
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare(`INSERT INTO sessoes (token, usuario_id, expira_em) VALUES (?, ?, datetime('now', '+${HORAS_SESSAO} hours'))`).run(token, u.id);
  return { token, usuario: { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil } };
}
const validarSenha = (senha) => {
  if (String(senha || '').length < 6) throw new ErroHttp(400, 'A senha precisa ter pelo menos 6 caracteres.');
  return String(senha);
};
const validarEmail = (email) => {
  const e = txt(email, 'o e-mail', true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new ErroHttp(400, 'E-mail inválido.');
  return e;
};

// Bloqueio contra adivinhação de senha (15 minutos):
// - 5 erros no mesmo e-mail a partir do mesmo endereço (não trava os colegas da loja)
// - 20 erros no total a partir do mesmo endereço (quem tenta vários e-mails)
const BLOQUEIO_MS = 15 * 60 * 1000;
const tentativas = new Map();
function conferirBloqueio(chave) {
  const t = tentativas.get(chave);
  if (t && t.bloqueadoAte > Date.now()) {
    const min = Math.ceil((t.bloqueadoAte - Date.now()) / 60000);
    throw new ErroHttp(429, `Muitas tentativas erradas. Tente de novo em ${min} minuto(s).`);
  }
}
function registrarErro(chave, limite) {
  const agora = Date.now();
  let t = tentativas.get(chave);
  if (!t || agora - t.inicio > BLOQUEIO_MS) t = { erros: 0, inicio: agora, bloqueadoAte: 0 };
  t.erros += 1;
  if (t.erros >= limite) { t.bloqueadoAte = agora + BLOQUEIO_MS; t.erros = 0; t.inicio = agora; }
  tentativas.set(chave, t);
  if (tentativas.size > 10000) for (const [k, v] of tentativas) if (v.bloqueadoAte < agora && agora - v.inicio > BLOQUEIO_MS) tentativas.delete(k);
}

const semUsuarios = () => db.prepare('SELECT COUNT(*) n FROM usuarios').get().n === 0;

// Informações públicas para a tela inicial
app.get('/api/status', rota(() => ({ precisaConfigurar: semUsuarios(), versao: VERSAO })));

// Primeira abertura: cria a conta de administrador (só funciona enquanto não existe nenhum usuário)
app.post('/api/primeiro-acesso', rota((req) => {
  const b = req.body || {};
  const nome = txt(b.nome, 'seu nome', true);
  const email = validarEmail(b.email);
  const senha = validarSenha(b.senha);
  return transacao(() => {
    if (!semUsuarios()) throw new ErroHttp(403, 'O sistema já foi configurado. Faça login.');
    const r = db.prepare("INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, 'admin')").run(nome, email, hashSenha(senha));
    return novaSessao({ id: Number(r.lastInsertRowid), nome, email, perfil: 'admin' });
  });
}));

app.post('/api/login', rota((req) => {
  const { email, senha } = req.body || {};
  const ip = req.ip || 'local';
  const chave = `${ip}|${String(email || '').trim().toLowerCase()}`;
  conferirBloqueio(chave);
  conferirBloqueio(ip);
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1').get(String(email || '').trim());
  if (!u || !conferirSenha(String(senha || ''), u.senha_hash)) {
    registrarErro(chave, 5);
    registrarErro(ip, 20);
    throw new ErroHttp(401, 'E-mail ou senha incorretos.');
  }
  tentativas.delete(chave);
  return novaSessao(u);
}));

function autenticar(req, _res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const u = token && db.prepare(`SELECT u.id, u.nome, u.email, u.perfil FROM sessoes s
    JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token = ? AND s.expira_em > datetime('now') AND u.ativo = 1`).get(token);
  if (!u) return next(new ErroHttp(401, 'Sessão expirada. Faça login novamente.'));
  req.usuario = u;
  req.token = token;
  next();
}
const somenteAdmin = (req, _res, next) =>
  req.usuario.perfil === 'admin' ? next() : next(new ErroHttp(403, 'Apenas administradores podem fazer isso.'));

app.use('/api', autenticar);

app.post('/api/logout', rota((req) => {
  db.prepare('DELETE FROM sessoes WHERE token = ?').run(req.token);
  return { ok: true };
}));
app.get('/api/me', rota((req) => req.usuario));
app.put('/api/me/senha', rota((req) => {
  const { atual, nova } = req.body || {};
  const u = db.prepare('SELECT senha_hash FROM usuarios WHERE id = ?').get(req.usuario.id);
  if (!conferirSenha(String(atual || ''), u.senha_hash)) throw new ErroHttp(400, 'Senha atual incorreta.');
  db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(hashSenha(validarSenha(nova)), req.usuario.id);
  db.prepare('DELETE FROM sessoes WHERE usuario_id = ? AND token <> ?').run(req.usuario.id, req.token);
  return { ok: true };
}));

// ---------- Usuários (admin) ----------
app.get('/api/usuarios', somenteAdmin, rota(() =>
  db.prepare('SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome').all()));

app.post('/api/usuarios', somenteAdmin, rota((req) => {
  const b = req.body || {};
  const senha = validarSenha(b.senha);
  const perfil = b.perfil === 'admin' ? 'admin' : 'operador';
  const r = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?,?,?,?)')
    .run(txt(b.nome, 'o nome', true), validarEmail(b.email), hashSenha(senha), perfil);
  return { id: Number(r.lastInsertRowid) };
}));

app.put('/api/usuarios/:id', somenteAdmin, rota((req) => {
  const uid = id(req.params.id);
  const b = req.body || {};
  const perfil = b.perfil === 'admin' ? 'admin' : 'operador';
  const ativo = b.ativo === false || b.ativo === 0 ? 0 : 1;
  if (uid === req.usuario.id && (ativo === 0 || perfil !== 'admin')) throw new ErroHttp(400, 'Você não pode remover seu próprio acesso de administrador.');
  db.prepare('UPDATE usuarios SET nome = ?, email = ?, perfil = ?, ativo = ? WHERE id = ?')
    .run(txt(b.nome, 'o nome', true), validarEmail(b.email), perfil, ativo, uid);
  if (b.senha) db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(hashSenha(validarSenha(b.senha)), uid);
  if (!ativo) db.prepare('DELETE FROM sessoes WHERE usuario_id = ?').run(uid);
  return { ok: true };
}));

// ---------- Painel ----------
app.get('/api/dashboard', rota(() => {
  const resumo = db.prepare(`SELECT
      COUNT(*) AS total_produtos,
      COALESCE(SUM(estoque), 0) AS total_itens,
      COALESCE(SUM(estoque * preco_custo), 0) AS valor_custo,
      COALESCE(SUM(estoque * preco_venda), 0) AS valor_venda,
      SUM(CASE WHEN estoque <= estoque_minimo THEN 1 ELSE 0 END) AS abaixo_minimo,
      SUM(CASE WHEN estoque = 0 THEN 1 ELSE 0 END) AS zerados
    FROM produtos WHERE ativo = 1`).get();
  const porSetor = db.prepare(`SELECT COALESCE(c.setor, 'outros') AS setor, COUNT(*) AS produtos,
      COALESCE(SUM(p.estoque * p.preco_custo), 0) AS valor_custo
    FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.ativo = 1 GROUP BY 1 ORDER BY 3 DESC`).all();
  const alertas = db.prepare(`SELECT p.id, p.codigo, p.nome, p.unidade, p.estoque, p.estoque_minimo, c.setor
    FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE p.ativo = 1 AND p.estoque <= p.estoque_minimo
    ORDER BY (p.estoque / NULLIF(p.estoque_minimo, 0)) ASC, p.nome LIMIT 15`).all();
  const ultimas = db.prepare(`SELECT m.id, m.tipo, m.quantidade, m.estoque_depois, m.motivo, m.criado_em,
      p.codigo, p.nome AS produto, p.unidade, u.nome AS usuario
    FROM movimentacoes m JOIN produtos p ON p.id = m.produto_id LEFT JOIN usuarios u ON u.id = m.usuario_id
    ORDER BY m.id DESC LIMIT 10`).all();
  const mes = db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN quantidade * COALESCE(valor_unitario, 0) END), 0) AS entradas_valor,
      COALESCE(SUM(CASE WHEN tipo = 'saida' THEN quantidade * COALESCE(valor_unitario, 0) END), 0) AS saidas_valor,
      SUM(CASE WHEN tipo = 'entrada' THEN 1 ELSE 0 END) AS entradas,
      SUM(CASE WHEN tipo = 'saida' THEN 1 ELSE 0 END) AS saidas
    FROM movimentacoes WHERE criado_em >= date('now', 'localtime', 'start of month')`).get();
  return { resumo, porSetor, alertas, ultimas, mes };
}));

// ---------- Categorias ----------
const SETORES = ['eletrica', 'hidraulica', 'seguranca', 'outros'];
const setorValido = (s) => { if (!SETORES.includes(s)) throw new ErroHttp(400, 'Setor inválido.'); return s; };

app.get('/api/categorias', rota(() => db.prepare(`SELECT c.*, COUNT(p.id) AS produtos FROM categorias c
  LEFT JOIN produtos p ON p.categoria_id = c.id AND p.ativo = 1 GROUP BY c.id ORDER BY c.setor, c.nome`).all()));
app.post('/api/categorias', rota((req) => {
  const r = db.prepare('INSERT INTO categorias (nome, setor) VALUES (?, ?)').run(txt(req.body.nome, 'o nome', true), setorValido(req.body.setor));
  return { id: Number(r.lastInsertRowid) };
}));
app.post('/api/categorias/sugeridas', rota(() => ({ criadas: criarCategoriasSugeridas() })));
app.put('/api/categorias/:id', rota((req) => {
  db.prepare('UPDATE categorias SET nome = ?, setor = ? WHERE id = ?').run(txt(req.body.nome, 'o nome', true), setorValido(req.body.setor), id(req.params.id));
  return { ok: true };
}));
app.delete('/api/categorias/:id', somenteAdmin, rota((req) => {
  db.prepare('DELETE FROM categorias WHERE id = ?').run(id(req.params.id));
  return { ok: true };
}));

// ---------- Fornecedores ----------
const camposFornecedor = (b) => [txt(b.nome, 'o nome', true), txt(b.cnpj), txt(b.telefone), txt(b.email), txt(b.contato)];
app.get('/api/fornecedores', rota(() => db.prepare(`SELECT f.*, COUNT(p.id) AS produtos FROM fornecedores f
  LEFT JOIN produtos p ON p.fornecedor_id = f.id AND p.ativo = 1 GROUP BY f.id ORDER BY f.nome`).all()));
app.post('/api/fornecedores', rota((req) => {
  const r = db.prepare('INSERT INTO fornecedores (nome, cnpj, telefone, email, contato) VALUES (?,?,?,?,?)').run(...camposFornecedor(req.body || {}));
  return { id: Number(r.lastInsertRowid) };
}));
app.put('/api/fornecedores/:id', rota((req) => {
  db.prepare('UPDATE fornecedores SET nome = ?, cnpj = ?, telefone = ?, email = ?, contato = ? WHERE id = ?')
    .run(...camposFornecedor(req.body || {}), id(req.params.id));
  return { ok: true };
}));
app.delete('/api/fornecedores/:id', somenteAdmin, rota((req) => {
  db.prepare('DELETE FROM fornecedores WHERE id = ?').run(id(req.params.id));
  return { ok: true };
}));

// ---------- Produtos ----------
const SQL_PRODUTOS = `SELECT p.*, c.nome AS categoria, c.setor, f.nome AS fornecedor
  FROM produtos p LEFT JOIN categorias c ON c.id = p.categoria_id LEFT JOIN fornecedores f ON f.id = p.fornecedor_id`;

function filtrosProdutos(q) {
  const where = [];
  const params = [];
  if (q.inativos !== '1') where.push('p.ativo = 1');
  if (q.busca) {
    where.push('(sem_acento(p.nome) LIKE sem_acento(?) OR p.codigo LIKE ? OR p.codigo_barras = ? OR sem_acento(p.marca) LIKE sem_acento(?))');
    const t = `%${q.busca}%`;
    params.push(t, t, q.busca, t);
  }
  if (q.setor) { where.push('c.setor = ?'); params.push(q.setor); }
  if (q.categoria_id) { where.push('p.categoria_id = ?'); params.push(Number(q.categoria_id)); }
  if (q.fornecedor_id) { where.push('p.fornecedor_id = ?'); params.push(Number(q.fornecedor_id)); }
  if (q.baixo === '1') where.push('p.estoque <= p.estoque_minimo');
  return { sql: where.length ? ` WHERE ${where.join(' AND ')}` : '', params };
}

app.get('/api/produtos', rota((req) => {
  const { sql, params } = filtrosProdutos(req.query);
  return db.prepare(`${SQL_PRODUTOS}${sql} ORDER BY p.nome LIMIT 2000`).all(...params);
}));

app.get('/api/produtos/:id', rota((req) => {
  const p = db.prepare(`${SQL_PRODUTOS} WHERE p.id = ?`).get(id(req.params.id));
  if (!p) throw new ErroHttp(404, 'Produto não encontrado.');
  return p;
}));

function camposProduto(b) {
  return {
    codigo: txt(b.codigo, 'o código', true),
    codigo_barras: txt(b.codigo_barras),
    nome: txt(b.nome, 'o nome', true),
    marca: txt(b.marca),
    categoria_id: b.categoria_id ? Number(b.categoria_id) : null,
    fornecedor_id: b.fornecedor_id ? Number(b.fornecedor_id) : null,
    unidade: (txt(b.unidade) || 'UN').toUpperCase(),
    preco_custo: num(b.preco_custo, 'o preço de custo') ?? 0,
    preco_venda: num(b.preco_venda, 'o preço de venda') ?? 0,
    estoque_minimo: num(b.estoque_minimo, 'o estoque mínimo') ?? 0,
    localizacao: txt(b.localizacao),
  };
}

app.post('/api/produtos', rota((req) => {
  const c = camposProduto(req.body || {});
  const inicial = num(req.body.estoque_inicial, 'o estoque inicial') ?? 0;
  return transacao(() => {
    const r = db.prepare(`INSERT INTO produtos (codigo, codigo_barras, nome, marca, categoria_id, fornecedor_id, unidade,
        preco_custo, preco_venda, estoque, estoque_minimo, localizacao)
      VALUES (:codigo, :codigo_barras, :nome, :marca, :categoria_id, :fornecedor_id, :unidade,
        :preco_custo, :preco_venda, :estoque, :estoque_minimo, :localizacao)`).run({ ...c, estoque: inicial });
    const pid = Number(r.lastInsertRowid);
    if (inicial > 0) {
      db.prepare(`INSERT INTO movimentacoes (produto_id, tipo, quantidade, estoque_antes, estoque_depois, valor_unitario, motivo, usuario_id)
        VALUES (?, 'entrada', ?, 0, ?, ?, 'Saldo inicial', ?)`).run(pid, inicial, inicial, c.preco_custo, req.usuario.id);
    }
    return { id: pid };
  });
}));

app.put('/api/produtos/:id', rota((req) => {
  const c = camposProduto(req.body || {});
  const ativo = req.body.ativo === false || req.body.ativo === 0 ? 0 : 1;
  const r = db.prepare(`UPDATE produtos SET codigo = :codigo, codigo_barras = :codigo_barras, nome = :nome, marca = :marca,
      categoria_id = :categoria_id, fornecedor_id = :fornecedor_id, unidade = :unidade, preco_custo = :preco_custo,
      preco_venda = :preco_venda, estoque_minimo = :estoque_minimo, localizacao = :localizacao, ativo = :ativo,
      atualizado_em = datetime('now','localtime') WHERE id = :id`).run({ ...c, ativo, id: id(req.params.id) });
  if (!r.changes) throw new ErroHttp(404, 'Produto não encontrado.');
  return { ok: true };
}));

// Exclusão lógica: preserva o histórico de movimentações
app.delete('/api/produtos/:id', somenteAdmin, rota((req) => {
  db.prepare("UPDATE produtos SET ativo = 0, atualizado_em = datetime('now','localtime') WHERE id = ?").run(id(req.params.id));
  return { ok: true };
}));

// ---------- Movimentações ----------
function registrarMovimentacao(b, usuarioId) {
  const produtoId = id(b.produto_id);
  const tipo = String(b.tipo || '');
  if (!['entrada', 'saida', 'ajuste'].includes(tipo)) throw new ErroHttp(400, 'Tipo de movimentação inválido.');
  const qtd = num(b.quantidade, 'a quantidade', { obrigatorio: true });
  if (tipo !== 'ajuste' && qtd <= 0) throw new ErroHttp(400, 'A quantidade deve ser maior que zero.');

  return transacao(() => {
    const p = db.prepare('SELECT id, nome, estoque, preco_custo, preco_venda, ativo FROM produtos WHERE id = ?').get(produtoId);
    if (!p) throw new ErroHttp(404, 'Produto não encontrado.');
    if (!p.ativo) throw new ErroHttp(400, 'Produto inativo.');

    let depois;
    let quantidade = qtd;
    if (tipo === 'entrada') depois = p.estoque + qtd;
    else if (tipo === 'saida') {
      if (qtd > p.estoque) throw new ErroHttp(400, `Estoque insuficiente de "${p.nome}". Disponível: ${p.estoque}.`);
      depois = p.estoque - qtd;
    } else {
      // Ajuste (inventário): a quantidade informada é o novo saldo contado
      depois = qtd;
      quantidade = qtd - p.estoque;
    }
    depois = Math.round(depois * 1000) / 1000;
    const padrao = tipo === 'saida' ? p.preco_venda : p.preco_custo;
    const valor = num(b.valor_unitario, 'o valor unitário') ?? padrao;

    db.prepare("UPDATE produtos SET estoque = ?, atualizado_em = datetime('now','localtime') WHERE id = ?").run(depois, produtoId);
    if (tipo === 'entrada' && b.atualizar_custo && valor > 0) {
      db.prepare('UPDATE produtos SET preco_custo = ? WHERE id = ?').run(valor, produtoId);
    }
    const r = db.prepare(`INSERT INTO movimentacoes (produto_id, tipo, quantidade, estoque_antes, estoque_depois, valor_unitario, motivo, documento, usuario_id)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(produtoId, tipo, quantidade, p.estoque, depois, valor, txt(b.motivo), txt(b.documento), usuarioId);
    return { id: Number(r.lastInsertRowid), estoque: depois };
  });
}

app.post('/api/movimentacoes', rota((req) => registrarMovimentacao(req.body || {}, req.usuario.id)));

// Lote: vários itens numa única transação (ex.: uma nota fiscal de entrada ou um pedido de saída)
app.post('/api/movimentacoes/lote', rota((req) => {
  const { tipo, itens, motivo, documento } = req.body || {};
  if (!Array.isArray(itens) || !itens.length) throw new ErroHttp(400, 'Nenhum item informado.');
  const resultados = transacao(() => itens.map((it) => registrarMovimentacao({ ...it, tipo, motivo, documento }, req.usuario.id)));
  return { ok: true, itens: resultados.length };
}));

app.get('/api/movimentacoes', rota((req) => {
  const q = req.query;
  const where = [];
  const params = [];
  if (q.produto_id) { where.push('m.produto_id = ?'); params.push(Number(q.produto_id)); }
  if (q.tipo) { where.push('m.tipo = ?'); params.push(q.tipo); }
  if (q.de) { where.push('date(m.criado_em) >= date(?)'); params.push(q.de); }
  if (q.ate) { where.push('date(m.criado_em) <= date(?)'); params.push(q.ate); }
  if (q.busca) { where.push('(sem_acento(p.nome) LIKE sem_acento(?) OR p.codigo LIKE ? OR m.documento LIKE ?)'); const t = `%${q.busca}%`; params.push(t, t, t); }
  const sql = `SELECT m.*, p.codigo, p.nome AS produto, p.unidade, u.nome AS usuario
    FROM movimentacoes m JOIN produtos p ON p.id = m.produto_id LEFT JOIN usuarios u ON u.id = m.usuario_id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.id DESC LIMIT ?`;
  return db.prepare(sql).all(...params, Math.min(Number(q.limite) || 500, 5000));
}));

// ---------- Relatórios CSV (abrem direto no Excel) ----------
function enviarCsv(res, nome, linhas, colunas) {
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    let s = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
    // Texto começando com = + - @ viraria fórmula no Excel: força como texto
    if (typeof v !== 'number' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const corpo = [colunas.map((c) => c[1]).join(';'), ...linhas.map((l) => colunas.map((c) => esc(l[c[0]])).join(';'))].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
  res.send('﻿' + corpo);
}

app.get('/api/relatorios/estoque.csv', (req, res, next) => {
  try {
    const { sql, params } = filtrosProdutos(req.query);
    const linhas = db.prepare(`${SQL_PRODUTOS}${sql} ORDER BY c.setor, p.nome`).all(...params)
      .map((p) => ({ ...p, valor_total: Math.round(p.estoque * p.preco_custo * 100) / 100, situacao: p.estoque <= p.estoque_minimo ? 'REPOR' : 'OK' }));
    enviarCsv(res, 'estoque.csv', linhas, [
      ['codigo', 'Código'], ['codigo_barras', 'Cód. barras'], ['nome', 'Produto'], ['marca', 'Marca'], ['setor', 'Setor'],
      ['categoria', 'Categoria'], ['fornecedor', 'Fornecedor'], ['unidade', 'Un'], ['estoque', 'Estoque'],
      ['estoque_minimo', 'Mínimo'], ['preco_custo', 'Custo'], ['preco_venda', 'Venda'], ['valor_total', 'Valor em estoque (custo)'],
      ['localizacao', 'Localização'], ['situacao', 'Situação'],
    ]);
  } catch (e) { next(e); }
});

app.get('/api/relatorios/movimentacoes.csv', (req, res, next) => {
  try {
    const q = req.query;
    const where = [];
    const params = [];
    if (q.de) { where.push('date(m.criado_em) >= date(?)'); params.push(q.de); }
    if (q.ate) { where.push('date(m.criado_em) <= date(?)'); params.push(q.ate); }
    if (q.tipo) { where.push('m.tipo = ?'); params.push(q.tipo); }
    const linhas = db.prepare(`SELECT m.*, p.codigo, p.nome AS produto, p.unidade, u.nome AS usuario
      FROM movimentacoes m JOIN produtos p ON p.id = m.produto_id LEFT JOIN usuarios u ON u.id = m.usuario_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.id`).all(...params);
    enviarCsv(res, 'movimentacoes.csv', linhas, [
      ['criado_em', 'Data'], ['tipo', 'Tipo'], ['codigo', 'Código'], ['produto', 'Produto'], ['quantidade', 'Quantidade'],
      ['unidade', 'Un'], ['estoque_antes', 'Antes'], ['estoque_depois', 'Depois'], ['valor_unitario', 'Valor unit.'],
      ['documento', 'Documento'], ['motivo', 'Motivo'], ['usuario', 'Usuário'],
    ]);
  } catch (e) { next(e); }
});

// ---------- Backups (admin) ----------
app.get('/api/backups', somenteAdmin, rota(() => ({ pasta: backup.BACKUP_DIR, extra: backup.infoExtra(), itens: backup.listar() })));
app.post('/api/backups', somenteAdmin, rota(() => ({ arquivo: backup.backupManual() })));
app.get('/api/backups/:arquivo', somenteAdmin, (req, res, next) => {
  const p = backup.caminhoDe(req.params.arquivo);
  if (!p) return next(new ErroHttp(404, 'Backup não encontrado.'));
  res.download(p, req.params.arquivo);
});

// ---------- Erros ----------
app.use('/api', (_req, _res, next) => next(new ErroHttp(404, 'Rota não encontrada.')));
app.use((err, _req, res, _next) => {
  let status = err.status || 500;
  let msg = err.message;
  if (/UNIQUE constraint failed: produtos\.codigo_barras/.test(msg)) { status = 409; msg = 'Esse código de barras já está em outro produto.'; }
  else if (/UNIQUE constraint failed: produtos\.codigo/.test(msg)) { status = 409; msg = 'Já existe um produto com esse código.'; }
  else if (/UNIQUE constraint failed: usuarios\.email/.test(msg)) { status = 409; msg = 'Já existe um usuário com esse e-mail.'; }
  else if (/UNIQUE constraint failed: categorias\.nome/.test(msg)) { status = 409; msg = 'Já existe uma categoria com esse nome.'; }
  else if (err.type === 'entity.parse.failed') { status = 400; msg = 'Dados enviados em formato inválido.'; }
  else if (/FOREIGN KEY constraint failed/.test(msg)) { status = 400; msg = 'Registro relacionado inválido.'; }
  else if (/CHECK constraint failed/.test(msg)) { status = 400; msg = 'Valor fora do permitido (verifique números negativos).'; }
  if (status >= 500) console.error(err);
  res.status(status).json({ erro: status >= 500 ? 'Erro interno no servidor.' : msg });
});

const PORT = Number(process.env.PORT) || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Estoque rodando em http://localhost:${PORT}  (banco: ${DB_PATH})`));
}
module.exports = app;
