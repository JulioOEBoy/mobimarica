"""
Backend REST para o sistema 'CorridasApp' (semelhante ao Uber),
que acessa o PostgreSQL (no WSL) e serve os arquivos do frontend.

Rotas disponiveis:
  GET    /api/aplicativo          - lista todos os aplicativos
  GET    /api/aplicativo/:id      - retorna um aplicativo
  GET    /api/usuario             - lista usuarios
  GET    /api/usuario/:id         - retorna um usuario
  POST   /api/usuario             - cria um usuario
  PUT    /api/usuario/:id         - atualiza um usuario
  DELETE /api/usuario/:id         - remove um usuario
  GET    /api/motorista           - lista motoristas
  GET    /api/motorista/:id       - retorna um motorista
  POST   /api/motorista           - cria motorista
  PUT    /api/motorista/:id       - atualiza motorista
  DELETE /api/motorista/:id       - remove motorista
  GET    /api/pedido              - lista pedidos
  GET    /api/pedido/:id          - retorna um pedido
  POST   /api/pedido              - cria pedido
  PUT    /api/pedido/:id          - atualiza pedido
  DELETE /api/pedido/:id          - remove pedido
  GET    /api/avaliacao           - lista avaliacoes
  GET    /api/avaliacao/:id       - retorna uma avaliacao
  POST   /api/avaliacao           - cria avaliacao
  PUT    /api/avaliacao/:id       - atualiza avaliacao
  DELETE /api/avaliacao/:id       - remove avaliacao
  GET    /api/resumo              - resumo estatistico do sistema
  GET    /api/relacao             - diagrama de relacionamento
  GET    /api/funcoes             - lista as funcoes do banco

Solicitacao de execucao: python app.py
"""
import os
import psycopg2
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__)

# Configuracao de conexao com o PostgreSQL (exata para o WSL)
# O Flask e o PostgreSQL estao no mesmo WSL, entao usa localhost
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "corridasapp")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS", "")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


def get_conn():
    """Retorna conexao com o banco de dados."""
    return psycopg2.connect(DATABASE_URL)


def query_to_dicts(cur):
    """Converte resultados de uma consulta em lista de dicionarios."""
    cols = [desc[0] for desc in cur.description] if cur.description else []
    return [dict(zip(cols, row)) for row in cur.fetchall()]


def query_all(table):
    """Retorna todos os registros de uma tabela."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {table}")
            return query_to_dicts(cur)


def query_by_id(table, id):
    """Retorna um registro por id."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT * FROM {table} WHERE id = %s", (id,))
            rows = cur.fetchall()
    return query_to_dicts(rows)


def query_create(table, data):
    """Cria um registro em uma tabela e devolve o registro criado."""
    cols = ", ".join(data.keys())
    ph = ", ".join(["%s"] * len(data))
    values = list(data.values())
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {table} ({cols}) VALUES ({ph}) RETURNING *",
                values,
            )
            rows = cur.fetchall()
            conn.commit()
    return query_to_dicts(rows)


def query_update(table, id, data):
    """Atualiza um registro e devolve o registro atualizado."""
    set_clause = ", ".join([f"{k} = %s" for k in data.keys()])
    values = list(data.values()) + [id]
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"UPDATE {table} SET {set_clause} WHERE id = %s RETURNING *",
                values,
            )
            rows = cur.fetchall()
            conn.commit()
    return query_to_dicts(rows)


def query_delete(table, id):
    """Remove um registro e devolve o registro removido."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"DELETE FROM {table} WHERE id = %s RETURNING *", (id,))
            rows = cur.fetchall()
            conn.commit()
    return query_to_dicts(rows) if rows else None


# ------------- FRONTEND ------------- #

# O backend roda no WSL. O frontend fica em /mnt/c/Users/jcpcg/workspace/frontend
FRONTEND_DIR = "/mnt/c/Users/jcpcg/workspace/frontend"


@app.route("/", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def frontend_index():
    """Página principal do frontend."""
    return send_from_directory(FRONTEND_DIR, "index.html")

# ------------- ROTAS DE APP ------------- #

@app.route("/api/aplicativo/<int:id_aplicativo>", methods=["GET"])
def api_aplicativo_id(id_aplicativo):
    return jsonify(query_by_id("aplicativo", id_aplicativo))


@app.route("/api/aplicativo", methods=["POST"])
def api_aplicativo_create():
    data = request.get_json() or {}
    return jsonify(query_create("aplicativo", data)), 201


@app.route("/api/aplicativo/<int:id_aplicativo>", methods=["PUT"])
def api_aplicativo_update(id_aplicativo):
    data = request.get_json() or {}
    return jsonify(query_update("aplicativo", id_aplicativo, data))


@app.route("/api/aplicativo/<int:id_aplicativo>", methods=["DELETE"])
def api_aplicativo_delete(id_aplicativo):
    return jsonify(query_delete("aplicativo", id_aplicativo))


# ------------- ROTAS DE USUARIO ------------- #

@app.route("/api/usuario", methods=["GET"])
def api_usuario():
    return jsonify(query_all("usuario"))


@app.route("/api/usuario/<int:id_usuario>", methods=["GET"])
def api_usuario_id(id_usuario):
    return jsonify(query_by_id("usuario", id_usuario))


@app.route("/api/usuario", methods=["POST"])
def api_usuario_create():
    data = request.get_json() or {}
    if "senha" in data:
        data["senha_hash"] = "hashed:" + data.pop("senha")
    return jsonify(query_create("usuario", data)), 201


@app.route("/api/usuario/<int:id_usuario>", methods=["PUT"])
def api_usuario_update(id_usuario):
    data = request.get_json() or {}
    if "senha" in data:
        data["senha_hash"] = "hashed:" + data.pop("senha")
    return jsonify(query_update("usuario", id_usuario, data))


@app.route("/api/usuario/<int:id_usuario>", methods=["DELETE"])
def api_usuario_delete(id_usuario):
    return jsonify(query_delete("usuario", id_usuario))


# ------------- ROTAS DE MOTORISTA ------------- #

@app.route("/api/motorista", methods=["GET"])
def api_motorista():
    return jsonify(query_all("motorista"))


@app.route("/api/motorista/<int:id_motorista>", methods=["GET"])
def api_motorista_id(id_motorista):
    return jsonify(query_by_id("motorista", id_motorista))


@app.route("/api/motorista", methods=["POST"])
def api_motorista_create():
    data = request.get_json() or {}
    return jsonify(query_create("motorista", data)), 201


@app.route("/api/motorista/<int:id_motorista>", methods=["PUT"])
def api_motorista_update(id_motorista):
    data = request.get_json() or {}
    return jsonify(query_update("motorista", id_motorista, data))


@app.route("/api/motorista/<int:id_motorista>", methods=["DELETE"])
def api_motorista_delete(id_motorista):
    return jsonify(query_delete("motorista", id_motorista))


# ------------- ROTAS DE PEDIDO ------------- #

@app.route("/api/pedido", methods=["GET"])
def api_pedido():
    return jsonify(query_all("pedido"))


@app.route("/api/pedido/<int:id_pedido>", methods=["GET"])
def api_pedido_id(id_pedido):
    return jsonify(query_by_id("pedido", id_pedido))


@app.route("/api/pedido", methods=["POST"])
def api_pedido_create():
    data = request.get_json() or {}
    return jsonify(query_create("pedido", data)), 201


@app.route("/api/pedido/<int:id_pedido>", methods=["PUT"])
def api_pedido_update(id_pedido):
    data = request.get_json() or {}
    return jsonify(query_update("pedido", id_pedido, data))


@app.route("/api/pedido/<int:id_pedido>", methods=["DELETE"])
def api_pedido_delete(id_pedido):
    return jsonify(query_delete("pedido", id_pedido))


# ------------- ROTAS DE AVALIACAO ------------- #

@app.route("/api/avaliacao", methods=["GET"])
def api_avaliacao():
    return jsonify(query_all("avaliacao"))


@app.route("/api/avaliacao/<int:id_avaliacao>", methods=["GET"])
def api_avaliacao_id(id_avaliacao):
    return jsonify(query_by_id("avaliacao", id_avaliacao))


@app.route("/api/avaliacao", methods=["POST"])
def api_avaliacao_create():
    data = request.get_json() or {}
    return jsonify(query_create("avaliacao", data)), 201


@app.route("/api/avaliacao/<int:id_avaliacao>", methods=["PUT"])
def api_avaliacao_update(id_avaliacao):
    data = request.get_json() or {}
    return jsonify(query_update("avaliacao", id_avaliacao, data))


@app.route("/api/avaliacao/<int:id_avaliacao>", methods=["DELETE"])
def api_avaliacao_delete(id_avaliacao):
    return jsonify(query_delete("avaliacao", id_avaliacao))


# ------------- ROTAS DE ESTATISTICA E SCHEMA ------------- #

@app.route("/api/resumo", methods=["GET"])
def api_resumo():
    """Retorna estatisticas gerais do sistema."""
    out = {}
    for table in ["aplicativo", "usuario", "motorista", "pedido", "avaliacao"]:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT COUNT(*) FROM {table}")
                out[table] = cur.fetchone()[0]
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COALESCE(SUM(preco_pago),0) FROM pedido")
            out["receita_total"] = cur.fetchone()[0]
    return jsonify(out)


@app.route("/api/relacao", methods=["GET"])
def api_relacao():
    """Retorna um resumo do diagrama de relacionamento."""
    rel = [
        {"de": "aplicativo", "para": "motorista", "tipo": "1:N"},
        {"de": "motorista", "para": "usuario", "tipo": "1:1"},
        {"de": "pedido", "para": "aplicativo", "tipo": "1:N"},
        {"de": "pedido", "para": "usuario", "tipo": "1:N"},
        {"de": "pedido", "para": "motorista", "tipo": "1:1"},
        {"de": "avaliacao", "para": "pedido", "tipo": "1:N"},
        {"de": "avaliacao", "para": "motorista", "tipo": "1:N"},
        {"de": "avaliacao", "para": "usuario", "tipo": "1:N"},
    ]
    return jsonify(rel)


@app.route("/api/funcoes", methods=["GET"])
def api_funcoes():
    """Lista as funcoes do banco."""
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%reputacao%'"
            )
            rows = cur.fetchall()
    return jsonify([{"funcao": r[0], "definicao": r[1]} for r in rows])


if __name__ == "__main__":
    print("=" * 60)
    print("  CorridasApp - Backend REST (PostgreSQL)")
    print(f"  Banco: {DB_NAME} em {DB_HOST}:{DB_PORT}")
    print("  Acesse: http://localhost:5000")
    print("  Docs: http://localhost:5000/api/docs")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5000, debug=False)
