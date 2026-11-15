/**
 * CorridasApp - Frontend JavaScript
 * Comunica com a API REST do backend e renderiza as páginas.
 * ============================================================================
 */

// Estado global da aplicação
const state = {
  currentSection: 'dashboard',
  currentRecord: null,
  records: {
    aplicativo: [],
    usuario: [],
    motorista: [],
    pedido: [],
    avaliacao: []
  },
  loading: false,
  error: null,
};

// URLs de base
const API_BASE = '/api';
const BASE_URL = window.location.origin;

// ============================================================
// HELPERS DE HTTP
// ============================================================

async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}

// ============================================================
// CARREGAMENTO INICIAL
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  state.loading = true;
  state.error = null;
  loadRecords();
  setupNavigation();
  setupModal();
  setupForms();
  setupInfoBanner();
  state.loading = false;
});

// ============================================================
// CARREGAMENTO DE REGISTROS
// ============================================================

async function loadRecords() {
  const sections = ['aplicativo', 'usuario', 'motorista', 'pedido', 'avaliacao'];

  for (const section of sections) {
    try {
      state.records[section] = await apiRequest(`/${section}`);
    } catch (err) {
      console.error(`Erro ao carregar ${section}:`, err);
      showError(`Não foi possível carregar ${section}. Verifique a conexão.`, section);
    }
  }

  render();
}

// ============================================================
// NAVEGAÇÃO
// ============================================================

function setupNavigation() {
  const navItems = document.querySelectorAll('[data-section]');
  const sectionNav = document.querySelectorAll('.section-nav__item');

  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (!section) return;

      switchSection(section);
    });
  });

  sectionNav.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      if (!section) return;

      switchSection(section);
    });
  });
}

function switchSection(section) {
  if (state.currentSection === section) return;

  state.currentSection = section;

  // Atualiza navegação
  document.querySelectorAll('[data-section]').forEach((el) => {
    el.classList.toggle('active', el.dataset.section === section);
  });

  document.querySelectorAll('.section-nav__item').forEach((el) => {
    el.classList.toggle('active', el.dataset.section === section);
  });

  // Atualiza barra de usuário (se for a seção de cadastro)
  if (section === 'usuarios') {
    document.getElementById('navbar-user-name').textContent = 'Usuários';
  } else if (section === 'motoristas') {
    document.getElementById('navbar-user-name').textContent = 'Motoristas';
  } else if (section === 'pedidos') {
    document.getElementById('navbar-user-name').textContent = 'Pedidos';
  } else if (section === 'avaliacoes') {
    document.getElementById('navbar-user-name').textContent = 'Avaliações';
  } else {
    document.getElementById('navbar-user-name').textContent = 'Visitante';
  }

  render();
}

// ============================================================
// RENDERIZAÇÃO
// ============================================================

function render() {
  const content = document.getElementById('content');
  const section = state.currentSection;

  switch (section) {
    case 'dashboard':
      content.innerHTML = renderDashboard();
      break;
    case 'usuarios':
      content.innerHTML = renderUsuarios();
      break;
    case 'motoristas':
      content.innerHTML = renderMotoristas();
      break;
    case 'pedidos':
      content.innerHTML = renderPedidos();
      break;
    case 'avaliacoes':
      content.innerHTML = renderAvaliacoes();
      break;
    case 'resumo':
      content.innerHTML = renderResumo();
      break;
    default:
      content.innerHTML = renderDashboard();
  }

  state.loading = false;
}

// ============================================================
// PAINEL PRINCIPAL (DASHBOARD)
// ============================================================

function renderDashboard() {
  // Contadores
  const counts = {
    aplicativo: state.records.aplicativo.length,
    usuario: state.records.usuario.length,
    motorista: state.records.motorista.length,
    pedido: state.records.pedido.length,
    avaliacao: state.records.avaliacao.length,
  };

  // Total de receita
  let totalReceita = 0;
  for (const p of state.records.pedido) {
    const preco = parseFloat(p.preco_pago) || 0;
    totalReceita += preco;
  }

  // Sequencia de entidades de relacionamento
  const entities = [
    { name: 'Aplicativo', count: counts.aplicativo, color: '#2563eb' },
    { name: 'Usuário', count: counts.usuario, color: '#16a34a' },
    { name: 'Motorista', count: counts.motorista, color: '#ca8a04' },
    { name: 'Pedido', count: counts.pedido, color: '#7c3aed' },
    { name: 'Avaliação', count: counts.avaliacao, color: '#dc2626' },
  ];

  return `
    <!-- Hero -->
    <section class="banner">
      <div class="container">
        <h1 class="banner__title">Painel de Controle</h1>
        <p class="banner__subtitle">
          Visualize o banco de dados e o relacionamento dos sistemas de corrida.
          <strong class="text-accent">Aplicativo</strong> &rarr; <strong class="text-accent">Usuário</strong> &rarr; <strong class="text-accent">Motorista</strong> &rarr; <strong class="text-accent">Pedido</strong> &rarr; <strong class="text-accent">Avaliação</strong>
        </p>
      </div>
    </section>

    <div class="container">
      <!-- Grid de estatísticas -->
      <div class="grid grid--stats">
        ${entities.map(
          (e) => `
          <a href="#" class="stat" data-section="${e.name === 'Avaliação' ? 'avaliacoes' : e.name.toLowerCase()}s">
            <div class="stat__icon" style="color: ${e.color}">
              ${getStatIcon(e.name)}
            </div>
            <div class="stat__number">${e.count}</div>
            <div class="stat__label">${e.name}</div>
          </a>
        `
        ).join('')}
      </div>

      <div class="grid grid--receita">
        <a href="#" class="stat" data-section="pedidos">
          <div class="stat__icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="8" y="12" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2"/>
              <path d="M8 12 L8 17 L12 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M24 12 L24 17 L20 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="stat__number">R$ ${totalReceita.toFixed(2)}</div>
          <div class="stat__label">Total de Receita</div>
        </a>
        <a href="#" class="stat" data-section="resumo">
          <div class="stat__icon" style="color: var(--accent)">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
              <path d="M16 8 L16 16 L20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="stat__number">${Object.values(counts).reduce((a, b) => a + b, 0)}</div>
          <div class="stat__label">Registros Totais</div>
        </a>
      </div>

      <!-- Diagrama de relacionamento -->
      <section class="card">
        <div class="card__header">
          <h2 class="card__title">Banco de dados <span class="text-muted">— Diagrama de relacionamento</span></h2>
          <span class="badge badge--info">5 Tabelas</span>
        </div>
        <div class="diagram">
          <div class="diagram__node">
            <div class="diagram__label">Aplicativo</div>
            <span class="badge badge--primary">1</span>
          </div>
          <div class="diagram__arrow">→</div>
          <div class="diagram__node">
            <div class="diagram__label">Motorista</div>
            <span class="badge badge--warning">1:**</span>
          </div>
          <div class="diagram__arrow">→</div>
          <div class="diagram__node">
            <div class="diagram__label">Usuário</div>
            <span class="badge badge--success">1:1</span>
          </div>
          <div class="diagram__arrow">→</div>
          <div class="diagram__node">
            <div class="diagram__label">Pedido</div>
            <span class="badge badge--info">1:**</span>
          </div>
          <div class="diagram__arrow">→</div>
          <div class="diagram__node">
            <div class="diagram__label">Avaliação</div>
            <span class="badge badge--danger">1:**</span>
          </div>
        </div>
        <p class="card__subtitle" style="margin-top:8px;">
          Um <strong class="text-accent">aplicativo</strong> pode ter vários <strong class="text-accent">motoristas</strong>. Um <strong class="text-accent">motorista</strong> é um <strong class="text-accent">usuário</strong>.
        </p>
        <p class="card__subtitle" style="margin-top:4px;">
          Um <strong class="text-accent">pedido</strong> pertence a um <strong class="text-accent">usuário</strong> e a um <strong class="text-accent">motorista</strong>. Uma <strong class="text-accent">avaliação</strong> está ligada a um <strong class="text-accent">pedido</strong>.
        </p>
        <a href="/pages/diagrama.html" class="btn btn--secondary" style="margin-top:12px;">
          Ver diagrama completo
        </a>
      </section>

      <!-- Ações rápidas -->
      <section class="card">
        <div class="card__header">
          <h2 class="card__title">Ações rápidas</h2>
        </div>
        <div class="quick-actions">
          <a href="#" class="quick-actions__item" data-section="usuarios">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="14" rx="3" stroke="currentColor" stroke-width="2"/>
              <path d="M3 10 L9 10 L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Novo Usuário</span>
          </a>
          <a href="#" class="quick-actions__item" data-section="motoristas">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="2"/>
              <rect x="10" y="3" width="8" height="12" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M13 7 L16 14 L13 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Novo Motorista</span>
          </a>
          <a href="#" class="quick-actions__item" data-section="pedidos">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 4 L15 4 L15 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M5 10 L10 10 L10 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M10 10 L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>Novo Pedido</span>
          </a>
        </div>
      </section>
    </div>
  `;
}

function getStatIcon(name) {
  const icons = {
    'Aplicativo': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" stroke-width="2"/><path d="M3 12 L12 12 L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    'Usuário': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 21 L12 14 L20 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    'Motorista': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="2"/><rect x="11" y="3" width="10" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M14 8 L18 14 L14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    'Pedido': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 4 L19 4 L19 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 10 L10 10 L10 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 10 L15 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    'Avaliação': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2 L14 8 L20 8 L16 13 L18 19 L12 15 L6 19 L8 13 L4 13 L8 8 L4 8 Z" fill="currentColor"/></svg>`,
  };
  return icons[name] || icons['Aplicativo'];
}

// ============================================================
// LISTAGEM DE REGISTROS
// ============================================================

function renderUsuarios() {
  return renderList('usuario');
}

function renderMotoristas() {
  return renderList('motorista');
}

function renderPedidos() {
  return renderList('pedido');
}

function renderAvaliacoes() {
  return renderList('avaliacao');
}

function renderList(table) {
  const records = state.records[table];
  const isEmpty = !records || records.length === 0;

  const columns = {
    aplicativo: ['id', 'nome_aplicativo', 'descricao', 'cnpj_aplicativo'],
    usuario: ['id', 'nome', 'email', 'cpf', 'telefone', 'tipo_conta', 'reputacao', 'qtd_corrida', 'ativo'],
    motorista: ['id', 'placa_veiculo', 'modelo_veiculo', 'aprovado', 'disponivel', 'reputacao', 'qtd_corrida', 'receita_total'],
    pedido: ['id', 'id_usuario', 'id_motorista', 'preco_pago', 'forma_pagamento', 'status', 'data_corrida'],
    avaliacao: ['id', 'id_pedido', 'id_usuario', 'id_motorista', 'nota', 'comentario', 'data_avaliacao'],
  };

  const labelMap = {
    aplicativo: { id: '#', nome_aplicativo: 'Aplicativo', descricao: 'Descrição', cnpj_aplicativo: 'CNPJ' },
    usuario: { id: '#', nome: 'Nome', email: 'E-mail', cpf: 'CPF', telefone: 'Telefone', tipo_conta: 'Tipo', reputacao: 'Reputação', qtd_corrida: 'Qtd Corrida', ativo: 'Ativo' },
    motorista: { id: '#', placa_veiculo: 'Placa', modelo_veiculo: 'Veículo', aprovado: 'Aprovado', disponivel: 'Disponível', reputacao: 'Reputação', qtd_corrida: 'Qtd Corrida', receita_total: 'Receita' },
    pedido: { id: '#', id_usuario: 'Usuário', id_motorista: 'Motorista', preco_pago: 'Preço', forma_pagamento: 'Pagamento', status: 'Status', data_corrida: 'Data' },
    avaliacao: { id: '#', id_pedido: 'Pedido', id_usuario: 'Usuário', id_motorista: 'Motorista', nota: 'Nota', comentario: 'Comentário', data_avaliacao: 'Data' },
  };

  const colDefs = columns[table] || [];
  const labels = labelMap[table] || {};

  let rows = '';
  if (isEmpty) {
    rows = `
      <tr>
        <td colspan="${colDefs.length + 1}" class="text-center text-muted">
          Nenhum registro encontrado. <a href="#" data-section="${table}" class="text-accent">Cadastre um novo</a>
        </td>
      </tr>
    `;
  } else {
    rows = records.map((r) => {
      const cells = colDefs.map((col) => {
        let value = r[col] !== undefined ? r[col] : '';
        if (typeof value === 'boolean') {
          value = value ? 'Sim' : 'Não';
        } else if (typeof value === 'number') {
          if (col === 'reputacao') {
            value = value.toFixed(2);
          } else if (col === 'qtd_corrida' || col === 'receita_total') {
            value = value.toLocaleString('pt-BR');
          }
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        return `<td>${escapeHtml(String(value))}</td>`;
      }).join('');

      const actions = `
        <div class="action-cell">
          <button class="btn btn--secondary btn--sm" data-action="edit" data-table="${table}" data-id="${r.id}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 2 L2 13 L8 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Editar
          </button>
          <button class="btn btn--danger btn--sm" data-action="delete" data-table="${table}" data-id="${r.id}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3 L11 11 M11 3 L3 11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Excluir
          </button>
        </div>
      `;

      return `<tr>${cells}${actions}</tr>`;
    }).join('');
  }

  // Resumo de relacionamento
  const relSummary = `
    <div class="rel-summary">
      <span class="badge badge--primary">Aplicativo &rarr; Motorista (1:N)</span>
      <span class="badge badge--success">Motorista &rarr; Usuário (1:1)</span>
      <span class="badge badge--info">Pedido &rarr; Usuário (1:N)</span>
      <span class="badge badge--danger">Avaliação &rarr; Motorista (1:N)</span>
    </div>
  `;

  return `
    <div class="container">
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">${labels[table] || table} <span class="text-muted">(${records?.length || 0})</span></h2>
          <button class="btn btn--primary" data-action="new" data-table="${table}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" stroke-width="2"/><path d="M3 8 L8 8 L8 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            Novo ${labels[table] || table}
          </button>
        </div>
        ${relSummary}
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                ${colDefs.map((c) => `<th>${escapeHtml(labels[c] || c)}</th>`).join('')}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderResumo() {
  const resumo = state.records.resumo || {};

  // Contadores
  const counts = {
    aplicativo: state.records.aplicativo.length,
    usuario: state.records.usuario.length,
    motorista: state.records.motorista.length,
    pedido: state.records.pedido.length,
    avaliacao: state.records.avaliacao.length,
  };

  // Total de receita
  let totalReceita = 0;
  for (const p of state.records.pedido) {
    totalReceita += parseFloat(p.preco_pago) || 0;
  }

  // Motoristas mais bem avaliados
  const motoristas = state.records.motorista.filter(m => m.reputacao);
  motoristas.sort((a, b) => (parseFloat(b.reputacao) || 0) - (parseFloat(a.reputacao) || 0));

  // Pedidos mais recentes
  const pedidos = [...state.records.pedido].sort((a, b) => {
    const da = new Date(a.data_corrida || 0).getTime();
    const db = new Date(b.data_corrida || 0).getTime();
    return db - da;
  }).slice(0, 5);

  // Avaliações mais recentes
  const avaliacoes = [...state.records.avaliacao].sort((a, b) => {
    const da = new Date(a.data_avaliacao || 0).getTime();
    const db = new Date(b.data_avaliacao || 0).getTime();
    return db - da;
  }).slice(0, 5);

  return `
    <div class="container">
      <div class="card">
        <div class="card__header">
          <h2 class="card__title">Resumo Executivo</h2>
          <span class="badge badge--info">Sistema de Corridas</span>
        </div>

        <div class="grid grid--stats">
          <a href="#" class="stat" data-section="aplicativos">
            <div class="stat__icon" style="color: var(--accent)">${getStatIcon('Aplicativo')}</div>
            <div class="stat__number">${counts.aplicativo}</div>
            <div class="stat__label">Aplicativos</div>
          </a>
          <a href="#" class="stat" data-section="usuarios">
            <div class="stat__icon">${getStatIcon('Usuário')}</div>
            <div class="stat__number">${counts.usuario}</div>
            <div class="stat__label">Usuários</div>
          </a>
          <a href="#" class="stat" data-section="motoristas">
            <div class="stat__icon">${getStatIcon('Motorista')}</div>
            <div class="stat__number">${counts.motorista}</div>
            <div class="stat__label">Motoristas</div>
          </a>
          <a href="#" class="stat" data-section="pedidos">
            <div class="stat__icon">${getStatIcon('Pedido')}</div>
            <div class="stat__number">${counts.pedido}</div>
            <div class="stat__label">Pedidos</div>
          </a>
          <a href="#" class="stat" data-section="avaliacoes">
            <div class="stat__icon">${getStatIcon('Avaliação')}</div>
            <div class="stat__number">${counts.avaliacao}</div>
            <div class="stat__label">Avaliações</div>
          </a>
        </div>

        <div class="grid grid--receita">
          <div class="stat">
            <div class="stat__icon" style="color: var(--success)">${getStatIcon('Motorista')}</div>
            <div class="stat__number">R$ ${totalReceita.toFixed(2)}</div>
            <div class="stat__label">Receita Total</div>
          </div>
          <div class="stat">
            <div class="stat__icon" style="color: var(--info)">${getStatIcon('Avaliação')}</div>
            <div class="stat__number">${counts.avaliacao}</div>
            <div class="stat__label">Avaliações</div>
          </div>
        </div>

        <!-- Motoristas por reputação -->
        <section class="card card--summary">
          <h3 class="card__title">Motoristas por reputação</h3>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th>Placa</th><th>Veículo</th><th>Nota</th><th>Aprovado</th></tr>
              </thead>
              <tbody>
                ${motoristas.map((m) => `
                  <tr>
                    <td>${escapeHtml(m.placa_veiculo)}</td>
                    <td>${escapeHtml(m.modelo_veiculo || '-')}</td>
                    <td>${parseFloat(m.reputacao || 0).toFixed(2)}</td>
                    <td>${m.aprovado ? '<span class="badge badge--success">Sim</span>' : '<span class="badge badge--danger">Não</span>'}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4" class="text-center text-muted">Nenhum motorista cadastrado</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Pedidos recentes -->
        <section class="card">
          <h3 class="card__title">Pedidos recentes</h3>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th>Data</th><th>Usuário</th><th>Motorista</th><th>Valor</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${pedidos.map((p) => `
                  <tr>
                    <td>${p.data_corrida ? new Date(p.data_corrida).toLocaleString('pt-BR') : '-'}</td>
                    <td>${escapeHtml(p.id_usuario || '-')}</td>
                    <td>${escapeHtml(p.id_motorista || '-')}</td>
                    <td>R$ ${parseFloat(p.preco_pago || 0).toFixed(2)}</td>
                    <td><span class="badge badge--${getStatusBadge(p.status)}">${escapeHtml(p.status || 'N/A')}</span></td>
                  </tr>
                `).join('') || '<tr><td colspan="5" class="text-center text-muted">Nenhum pedido cadastrado</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Avaliações mais recentes -->
        <section class="card">
          <h3 class="card__title">Avaliações mais recentes</h3>
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th>Usuário</th><th>Motorista</th><th>Nota</th><th>Comentário</th></tr>
              </thead>
              <tbody>
                ${avaliacoes.map((a) => `
                  <tr>
                    <td>${escapeHtml(a.id_usuario || '-')}</td>
                    <td>${escapeHtml(a.id_motorista || '-')}</td>
                    <td><span class="badge badge--success">${parseFloat(a.nota || 0).toFixed(1)}</span></td>
                    <td>${escapeHtml(a.comentario || '-')}</td>
                  </tr>
                `).join('') || '<tr><td colspan="4" class="text-center text-muted">Nenhuma avaliação cadastrada</td></tr>'}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  `;
}

function getStatusBadge(status) {
  const badges = {
    concluido: 'success',
    em_andamento: 'warning',
    aguardando: 'info',
    ativo: 'primary',
    cancelado: 'danger',
  };
  return badges[status] || 'primary';
}

// ============================================================
// MODAL DE CADASTRO/EDIÇÃO
// ============================================================

function setupModal() {
  const wrapper = document.getElementById('modal-wrapper');
  const closeBtn = document.getElementById('modal-close');
  const cancelBtn = document.getElementById('modal-cancel');
  const submitBtn = document.getElementById('modal-submit');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  // Abre modal com formulário de novo registro
  document.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'new') {
      openModal(e.target.dataset.table, null);
    }
  });

  // Edição
  document.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'edit') {
      const table = e.target.dataset.table;
      const id = parseInt(e.target.dataset.id, 10);
      openModal(table, id);
    }
  });

  // Exclusão
  document.addEventListener('click', (e) => {
    if (e.target.dataset.action === 'delete') {
      const table = e.target.dataset.table;
      const id = parseInt(e.target.dataset.id, 10);
      deleteRecord(table, id);
    }
  });

  // Fechar modal
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  wrapper.addEventListener('click', (e) => {
    if (e.target === wrapper) closeModal();
  });

  // Submit
  submitBtn.addEventListener('click', saveRecord);
}

function openModal(table, id) {
  const isEdit = id !== null;
  state.currentRecord = isEdit ? { id } : null;
  state.currentTable = table;
  state.formData = {};

  title.textContent = isEdit ? 'Editar Registro' : 'Novo Cadastro';
  document.getElementById('modal-submit').textContent = isEdit ? 'Atualizar' : 'Salvar';

  // Carrega dados para edição
  if (isEdit) {
    const record = state.records[table]?.find((r) => r.id === id);
    if (!record) {
      showError('Registro não encontrado.', table);
      closeModal();
      return;
    }
    state.formData = { ...record };
  } else {
    state.formData = {};
  }

  // Renderiza formulário
  const fields = getFormFields(table);
  body.innerHTML = fields.map((f) => `
    <div class="form-group">
      <label class="form-label" for="f-${f.name}">${f.label}</label>
      <input
        type="${f.type || 'text'}"
        class="form-input"
        id="f-${f.name}"
        name="${f.name}"
        value="${escapeHtml(state.formData[f.name] || '')}"
        ${f.required ? 'required' : ''}
      ${f.type === 'number' ? 'min="0"' : ''}
      />
    </div>
  `).join('');

  document.getElementById('modal-wrapper').classList.add('active');
  document.getElementById('f-' + Object.keys(state.formData)[0] || '').focus();
}

function closeModal() {
  document.getElementById('modal-wrapper').classList.remove('active');
  state.currentRecord = null;
  state.currentTable = null;
  state.formData = {};
}

function getFormFields(table) {
  const fields = {
    aplicativo: [
      { name: 'nome_aplicativo', label: 'Nome', type: 'text', required: true },
      { name: 'descricao', label: 'Descrição' },
      { name: 'cnpj_aplicativo', label: 'CNPJ' },
    ],
    usuario: [
      { name: 'nome', label: 'Nome', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'telefone', label: 'Telefone' },
      { name: 'cpf', label: 'CPF' },
      { name: 'senha', label: 'Senha', type: 'password' },
      { name: 'tipo_conta', label: 'Tipo de Conta', type: 'select', options: ['passageiro', 'motorista'] },
      { name: 'reputacao', label: 'Reputação (0-5)', type: 'number', min: 0, max: 5 },
      { name: 'qtd_corrida', label: 'Qtd Corridas', type: 'number', min: 0 },
    ],
    motorista: [
      { name: 'id_usuario', label: 'Usuário (ID)', type: 'number', required: true },
      { name: 'id_aplicativo', label: 'Aplicativo (ID)', type: 'number', required: true },
      { name: 'placa_veiculo', label: 'Placa do Veículo', type: 'text', required: true },
      { name: 'modelo_veiculo', label: 'Modelo do Veículo' },
      { name: 'aprovado', label: 'Aprovado', type: 'checkbox' },
      { name: 'disponivel', label: 'Disponível', type: 'checkbox' },
      { name: 'reputacao', label: 'Reputação (0-5)', type: 'number', min: 0, max: 5 },
      { name: 'qtd_corrida', label: 'Qtd Corridas', type: 'number', min: 0 },
      { name: 'receita_total', label: 'Receita (R$)', type: 'number', min: 0 },
    ],
    pedido: [
      { name: 'id_usuario', label: 'Usuário (ID)', type: 'number', required: true },
      { name: 'id_motorista', label: 'Motorista (ID)', type: 'number', required: true },
      { name: 'id_aplicativo', label: 'Aplicativo (ID)', type: 'number', required: true },
      { name: 'preco_pago', label: 'Preço Pago (R$)', type: 'number', min: 0 },
      { name: 'forma_pagamento', label: 'Forma de Pagamento', type: 'select', options: ['cartao', 'dinheiro', 'pix'] },
      { name: 'status', label: 'Status', type: 'select', options: ['aguardando', 'confirmado', 'em_andamento', 'concluido', 'cancelado'] },
      { name: 'data_corrida', label: 'Data da Corrida', type: 'datetime-local' },
    ],
    avaliacao: [
      { name: 'id_pedido', label: 'ID do Pedido', type: 'number', required: true },
      { name: 'id_usuario', label: 'ID do Usuário', type: 'number', required: true },
      { name: 'id_motorista', label: 'ID do Motorista', type: 'number', required: true },
      { name: 'nota', label: 'Nota (0-5)', type: 'number', min: 0, max: 5, required: true },
      { name: 'comentario', label: 'Comentário' },
    ],
  };

  const tableFields = fields[table] || [];
  return tableFields;
}

async function saveRecord() {
  const table = state.currentTable;
  const data = {};

  // Coleta os dados do formulário
  const inputs = document.querySelectorAll('#modal-body input, #modal-body select');
  inputs.forEach((input) => {
    const name = input.name;
    if (name) {
      if (input.type === 'checkbox') {
        data[name] = input.checked;
      } else {
        data[name] = input.value;
      }
    }
  });

  // Converte string para número/booleano
  for (const key in data) {
    if (data[key] === 'on' || data[key] === 'true') data[key] = true;
    else if (data[key] === 'off' || data[key] === 'false') data[key] = false;
    else if (data[key] !== '' && !isNaN(data[key]) && data[key].trim() !== '') {
      data[key] = parseFloat(data[key]);
    }
  }

  try {
    let result;
    if (state.currentRecord) {
      // Atualizar
      result = await apiRequest(`/${table}/${state.currentRecord.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      showSuccess('Registro atualizado com sucesso!');
    } else {
      // Criar
      result = await apiRequest(`/${table}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
      showSuccess('Registro criado com sucesso!');
    }

    // Atualiza estado
    if (result && result.length > 0) {
      const idx = state.records[table].findIndex((r) => r.id === result[0]?.id);
      if (idx >= 0) {
        state.records[table][idx] = result[0];
      } else {
        state.records[table].push(result[0]);
      }
    }
    closeModal();
    render();
  } catch (err) {
    showError(err.message, table);
  }
}

async function deleteRecord(table, id) {
  if (!confirm(`Tem certeza que deseja excluir este registro?`)) return;

  try {
    await apiRequest(`/${table}/${id}`, { method: 'DELETE' });
    showSuccess('Registro excluído com sucesso!');
    closeModal();
    render();
  } catch (err) {
    showError(err.message, table);
  }
}

// ============================================================
// FORMULÁRIOS AUTOMÁTICOS
// ============================================================

function setupForms() {
  // Deixa o formulário de senha chamar saveRecord no submit
  document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-submit') {
      saveRecord();
    }
  });
}

// ============================================================
// MENSAGENS DE ERRO E SUCESSO
// ============================================================

function showError(message, table) {
  state.error = message;
  const banner = document.getElementById('info-banner');
  const detail = document.getElementById('info-banner-detail');
  banner.className = 'info-banner';
  banner.style.background = 'var(--danger-light)';
  banner.style.color = '#991b1b';
  detail.textContent = `Erro: ${message}`;
  banner.classList.add('active');
}

function showSuccess(message) {
  const banner = document.getElementById('info-banner');
  const detail = document.getElementById('info-banner-detail');
  banner.className = 'info-banner';
  banner.style.background = 'var(--success-light)';
  banner.style.color = '#166534';
  detail.textContent = message;
  banner.classList.add('active');
  setTimeout(() => {
    banner.classList.remove('active');
  }, 3000);
}

// ============================================================
// BANDEIRA DE INFORMAÇÕES SOBRE O BANCO
// ============================================================

function setupInfoBanner() {
  const closeBtn = document.getElementById('info-banner-close');
  const banner = document.getElementById('info-banner');
  closeBtn.addEventListener('click', () => {
    banner.classList.remove('active');
  });
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
