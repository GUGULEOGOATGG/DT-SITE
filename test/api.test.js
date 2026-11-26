const { test, before, after } = require('node:test');
const assert = require('node:assert');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'estoque-teste-'));
process.env.DB_PATH = path.join(dir, 'teste.db');
const app = require('../src/server');

let srv, base, token;
const req = async (metodo, url, body, tk = token) => {
  const r = await fetch(base + url, { method: metodo, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` }, body: body && JSON.stringify(body) });
  const tipo = r.headers.get('content-type') || '';
  return { status: r.status, dados: tipo.includes('json') ? await r.json() : await r.text() };
};

before(async () => {
  await new Promise((ok) => (srv = app.listen(0, ok)));
  base = `http://127.0.0.1:${srv.address().port}/api`;
});
after(() => { srv.close(); fs.rmSync(dir, { recursive: true, force: true }); });

test('login exige credenciais válidas', async () => {
  assert.equal((await req('POST', '/login', { email: 'admin@loja.com', senha: 'errada' })).status, 401);
  const r = await req('POST', '/login', { email: 'admin@loja.com', senha: 'admin123' });
  assert.equal(r.status, 200);
  token = r.dados.token;
  assert.equal((await req('GET', '/produtos', null, 'invalido')).status, 401);
});

test('dados de exemplo cobrem os três setores', async () => {
  const d = (await req('GET', '/dashboard')).dados;
  const setores = d.porSetor.map((s) => s.setor).sort();
  assert.deepEqual(setores, ['eletrica', 'hidraulica', 'seguranca']);
  assert.ok(d.alertas.length > 0);
  const busca = (await req('GET', '/produtos?busca=camera')).dados;
  assert.ok(busca.length >= 2 && busca.every((p) => /Câmera/.test(p.nome)), 'busca ignora acentos');
});

test('cadastro, entrada, saída, ajuste e bloqueio de estoque negativo', async () => {
  const cat = (await req('GET', '/categorias')).dados[0];
  const c = await req('POST', '/produtos', { codigo: 'TST-1', nome: 'Produto teste', categoria_id: cat.id, preco_custo: '10,50', preco_venda: 20, estoque_minimo: 2, estoque_inicial: 5 });
  assert.equal(c.status, 200, JSON.stringify(c.dados));
  const id = c.dados.id;
  assert.equal((await req('POST', '/produtos', { codigo: 'tst-1', nome: 'dup' })).status, 409);

  let r = await req('POST', '/movimentacoes', { produto_id: id, tipo: 'entrada', quantidade: 10, documento: 'NF 123' });
  assert.equal(r.dados.estoque, 15);
  r = await req('POST', '/movimentacoes', { produto_id: id, tipo: 'saida', quantidade: 4 });
  assert.equal(r.dados.estoque, 11);
  r = await req('POST', '/movimentacoes', { produto_id: id, tipo: 'saida', quantidade: 100 });
  assert.equal(r.status, 400);
  assert.match(r.dados.erro, /insuficiente/);
  r = await req('POST', '/movimentacoes', { produto_id: id, tipo: 'ajuste', quantidade: 9 });
  assert.equal(r.dados.estoque, 9);

  const p = (await req('GET', '/produtos/' + id)).dados;
  assert.equal(p.estoque, 9);
  assert.equal(p.preco_custo, 10.5);
  const hist = (await req('GET', '/movimentacoes?produto_id=' + id)).dados;
  assert.equal(hist.length, 4);
  assert.equal(hist[0].quantidade, -2); // ajuste registra a diferença
});

test('lote é atômico: se um item falha, nada é gravado', async () => {
  const prods = (await req('GET', '/produtos?busca=TST-1')).dados;
  const outro = (await req('GET', '/produtos')).dados.find((p) => p.codigo === 'ELE-004');
  const antes = outro.estoque;
  const r = await req('POST', '/movimentacoes/lote', { tipo: 'saida', itens: [{ produto_id: outro.id, quantidade: 1 }, { produto_id: prods[0].id, quantidade: 9999 }] });
  assert.equal(r.status, 400);
  assert.equal((await req('GET', '/produtos/' + outro.id)).dados.estoque, antes);
  const ok = await req('POST', '/movimentacoes/lote', { tipo: 'entrada', documento: 'NF 9', itens: [{ produto_id: outro.id, quantidade: 2 }, { produto_id: prods[0].id, quantidade: 1 }] });
  assert.equal(ok.status, 200);
  assert.equal((await req('GET', '/produtos/' + outro.id)).dados.estoque, antes + 2);
});

test('operador não acessa funções de admin', async () => {
  await req('POST', '/usuarios', { nome: 'Op', email: 'op@loja.com', senha: '123456', perfil: 'operador' });
  const tk = (await req('POST', '/login', { email: 'op@loja.com', senha: '123456' })).dados.token;
  assert.equal((await req('GET', '/usuarios', null, tk)).status, 403);
  assert.equal((await req('GET', '/backups', null, tk)).status, 403);
  assert.equal((await req('GET', '/produtos', null, tk)).status, 200);
});

test('relatório CSV e backup', async () => {
  const csv = await req('GET', '/relatorios/estoque.csv?baixo=1');
  assert.equal(csv.status, 200);
  assert.match(csv.dados, /Código;Cód\. barras;Produto/);
  assert.match(csv.dados, /REPOR/);
  const lista = (await req('GET', '/backups')).dados;
  assert.equal(lista.itens.filter((b) => b.tipo === 'automatico').length, 1, 'backup automático do dia criado ao iniciar');
  const novo = (await req('POST', '/backups')).dados.arquivo;
  assert.match(novo, /^estoque-manual-/);
  const r = await fetch(base + '/backups/' + novo, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(r.status, 200);
  const buf = Buffer.from(await r.arrayBuffer());
  assert.equal(buf.subarray(0, 15).toString(), 'SQLite format 3');
  assert.equal((await req('GET', '/backups/..%2Fteste.db')).status, 404);
});
