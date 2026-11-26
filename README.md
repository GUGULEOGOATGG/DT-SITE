# Controle de Estoque: Elétrica, Hidráulica e Segurança Eletrônica

Programa completo de controle de estoque para loja de materiais, com banco de dados SQLite embutido. Não precisa instalar nenhum servidor de banco nem ter internet.

## Funcionalidades

- **Login com perfis:** *Administrador* (tudo) e *Operador* (cadastra e movimenta, mas não exclui nem gerencia usuários).
- **Produtos:** código interno, código de barras, marca, categoria, fornecedor, unidade (UN, M, RL, BR, CX…), custo, venda, estoque mínimo e localização na prateleira.
- **Setores:** Elétrica, Hidráulica e Segurança Eletrônica, com categorias próprias (cabos, disjuntores, tubos PVC, câmeras, DVR, alarmes…).
- **Entrada / Saída / Ajuste de inventário:** aceita **leitor de código de barras** (bipa e tecla Enter). O estoque **nunca fica negativo**, e cada lançamento grava o saldo antes e depois, além do usuário, documento (NF/OS) e motivo.
- **Lançamento em lote** (`POST /api/movimentacoes/lote`): uma NF inteira de uma vez. Se um item falhar, nada é gravado.
- **Painel:** valor do estoque (custo e venda), itens abaixo do mínimo, valor por setor e últimas movimentações.
- **Relatórios CSV** (abrem no Excel): posição de estoque, lista de compras (itens a repor) e movimentações por período.
- **Backup** do banco com um clique (admin).
- **Programa para Windows** com backup automático diário, que funciona sem internet. Também pode rodar como site/servidor.
- Tema claro e escuro.

## Programa para Windows (PC)

O sistema é um **programa de computador**: abre numa janela própria, tem ícone na área de trabalho e **funciona sem internet**. Os dados ficam no próprio PC.

### Instalar

**Opção A: versão portátil (.zip)**
1. Baixe `Controle-de-Estoque-1.1.0-Windows-portatil.zip`.
2. Clique com o botão direito → **Extrair tudo…** (por exemplo, para `C:\Controle de Estoque`).
3. Dê dois cliques em **Controle de Estoque.exe**. Se quiser, crie um atalho na área de trabalho (botão direito → Enviar para → Área de trabalho).

**Opção B: instalador (.exe)**, que cria atalho e entrada no Menu Iniciar sozinho:
1. No GitHub, abra a aba **Actions** → **Instalador Windows** → **Run workflow**.
2. Espere cerca de 5 minutos e baixe o arquivo em **Artifacts** → `Controle-de-Estoque-Windows`.
3. Rode `Instalar-Controle-de-Estoque-1.1.0.exe` e siga os passos.

> Na primeira vez, o Windows pode mostrar **"O Windows protegeu o computador"** (porque o programa não tem assinatura digital paga). Clique em **Mais informações → Executar assim mesmo**.

Login inicial: **admin@loja.com** / **admin123**. Troque a senha no primeiro acesso (botão "Senha", no canto superior).

### Onde ficam os dados e os backups

- Banco de dados: `%APPDATA%\Controle de Estoque\dados\estoque.db`
- **Backup automático:** uma cópia por dia em `...\dados\backups` (mantém os 15 últimos dias), mesmo se o programa ficar aberto por vários dias.
- Tudo de backup fica na barra lateral, em **Backup** (só para administradores):
  - **Fazer backup agora**: cópia na hora.
  - **Salvar cópia em…**: guarda num pendrive ou no Google Drive, para não perder nada se o PC der problema.
  - **Restaurar**: volta os dados de um backup da lista ou de um arquivo. Antes, ele guarda uma cópia dos dados atuais por segurança, e o programa reinicia sozinho.
- Atalhos: **F5** recarrega, **Ctrl + / Ctrl −** zoom, **F11** tela cheia.
- Desinstalar o programa **não apaga** os dados.

**Trocar de computador:** faça um backup no PC antigo, instale o programa no novo e use *Restaurar backup*.

### Para quem for mexer no código

```bash
npm install
npm run app          # abre o programa (janela desktop)
npm test             # testes automatizados
npm run dist:win     # gera instalador e .zip em dist/ (no Windows; no Linux exige Wine)
npm start            # modo servidor/site em http://localhost:3000
```

---

## Modo servidor (opcional: vários computadores ou acesso pelo celular)

O programa desktop é para **um computador**. Se a loja precisar usar o estoque em vários PCs ao mesmo tempo, rode o mesmo sistema em **modo servidor**, num PC da loja ou na nuvem, e acesse pelo navegador.

### Rodando como servidor num PC

1. Instale o **Node.js 22.13 ou mais novo**: <https://nodejs.org> (versão LTS).
2. Na pasta do projeto: `npm install` e depois `npm start`.
3. Abra <http://localhost:3000>. Os outros PCs e celulares do mesmo Wi-Fi acessam por `http://IP-DO-PC:3000` (descubra o IP com `ipconfig`).

O banco fica em `data/estoque.db`. Para começar sem os produtos de exemplo, rode com `SEM_DADOS_EXEMPLO=1`.

### Variáveis de ambiente

| Variável | Para quê | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `DB_PATH` | Onde fica o arquivo do banco | `data/estoque.db` |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | Primeiro administrador (só na criação do banco) | `admin@loja.com` / `admin123` |
| `SEM_DADOS_EXEMPLO` | `1` para não inserir os produtos de exemplo | — |
| `BACKUP_DIR` | Pasta dos backups automáticos | `data/backups` |
| `BACKUP_MANTER` | Quantos dias de backup automático guardar | `15` |

## Como colocar na nuvem

O ponto mais importante: **o banco é um arquivo** (`estoque.db`). Na nuvem, ele precisa ficar num **disco persistente**. Sem isso, o servidor apaga os dados a cada atualização ou reinício. Escolha uma das opções abaixo.

### Opção 1: Render (mais fácil, sem terminal), cerca de US$ 7/mês

1. Crie uma conta em <https://render.com> e conecte seu GitHub.
2. Clique em **New → Blueprint** e escolha este repositório. O arquivo `render.yaml` já configura tudo, inclusive o disco persistente de 1 GB.
3. Preencha `ADMIN_EMAIL` e `ADMIN_SENHA` com o seu e-mail e uma senha forte.
4. Clique em **Apply**. Em poucos minutos você recebe um endereço `https://estoque-xxxx.onrender.com`, já com HTTPS.

> O plano **Free** do Render **não tem disco persistente**: o banco seria apagado. Use o plano *Starter* ou superior.

### Opção 2: Railway, cerca de US$ 5/mês

1. Crie uma conta em <https://railway.app> e clique em **New Project → Deploy from GitHub repo**.
2. No serviço criado, abra **Settings → Volumes → Add Volume** com o caminho de montagem `/data`.
3. Em **Variables**, adicione `DB_PATH=/data/estoque.db`, `ADMIN_EMAIL` e `ADMIN_SENHA`.
4. Em **Settings → Networking → Generate Domain** você ganha o endereço público com HTTPS.

### Opção 3: Servidor VPS próprio (mais barato no longo prazo, cerca de R$ 25–40/mês)

Funciona em Hostinger VPS, DigitalOcean, Hetzner, Contabo, Oracle Cloud (tem plano gratuito) etc. Crie um servidor **Ubuntu 24.04** e acesse por SSH:

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh

# 2. Baixar o projeto e subir
git clone https://github.com/SEU-USUARIO/SEU-REPO.git estoque && cd estoque
docker build -t estoque .
docker run -d --name estoque --restart unless-stopped \
  -p 3000:3000 -v estoque-dados:/data \
  -e ADMIN_EMAIL=voce@sualoja.com.br -e ADMIN_SENHA='SenhaForte123' \
  estoque
```

Já está acessível em `http://IP-DO-SERVIDOR:3000`. Para ter **domínio próprio com HTTPS** (ex.: `estoque.sualoja.com.br`):

1. No painel do seu domínio (Registro.br, Hostinger…), crie um registro **A** apontando `estoque` para o IP do servidor.
2. Instale o Caddy, que gera o certificado HTTPS sozinho:
   ```bash
   sudo apt install -y caddy
   echo 'estoque.sualoja.com.br {
     reverse_proxy localhost:3000
   }' | sudo tee /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

**Atualizar a versão** no VPS:
```bash
cd estoque && git pull && docker build -t estoque . && docker rm -f estoque && \
docker run -d --name estoque --restart unless-stopped -p 3000:3000 -v estoque-dados:/data estoque
```
(Os dados ficam no volume `estoque-dados` e não se perdem.)

### Backup: não pule esta parte

- O servidor também faz **backup automático diário** em `data/backups` (ou na pasta de `BACKUP_DIR`). Na barra lateral, em **Backup**, dá para fazer um backup na hora e baixar qualquer um da lista. Guarde cópias no Google Drive/OneDrive.
- No VPS, backup automático diário às 3h da manhã (`crontab -e`):
  ```
  0 3 * * * docker exec estoque node -e "new (require('node:sqlite').DatabaseSync)('/data/estoque.db').exec(\"VACUUM INTO '/data/backup-$(date +\%a).db'\")"
  ```
  Isso mantém 7 cópias rotativas, uma por dia da semana, dentro do volume.
- Para **restaurar**, pare o sistema e substitua `estoque.db` pelo arquivo de backup.

### Segurança em produção

- Troque a senha do admin no primeiro acesso e crie um usuário por funcionário.
- Use sempre **HTTPS** (Render e Railway já incluem; no VPS, use o Caddy).

---

## Estrutura

```
electron/main.js → programa desktop (janela, menu, backups)
src/db.js        → criação das tabelas, transações e dados iniciais
src/server.js    → API REST (Express)
public/          → interface web (HTML/CSS/JS puro)
test/            → testes automatizados da API
Dockerfile       → imagem para VPS / qualquer nuvem com Docker
render.yaml      → deploy de 1 clique no Render
.github/workflows/instalador-windows.yml → gera o instalador .exe no GitHub
```

### Tabelas do banco

`usuarios`, `sessoes`, `categorias` (com setor), `fornecedores`, `produtos` e `movimentacoes` (histórico imutável com saldo antes/depois).

### Quando migrar para PostgreSQL?

SQLite aguenta tranquilamente uma loja (milhares de produtos, vários usuários ao mesmo tempo). Só vale migrar para PostgreSQL (Supabase, Neon, RDS) se você tiver **várias filiais** gravando no mesmo banco ou precisar rodar o sistema em vários servidores ao mesmo tempo.
