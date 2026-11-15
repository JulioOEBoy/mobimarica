## 📋 Projeto
Sistema similar ao Uber focando na relação de **Aplicativo ↔ Usuário ↔ Motorista**, 
com dados de personalidade, reputação, quantidade de corridas e etc. 
Foi desenvolvido para duas disciplinas de práticas:
- Concentração do banco de dados
- Front-end web com CRUD

---

## 🗃️ Banco de Dados
**PostgreSQL 18** (rodando no WSL Ubuntu)

### Estrutura das tabelas
| Tabela | Descrição |
|--------|-----------|
| `aplicativo` | Aplicativos similares ao Uber |
| `usuario` | Usuários do sistema (clientes e motoristas) |
| `motorista` | Dados dos motoristas |
| `pedido` | Corrida/pedidos feitos |
| `avaliacao` | Avaliações dos motoristas |

### Funções SQL
- `atualizar_reputacao_motorista(ID)` — atualiza a reputação do motorista com base nas avaliações
- `maior_preco_corrida()` — retorna o pedido de maior valor pago

### Instalação local
```bash
# 1. Instalar PostgreSQL no WSL
sudo apt-get install postgresql postgresql-contrib

# 2. Criar banco
createdb corridasapp

# 3. Carregar o schema
psql -h localhost -U postgres -d corridasapp -f sql/schema_corridasapp.sql
```

### Dados de exemplo
- **Aplicativos:** 3
- **Usuários:** 8 (5 motoristas + 3 clientes)
- **Motorizados:** 5
- **Pedidos:** 10
- **Avaliações:** 6

---

## 🗺️ Diagrama do Banco
O diagrama está disponível em `diagrama/corridasapp_diagrama.svg`.

```bash
open diagrama/corridasapp_diagrama.svg
```

---

## 🌐 Backend (Flask + psycopg2)
```bash
cd backend
python app.py
```
Acesse: `http://localhost:5000`

### Rotas disponíveis
- `GET /api/aplicativo`
- `GET /api/usuario`
- `GET /api/motorista`
- `GET /api/pedido`
- `GET /api/avaliacao`
- `GET /api/resumo`
- `GET /api/relacao`
- `GET /api/funcoes`

---

## 🖥️ Front-end (HTML/CSS/JS)
```bash
cd frontend
# Abrir index.html no navegador
open frontend/index.html
```

---

## 📦 Estrutura do Projeto
```
CorridasApp/
├── backend/            # Flask + API REST
├── frontend/           # HTML/CSS/JS com CRUD
├── sql/                # Esquema do banco
├── diagrama/           # Diagrama do banco
├── README.md
└── .gitignore
```

---

## 🚀 Como publicar no GitHub

### 1. Crie o repositório no GitHub
Vá em [github.com/new](https://github.com/new) e digite:
- **Repository name:** `CorridasApp`

### 2. No terminal, navegue até o projeto
```bash
cd /c/Users/jcpcg/workspace/CorridasApp
```

### 3. Inicialize o Git
```bash
git init
git add .
git commit -m "Primeiro commit - CorridasApp"
```

### 4. Conecte ao GitHub
```bash
git remote add origin https://github.com/seu-usuario/CorridasApp.git
```

### 5. Envie para o GitHub
```bash
git push -u origin main
```

---

## ⚙️ Configuração
- **Node.js:** não necessário (usa Python)
- **Flask 3.1.3** (backend)
- **psycopg2-binary** (driver PostgreSQL)
- **PostgreSQL 18** (banco)

---

## 📝 Licença
Este projeto é fornecido para fins educacionais.
