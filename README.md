# Controle de Estoque: Elétrica, Hidráulica e Segurança Eletrônica

Sistema web completo para controle de estoque de loja de materiais, com banco de dados SQLite embutido. Não precisa instalar nenhum servidor de banco.

## Funcionalidades

- **Login com perfis:** *Administrador* (tudo) e *Operador* (cadastra e movimenta, mas não exclui nem gerencia usuários).
- **Produtos:** código interno, código de barras, marca, categoria, fornecedor, unidade (UN, M, RL, BR, CX…), custo, venda, estoque mínimo e localização na prateleira.
- **Setores:** Elétrica, Hidráulica e Segurança Eletrônica, com categorias próprias (cabos, disjuntores, tubos PVC, câmeras, DVR, alarmes…).
- **Entrada / Saída / Ajuste de inventário:** aceita **leitor de código de barras** (bipa e tecla Enter). O estoque **nunca fica negativo**, e cada lançamento grava o saldo antes e depois, além do usuário, documento (NF/OS) e motivo.
- **Lançamento em lote** (`POST /api/movimentacoes/lote`): uma NF inteira de uma vez. Se um item falhar, nada é gravado.
- **Painel:** valor do estoque (custo e venda), itens abaixo do mínimo, valor por setor e últimas movimentações.
- **Relatórios CSV** (abrem no Excel): posição de estoque, lista de compras (itens a repor) e movimentações por período.
- **Backup** do banco com um clique (admin).
- Funciona no celular e no computador, com tema claro e escuro.

## Rodando no seu computador

1. Instale o **Node.js 22.13 ou mais novo**: <https://nodejs.org> (versão LTS).
2. No terminal, dentro da pasta do projeto:
   ```bash
   npm install
   npm start
   ```
3. Abra <http://localhost:3000>
   - Login inicial: **admin@loja.com** / **admin123** (troque em "Senha" logo no primeiro acesso)

O banco fica em `data/estoque.db`. Na primeira execução ele é criado com ~30 produtos de exemplo. Para começar vazio, rode com `SEM_DADOS_EXEMPLO=1`.

> **Usar na rede da loja:** rodando num PC da loja, os outros computadores e celulares do mesmo Wi-Fi acessam por `http://IP-DO-PC:3000` (descubra o IP com `ipconfig` no Windows).

### Variáveis de ambiente

| Variável | Para quê | Padrão |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `DB_PATH` | Onde fica o arquivo do banco | `data/estoque.db` |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | Primeiro administrador (só na criação do banco) | `admin@loja.com` / `admin123` |
| `SEM_DADOS_EXEMPLO` | `1` para não inserir os produtos de exemplo | — |

### Testes

```bash
npm test
```

---

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

- Pelo sistema: **Relatórios → Baixar backup** (admin). Guarde o arquivo `.db` no Google Drive/OneDrive.
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
src/db.js        → criação das tabelas, transações e dados iniciais
src/server.js    → API REST (Express)
public/          → interface web (HTML/CSS/JS puro)
test/            → testes automatizados da API
Dockerfile       → imagem para VPS / qualquer nuvem com Docker
render.yaml      → deploy de 1 clique no Render
```

### Tabelas do banco

`usuarios`, `sessoes`, `categorias` (com setor), `fornecedores`, `produtos` e `movimentacoes` (histórico imutável com saldo antes/depois).

### Quando migrar para PostgreSQL?

SQLite aguenta tranquilamente uma loja (milhares de produtos, vários usuários ao mesmo tempo). Só vale migrar para PostgreSQL (Supabase, Neon, RDS) se você tiver **várias filiais** gravando no mesmo banco ou precisar rodar o sistema em vários servidores ao mesmo tempo.
