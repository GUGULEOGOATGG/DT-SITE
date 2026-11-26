# Controle de Estoque: Elétrica, Hidráulica e Segurança Eletrônica

Programa de controle de estoque para lojas de materiais. Funciona no Windows, **sem mensalidade e sem internet**, e pode ser usado em vários computadores e celulares da loja ao mesmo tempo.

## Funcionalidades

- **Login com perfis:** *Administrador* (tudo) e *Operador* (cadastra e movimenta, mas não exclui nem gerencia usuários). Bloqueia por 15 minutos depois de 5 senhas erradas.
- **Produtos:** código interno, código de barras (sem repetição), marca, categoria, fornecedor, unidade (UN, M, RL, BR, CX…), custo, venda, estoque mínimo e localização na prateleira. A busca ignora acentos.
- **Setores:** Elétrica, Hidráulica e Segurança Eletrônica, com categorias próprias. Há 15 categorias sugeridas que você cria com um clique, se quiser.
- **Entrada / Saída / Ajuste de inventário:** aceita **leitor de código de barras** (bipa e tecla Enter). O estoque **nunca fica negativo**, e cada lançamento grava o saldo antes e depois, além do usuário, documento (NF/OS) e observação.
- **Painel:** valor do estoque (custo e venda), itens para repor, valor por setor e últimas movimentações. Com o estoque vazio, mostra os primeiros passos.
- **Relatórios** em planilha (abrem no Excel): posição de estoque, lista de compras e movimentações por período.
- **Backup automático diário**, com cópia opcional no **Google Drive / OneDrive (grátis)**.
- Tema claro e escuro, e funciona no celular pelo navegador.

## Instalar no Windows

**Opção A: versão portátil (.zip)**
1. Baixe `Controle-de-Estoque-2.0.0-Windows-portatil.zip`.
2. Clique com o botão direito → **Extrair tudo…** (por exemplo, para `C:\Controle de Estoque`).
3. Dê dois cliques em **Controle de Estoque.exe**. Para criar um atalho: botão direito → Enviar para → Área de trabalho.

**Opção B: instalador (.exe)**, que cria atalho e entrada no Menu Iniciar sozinho:
1. No GitHub, abra a aba **Actions** → **Instalador Windows** → **Run workflow**.
2. Espere cerca de 5 minutos e baixe o arquivo em **Artifacts** → `Controle-de-Estoque-Windows`.
3. Rode `Instalar-Controle-de-Estoque-2.0.0.exe` e siga os passos.

> Na primeira vez, o Windows pode mostrar **"O Windows protegeu o computador"** (porque o programa não tem assinatura digital paga). Clique em **Mais informações → Executar assim mesmo**.

## Primeira abertura

1. O programa pergunta **como este computador vai funcionar**:
   - **Computador principal:** guarda os dados. Se a loja tem só um PC, escolha esta.
   - **Conectar ao computador principal:** para os outros PCs da loja. Basta digitar o endereço que aparece no principal, em **Configurações** (ex.: `192.168.0.10`).
2. No computador principal, você **cria a conta do administrador** (nome, e-mail e senha). O sistema começa **vazio**, sem nenhum dado de exemplo.
3. O Painel mostra os primeiros passos: categorias → fornecedores → produtos → backup na nuvem → login dos funcionários.

> No computador principal, o Windows pode perguntar se o programa pode usar a rede. Clique em **Permitir acesso**, senão os outros PCs não conseguem conectar.

## Usar em vários computadores e no celular (grátis)

- **Na loja:** os outros PCs instalam o programa e escolhem *Conectar ao computador principal*. Celulares e tablets no mesmo Wi-Fi abrem `http://ENDEREÇO-DO-PRINCIPAL:47821` no navegador.
- **De fora da loja:** instale o **Tailscale** (grátis, <https://tailscale.com/download>) no computador principal e no seu celular ou notebook, com a mesma conta. Em **Configurações** vai aparecer um endereço começando com `100.` que funciona de qualquer lugar, por uma conexão privada e criptografada. O sistema não fica aberto para a internet.
- O computador principal precisa estar ligado e com o programa aberto enquanto os outros usam. Se ele estiver desligado, os outros mostram um aviso com o botão "Tentar de novo".

## Backup

Tudo fica na barra lateral, em **Backup** (só administradores):

- **Automático:** uma cópia por dia (mantém os últimos 15 dias), mesmo se o programa ficar aberto por vários dias.
- **Na nuvem, de graça:** instale o **Google Drive para computador** (15 GB grátis) ou use o **OneDrive** do Windows. O programa detecta a pasta e, com um clique em **Usar Google Drive**, cada backup também é copiado para `Backup Controle de Estoque` dentro dela e sobe sozinho para a internet. Também funciona com pendrive (**Outra pasta…**).
- **Fazer backup agora**, **Salvar cópia em…** e **Restaurar** (da lista ou de um arquivo). Antes de restaurar, o programa guarda uma cópia dos dados atuais, e depois reinicia sozinho.
- **Trocar de computador:** instale no PC novo, escolha *Computador principal*, crie uma conta qualquer e use **Backup → Restaurar de um arquivo** com o último backup do Google Drive. A conta e todos os dados antigos voltam.

> Nunca coloque o banco de dados (`estoque.db`) direto numa pasta do Google Drive/OneDrive para dois PCs usarem ao mesmo tempo: o arquivo corrompe. A nuvem é só para os backups.

Onde ficam os arquivos no Windows: `%APPDATA%\Controle de Estoque\dados\` (banco e backups). Desinstalar o programa **não apaga** os dados.

Atalhos: **F5** recarrega, **Ctrl + / Ctrl −** zoom, **F11** tela cheia.

---

## Para quem for mexer no código

```bash
npm install
npm run app          # abre o programa (janela desktop)
npm test             # testes automatizados
npm run dist:win     # gera instalador e .zip em dist/ (no Windows; no Linux exige Wine)
npm start            # modo servidor/site em http://localhost:3000
DADOS_EXEMPLO=1 npm start   # servidor com produtos de demonstração (para testes)
```

### Variáveis de ambiente (modo servidor)

| Variável | Para quê | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `DB_PATH` | Onde fica o arquivo do banco | `data/estoque.db` |
| `ADMIN_EMAIL` / `ADMIN_SENHA` / `ADMIN_NOME` | Cria o administrador na primeira execução (recomendado na nuvem). Sem isso, a primeira pessoa que abrir o sistema cria a conta | — |
| `DADOS_EXEMPLO` | `1` insere produtos de demonstração num banco vazio | — |
| `BACKUP_DIR` | Pasta dos backups automáticos | `data/backups` |
| `BACKUP_DIR_EXTRA` | Segunda pasta para copiar cada backup (ex.: pasta do Google Drive) | — |
| `BACKUP_MANTER` | Quantos dias de backup automático guardar | `15` |
| `TRUST_PROXY` | `1` quando roda atrás de Render/Railway/Caddy (o bloqueio de senha passa a ver o IP real) | — |
| `TZ` | Fuso horário (datas dos lançamentos e do backup diário) | do sistema |

## Opções pagas na nuvem (só se não quiser deixar um PC ligado)

O banco é um arquivo (`estoque.db`), então o servidor precisa de **disco persistente**.

- **Oracle Cloud "Always Free":** é grátis, mas pede cartão de crédito no cadastro e a configuração é técnica. Use os passos do VPS abaixo.
- **Render** (cerca de US$ 7/mês): **New → Blueprint** com este repositório (o `render.yaml` já configura disco, fuso e proxy). Preencha `ADMIN_EMAIL` e `ADMIN_SENHA`. O plano Free do Render apaga o banco, então não serve.
- **Railway** (cerca de US$ 5/mês): crie um volume em `/data` e defina `DB_PATH=/data/estoque.db`, `TRUST_PROXY=1`, `TZ=America/Sao_Paulo`, `ADMIN_EMAIL` e `ADMIN_SENHA`.
- **VPS com Docker** (Ubuntu):
  ```bash
  curl -fsSL https://get.docker.com | sh
  git clone https://github.com/SEU-USUARIO/SEU-REPO.git estoque && cd estoque
  docker build -t estoque .
  docker run -d --name estoque --restart unless-stopped -p 3000:3000 -v estoque-dados:/data \
    -e ADMIN_EMAIL=voce@sualoja.com.br -e ADMIN_SENHA='SenhaForte123' estoque
  ```
  Para HTTPS com domínio próprio, use o Caddy (`reverse_proxy localhost:3000`) e defina `TRUST_PROXY=1`.

O backup automático diário também funciona no servidor (`/data/backups`). Na tela **Backup** dá para baixar qualquer cópia.

---

## Estrutura

```
electron/main.js     → programa desktop (modos principal/conectado, backup, configurações)
electron/inicio.html → tela de boas-vindas (escolha do modo)
electron/preload.js  → ponte segura entre a tela e o programa
src/db.js            → tabelas, transações e categorias sugeridas
src/backup.js        → backup automático, manual e cópia para a pasta da nuvem
src/server.js        → API REST (Express)
public/              → interface (HTML/CSS/JS puro)
test/                → testes automatizados
Dockerfile, render.yaml, .github/workflows/instalador-windows.yml
```

Tabelas: `usuarios`, `sessoes`, `categorias` (com setor), `fornecedores`, `produtos` e `movimentacoes` (histórico imutável com saldo antes/depois).
