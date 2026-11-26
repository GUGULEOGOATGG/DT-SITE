// Versão final: banco começa vazio e o primeiro acesso cria o administrador
const { test, before, after } = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'estoque-vazio-'));
process.env.DB_PATH = path.join(dir, 'vazio.db');
process.env.BACKUP_DIR_EXTRA = path.join(dir, 'google-drive');
delete process.env.DADOS_EXEMPLO;
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_SENHA;
const app = require('../src/server');

let srv, base, token;
const req = async (metodo, url, body, tk = token) => {
  const r = await fetch(base + url, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` }, body: body && JSON.stringify(body) });
  return { status: r.status, dados: (r.headers.get('content-type') || '').includes('json') ? await r.json() : await r.text() };
};
before(async () => {
  await new Promise((ok) => (srv = app.listen(0, ok)));
  base = `http://127.0.0.1:${srv.address().port}/api`;
});
after(() => { srv.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('banco novo começa sem nenhum usuário e sem login padrão', async () => {
  assert.deepEqual((await req('GET', '/status')).dados.precisaConfigurar, true);
  assert.equal((await req('POST', '/login', { email: 'admin@loja.com', senha: 'admin123' })).status, 401);
});

test('primeiro acesso cria o administrador uma única vez', async () => {
  assert.equal((await req('POST', '/primeiro-acesso', { nome: 'Dono', email: 'invalido', senha: '123456' })).status, 400);
  assert.equal((await req('POST', '/primeiro-acesso', { nome: 'Dono', email: 'dono@loja.com', senha: '123' })).status, 400);
  const r = await req('POST', '/primeiro-acesso', { nome: 'Dono da Loja', email: 'dono@loja.com', senha: 'segredo1' });
  assert.equal(r.status, 200);
  assert.equal(r.dados.usuario.perfil, 'admin');
  token = r.dados.token;
  assert.equal((await req('POST', '/primeiro-acesso', { nome: 'Invasor', email: 'x@x.com', senha: 'segredo1' })).status, 403);
  assert.equal((await req('GET', '/status')).dados.precisaConfigurar, false);
});

test('nada cadastrado: sem produtos, categorias, fornecedores ou movimentações', async () => {
  assert.equal((await req('GET', '/produtos')).dados.length, 0);
  assert.equal((await req('GET', '/categorias')).dados.length, 0);
  assert.equal((await req('GET', '/fornecedores')).dados.length, 0);
  assert.equal((await req('GET', '/movimentacoes')).dados.length, 0);
  const d = (await req('GET', '/dashboard')).dados;
  assert.equal(d.resumo.total_produtos, 0);
  assert.equal(d.resumo.valor_custo, 0);
});

test('categorias sugeridas só quando pedido, sem duplicar', async () => {
  assert.equal((await req('POST', '/categorias/sugeridas')).dados.criadas, 15);
  assert.equal((await req('POST', '/categorias/sugeridas')).dados.criadas, 0);
});

test('preços no formato brasileiro e código de barras sem repetir', async () => {
  const r = await req('POST', '/produtos', { codigo: 'A1', nome: 'Teste', preco_custo: '1.234,56', preco_venda: 'R$ 2.000,00', codigo_barras: '789123' });
  assert.equal(r.status, 200, JSON.stringify(r.dados));
  const p = (await req('GET', '/produtos/' + r.dados.id)).dados;
  assert.equal(p.preco_custo, 1234.56);
  assert.equal(p.preco_venda, 2000);
  const dup = await req('POST', '/produtos', { codigo: 'A2', nome: 'Outro', codigo_barras: '789123' });
  assert.equal(dup.status, 409);
  assert.match(dup.dados.erro, /código de barras/);
  assert.equal((await req('POST', '/produtos', { codigo: 'A3', nome: 'Sem barras', codigo_barras: '' })).status, 200);
  assert.equal((await req('POST', '/produtos', { codigo: 'A4', nome: 'Sem barras 2', codigo_barras: '' })).status, 200);
});

test('planilha não executa fórmulas vindas de nomes de produto', async () => {
  await req('POST', '/produtos', { codigo: 'X1', nome: '=HYPERLINK("http://mal")' });
  const csv = (await req('GET', '/relatorios/estoque.csv')).dados;
  assert.match(csv, /'=HYPERLINK/);
});

test('backup automático também vai para a pasta extra (Google Drive)', async () => {
  const b = (await req('GET', '/backups')).dados;
  assert.equal(b.extra.erro, null);
  const novo = (await req('POST', '/backups')).dados.arquivo;
  const naNuvem = fs.readdirSync(process.env.BACKUP_DIR_EXTRA);
  assert.ok(naNuvem.some((f) => /^estoque-\d{4}-\d{2}-\d{2}\.db$/.test(f)), 'backup do dia copiado');
  assert.ok(naNuvem.includes(novo), 'backup manual copiado');
});

test('bloqueia após 5 senhas erradas', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await req('POST', '/login', { email: 'dono@loja.com', senha: 'errada' })).status, 401);
  const r = await req('POST', '/login', { email: 'dono@loja.com', senha: 'segredo1' });
  assert.equal(r.status, 429);
  assert.match(r.dados.erro, /Muitas tentativas/);
  // outro funcionário no mesmo endereço continua entrando normalmente
  await req('POST', '/usuarios', { nome: 'Op', email: 'op@loja.com', senha: '123456' });
  assert.equal((await req('POST', '/login', { email: 'op@loja.com', senha: '123456' })).status, 200);
});

test('JSON inválido e rota inexistente respondem com erro claro', async () => {
  const r = await fetch(base + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{quebrado' });
  assert.equal(r.status, 400);
  assert.equal((await req('GET', '/nao-existe')).status, 404);
});
