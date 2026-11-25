'use strict';
// ================= Utilidades =================
const $ = (s, el = document) => el.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const qtd = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const dataBR = (s) => (s ? new Date(s.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');
const SETORES = { eletrica: 'Elétrica', hidraulica: 'Hidráulica', seguranca: 'Segurança Eletrônica', outros: 'Outros' };
const TIPOS = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' };
const UNIDADES = ['UN', 'M', 'RL', 'BR', 'CX', 'PC', 'KG', 'L', 'PAR', 'KIT'];
const setorTag = (s) => (s ? `<span class="etiqueta setor-${esc(s)}">${esc(SETORES[s] || s)}</span>` : '');

let token = localStorage.getItem('token');
let usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

async function api(caminho, opcoes = {}) {
  const r = await fetch('/api' + caminho, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opcoes.headers || {}) },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });
  if (r.status === 401 && caminho !== '/login') { sair(false); throw new Error('Sessão expirada.'); }
  const dados = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  if (!r.ok) throw new Error(dados?.erro || `Erro ${r.status}`);
  return dados;
}

// Download autenticado (CSV / backup)
async function baixar(caminho, nome) {
  const r = await fetch('/api' + caminho, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return aviso('Falha ao gerar arquivo.', true);
  const url = URL.createObjectURL(await r.blob());
  Object.assign(document.createElement('a'), { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let tAviso;
function aviso(msg, erro = false) {
  const el = $('#aviso');
  el.textContent = msg;
  el.className = 'aviso mostrar' + (erro ? ' erro-aviso' : '');
  clearTimeout(tAviso);
  tAviso = setTimeout(() => (el.className = 'aviso'), 3200);
}

const tentar = (fn) => async (...a) => { try { await fn(...a); } catch (e) { aviso(e.message, true); } };

// Modal genérico: campos -> objeto
function abrirModal(titulo, html, aoSalvar) {
  const dlg = $('#modal');
  const form = $('#modal-form');
  form.innerHTML = `<h2>${esc(titulo)}</h2>${html}
    <div class="acoes"><button class="btn" value="cancelar" formnovalidate>Cancelar</button>
    <button class="btn primario" value="ok">Salvar</button></div>`;
  form.onsubmit = async (ev) => {
    if (ev.submitter?.value !== 'ok') return;
    ev.preventDefault();
    const dados = Object.fromEntries(new FormData(form));
    form.querySelectorAll('input[type=checkbox]').forEach((c) => (dados[c.name] = c.checked));
    try { await aoSalvar(dados); dlg.close(); } catch (e) { aviso(e.message, true); }
  };
  dlg.showModal();
  form.querySelector('input,select')?.focus();
}
const opcoes = (lista, sel, vazio = '— nenhum —') =>
  `<option value="">${vazio}</option>` + lista.map((i) => `<option value="${i.id}" ${String(i.id) === String(sel) ? 'selected' : ''}>${esc(i.nome)}</option>`).join('');

// ================= Sessão =================
async function entrar(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  try {
    const r = await api('/login', { method: 'POST', body: f });
    token = r.token; usuario = r.usuario;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    $('#erro-login').textContent = '';
    iniciar();
  } catch (e) { $('#erro-login').textContent = e.message; }
}
async function sair(chamarApi = true) {
  if (chamarApi) await api('/logout', { method: 'POST' }).catch(() => {});
  token = null; usuario = null;
  localStorage.removeItem('token'); localStorage.removeItem('usuario');
  $('#app').hidden = true; $('#tela-login').hidden = false;
}
function trocarSenha() {
  abrirModal('Alterar senha', `<div class="form-grade">
    <label>Senha atual<input type="password" name="atual" required></label>
    <label>Nova senha<input type="password" name="nova" minlength="6" required></label></div>`,
  async (d) => { await api('/me/senha', { method: 'PUT', body: d }); aviso('Senha alterada.'); });
}

// ================= Telas =================
const telas = {};
let cache = { categorias: [], fornecedores: [] };
async function carregarAuxiliares() {
  [cache.categorias, cache.fornecedores] = await Promise.all([api('/categorias'), api('/fornecedores')]);
}

// ---------- Painel ----------
telas.painel = async (el) => {
  const d = await api('/dashboard');
  const r = d.resumo;
  const maxSetor = Math.max(1, ...d.porSetor.map((s) => s.valor_custo));
  el.innerHTML = `<h1>Painel</h1>
  <div class="grade">
    <div class="cartao kpi"><div class="rotulo">Produtos ativos</div><div class="valor">${qtd(r.total_produtos)}</div></div>
    <div class="cartao kpi"><div class="rotulo">Valor em estoque (custo)</div><div class="valor">${moeda(r.valor_custo)}</div></div>
    <div class="cartao kpi"><div class="rotulo">Valor em estoque (venda)</div><div class="valor">${moeda(r.valor_venda)}</div></div>
    <div class="cartao kpi alerta"><div class="rotulo">Abaixo do mínimo</div><div class="valor">${qtd(r.abaixo_minimo)}</div></div>
    <div class="cartao kpi perigo"><div class="rotulo">Zerados</div><div class="valor">${qtd(r.zerados)}</div></div>
  </div>
  <div class="grade">
    <div class="cartao kpi"><div class="rotulo">Entradas no mês</div><div class="valor">${moeda(d.mes.entradas_valor)}</div><small>${qtd(d.mes.entradas)} lançamentos</small></div>
    <div class="cartao kpi"><div class="rotulo">Saídas no mês</div><div class="valor">${moeda(d.mes.saidas_valor)}</div><small>${qtd(d.mes.saidas)} lançamentos</small></div>
  </div>
  <div class="duas">
    <div class="cartao"><h2>⚠️ Repor estoque</h2><div class="tabela-wrap"><table>
      <thead><tr><th>Produto</th><th class="num">Atual</th><th class="num">Mínimo</th></tr></thead><tbody>
      ${d.alertas.map((a) => `<tr><td class="quebra">${esc(a.codigo)} · ${esc(a.nome)}</td>
        <td class="num baixo">${qtd(a.estoque)} ${esc(a.unidade)}</td><td class="num">${qtd(a.estoque_minimo)}</td></tr>`).join('')
        || '<tr><td colspan="3" class="vazio">Tudo em dia 👍</td></tr>'}
      </tbody></table></div></div>
    <div class="cartao"><h2>Valor por setor</h2>
      ${d.porSetor.map((s) => `<div style="margin-bottom:12px">${setorTag(s.setor)} <strong style="float:right">${moeda(s.valor_custo)}</strong>
        <div class="barra-setor"><div class="setor-${esc(s.setor)}" style="width:${(s.valor_custo / maxSetor) * 100}%"></div></div>
        <small style="color:var(--suave)">${s.produtos} produtos</small></div>`).join('')}
      <h2 style="margin-top:20px">Últimas movimentações</h2>
      <div class="tabela-wrap"><table><tbody>
      ${d.ultimas.map((m) => `<tr><td><span class="etiqueta tipo-${m.tipo}">${TIPOS[m.tipo]}</span></td>
        <td class="quebra">${esc(m.produto)}</td><td class="num">${qtd(m.quantidade)} ${esc(m.unidade)}</td>
        <td style="color:var(--suave)">${dataBR(m.criado_em)}</td></tr>`).join('') || '<tr><td class="vazio">Sem movimentações</td></tr>'}
      </tbody></table></div></div>
  </div>`;
};

// ---------- Produtos ----------
telas.produtos = async (el) => {
  await carregarAuxiliares();
  el.innerHTML = `<h1>Produtos</h1>
  <div class="barra-ferramentas">
    <input id="f-busca" placeholder="Buscar por nome, código, marca ou código de barras…">
    <select id="f-setor"><option value="">Todos os setores</option>${Object.entries(SETORES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <select id="f-cat">${opcoes(cache.categorias, '', 'Todas as categorias')}</select>
    <label style="flex-direction:row;align-items:center;gap:6px;color:var(--texto)"><input type="checkbox" id="f-baixo" style="width:auto"> Só abaixo do mínimo</label>
    <button class="btn primario" id="novo-produto">+ Novo produto</button>
  </div>
  <div class="cartao tabela-wrap"><table>
    <thead><tr><th>Código</th><th>Produto</th><th>Setor</th><th>Local</th><th class="num">Estoque</th><th class="num">Mín.</th>
    <th class="num">Custo</th><th class="num">Venda</th><th></th></tr></thead><tbody id="lista-produtos"></tbody></table></div>`;

  const lista = async () => {
    const p = new URLSearchParams({ busca: $('#f-busca').value, setor: $('#f-setor').value, categoria_id: $('#f-cat').value, baixo: $('#f-baixo').checked ? '1' : '' });
    const itens = await api('/produtos?' + p);
    $('#lista-produtos').innerHTML = itens.map((i) => `<tr>
      <td>${esc(i.codigo)}</td>
      <td class="quebra"><strong>${esc(i.nome)}</strong><br><small style="color:var(--suave)">${esc(i.marca || '')} ${i.categoria ? '· ' + esc(i.categoria) : ''}</small></td>
      <td>${setorTag(i.setor)}</td><td>${esc(i.localizacao || '')}</td>
      <td class="num ${i.estoque <= i.estoque_minimo ? 'baixo' : ''}">${qtd(i.estoque)} ${esc(i.unidade)}</td>
      <td class="num">${qtd(i.estoque_minimo)}</td><td class="num">${moeda(i.preco_custo)}</td><td class="num">${moeda(i.preco_venda)}</td>
      <td><button class="btn pequeno" data-mov="${i.id}">Movimentar</button>
        <button class="btn pequeno" data-edit="${i.id}">Editar</button>
        <button class="btn pequeno" data-hist="${i.id}">Histórico</button></td></tr>`).join('')
      || '<tr><td colspan="9" class="vazio">Nenhum produto encontrado.</td></tr>';
  };
  let t;
  $('#f-busca').oninput = () => { clearTimeout(t); t = setTimeout(tentar(lista), 250); };
  ['#f-setor', '#f-cat', '#f-baixo'].forEach((s) => ($(s).onchange = tentar(lista)));
  $('#novo-produto').onclick = () => formProduto(null, lista);
  $('#lista-produtos').onclick = tentar(async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.edit) formProduto(await api('/produtos/' + b.dataset.edit), lista);
    if (b.dataset.mov) location.hash = 'movimentar/' + b.dataset.mov;
    if (b.dataset.hist) location.hash = 'historico/' + b.dataset.hist;
  });
  await lista();
};

function formProduto(p, depois) {
  const v = (k) => esc(p?.[k] ?? '');
  abrirModal(p ? 'Editar produto' : 'Novo produto', `<div class="form-grade">
    <label>Código interno *<input name="codigo" required value="${v('codigo')}"></label>
    <label>Código de barras<input name="codigo_barras" value="${v('codigo_barras')}"></label>
    <label class="largo">Descrição *<input name="nome" required value="${v('nome')}"></label>
    <label>Marca<input name="marca" value="${v('marca')}"></label>
    <label>Categoria<select name="categoria_id">${opcoes(cache.categorias.map((c) => ({ ...c, nome: `${c.nome} (${SETORES[c.setor]})` })), p?.categoria_id)}</select></label>
    <label>Fornecedor<select name="fornecedor_id">${opcoes(cache.fornecedores, p?.fornecedor_id)}</select></label>
    <label>Unidade<select name="unidade">${UNIDADES.map((u) => `<option ${u === (p?.unidade || 'UN') ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
    <label>Preço de custo (R$)<input name="preco_custo" inputmode="decimal" value="${v('preco_custo')}"></label>
    <label>Preço de venda (R$)<input name="preco_venda" inputmode="decimal" value="${v('preco_venda')}"></label>
    <label>Estoque mínimo<input name="estoque_minimo" inputmode="decimal" value="${v('estoque_minimo')}"></label>
    <label>Localização (prateleira)<input name="localizacao" value="${v('localizacao')}"></label>
    ${p ? `<label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" name="ativo" style="width:auto" ${p.ativo ? 'checked' : ''}> Produto ativo</label>`
      : '<label>Estoque inicial<input name="estoque_inicial" inputmode="decimal" value="0"></label>'}
    </div>`,
  async (d) => {
    if (p) await api('/produtos/' + p.id, { method: 'PUT', body: d });
    else await api('/produtos', { method: 'POST', body: d });
    aviso('Produto salvo.');
    await depois();
  });
}

// ---------- Entrada / Saída ----------
telas.movimentar = async (el, produtoId) => {
  el.innerHTML = `<h1>Entrada / Saída de mercadoria</h1>
  <div class="abas">${Object.entries(TIPOS).map(([k, v]) => `<button class="btn" data-tipo="${k}">${v}</button>`).join('')}</div>
  <div class="cartao">
    <p id="dica" style="margin-top:0;color:var(--suave)"></p>
    <label>Produto (digite, ou passe o leitor de código de barras e tecle Enter)
      <input id="m-busca" autocomplete="off" placeholder="Ex.: disjuntor 20A, ELE-004, 7890000000042"></label>
    <div id="m-sug" class="sugestoes" hidden></div>
    <div id="m-prod" style="margin:12px 0"></div>
    <form id="m-form" class="form-grade">
      <label id="rot-qtd">Quantidade *<input name="quantidade" inputmode="decimal" required></label>
      <label>Valor unitário (R$)<input name="valor_unitario" inputmode="decimal" placeholder="padrão do cadastro"></label>
      <label>Documento (NF, pedido, OS)<input name="documento"></label>
      <label>Motivo / observação<input name="motivo"></label>
      <label id="lbl-custo" style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" name="atualizar_custo" style="width:auto"> Atualizar preço de custo com este valor</label>
      <div class="acoes largo"><button class="btn primario" type="submit">Registrar</button></div>
    </form>
  </div>`;

  let tipo = 'entrada';
  let produto = null;
  const dicas = {
    entrada: 'Compra/recebimento de mercadoria. Soma ao estoque.',
    saida: 'Venda, uso em obra/instalação ou perda. Subtrai do estoque (não permite ficar negativo).',
    ajuste: 'Inventário: informe a quantidade CONTADA na prateleira; o sistema corrige o saldo e registra a diferença.',
  };
  const setTipo = (t) => {
    tipo = t;
    el.querySelectorAll('[data-tipo]').forEach((b) => b.classList.toggle('ativo', b.dataset.tipo === t));
    $('#dica').textContent = dicas[t];
    $('#rot-qtd').firstChild.textContent = t === 'ajuste' ? 'Quantidade contada *' : 'Quantidade *';
    $('#lbl-custo').hidden = t !== 'entrada';
  };
  el.querySelectorAll('[data-tipo]').forEach((b) => (b.onclick = () => setTipo(b.dataset.tipo)));
  setTipo('entrada');

  const escolher = (p) => {
    produto = p;
    $('#m-sug').hidden = true;
    $('#m-busca').value = '';
    $('#m-prod').innerHTML = `<div class="cartao" style="background:var(--fundo)"><strong>${esc(p.codigo)} · ${esc(p.nome)}</strong> ${setorTag(p.setor)}<br>
      Estoque atual: <strong class="${p.estoque <= p.estoque_minimo ? 'baixo' : ''}">${qtd(p.estoque)} ${esc(p.unidade)}</strong>
      · Mínimo ${qtd(p.estoque_minimo)} · Custo ${moeda(p.preco_custo)} · Venda ${moeda(p.preco_venda)} · Local ${esc(p.localizacao || '-')}</div>`;
    $('#m-form [name=quantidade]').focus();
  };

  let resultados = [];
  let t;
  const buscar = async () => {
    const q = $('#m-busca').value.trim();
    if (!q) { $('#m-sug').hidden = true; return; }
    resultados = await api('/produtos?busca=' + encodeURIComponent(q));
    $('#m-sug').hidden = false;
    $('#m-sug').innerHTML = resultados.slice(0, 20).map((p, i) => `<div data-i="${i}">${esc(p.codigo)} · ${esc(p.nome)} <small style="color:var(--suave)">(${qtd(p.estoque)} ${esc(p.unidade)})</small></div>`).join('')
      || '<div>Nenhum produto encontrado</div>';
  };
  $('#m-busca').oninput = () => { clearTimeout(t); t = setTimeout(tentar(buscar), 200); };
  $('#m-busca').onkeydown = tentar(async (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    clearTimeout(t);
    await buscar();
    const q = $('#m-busca').value.trim().toLowerCase();
    const exato = resultados.find((p) => p.codigo_barras === q || p.codigo.toLowerCase() === q);
    if (exato || resultados.length === 1) escolher(exato || resultados[0]);
  });
  $('#m-sug').onclick = (ev) => { const i = ev.target.closest('[data-i]')?.dataset.i; if (i !== undefined) escolher(resultados[i]); };

  $('#m-form').onsubmit = tentar(async (ev) => {
    ev.preventDefault();
    if (!produto) throw new Error('Selecione um produto primeiro.');
    const d = Object.fromEntries(new FormData(ev.target));
    d.atualizar_custo = ev.target.atualizar_custo.checked;
    const r = await api('/movimentacoes', { method: 'POST', body: { ...d, tipo, produto_id: produto.id } });
    aviso(`${TIPOS[tipo]} registrada. Novo saldo: ${qtd(r.estoque)} ${produto.unidade}`);
    ev.target.reset();
    escolher(await api('/produtos/' + produto.id));
    $('#m-busca').focus();
  });

  if (produtoId) escolher(await api('/produtos/' + produtoId)); else $('#m-busca').focus();
};

// ---------- Histórico ----------
telas.historico = async (el, produtoId) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const prod = produtoId ? await api('/produtos/' + produtoId) : null;
  el.innerHTML = `<h1>Histórico de movimentações${prod ? ' — ' + esc(prod.nome) : ''}</h1>
  <div class="barra-ferramentas">
    ${prod ? '<a class="btn" href="#historico">Ver todos</a>' : '<input id="h-busca" placeholder="Produto, código ou documento">'}
    <select id="h-tipo"><option value="">Todos os tipos</option>${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <input type="date" id="h-de" value="${prod ? '' : inicio}"><input type="date" id="h-ate" value="${hoje}">
  </div>
  <div class="cartao tabela-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Produto</th><th class="num">Qtd.</th>
    <th class="num">Antes</th><th class="num">Depois</th><th class="num">Valor unit.</th><th>Documento</th><th>Motivo</th><th>Usuário</th></tr></thead>
    <tbody id="h-lista"></tbody></table></div>`;
  const lista = async () => {
    const p = new URLSearchParams({ tipo: $('#h-tipo').value, de: $('#h-de').value, ate: $('#h-ate').value, busca: $('#h-busca')?.value || '' });
    if (produtoId) p.set('produto_id', produtoId);
    const itens = await api('/movimentacoes?' + p);
    $('#h-lista').innerHTML = itens.map((m) => `<tr><td>${dataBR(m.criado_em)}</td><td><span class="etiqueta tipo-${m.tipo}">${TIPOS[m.tipo]}</span></td>
      <td class="quebra">${esc(m.codigo)} · ${esc(m.produto)}</td><td class="num">${m.quantidade > 0 && m.tipo === 'ajuste' ? '+' : ''}${qtd(m.quantidade)} ${esc(m.unidade)}</td>
      <td class="num">${qtd(m.estoque_antes)}</td><td class="num">${qtd(m.estoque_depois)}</td><td class="num">${m.valor_unitario != null ? moeda(m.valor_unitario) : ''}</td>
      <td>${esc(m.documento || '')}</td><td class="quebra">${esc(m.motivo || '')}</td><td>${esc(m.usuario || '')}</td></tr>`).join('')
      || '<tr><td colspan="10" class="vazio">Nenhuma movimentação no período.</td></tr>';
  };
  let t;
  if ($('#h-busca')) $('#h-busca').oninput = () => { clearTimeout(t); t = setTimeout(tentar(lista), 250); };
  ['#h-tipo', '#h-de', '#h-ate'].forEach((s) => ($(s).onchange = tentar(lista)));
  await lista();
};

// ---------- Categorias ----------
telas.categorias = async (el) => {
  const itens = await api('/categorias');
  el.innerHTML = `<h1>Categorias</h1><div class="barra-ferramentas"><button class="btn primario" id="nova">+ Nova categoria</button></div>
  <div class="cartao tabela-wrap"><table><thead><tr><th>Nome</th><th>Setor</th><th class="num">Produtos</th><th></th></tr></thead><tbody>
  ${itens.map((c) => `<tr><td>${esc(c.nome)}</td><td>${setorTag(c.setor)}</td><td class="num">${c.produtos}</td>
    <td><button class="btn pequeno" data-edit="${c.id}">Editar</button> <button class="btn pequeno perigo so-admin" data-del="${c.id}">Excluir</button></td></tr>`).join('')}
  </tbody></table></div>`;
  const form = (c) => abrirModal(c ? 'Editar categoria' : 'Nova categoria', `<div class="form-grade">
    <label>Nome *<input name="nome" required value="${esc(c?.nome || '')}"></label>
    <label>Setor<select name="setor">${Object.entries(SETORES).map(([k, v]) => `<option value="${k}" ${c?.setor === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>`,
  async (d) => { await api('/categorias' + (c ? '/' + c.id : ''), { method: c ? 'PUT' : 'POST', body: d }); aviso('Categoria salva.'); rotear(); });
  $('#nova').onclick = () => form(null);
  el.onclick = tentar(async (ev) => {
    const b = ev.target.closest('button');
    if (b?.dataset.edit) form(itens.find((c) => c.id == b.dataset.edit));
    if (b?.dataset.del && confirm('Excluir esta categoria? Os produtos ficarão sem categoria.')) { await api('/categorias/' + b.dataset.del, { method: 'DELETE' }); rotear(); }
  });
  aplicarPerfil();
};

// ---------- Fornecedores ----------
telas.fornecedores = async (el) => {
  const itens = await api('/fornecedores');
  el.innerHTML = `<h1>Fornecedores</h1><div class="barra-ferramentas"><button class="btn primario" id="novo">+ Novo fornecedor</button></div>
  <div class="cartao tabela-wrap"><table><thead><tr><th>Nome</th><th>CNPJ</th><th>Contato</th><th>Telefone</th><th>E-mail</th><th class="num">Produtos</th><th></th></tr></thead><tbody>
  ${itens.map((f) => `<tr><td>${esc(f.nome)}</td><td>${esc(f.cnpj || '')}</td><td>${esc(f.contato || '')}</td><td>${esc(f.telefone || '')}</td>
    <td>${esc(f.email || '')}</td><td class="num">${f.produtos}</td>
    <td><button class="btn pequeno" data-edit="${f.id}">Editar</button> <button class="btn pequeno perigo so-admin" data-del="${f.id}">Excluir</button></td></tr>`).join('')
    || '<tr><td colspan="7" class="vazio">Nenhum fornecedor.</td></tr>'}
  </tbody></table></div>`;
  const form = (f) => abrirModal(f ? 'Editar fornecedor' : 'Novo fornecedor', `<div class="form-grade">
    <label class="largo">Razão social / nome *<input name="nome" required value="${esc(f?.nome || '')}"></label>
    <label>CNPJ<input name="cnpj" value="${esc(f?.cnpj || '')}"></label><label>Contato<input name="contato" value="${esc(f?.contato || '')}"></label>
    <label>Telefone<input name="telefone" value="${esc(f?.telefone || '')}"></label><label>E-mail<input name="email" type="email" value="${esc(f?.email || '')}"></label></div>`,
  async (d) => { await api('/fornecedores' + (f ? '/' + f.id : ''), { method: f ? 'PUT' : 'POST', body: d }); aviso('Fornecedor salvo.'); rotear(); });
  $('#novo').onclick = () => form(null);
  el.onclick = tentar(async (ev) => {
    const b = ev.target.closest('button');
    if (b?.dataset.edit) form(itens.find((f) => f.id == b.dataset.edit));
    if (b?.dataset.del && confirm('Excluir este fornecedor?')) { await api('/fornecedores/' + b.dataset.del, { method: 'DELETE' }); rotear(); }
  });
  aplicarPerfil();
};

// ---------- Relatórios ----------
telas.relatorios = async (el) => {
  const hoje = new Date().toISOString().slice(0, 10);
  const inicioMes = hoje.slice(0, 8) + '01';
  el.innerHTML = `<h1>Relatórios</h1><p style="color:var(--suave)">Arquivos CSV abrem direto no Excel / Google Planilhas.</p>
  <div class="duas">
    <div class="cartao"><h2>Posição de estoque</h2>
      <div class="form-grade"><label>Setor<select id="r-setor"><option value="">Todos</option>${Object.entries(SETORES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label style="flex-direction:row;align-items:center;gap:6px;align-self:end"><input type="checkbox" id="r-baixo" style="width:auto"> Só itens para repor (lista de compras)</label></div>
      <div class="acoes"><button class="btn primario" id="r-estoque">Baixar CSV</button></div></div>
    <div class="cartao"><h2>Movimentações</h2>
      <div class="form-grade"><label>De<input type="date" id="r-de" value="${inicioMes}"></label><label>Até<input type="date" id="r-ate" value="${hoje}"></label>
      <label>Tipo<select id="r-tipo"><option value="">Todos</option>${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div>
      <div class="acoes"><button class="btn primario" id="r-mov">Baixar CSV</button></div></div>
    <div class="cartao so-admin"><h2>Backup do banco de dados</h2>
      <p style="color:var(--suave)">Baixa uma cópia completa do banco (arquivo .db). Faça isso com frequência!</p>
      <div class="acoes"><button class="btn" id="r-backup">Baixar backup</button></div></div>
  </div>`;
  $('#r-estoque').onclick = () => baixar('/relatorios/estoque.csv?' + new URLSearchParams({ setor: $('#r-setor').value, baixo: $('#r-baixo').checked ? '1' : '' }), 'estoque.csv');
  $('#r-mov').onclick = () => baixar('/relatorios/movimentacoes.csv?' + new URLSearchParams({ de: $('#r-de').value, ate: $('#r-ate').value, tipo: $('#r-tipo').value }), 'movimentacoes.csv');
  $('#r-backup').onclick = () => baixar('/backup', `estoque-backup-${hoje}.db`);
  aplicarPerfil();
};

// ---------- Usuários ----------
telas.usuarios = async (el) => {
  const itens = await api('/usuarios');
  el.innerHTML = `<h1>Usuários</h1><div class="barra-ferramentas"><button class="btn primario" id="novo">+ Novo usuário</button></div>
  <div class="cartao tabela-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>
  ${itens.map((u) => `<tr><td>${esc(u.nome)}</td><td>${esc(u.email)}</td><td>${u.perfil === 'admin' ? 'Administrador' : 'Operador'}</td>
    <td>${u.ativo ? 'Ativo' : 'Bloqueado'}</td><td><button class="btn pequeno" data-edit="${u.id}">Editar</button></td></tr>`).join('')}
  </tbody></table></div>
  <p style="color:var(--suave)"><strong>Operador:</strong> cadastra produtos e registra entradas/saídas. <strong>Administrador:</strong> também exclui registros, gerencia usuários e faz backup.</p>`;
  const form = (u) => abrirModal(u ? 'Editar usuário' : 'Novo usuário', `<div class="form-grade">
    <label>Nome *<input name="nome" required value="${esc(u?.nome || '')}"></label>
    <label>E-mail *<input name="email" type="email" required value="${esc(u?.email || '')}"></label>
    <label>Perfil<select name="perfil"><option value="operador">Operador</option><option value="admin" ${u?.perfil === 'admin' ? 'selected' : ''}>Administrador</option></select></label>
    <label>${u ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}<input name="senha" type="password" minlength="6" ${u ? '' : 'required'}></label>
    ${u ? `<label style="flex-direction:row;align-items:center;gap:6px"><input type="checkbox" name="ativo" style="width:auto" ${u.ativo ? 'checked' : ''}> Ativo</label>` : ''}</div>`,
  async (d) => { await api('/usuarios' + (u ? '/' + u.id : ''), { method: u ? 'PUT' : 'POST', body: d }); aviso('Usuário salvo.'); rotear(); });
  $('#novo').onclick = () => form(null);
  el.onclick = (ev) => { const b = ev.target.closest('[data-edit]'); if (b) form(itens.find((u) => u.id == b.dataset.edit)); };
};

// ================= Roteamento =================
function aplicarPerfil() {
  document.querySelectorAll('.so-admin').forEach((e) => (e.hidden = usuario?.perfil !== 'admin'));
}
async function rotear() {
  const [nome, param] = (location.hash.slice(1) || 'painel').split('/');
  const tela = telas[nome] || telas.painel;
  document.querySelectorAll('.menu a').forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === '#' + nome));
  $('#menu').classList.remove('aberto');
  const el = $('#conteudo');
  el.onclick = null;
  try { await tela(el, param); } catch (e) { el.innerHTML = `<p class="erro">${esc(e.message)}</p>`; }
}

async function iniciar() {
  if (!token) { $('#tela-login').hidden = false; return; }
  try { usuario = await api('/me'); } catch { return; }
  $('#tela-login').hidden = true;
  $('#app').hidden = false;
  $('#nome-usuario').textContent = usuario.nome;
  aplicarPerfil();
  rotear();
}

$('#form-login').onsubmit = entrar;
$('#btn-sair').onclick = () => sair();
$('#btn-senha').onclick = trocarSenha;
$('#btn-menu').onclick = () => $('#menu').classList.toggle('aberto');
window.addEventListener('hashchange', rotear);
iniciar();
