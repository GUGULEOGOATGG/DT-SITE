'use strict';
// ================= Ícones (traço, estilo Lucide) =================
const ICONES = {
  painel: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  caixa: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  movimentar: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  historico: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  etiqueta: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1"/>',
  caminhao: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  relatorio: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  backup: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  chave: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
  busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  mais: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  editar: '<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"/>',
  lixo: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  alerta: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  entrada: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M19 21H5"/>',
  saida: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M19 3H5"/>',
  ajuste: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  dinheiro: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
  subir: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  fechar: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  enviar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  pasta: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  codigoBarras: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 7v10"/><path d="M12 7v10"/><path d="M16 7v10"/>',
  ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  restaurar: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  engrenagem: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  nuvem: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  rede: '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
  zerado: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
};
const ic = (nome) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome] || ''}</svg>`;

// ================= Utilidades =================
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const moeda = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const qtd = (v) => Number(v || 0).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const dataBR = (s) => (s ? new Date(s.includes('T') ? s : s.replace(' ', 'T')).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');
const tamanho = (b) => (b > 1048576 ? `${(b / 1048576).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const SETORES = { eletrica: 'Elétrica', hidraulica: 'Hidráulica', seguranca: 'Segurança Eletrônica', outros: 'Outros' };
const TIPOS = { entrada: 'Entrada', saida: 'Saída', ajuste: 'Ajuste' };
const UNIDADES = ['UN', 'M', 'RL', 'BR', 'CX', 'PC', 'KG', 'L', 'PAR', 'KIT'];
const setorTag = (s) => (s ? `<span class="etiqueta setor-${esc(s)}">${esc(SETORES[s] || s)}</span>` : '<span class="suave">—</span>');
const tipoTag = (t) => `<span class="etiqueta tipo-${esc(t)}">${esc(TIPOS[t] || t)}</span>`;
const DESKTOP = typeof window.desktop === 'object' && window.desktop !== null; // dentro do programa do PC
const PRINCIPAL = DESKTOP && window.desktop.modo === 'principal'; // PC que guarda os dados
// Data de hoje no fuso do computador (toISOString usa UTC e erra depois das 21h no Brasil)
const dataLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function medidor(p) {
  const nivel = p.estoque <= 0 ? 'zero' : p.estoque <= p.estoque_minimo ? 'baixo' : 'ok';
  const ref = Math.max(p.estoque_minimo * 2, 1);
  const pct = Math.max(3, Math.min(100, (p.estoque / ref) * 100));
  return `<div class="medidor nivel-${nivel}" title="Mínimo: ${qtd(p.estoque_minimo)}">
    <span class="medidor-valor">${qtd(p.estoque)} <small>${esc(p.unidade)}</small></span>
    <span class="medidor-barra"><i style="width:${pct}%"></i></span></div>`;
}
const vazio = (icone, texto, colunas = 1) => `<tr><td colspan="${colunas}" class="vazio">${ic(icone)}${esc(texto)}</td></tr>`;
const cabecalho = (titulo, sub, acoes = '') => `<div class="pagina-topo"><div><h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${acoes ? `<div class="acoes-topo">${acoes}</div>` : ''}</div>`;

let token = localStorage.getItem('token');
let usuario = null;

async function api(caminho, opcoes = {}) {
  const r = await fetch('/api' + caminho, {
    ...opcoes,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opcoes.headers || {}) },
    body: opcoes.body ? JSON.stringify(opcoes.body) : undefined,
  });
  if (r.status === 401 && caminho !== '/login') { sair(false); throw new Error('Sessão expirada. Entre novamente.'); }
  const dados = r.headers.get('content-type')?.includes('json') ? await r.json() : null;
  if (!r.ok) throw new Error(dados?.erro || `Erro ${r.status}`);
  return dados;
}

async function baixar(caminho, nome) {
  const r = await fetch('/api' + caminho, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return aviso('Não foi possível gerar o arquivo.', true);
  const url = URL.createObjectURL(await r.blob());
  Object.assign(document.createElement('a'), { href: url, download: nome }).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function aviso(msg, erro = false) {
  const el = document.createElement('div');
  el.className = 'aviso' + (erro ? ' erro-aviso' : ' ok');
  el.innerHTML = `${ic(erro ? 'alerta' : 'ok')}<span>${esc(msg)}</span>`;
  $('#avisos').append(el);
  setTimeout(() => el.remove(), erro ? 5000 : 3200);
}
const tentar = (fn) => async (...a) => { try { await fn(...a); } catch (e) { aviso(e.message, true); } };

// Modal: monta formulário e devolve os campos como objeto
function abrirModal(titulo, html, aoSalvar, textoBotao = 'Salvar') {
  const dlg = $('#modal');
  const form = $('#modal-form');
  form.innerHTML = `<div class="modal-topo"><h2>${esc(titulo)}</h2>
      <button class="btn-icone" value="cancelar" formnovalidate aria-label="Fechar">${ic('fechar')}</button></div>
    <div class="modal-corpo">${html}</div>
    <div class="modal-rodape"><button class="btn" value="cancelar" formnovalidate>Cancelar</button>
      <button class="btn primario" value="ok">${esc(textoBotao)}</button></div>`;
  form.onsubmit = async (ev) => {
    if (ev.submitter?.value !== 'ok') return;
    ev.preventDefault();
    const dados = Object.fromEntries(new FormData(form));
    $$('input[type=checkbox]', form).forEach((c) => (dados[c.name] = c.checked));
    ev.submitter.disabled = true;
    try { await aoSalvar(dados); dlg.close(); } catch (e) { aviso(e.message, true); } finally { ev.submitter.disabled = false; }
  };
  dlg.showModal();
  $('.modal-corpo input, .modal-corpo select', form)?.focus();
}
const opcoes = (lista, sel, vazioTxt = '— nenhum —') =>
  `<option value="">${vazioTxt}</option>` + lista.map((i) => `<option value="${i.id}" ${String(i.id) === String(sel) ? 'selected' : ''}>${esc(i.nome)}</option>`).join('');

// ================= Sessão =================
async function entrar(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  const botao = $('button[type=submit]', ev.target);
  botao.disabled = true;
  try {
    const r = await api('/login', { method: 'POST', body: f });
    token = r.token;
    localStorage.setItem('token', token);
    $('#erro-login').textContent = '';
    ev.target.reset();
    await iniciar();
  } catch (e) { $('#erro-login').textContent = e.message; } finally { botao.disabled = false; }
}
async function sair(chamarApi = true) {
  if (chamarApi) await api('/logout', { method: 'POST' }).catch(() => {});
  token = null; usuario = null;
  localStorage.removeItem('token');
  mostrarLogin();
}
function trocarSenha() {
  abrirModal('Alterar senha', `<div class="form-grade">
    <label class="campo">Senha atual<input type="password" name="atual" required></label>
    <label class="campo">Nova senha (mín. 6 caracteres)<input type="password" name="nova" minlength="6" required></label></div>`,
  async (d) => { await api('/me/senha', { method: 'PUT', body: d }); aviso('Senha alterada com sucesso.'); });
}

// ================= Menu lateral =================
const MENU = [
  { secao: 'Operação' },
  { id: 'painel', nome: 'Painel', icone: 'painel' },
  { id: 'movimentar', nome: 'Entrada / Saída', icone: 'movimentar' },
  { id: 'produtos', nome: 'Produtos', icone: 'caixa', contador: true },
  { id: 'historico', nome: 'Histórico', icone: 'historico' },
  { secao: 'Cadastros' },
  { id: 'categorias', nome: 'Categorias', icone: 'etiqueta' },
  { id: 'fornecedores', nome: 'Fornecedores', icone: 'caminhao' },
  { secao: 'Sistema' },
  { id: 'relatorios', nome: 'Relatórios', icone: 'relatorio' },
  { id: 'backup', nome: 'Backup', icone: 'backup', admin: true },
  { id: 'usuarios', nome: 'Usuários', icone: 'usuarios', admin: true },
  { id: 'configuracoes', nome: 'Configurações', icone: 'engrenagem', desktop: true },
];
function montarMenu() {
  const admin = usuario?.perfil === 'admin';
  $('#menu').innerHTML = MENU.filter((m) => (!m.admin || admin) && (!m.desktop || DESKTOP)).map((m) => (m.secao
    ? `<div class="lateral-secao">${m.secao}</div>`
    : `<a href="#${m.id}" data-id="${m.id}">${ic(m.icone)}<span>${m.nome}</span>${m.contador ? '<span class="contador" id="contador-repor" hidden></span>' : ''}</a>`)).join('');
}
async function atualizarContador() {
  try {
    const n = (await api('/produtos?baixo=1')).length;
    const el = $('#contador-repor');
    if (el) { el.hidden = !n; el.textContent = n; el.title = `${n} produto(s) para repor`; }
  } catch { /* silencioso */ }
}
function abrirLateral(abrir) {
  $('#lateral').classList.toggle('aberta', abrir);
  $('#fundo-lateral').classList.toggle('visivel', abrir);
}

// ================= Telas =================
const telas = {};
const cache = { categorias: [], fornecedores: [] };
async function carregarAuxiliares() {
  [cache.categorias, cache.fornecedores] = await Promise.all([api('/categorias'), api('/fornecedores')]);
}

// ---------- Painel ----------
telas.painel = async (el) => {
  const d = await api('/dashboard');
  const r = d.resumo;
  const maxSetor = Math.max(1, ...d.porSetor.map((s) => s.valor_custo));
  const primeiroNome = (usuario.nome || '').split(' ')[0];
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const kpi = (tom, icone, rotulo, valor, nota = '') => `<div class="cartao kpi"><div class="kpi-icone ${tom}">${ic(icone)}</div>
    <div><div class="kpi-rotulo">${rotulo}</div><div class="kpi-valor">${valor}</div>${nota ? `<div class="kpi-nota">${nota}</div>` : ''}</div></div>`;
  const movIcone = { entrada: ['tom-verde', 'entrada'], saida: ['tom-vermelho', 'saida'], ajuste: ['tom-laranja', 'ajuste'] };

  if (r.total_produtos === 0) return primeirosPassos(el, `${saudacao}, ${esc(primeiroNome)}`);

  el.innerHTML = cabecalho(`${saudacao}, ${esc(primeiroNome)}`, 'Resumo do estoque da loja hoje.',
    `<a class="btn" href="#relatorios">${ic('relatorio')}Relatórios</a><a class="btn primario" href="#movimentar">${ic('movimentar')}Lançar entrada / saída</a>`) + `
  <div class="kpis">
    ${kpi('tom-azul', 'caixa', 'Produtos ativos', qtd(r.total_produtos), `${qtd(r.total_itens)} unidades no total`)}
    ${kpi('tom-roxo', 'dinheiro', 'Estoque a preço de custo', moeda(r.valor_custo))}
    ${kpi('tom-verde', 'subir', 'Estoque a preço de venda', moeda(r.valor_venda), `Margem potencial ${moeda(r.valor_venda - r.valor_custo)}`)}
    ${kpi('tom-laranja', 'alerta', 'Para repor', qtd(r.abaixo_minimo), `${qtd(r.zerados)} zerado(s)`)}
  </div>
  <div class="grade-2">
    <div class="pilha">
      <div class="cartao">
        <div class="cartao-topo"><h2>${ic('alerta')} Precisa repor</h2><a href="#produtos/repor">Ver todos</a></div>
        <div class="tabela-wrap" style="margin-top:12px"><table>
          <thead><tr><th>Produto</th><th>Setor</th><th class="num">Estoque</th></tr></thead><tbody>
          ${d.alertas.map((a) => `<tr><td class="quebra"><div class="produto-nome">${esc(a.nome)}</div><div class="produto-meta">${esc(a.codigo)} · mínimo ${qtd(a.estoque_minimo)}</div></td>
            <td>${setorTag(a.setor)}</td><td class="num">${medidor(a)}</td></tr>`).join('') || vazio('ok', 'Tudo em dia. Nenhum produto abaixo do mínimo.', 3)}
          </tbody></table></div>
      </div>
      <div class="kpis" style="margin:0">
        ${kpi('tom-verde', 'entrada', 'Entradas no mês', moeda(d.mes.entradas_valor), `${qtd(d.mes.entradas)} lançamento(s)`)}
        ${kpi('tom-vermelho', 'saida', 'Saídas no mês', moeda(d.mes.saidas_valor), `${qtd(d.mes.saidas)} lançamento(s)`)}
      </div>
    </div>
    <div class="pilha">
      <div class="cartao">
        <div class="cartao-topo"><h2>Valor por setor</h2></div>
        <div style="padding:6px 0 8px">
        ${d.porSetor.map((s) => `<div class="setor-linha"><div class="setor-linha-topo">${setorTag(s.setor)}<strong>${moeda(s.valor_custo)}</strong></div>
          <div class="barra"><i class="${esc(s.setor)}" style="width:${(s.valor_custo / maxSetor) * 100}%"></i></div>
          <small class="suave">${s.produtos} produto(s)</small></div>`).join('') || '<p class="suave" style="padding:0 20px">Sem produtos.</p>'}
        </div>
      </div>
      <div class="cartao">
        <div class="cartao-topo"><h2>Últimas movimentações</h2><a href="#historico">Ver histórico</a></div>
        <ul class="lista">
        ${d.ultimas.map((m) => `<li><span class="mov-icone ${movIcone[m.tipo][0]}">${ic(movIcone[m.tipo][1])}</span>
          <div class="cresce"><strong>${esc(m.produto)}</strong><small>${dataBR(m.criado_em)}${m.usuario ? ' · ' + esc(m.usuario) : ''}</small></div>
          <strong class="num">${m.tipo === 'saida' ? '−' : m.tipo === 'entrada' ? '+' : '±'}${qtd(Math.abs(m.quantidade))} <small class="suave">${esc(m.unidade)}</small></strong></li>`).join('')
          || '<li class="suave">Nenhuma movimentação ainda.</li>'}
        </ul>
      </div>
    </div>
  </div>`;
};

// Painel de uma loja que ainda não cadastrou nada
async function primeirosPassos(el, titulo) {
  const admin = usuario.perfil === 'admin';
  const [cats, forns, bkp] = await Promise.all([api('/categorias'), api('/fornecedores'), admin ? api('/backups') : null]);
  const passos = [
    { feito: cats.length > 0, titulo: 'Crie as categorias', texto: 'Ex.: Fios e Cabos, Tubos PVC, Câmeras. Dá para criar as sugeridas com um clique.', link: '#categorias', botao: 'Ir para Categorias' },
    { feito: forns.length > 0, titulo: 'Cadastre os fornecedores', texto: 'De quem a loja compra. Ajuda a saber para quem pedir cada produto.', link: '#fornecedores', botao: 'Ir para Fornecedores', opcional: true },
    { feito: false, titulo: 'Cadastre os produtos', texto: 'Informe o estoque atual de cada item como "estoque inicial". O leitor de código de barras funciona no cadastro.', link: '#produtos/novo', botao: 'Cadastrar produto' },
  ];
  if (admin && PRINCIPAL) passos.push({ feito: !!bkp?.extra?.pasta, titulo: 'Ligue o backup na nuvem', texto: 'Cópia automática no Google Drive ou OneDrive, de graça.', link: '#backup', botao: 'Ir para Backup' });
  if (admin) passos.push({ feito: false, titulo: 'Crie o login dos funcionários', texto: 'Cada um entra com o próprio e-mail, e o histórico mostra quem fez cada lançamento.', link: '#usuarios', botao: 'Ir para Usuários', opcional: true });
  el.innerHTML = cabecalho(titulo, 'Seu estoque está vazio. Siga os passos abaixo para começar.') + `
  <div class="cartao"><ul class="lista passos">
    ${passos.map((p, i) => `<li class="${p.feito ? 'feito' : ''}">
      <span class="passo-num">${p.feito ? ic('ok') : i + 1}</span>
      <div class="cresce"><strong>${p.titulo}${p.opcional ? ' <small class="suave">(opcional)</small>' : ''}</strong><small>${p.texto}</small></div>
      ${p.feito ? '<span class="etiqueta tipo-entrada">Feito</span>' : `<a class="btn ${i === passos.findIndex((x) => !x.feito) ? 'primario' : ''}" href="${p.link}">${p.botao}</a>`}
    </li>`).join('')}
  </ul></div>`;
}

// ---------- Produtos ----------
telas.produtos = async (el, param) => {
  await carregarAuxiliares();
  el.innerHTML = cabecalho('Produtos', 'Cadastro de materiais, preços e níveis de estoque.',
    `<button class="btn primario" id="novo-produto">${ic('mais')}Novo produto</button>`) + `
  <div class="cartao">
    <div class="ferramentas">
      <div class="com-icone">${ic('busca')}<input id="f-busca" placeholder="Buscar por nome, código, marca ou código de barras"></div>
      <select id="f-setor"><option value="">Todos os setores</option>${Object.entries(SETORES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <select id="f-cat">${opcoes(cache.categorias, '', 'Todas as categorias')}</select>
      <label class="check"><input type="checkbox" id="f-baixo" ${param === 'repor' ? 'checked' : ''}> Só para repor</label>
      <label class="check"><input type="checkbox" id="f-inativos"> Mostrar desativados</label>
    </div>
    <div class="tabela-wrap"><table>
      <thead><tr><th>Produto</th><th>Setor</th><th>Local</th><th class="num">Estoque</th><th class="num">Custo</th><th class="num">Venda</th><th></th></tr></thead>
      <tbody id="lista-produtos"></tbody></table></div>
    <div class="rodape-tabela" id="rodape-produtos"></div>
  </div>`;

  const admin = usuario.perfil === 'admin';
  const lista = async () => {
    const p = new URLSearchParams({ busca: $('#f-busca').value, setor: $('#f-setor').value, categoria_id: $('#f-cat').value, baixo: $('#f-baixo').checked ? '1' : '', inativos: $('#f-inativos').checked ? '1' : '' });
    const itens = await api('/produtos?' + p);
    const filtrando = [...p.values()].some(Boolean);
    $('#lista-produtos').innerHTML = itens.map((i) => `<tr>
      <td class="quebra"><div class="produto-nome">${esc(i.nome)}${i.ativo ? '' : ' <span class="etiqueta tipo-saida">Desativado</span>'}</div><div class="produto-meta"><span class="codigo">${esc(i.codigo)}</span> ${[i.marca, i.categoria].filter(Boolean).map(esc).join(' · ')}</div></td>
      <td>${setorTag(i.setor)}</td><td>${esc(i.localizacao || '—')}</td>
      <td class="num">${medidor(i)}</td><td class="num">${moeda(i.preco_custo)}</td><td class="num"><strong>${moeda(i.preco_venda)}</strong></td>
      <td class="acoes-linha">
        ${i.ativo ? `<button class="btn-icone" data-mov="${i.id}" title="Entrada / saída">${ic('movimentar')}</button>` : ''}
        <button class="btn-icone" data-hist="${i.id}" title="Histórico">${ic('historico')}</button>
        <button class="btn-icone" data-edit="${i.id}" title="Editar">${ic('editar')}</button>
        ${admin && i.ativo ? `<button class="btn-icone" data-del="${i.id}" title="Desativar">${ic('lixo')}</button>` : ''}
      </td></tr>`).join('') || (filtrando ? vazio('busca', 'Nenhum produto encontrado com esses filtros.', 7)
      : `<tr><td colspan="7" class="vazio">${ic('caixa')}Nenhum produto cadastrado ainda.<br><button class="btn primario" id="vazio-novo" style="margin-top:14px">${ic('mais')}Cadastrar o primeiro produto</button></td></tr>`);
    if ($('#vazio-novo')) $('#vazio-novo').onclick = () => formProduto(null, lista);
    const total = itens.reduce((s, i) => s + i.estoque * i.preco_custo, 0);
    $('#rodape-produtos').textContent = `${itens.length} produto(s) · valor a preço de custo: ${moeda(total)}`;
  };
  let t;
  $('#f-busca').oninput = () => { clearTimeout(t); t = setTimeout(tentar(lista), 250); };
  ['#f-setor', '#f-cat', '#f-baixo', '#f-inativos'].forEach((s) => ($(s).onchange = tentar(lista)));
  $('#novo-produto').onclick = () => formProduto(null, lista);
  if (param === 'novo') { history.replaceState(null, '', '#produtos'); formProduto(null, lista); }
  $('#lista-produtos').onclick = tentar(async (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.edit) formProduto(await api('/produtos/' + b.dataset.edit), lista);
    if (b.dataset.mov) location.hash = 'movimentar/' + b.dataset.mov;
    if (b.dataset.hist) location.hash = 'historico/' + b.dataset.hist;
    if (b.dataset.del && confirm('Desativar este produto? O histórico de movimentações é mantido.')) {
      await api('/produtos/' + b.dataset.del, { method: 'DELETE' });
      aviso('Produto desativado.');
      await lista(); atualizarContador();
    }
  });
  await lista();
};

function formProduto(p, depois) {
  const v = (k) => esc(p?.[k] ?? '');
  const br = (k, casas) => (p?.[k] == null ? '' : Number(p[k]).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: 3, useGrouping: false }));
  const semCategorias = !cache.categorias.length
    ? `<div class="dica">${ic('info')}<span>Você ainda não tem categorias. Dá para salvar o produto sem categoria e organizar depois em <a href="#categorias">Categorias</a>.</span></div>` : '';
  abrirModal(p ? 'Editar produto' : 'Novo produto', `${semCategorias}<div class="form-grade">
    <label class="campo largo">Descrição *<input name="nome" required value="${v('nome')}" placeholder="Ex.: Disjuntor DIN bipolar 40A"></label>
    <label class="campo">Código interno *<input name="codigo" required value="${v('codigo')}" placeholder="ELE-012"></label>
    <label class="campo">Código de barras<input name="codigo_barras" value="${v('codigo_barras')}" placeholder="Bipe o leitor aqui"></label>
    <label class="campo">Marca<input name="marca" value="${v('marca')}"></label>
    <label class="campo">Categoria<select name="categoria_id">${opcoes(cache.categorias.map((c) => ({ ...c, nome: `${c.nome} (${SETORES[c.setor]})` })), p?.categoria_id)}</select></label>
    <label class="campo">Fornecedor<select name="fornecedor_id">${opcoes(cache.fornecedores, p?.fornecedor_id)}</select></label>
    <label class="campo">Unidade<select name="unidade">${UNIDADES.map((u) => `<option ${u === (p?.unidade || 'UN') ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
    <label class="campo">Preço de custo (R$)<input name="preco_custo" inputmode="decimal" value="${br('preco_custo', 2)}" placeholder="0,00"></label>
    <label class="campo">Preço de venda (R$)<input name="preco_venda" inputmode="decimal" value="${br('preco_venda', 2)}" placeholder="0,00"></label>
    <label class="campo">Estoque mínimo<input name="estoque_minimo" inputmode="decimal" value="${br('estoque_minimo', 0)}" placeholder="0"></label>
    <label class="campo">Localização<input name="localizacao" value="${v('localizacao')}" placeholder="Prateleira A1-03"></label>
    ${p ? `<label class="check" style="align-self:end;height:40px"><input type="checkbox" name="ativo" ${p.ativo ? 'checked' : ''}> Produto ativo</label>`
      : '<label class="campo">Estoque inicial<input name="estoque_inicial" inputmode="decimal" value="0"></label>'}
    </div>`,
  async (d) => {
    if (p) await api('/produtos/' + p.id, { method: 'PUT', body: d });
    else await api('/produtos', { method: 'POST', body: d });
    aviso('Produto salvo.');
    await depois();
    atualizarContador();
  });
}

// ---------- Entrada / Saída ----------
telas.movimentar = async (el, produtoId) => {
  el.innerHTML = cabecalho('Entrada e saída', 'Registre compras, vendas, uso em obra e contagem de inventário.') + `
  <div class="segmentado">
    <button data-tipo="entrada">${ic('entrada')}Entrada</button>
    <button data-tipo="saida">${ic('saida')}Saída</button>
    <button data-tipo="ajuste">${ic('ajuste')}Ajuste de inventário</button>
  </div>
  <div class="cartao"><div class="cartao-corpo">
    <div class="dica">${ic('info')}<span id="dica"></span></div>
    <div class="busca-grande">${ic('codigoBarras')}
      <input id="m-busca" autocomplete="off" placeholder="Digite o nome ou o código, ou passe o leitor de código de barras">
      <div id="m-sug" class="sugestoes" hidden></div>
    </div>
    <div id="m-prod"></div>
    <form id="m-form" style="margin-top:20px">
      <div class="form-grade">
        <label class="campo" id="rot-qtd"><span>Quantidade *</span><input name="quantidade" inputmode="decimal" required placeholder="0"></label>
        <label class="campo">Valor unitário (R$)<input name="valor_unitario" inputmode="decimal" placeholder="Usa o preço do cadastro"></label>
        <label class="campo">Documento<input name="documento" placeholder="NF, pedido ou OS"></label>
        <label class="campo">Observação<input name="motivo" placeholder="Ex.: obra Rua das Flores, 120"></label>
      </div>
      <div class="acoes" style="margin-top:20px;justify-content:space-between;align-items:center">
        <label class="check" id="lbl-custo"><input type="checkbox" name="atualizar_custo"> Atualizar o preço de custo com este valor</label>
        <button class="btn primario grande" type="submit" id="m-registrar">${ic('ok')}Registrar</button>
      </div>
    </form>
  </div></div>`;

  let tipo = 'entrada';
  let produto = null;
  const dicas = {
    entrada: 'Compra ou recebimento de mercadoria. A quantidade é somada ao estoque.',
    saida: 'Venda, uso em obra/instalação ou perda. A quantidade é descontada (o estoque nunca fica negativo).',
    ajuste: 'Contagem de inventário: informe a quantidade que você contou na prateleira. O sistema corrige o saldo e registra a diferença.',
  };
  const setTipo = (t) => {
    tipo = t;
    $$('[data-tipo]', el).forEach((b) => b.classList.toggle('ativo', b.dataset.tipo === t));
    $('#dica').textContent = dicas[t];
    $('#rot-qtd span').textContent = t === 'ajuste' ? 'Quantidade contada *' : 'Quantidade *';
    $('#lbl-custo').style.visibility = t === 'entrada' ? 'visible' : 'hidden';
    $('#m-registrar').lastChild.textContent = `Registrar ${TIPOS[t].toLowerCase()}`;
  };
  $$('[data-tipo]', el).forEach((b) => (b.onclick = () => setTipo(b.dataset.tipo)));
  setTipo('entrada');

  const escolher = (p) => {
    produto = p;
    $('#m-sug').hidden = true;
    $('#m-busca').value = '';
    $('#m-prod').innerHTML = `<div class="produto-escolhido">
      <div class="kpi-icone tom-azul">${ic('caixa')}</div>
      <div class="cresce"><div class="nome">${esc(p.nome)}</div>
        <div class="produto-meta"><span class="codigo">${esc(p.codigo)}</span> ${setorTag(p.setor)} · Local ${esc(p.localizacao || '—')} · Custo ${moeda(p.preco_custo)} · Venda ${moeda(p.preco_venda)}</div></div>
      <div class="saldo-grande"><small>Estoque atual</small>
        <div class="valor ${p.estoque <= p.estoque_minimo ? 'suave' : ''}" style="${p.estoque <= p.estoque_minimo ? 'color:var(--alerta)' : ''}">${qtd(p.estoque)} <small>${esc(p.unidade)}</small></div>
        <small>mínimo ${qtd(p.estoque_minimo)}</small></div>
      <button class="btn-icone" id="m-limpar" title="Trocar produto">${ic('fechar')}</button></div>`;
    $('#m-limpar').onclick = () => { produto = null; $('#m-prod').innerHTML = ''; $('#m-busca').focus(); };
    $('#m-form [name=quantidade]').focus();
  };

  let resultados = [];
  let t;
  const buscar = async () => {
    const q = $('#m-busca').value.trim();
    if (!q) { $('#m-sug').hidden = true; return; }
    resultados = await api('/produtos?busca=' + encodeURIComponent(q));
    $('#m-sug').hidden = false;
    $('#m-sug').innerHTML = resultados.slice(0, 20).map((p, i) => `<button type="button" data-i="${i}">
      <span class="codigo">${esc(p.codigo)}</span><span class="cresce">${esc(p.nome)}</span>${medidor(p)}</button>`).join('')
      || '<div class="suave" style="padding:12px">Nenhum produto encontrado.</div>';
  };
  $('#m-busca').oninput = () => { clearTimeout(t); t = setTimeout(tentar(buscar), 200); };
  $('#m-busca').onkeydown = tentar(async (ev) => {
    if (ev.key === 'Escape') { $('#m-sug').hidden = true; return; }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); $('#m-sug button')?.focus(); return; }
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    clearTimeout(t);
    await buscar();
    const q = $('#m-busca').value.trim().toLowerCase();
    const exato = resultados.find((p) => p.codigo_barras === q || p.codigo.toLowerCase() === q);
    if (exato || resultados.length === 1) escolher(exato || resultados[0]);
  });
  $('#m-sug').onclick = (ev) => { const i = ev.target.closest('[data-i]')?.dataset.i; if (i !== undefined) escolher(resultados[i]); };
  $('#m-sug').onkeydown = (ev) => {
    const atual = document.activeElement;
    if (ev.key === 'ArrowDown') { ev.preventDefault(); atual.nextElementSibling?.focus(); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); (atual.previousElementSibling || $('#m-busca')).focus(); }
  };

  $('#m-form').onsubmit = tentar(async (ev) => {
    ev.preventDefault();
    if (!produto) { $('#m-busca').focus(); throw new Error('Escolha um produto primeiro.'); }
    const d = Object.fromEntries(new FormData(ev.target));
    d.atualizar_custo = ev.target.atualizar_custo.checked;
    const r = await api('/movimentacoes', { method: 'POST', body: { ...d, tipo, produto_id: produto.id } });
    aviso(`${TIPOS[tipo]} registrada. Novo saldo: ${qtd(r.estoque)} ${produto.unidade}`);
    ev.target.reset();
    escolher(await api('/produtos/' + produto.id));
    $('#m-busca').focus();
    atualizarContador();
  });

  if (produtoId) escolher(await api('/produtos/' + produtoId)); else $('#m-busca').focus();
};

// ---------- Histórico ----------
telas.historico = async (el, produtoId) => {
  const hoje = dataLocal();
  const inicio = dataLocal(new Date(Date.now() - 30 * 864e5));
  const prod = produtoId ? await api('/produtos/' + produtoId) : null;
  el.innerHTML = cabecalho(prod ? esc(prod.nome) : 'Histórico', prod ? `Movimentações do produto <span class="codigo">${esc(prod.codigo)}</span>` : 'Tudo o que entrou e saiu, com data, usuário e documento.',
    prod ? `<a class="btn" href="#historico">Ver todos os produtos</a>` : '') + `
  <div class="cartao">
    <div class="ferramentas">
      ${prod ? '' : `<div class="com-icone">${ic('busca')}<input id="h-busca" placeholder="Produto, código ou documento"></div>`}
      <select id="h-tipo"><option value="">Todos os tipos</option>${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <input type="date" id="h-de" value="${prod ? '' : inicio}" title="De"><input type="date" id="h-ate" value="${hoje}" title="Até">
    </div>
    <div class="tabela-wrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Produto</th><th class="num">Quantidade</th>
      <th class="num">Saldo</th><th class="num">Valor unit.</th><th>Documento</th><th>Observação</th><th>Usuário</th></tr></thead>
      <tbody id="h-lista"></tbody></table></div>
    <div class="rodape-tabela" id="h-rodape"></div>
  </div>`;
  const lista = async () => {
    const p = new URLSearchParams({ tipo: $('#h-tipo').value, de: $('#h-de').value, ate: $('#h-ate').value, busca: $('#h-busca')?.value || '' });
    if (produtoId) p.set('produto_id', produtoId);
    const itens = await api('/movimentacoes?' + p);
    $('#h-lista').innerHTML = itens.map((m) => `<tr><td>${dataBR(m.criado_em)}</td><td>${tipoTag(m.tipo)}</td>
      <td class="quebra"><div class="produto-nome">${esc(m.produto)}</div><div class="produto-meta">${esc(m.codigo)}</div></td>
      <td class="num"><strong>${m.tipo === 'saida' ? '−' : m.quantidade >= 0 ? '+' : '−'}${qtd(Math.abs(m.quantidade))}</strong> <small class="suave">${esc(m.unidade)}</small></td>
      <td class="num"><span class="suave">${qtd(m.estoque_antes)} →</span> <strong>${qtd(m.estoque_depois)}</strong></td>
      <td class="num">${m.valor_unitario != null ? moeda(m.valor_unitario) : '—'}</td>
      <td>${esc(m.documento || '—')}</td><td class="quebra">${esc(m.motivo || '')}</td><td>${esc(m.usuario || '')}</td></tr>`).join('')
      || vazio('historico', 'Nenhuma movimentação no período.', 9);
    $('#h-rodape').textContent = itens.length >= 500
      ? 'Mostrando as 500 movimentações mais recentes. Use as datas para ver períodos anteriores, ou baixe a planilha em Relatórios.'
      : `${itens.length} movimentação(ões)`;
  };
  let t;
  if ($('#h-busca')) $('#h-busca').oninput = () => { clearTimeout(t); t = setTimeout(tentar(lista), 250); };
  ['#h-tipo', '#h-de', '#h-ate'].forEach((s) => ($(s).onchange = tentar(lista)));
  await lista();
};

// ---------- Categorias ----------
telas.categorias = async (el) => {
  const itens = await api('/categorias');
  const admin = usuario.perfil === 'admin';
  el.innerHTML = cabecalho('Categorias', 'Organize os produtos por setor e tipo de material.', `<button class="btn primario" id="nova">${ic('mais')}Nova categoria</button>`) + `
  <div class="cartao tabela-wrap"><table><thead><tr><th>Nome</th><th>Setor</th><th class="num">Produtos</th><th></th></tr></thead><tbody>
  ${itens.map((c) => `<tr><td class="produto-nome">${esc(c.nome)}</td><td>${setorTag(c.setor)}</td><td class="num">${c.produtos}</td>
    <td class="acoes-linha"><button class="btn-icone" data-edit="${c.id}" title="Editar">${ic('editar')}</button>
    ${admin ? `<button class="btn-icone" data-del="${c.id}" title="Excluir">${ic('lixo')}</button>` : ''}</td></tr>`).join('')
    || `<tr><td colspan="4" class="vazio">${ic('etiqueta')}Nenhuma categoria ainda.<br>
      <span style="display:block;max-width:520px;margin:6px auto 14px">Crie uma por uma, ou comece com 15 categorias prontas para elétrica, hidráulica e segurança eletrônica (dá para editar e excluir depois).</span>
      <button class="btn primario" id="sugeridas">${ic('mais')}Criar categorias sugeridas</button></td></tr>`}
  </tbody></table></div>`;
  const form = (c) => abrirModal(c ? 'Editar categoria' : 'Nova categoria', `<div class="form-grade">
    <label class="campo">Nome *<input name="nome" required value="${esc(c?.nome || '')}"></label>
    <label class="campo">Setor<select name="setor">${Object.entries(SETORES).map(([k, v]) => `<option value="${k}" ${c?.setor === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>`,
  async (d) => { await api('/categorias' + (c ? '/' + c.id : ''), { method: c ? 'PUT' : 'POST', body: d }); aviso('Categoria salva.'); rotear(); });
  $('#nova').onclick = () => form(null);
  if ($('#sugeridas')) $('#sugeridas').onclick = tentar(async () => {
    const r = await api('/categorias/sugeridas', { method: 'POST' });
    aviso(`${r.criadas} categorias criadas.`);
    rotear();
  });
  el.onclick = tentar(async (ev) => {
    const b = ev.target.closest('button');
    if (b?.dataset.edit) form(itens.find((c) => c.id == b.dataset.edit));
    if (b?.dataset.del && confirm('Excluir esta categoria? Os produtos dela ficarão sem categoria.')) { await api('/categorias/' + b.dataset.del, { method: 'DELETE' }); aviso('Categoria excluída.'); rotear(); }
  });
};

// ---------- Fornecedores ----------
telas.fornecedores = async (el) => {
  const itens = await api('/fornecedores');
  const admin = usuario.perfil === 'admin';
  el.innerHTML = cabecalho('Fornecedores', 'Distribuidores e fabricantes de quem a loja compra.', `<button class="btn primario" id="novo">${ic('mais')}Novo fornecedor</button>`) + `
  <div class="cartao tabela-wrap"><table><thead><tr><th>Fornecedor</th><th>CNPJ</th><th>Telefone</th><th>E-mail</th><th class="num">Produtos</th><th></th></tr></thead><tbody>
  ${itens.map((f) => `<tr><td><div class="produto-nome">${esc(f.nome)}</div><div class="produto-meta">${f.contato ? 'Contato: ' + esc(f.contato) : '&nbsp;'}</div></td>
    <td>${esc(f.cnpj || '—')}</td><td>${esc(f.telefone || '—')}</td><td>${f.email ? `<a href="mailto:${esc(f.email)}">${esc(f.email)}</a>` : '—'}</td><td class="num">${f.produtos}</td>
    <td class="acoes-linha"><button class="btn-icone" data-edit="${f.id}" title="Editar">${ic('editar')}</button>
    ${admin ? `<button class="btn-icone" data-del="${f.id}" title="Excluir">${ic('lixo')}</button>` : ''}</td></tr>`).join('') || vazio('caminhao', 'Nenhum fornecedor cadastrado.', 6)}
  </tbody></table></div>`;
  const form = (f) => abrirModal(f ? 'Editar fornecedor' : 'Novo fornecedor', `<div class="form-grade">
    <label class="campo largo">Razão social / nome *<input name="nome" required value="${esc(f?.nome || '')}"></label>
    <label class="campo">CNPJ<input name="cnpj" value="${esc(f?.cnpj || '')}" placeholder="00.000.000/0000-00"></label>
    <label class="campo">Pessoa de contato<input name="contato" value="${esc(f?.contato || '')}"></label>
    <label class="campo">Telefone<input name="telefone" value="${esc(f?.telefone || '')}" placeholder="(00) 0000-0000"></label>
    <label class="campo">E-mail<input name="email" type="email" value="${esc(f?.email || '')}"></label></div>`,
  async (d) => { await api('/fornecedores' + (f ? '/' + f.id : ''), { method: f ? 'PUT' : 'POST', body: d }); aviso('Fornecedor salvo.'); rotear(); });
  $('#novo').onclick = () => form(null);
  el.onclick = tentar(async (ev) => {
    const b = ev.target.closest('button');
    if (b?.dataset.edit) form(itens.find((f) => f.id == b.dataset.edit));
    if (b?.dataset.del && confirm('Excluir este fornecedor?')) { await api('/fornecedores/' + b.dataset.del, { method: 'DELETE' }); aviso('Fornecedor excluído.'); rotear(); }
  });
};

// ---------- Relatórios ----------
telas.relatorios = async (el) => {
  const hoje = dataLocal();
  const inicioMes = hoje.slice(0, 8) + '01';
  el.innerHTML = cabecalho('Relatórios', 'Planilhas que abrem direto no Excel ou no Google Planilhas.') + `
  <div class="grade-3">
    <div class="cartao cartao-corpo pilha" style="gap:16px">
      <div class="kpi-icone tom-azul">${ic('caixa')}</div>
      <div><h2 style="font-size:1.05rem">Posição de estoque</h2><p class="suave" style="margin:4px 0 0">Todos os produtos com saldo, preços e valor total.</p></div>
      <label class="campo">Setor<select id="r-setor"><option value="">Todos</option>${Object.entries(SETORES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <button class="btn primario" id="r-estoque">${ic('baixar')}Baixar planilha</button>
    </div>
    <div class="cartao cartao-corpo pilha" style="gap:16px">
      <div class="kpi-icone tom-laranja">${ic('alerta')}</div>
      <div><h2 style="font-size:1.05rem">Lista de compras</h2><p class="suave" style="margin:4px 0 0">Só os itens abaixo do mínimo, prontos para mandar ao fornecedor.</p></div>
      <label class="campo">Setor<select id="r-setor2"><option value="">Todos</option>${Object.entries(SETORES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <button class="btn primario" id="r-compras">${ic('baixar')}Baixar planilha</button>
    </div>
    <div class="cartao cartao-corpo pilha" style="gap:16px">
      <div class="kpi-icone tom-verde">${ic('historico')}</div>
      <div><h2 style="font-size:1.05rem">Movimentações</h2><p class="suave" style="margin:4px 0 0">Entradas, saídas e ajustes de um período.</p></div>
      <div class="form-grade" style="grid-template-columns:1fr 1fr;gap:10px">
        <label class="campo">De<input type="date" id="r-de" value="${inicioMes}"></label><label class="campo">Até<input type="date" id="r-ate" value="${hoje}"></label></div>
      <label class="campo">Tipo<select id="r-tipo"><option value="">Todos</option>${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <button class="btn primario" id="r-mov">${ic('baixar')}Baixar planilha</button>
    </div>
  </div>`;
  $('#r-estoque').onclick = () => baixar('/relatorios/estoque.csv?' + new URLSearchParams({ setor: $('#r-setor').value }), 'estoque.csv');
  $('#r-compras').onclick = () => baixar('/relatorios/estoque.csv?' + new URLSearchParams({ setor: $('#r-setor2').value, baixo: '1' }), 'lista-de-compras.csv');
  $('#r-mov').onclick = () => baixar('/relatorios/movimentacoes.csv?' + new URLSearchParams({ de: $('#r-de').value, ate: $('#r-ate').value, tipo: $('#r-tipo').value }), 'movimentacoes.csv');
};

// ---------- Backup ----------
telas.backup = async (el) => {
  const { itens, extra } = await api('/backups');
  const info = PRINCIPAL ? await window.desktop.info() : null;
  const ultimo = itens[0];
  const nomeNuvem = (p) => (/google|meu drive|my drive/i.test(p) ? 'Google Drive' : /onedrive/i.test(p) ? 'OneDrive' : 'pasta extra');

  let blocoNuvem;
  if (extra.pasta) {
    blocoNuvem = `<div class="cartao destaque-backup" style="margin-bottom:20px">
      <div class="kpi-icone ${extra.erro ? 'tom-vermelho' : 'tom-azul'}">${ic(extra.erro ? 'alerta' : 'nuvem')}</div>
      <div class="cresce"><h2>${extra.erro ? 'Problema na cópia para a nuvem' : `Cópia na nuvem ligada (${nomeNuvem(extra.pasta)})`}</h2>
        <p class="suave" style="margin:4px 0 0">${extra.erro ? esc(extra.erro) : 'Cada backup também é copiado para'} <span class="codigo">${esc(extra.pasta)}</span>
        ${extra.ultimaCopia ? `· última cópia ${dataBR(extra.ultimaCopia)}` : ''}</p></div>
      ${PRINCIPAL ? `<div class="acoes"><button class="btn" id="b-abrir-extra">${ic('pasta')}Abrir</button><button class="btn perigo" id="b-remover-extra">Desligar</button></div>` : ''}
    </div>`;
  } else if (PRINCIPAL) {
    const sug = info.sugestoesNuvem;
    blocoNuvem = `<div class="cartao destaque-backup" style="margin-bottom:20px">
      <div class="kpi-icone tom-laranja">${ic('nuvem')}</div>
      <div class="cresce"><h2>Guarde os backups na nuvem, de graça</h2>
        <p class="suave" style="margin:4px 0 0">${sug.length
          ? 'Encontrei uma pasta de nuvem neste computador. Com um clique, cada backup também vai para lá e sobe sozinho para a internet.'
          : 'Instale o <strong>Google Drive para computador</strong> (15 GB grátis) ou use o <strong>OneDrive</strong> do Windows, e escolha a pasta aqui. Cada backup também vai para lá e sobe sozinho para a internet. Também serve um pendrive.'}</p></div>
      <div class="acoes">${sug.map((x, i) => `<button class="btn primario" data-sugestao="${i}">${ic('nuvem')}Usar ${esc(x.nome)}</button>`).join('')}
        <button class="btn" id="b-escolher-extra">${ic('pasta')}${sug.length ? 'Outra pasta…' : 'Escolher pasta…'}</button></div>
    </div>`;
  } else blocoNuvem = '';

  el.innerHTML = cabecalho('Backup', 'Cópias de segurança de todos os dados do estoque.',
    `${PRINCIPAL ? `<button class="btn" id="b-pasta">${ic('pasta')}Abrir pasta</button>` : ''}
     <button class="btn primario" id="b-agora">${ic('backup')}Fazer backup agora</button>`) + `
  <div class="cartao destaque-backup" style="margin-bottom:20px">
    <div class="kpi-icone tom-verde">${ic('escudo')}</div>
    <div class="cresce"><h2>Backup automático ligado</h2>
      <p class="suave" style="margin:4px 0 0">Todo dia o sistema guarda sozinho uma cópia dos dados e mantém os últimos 15 dias.
      ${ultimo ? `Último backup: <strong>${dataBR(ultimo.criado_em)}</strong>.` : ''}</p></div>
  </div>
  ${blocoNuvem}
  ${PRINCIPAL ? `<div class="grade-3" style="margin-bottom:20px">
    <div class="cartao cartao-corpo pilha" style="gap:14px">
      <div class="kpi-icone tom-azul">${ic('baixar')}</div>
      <div><h2 style="font-size:1.05rem">Salvar uma cópia agora</h2><p class="suave" style="margin:4px 0 0">Grava um backup onde você escolher, por exemplo num pendrive.</p></div>
      <button class="btn" id="b-salvar">${ic('baixar')}Salvar cópia em…</button></div>
    <div class="cartao cartao-corpo pilha" style="gap:14px">
      <div class="kpi-icone tom-laranja">${ic('restaurar')}</div>
      <div><h2 style="font-size:1.05rem">Restaurar de um arquivo</h2><p class="suave" style="margin:4px 0 0">Para trocar de computador ou voltar dados do Google Drive ou de um pendrive. O programa reinicia sozinho.</p></div>
      <button class="btn" id="b-arquivo">${ic('enviar')}Escolher arquivo…</button></div>
  </div>` : ''}
  <div class="cartao">
    <div class="cartao-topo"><h2>Backups guardados</h2><span class="suave">${itens.length} arquivo(s)</span></div>
    <div class="tabela-wrap" style="margin-top:12px"><table>
      <thead><tr><th>Data</th><th>Tipo</th><th class="num">Tamanho</th><th></th></tr></thead><tbody>
      ${itens.map((b) => `<tr><td><strong>${dataBR(b.criado_em)}</strong><div class="produto-meta">${esc(b.arquivo)}</div></td>
        <td><span class="etiqueta tipo-${b.tipo}">${b.tipo === 'manual' ? 'Manual' : 'Automático'}</span></td>
        <td class="num">${tamanho(b.tamanho)}</td>
        <td class="acoes-linha">
          <button class="btn-icone" data-baixar="${esc(b.arquivo)}" title="Baixar">${ic('baixar')}</button>
          ${PRINCIPAL ? `<button class="btn" data-restaurar="${esc(b.arquivo)}" style="height:32px">${ic('restaurar')}Restaurar</button>` : ''}
        </td></tr>`).join('') || vazio('backup', 'Nenhum backup ainda.', 4)}
      </tbody></table></div>
  </div>`;

  const resultado = (r, msgOk) => { if (r?.ok) aviso(msgOk); return r?.ok; };
  $('#b-agora').onclick = tentar(async () => { await api('/backups', { method: 'POST' }); aviso('Backup feito com sucesso.'); rotear(); });
  if (PRINCIPAL) {
    const d = window.desktop;
    $('#b-pasta').onclick = tentar(() => d.abrirPastaBackups(token));
    $('#b-salvar').onclick = tentar(async () => resultado(await d.salvarBackupComo(token), 'Cópia salva com sucesso.'));
    $('#b-arquivo').onclick = tentar(async () => resultado(await d.restaurarDeArquivo(token), 'Restaurando… o programa vai reiniciar.'));
    if ($('#b-escolher-extra')) $('#b-escolher-extra').onclick = tentar(async () => { if (resultado(await d.definirPastaExtra(token), 'Pronto! Os backups agora também vão para a nuvem.')) rotear(); });
    if ($('#b-abrir-extra')) $('#b-abrir-extra').onclick = tentar(() => d.abrirPastaBackups(token, 'extra'));
    if ($('#b-remover-extra')) $('#b-remover-extra').onclick = tentar(async () => {
      if (!confirm('Parar de copiar os backups para a nuvem? Os arquivos que já estão lá continuam guardados.')) return;
      await d.removerPastaExtra(token); aviso('Cópia para a nuvem desligada.'); rotear();
    });
  }
  el.onclick = tentar(async (ev) => {
    const b = ev.target.closest('button');
    if (b?.dataset.baixar) await baixar('/backups/' + encodeURIComponent(b.dataset.baixar), b.dataset.baixar);
    if (b?.dataset.restaurar) resultado(await window.desktop.restaurarDaLista(token, b.dataset.restaurar), 'Restaurando… o programa vai reiniciar.');
    if (b?.dataset.sugestao !== undefined) {
      const caminho = info.sugestoesNuvem[Number(b.dataset.sugestao)].caminho;
      if (resultado(await window.desktop.definirPastaExtra(token, caminho), 'Pronto! Os backups agora também vão para a nuvem.')) rotear();
    }
  });
};

// ---------- Configurações (programa do PC) ----------
telas.configuracoes = async (el) => {
  const info = await window.desktop.info();
  const enderecos = info.enderecosRede || [];
  const lan = enderecos.filter((e) => !/Tailscale/.test(e.rede));
  const ts = enderecos.filter((e) => /Tailscale/.test(e.rede));
  const linhaEndereco = (e) => `<li><div class="cresce"><strong style="font-size:1.25rem;font-variant-numeric:tabular-nums">${esc(e.ip)}</strong><small>${esc(e.rede)}</small></div>
    <span class="suave" style="font-size:13px">celular/navegador: http://${esc(e.ip)}:${info.porta}</span></li>`;
  el.innerHTML = cabecalho('Configurações', 'Como este computador funciona e como conectar os outros.') + `
  <div class="cartao destaque-backup" style="margin-bottom:20px">
    <div class="kpi-icone ${PRINCIPAL ? 'tom-azul' : 'tom-roxo'}">${ic(PRINCIPAL ? 'backup' : 'rede')}</div>
    <div class="cresce"><h2>${PRINCIPAL ? 'Este é o computador principal' : 'Conectado ao computador principal'}</h2>
      <p class="suave" style="margin:4px 0 0">${PRINCIPAL
        ? 'Os dados da loja ficam guardados aqui. Deixe este computador ligado enquanto os outros estiverem usando o sistema.'
        : `Os dados ficam no computador principal, no endereço <span class="codigo">${esc(info.endereco)}</span>.`}</p></div>
    <div class="acoes"><button class="btn" id="c-mudar">${ic('engrenagem')}Mudar</button></div>
  </div>
  ${PRINCIPAL ? `<div class="grade-2">
    <div class="cartao">
      <div class="cartao-topo"><h2>${ic('rede')} Endereço para os outros computadores</h2></div>
      <p class="suave" style="padding:8px 20px 0;margin:0">Nos outros PCs da loja, instale o programa, escolha <strong>"Conectar ao computador principal"</strong> e digite:</p>
      <ul class="lista">${lan.map(linhaEndereco).join('') || '<li class="suave">Este computador não está conectado a nenhuma rede.</li>'}</ul>
      <div class="dica" style="margin:0 20px 20px">${ic('info')}<span>Na primeira vez, o Windows pode perguntar se o programa pode usar a rede. Clique em <strong>Permitir acesso</strong>, senão os outros computadores não conseguem conectar.</span></div>
    </div>
    <div class="cartao">
      <div class="cartao-topo"><h2>${ic('nuvem')} Acessar de fora da loja (grátis)</h2></div>
      ${ts.length ? `<p class="suave" style="padding:8px 20px 0;margin:0">O Tailscale está ligado. De qualquer lugar, use este endereço:</p><ul class="lista">${ts.map(linhaEndereco).join('')}</ul>`
        : `<div class="cartao-corpo"><ol style="margin:0;padding-left:20px;display:grid;gap:8px">
          <li>Crie uma conta grátis em <a href="https://tailscale.com/download" target="_blank" rel="noopener">tailscale.com</a> e instale o Tailscale <strong>neste computador</strong>.</li>
          <li>Instale também no seu celular ou notebook, entrando com a <strong>mesma conta</strong>.</li>
          <li>Volte nesta tela: vai aparecer um endereço começando com <span class="codigo">100.</span> para usar de qualquer lugar.</li></ol>
          <p class="suave" style="margin:12px 0 0;font-size:13px">A conexão é privada e criptografada: o sistema não fica aberto para a internet.</p></div>`}
    </div>
  </div>` : ''}
  <p class="suave" style="margin-top:20px;font-size:13px">Controle de Estoque · versão ${esc(info.versao)}</p>`;
  $('#c-mudar').onclick = tentar(() => window.desktop.reconfigurar());
};

// ---------- Usuários ----------
telas.usuarios = async (el) => {
  const itens = await api('/usuarios');
  el.innerHTML = cabecalho('Usuários', 'Quem pode acessar o sistema. Crie um login para cada funcionário.', `<button class="btn primario" id="novo">${ic('mais')}Novo usuário</button>`) + `
  <div class="cartao tabela-wrap"><table><thead><tr><th>Usuário</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>
  ${itens.map((u) => `<tr><td><div style="display:flex;align-items:center;gap:12px"><div class="avatar">${esc(iniciais(u.nome))}</div>
      <div><div class="produto-nome">${esc(u.nome)}</div><div class="produto-meta">${esc(u.email)}</div></div></div></td>
    <td>${u.perfil === 'admin' ? '<span class="etiqueta tipo-manual">Administrador</span>' : '<span class="etiqueta tipo-automatico">Operador</span>'}</td>
    <td>${u.ativo ? '<span class="etiqueta tipo-entrada">Ativo</span>' : '<span class="etiqueta tipo-saida">Bloqueado</span>'}</td>
    <td class="acoes-linha"><button class="btn-icone" data-edit="${u.id}" title="Editar">${ic('editar')}</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="dica" style="margin-top:20px">${ic('info')}<span><strong>Operador:</strong> cadastra produtos e lança entradas/saídas. <strong>Administrador:</strong> também exclui registros, gerencia usuários e faz backup.</span></div>`;
  const form = (u) => abrirModal(u ? 'Editar usuário' : 'Novo usuário', `<div class="form-grade">
    <label class="campo">Nome *<input name="nome" required value="${esc(u?.nome || '')}"></label>
    <label class="campo">E-mail *<input name="email" type="email" required value="${esc(u?.email || '')}"></label>
    <label class="campo">Perfil<select name="perfil"><option value="operador">Operador</option><option value="admin" ${u?.perfil === 'admin' ? 'selected' : ''}>Administrador</option></select></label>
    <label class="campo">${u ? 'Nova senha (deixe vazio para manter)' : 'Senha * (mín. 6 caracteres)'}<input name="senha" type="password" minlength="6" ${u ? '' : 'required'}></label>
    ${u ? `<label class="check"><input type="checkbox" name="ativo" ${u.ativo ? 'checked' : ''}> Acesso liberado</label>` : ''}</div>`,
  async (d) => { await api('/usuarios' + (u ? '/' + u.id : ''), { method: u ? 'PUT' : 'POST', body: d }); aviso('Usuário salvo.'); rotear(); });
  $('#novo').onclick = () => form(null);
  el.onclick = (ev) => { const b = ev.target.closest('[data-edit]'); if (b) form(itens.find((u) => u.id == b.dataset.edit)); };
};

// ================= Roteamento =================
const iniciais = (nome) => String(nome || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();

async function rotear() {
  const [nome, param] = (location.hash.slice(1) || 'painel').split('/');
  const item = MENU.find((m) => m.id === nome && (!m.admin || usuario?.perfil === 'admin') && (!m.desktop || DESKTOP));
  const id = item ? nome : 'painel';
  $$('#menu a').forEach((a) => a.classList.toggle('ativo', a.dataset.id === id));
  abrirLateral(false);
  const el = $('#conteudo');
  el.onclick = null;
  window.scrollTo(0, 0);
  try { await telas[id](el, param); } catch (e) { el.innerHTML = cabecalho('Ops…', esc(e.message)); }
}

async function mostrarLogin() {
  $('#app').hidden = true;
  $('#tela-login').hidden = false;
  let primeiro = false;
  try { primeiro = (await api('/status')).precisaConfigurar; } catch { /* sem conexão: mostra o login */ }
  $('#form-login').hidden = primeiro;
  $('#form-primeiro').hidden = !primeiro;
  $(primeiro ? '#form-primeiro [name=nome]' : '#form-login [name=email]').focus();
}

async function primeiroAcesso(ev) {
  ev.preventDefault();
  const f = Object.fromEntries(new FormData(ev.target));
  if (f.senha !== f.senha2) { $('#erro-primeiro').textContent = 'As senhas não são iguais.'; return; }
  const botao = $('button[type=submit]', ev.target);
  botao.disabled = true;
  try {
    const r = await api('/primeiro-acesso', { method: 'POST', body: f });
    token = r.token;
    localStorage.setItem('token', token);
    ev.target.reset();
    $('#erro-primeiro').textContent = '';
    location.hash = 'painel';
    await iniciar();
  } catch (e) { $('#erro-primeiro').textContent = e.message; } finally { botao.disabled = false; }
}

async function iniciar() {
  if (!token) return mostrarLogin();
  try { usuario = await api('/me'); } catch { return; }
  $('#tela-login').hidden = true;
  $('#app').hidden = false;
  $('#nome-usuario').textContent = usuario.nome;
  $('#perfil-usuario').textContent = usuario.perfil === 'admin' ? 'Administrador' : 'Operador';
  $('#avatar').textContent = iniciais(usuario.nome);
  montarMenu();
  atualizarContador();
  rotear();
}

$('#btn-senha').innerHTML = ic('chave');
$('#btn-sair').innerHTML = ic('sair');
$('#btn-menu').innerHTML = ic('menu');
$('#form-login').onsubmit = entrar;
$('#form-primeiro').onsubmit = primeiroAcesso;
$('#btn-sair').onclick = () => sair();
$('#btn-senha').onclick = trocarSenha;
$('#btn-menu').onclick = () => abrirLateral(true);
$('#fundo-lateral').onclick = () => abrirLateral(false);
window.addEventListener('hashchange', rotear);
iniciar();
