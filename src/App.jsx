import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const priorities = {
  alto: {
    label: 'Alta',
    description: 'Impacto imediato',
  },
  medio: {
    label: 'Média',
    description: 'Precisa de atenção',
  },
  baixo: {
    label: 'Baixa',
    description: 'Pode ser programado',
  },
};

function Icon({ name, size = 18 }) {
  const icons = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5V8a2 2 0 0 0 0 4v2.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 14.5V12a2 2 0 0 0 0-4V5.5Z" />
        <path d="M12 7v2" />
        <path d="M12 13v.01" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m16 16 4 4" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="M7 7l1 13h8l1-13" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    inbox: (
      <>
        <path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
        <path d="M4 14h4l2 3h4l2-3h4" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v5" />
        <path d="M12 7v.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

function getStoredTickets() {
  try {
    const saved = localStorage.getItem('tickets');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(ticket) {
  const date = new Date(ticket.createdAt || Number(ticket.id));

  if (Number.isNaN(date.getTime())) {
    return 'Registrado agora';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(',', ' •');
}

function getTicketCode(id) {
  return `#${String(id).slice(-5).padStart(5, '0')}`;
}

function getInitials(name) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  return initials.toUpperCase() || 'US';
}

export default function App() {
  const [tickets, setTickets] = useState(getStoredTickets);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState('medio');
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const formPanelRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('tickets', JSON.stringify(tickets));
    } catch {
      return undefined;
    }

    return undefined;
  }, [tickets]);

  useEffect(() => {
    if (!confirmation) {
      return undefined;
    }

    const timer = window.setTimeout(() => setConfirmation(''), 4500);
    return () => window.clearTimeout(timer);
  }, [confirmation]);

  const ticketMetrics = useMemo(() => {
    const highPriority = tickets.filter((ticket) => ticket.urgencia === 'alto').length;
    const regularPriority = tickets.filter((ticket) => ticket.urgencia !== 'alto').length;

    return {
      total: tickets.length,
      highPriority,
      regularPriority,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');

    return tickets.filter((ticket) => {
      const matchesFilter = filter === 'todos' || ticket.urgencia === filter;
      const searchableText = `${ticket.nome} ${ticket.email} ${ticket.descricao}`.toLocaleLowerCase('pt-BR');
      return matchesFilter && (!term || searchableText.includes(term));
    });
  }, [filter, search, tickets]);

  function focusNewTicket() {
    formPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => document.getElementById('ticket-nome')?.focus(), 350);
  }

  function handleAddTicket(event) {
    event.preventDefault();

    if (!nome.trim() || !email.trim() || !descricao.trim()) {
      return;
    }

    const newTicket = {
      id: Date.now(),
      nome: nome.trim(),
      email: email.trim(),
      descricao: descricao.trim(),
      urgencia,
      createdAt: new Date().toISOString(),
    };

    setTickets((currentTickets) => [newTicket, ...currentTickets]);
    setNome('');
    setEmail('');
    setDescricao('');
    setUrgencia('medio');
    setFilter('todos');
    setSearch('');
    setConfirmation(`Chamado ${getTicketCode(newTicket.id)} aberto e incluído na fila.`);
  }

  function handleDelete(id) {
    setTickets((currentTickets) => currentTickets.filter((ticket) => ticket.id !== id));
  }

  function selectFilter(nextFilter) {
    setFilter(nextFilter);
    setSearch('');
  }

  const logoPath = `${import.meta.env.BASE_URL}imagem/logo2026.png`;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <img src={logoPath} alt="LTHS Tecnologia" className="sidebar__logo" />
          <div>
            <strong>LTHS Tecnologia</strong>
            <span>Central de suporte</span>
          </div>
        </div>

        <div className="sidebar__workspace">
          <span className="sidebar__workspace-dot" />
          Atendimento interno
        </div>

        <nav className="sidebar__nav" aria-label="Navegação da central de tickets">
          <p>Central</p>
          <button type="button" className={filter === 'todos' ? 'is-active' : ''} onClick={() => selectFilter('todos')}>
            <Icon name="grid" />
            <span>Visão geral</span>
          </button>
          <button type="button" onClick={focusNewTicket}>
            <Icon name="plus" />
            <span>Novo chamado</span>
          </button>

          <p className="sidebar__nav-heading">Fila de atendimento</p>
          <button type="button" className={filter === 'alto' ? 'is-active' : ''} onClick={() => selectFilter('alto')}>
            <Icon name="ticket" />
            <span>Alta prioridade</span>
            <b>{ticketMetrics.highPriority}</b>
          </button>
          <button type="button" className={filter === 'medio' ? 'is-active' : ''} onClick={() => selectFilter('medio')}>
            <Icon name="inbox" />
            <span>Prioridade média</span>
          </button>
        </nav>

        <div className="sidebar__help">
          <span className="sidebar__help-icon"><Icon name="info" size={16} /></span>
          <div>
            <strong>Precisa de ajuda?</strong>
            <span>Abra um chamado com os detalhes da solicitação.</span>
          </div>
        </div>

        <div className="sidebar__footer">
          <span>LTHS Tecnologia</span>
          <small>Operações digitais</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar__title">
            <span>Suporte interno</span>
            <strong>Central de tickets</strong>
          </div>
          <div className="topbar__user">
            <div className="topbar__avatar">LT</div>
            <div>
              <strong>Equipe LTHS</strong>
              <span>Administrador</span>
            </div>
          </div>
        </header>

        <div className="dashboard">
          <section className="page-heading">
            <div>
              <span className="eyebrow">ATENDIMENTO E SUPORTE</span>
              <h1>Organize cada solicitação em um só lugar.</h1>
              <p>Registre chamados, priorize demandas e acompanhe a fila de atendimento de forma clara.</p>
            </div>
            <button type="button" className="primary-action" onClick={focusNewTicket}>
              <Icon name="plus" size={19} />
              Abrir chamado
            </button>
          </section>

          <section className="metrics" aria-label="Resumo dos chamados">
            <article className="metric-card">
              <span className="metric-card__icon metric-card__icon--blue"><Icon name="ticket" /></span>
              <div>
                <span>Chamados abertos</span>
                <strong>{ticketMetrics.total}</strong>
              </div>
              <small>Fila atual</small>
            </article>
            <article className="metric-card">
              <span className="metric-card__icon metric-card__icon--red"><Icon name="info" /></span>
              <div>
                <span>Alta prioridade</span>
                <strong>{ticketMetrics.highPriority}</strong>
              </div>
              <small>Exigem atenção</small>
            </article>
            <article className="metric-card">
              <span className="metric-card__icon metric-card__icon--cyan"><Icon name="inbox" /></span>
              <div>
                <span>Demais solicitações</span>
                <strong>{ticketMetrics.regularPriority}</strong>
              </div>
              <small>Em acompanhamento</small>
            </article>
          </section>

          {confirmation && (
            <div className="confirmation" role="status">
              <span>✓</span>
              {confirmation}
            </div>
          )}

          <section className="workspace">
            <div className="tickets-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">FILA ATUAL</span>
                  <h2>Chamados em atendimento</h2>
                </div>
                <span className="ticket-count">{filteredTickets.length} {filteredTickets.length === 1 ? 'chamado' : 'chamados'}</span>
              </div>

              <div className="ticket-toolbar">
                <label className="search-field">
                  <Icon name="search" size={17} />
                  <input
                    type="search"
                    placeholder="Buscar por nome, e-mail ou assunto"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Buscar chamados"
                  />
                </label>
                <div className="filter-group" aria-label="Filtrar chamados por prioridade">
                  {[
                    ['todos', 'Todos'],
                    ['alto', 'Alta'],
                    ['medio', 'Média'],
                    ['baixo', 'Baixa'],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      className={filter === value ? 'is-selected' : ''}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ticket-list">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((ticket) => {
                    const priority = priorities[ticket.urgencia] || priorities.medio;

                    return (
                      <article className="ticket-card" data-priority={ticket.urgencia || 'medio'} key={ticket.id}>
                        <div className="ticket-card__identity">
                          <span className="requester-avatar">{getInitials(ticket.nome)}</span>
                          <div>
                            <div className="ticket-card__line">
                              <span className="ticket-code">{getTicketCode(ticket.id)}</span>
                              <span className="ticket-status"><i />Aberto</span>
                            </div>
                            <h3>{ticket.nome}</h3>
                            <span className="requester-email">{ticket.email}</span>
                          </div>
                        </div>

                        <p className="ticket-description">{ticket.descricao}</p>

                        <div className="ticket-card__footer">
                          <div className="ticket-meta">
                            <span className="priority-badge">{priority.label}</span>
                            <span>{formatDate(ticket)}</span>
                          </div>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDelete(ticket.id)}
                            aria-label={`Excluir chamado ${getTicketCode(ticket.id)}`}
                            title="Excluir chamado"
                          >
                            <Icon name="trash" size={17} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <span><Icon name="inbox" size={24} /></span>
                    <h3>Nenhum chamado encontrado</h3>
                    <p>Ajuste sua busca ou abra um novo chamado para iniciar a fila.</p>
                    <button type="button" onClick={focusNewTicket}>Abrir chamado <Icon name="arrow" size={16} /></button>
                  </div>
                )}
              </div>
            </div>

            <aside className="form-panel" ref={formPanelRef}>
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">NOVA SOLICITAÇÃO</span>
                  <h2>Abrir chamado</h2>
                </div>
                <span className="form-panel__badge"><Icon name="ticket" size={16} /></span>
              </div>
              <p className="form-panel__intro">Informe os dados abaixo para incluir sua solicitação na fila de suporte.</p>

              <form className="ticket-form" onSubmit={handleAddTicket}>
                <label className="field">
                  <span>Nome completo</span>
                  <input
                    id="ticket-nome"
                    type="text"
                    placeholder="Como devemos chamar você?"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>E-mail para retorno</span>
                  <input
                    type="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Descreva a solicitação</span>
                  <textarea
                    placeholder="Explique o que aconteceu e inclua informações que ajudem no atendimento."
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    required
                    rows={5}
                  />
                </label>

                <fieldset className="priority-field">
                  <legend>Prioridade</legend>
                  <div className="priority-options">
                    {Object.entries(priorities).map(([value, priority]) => (
                      <label className={urgencia === value ? 'is-selected' : ''} key={value}>
                        <input
                          type="radio"
                          name="urgencia"
                          value={value}
                          checked={urgencia === value}
                          onChange={(event) => setUrgencia(event.target.value)}
                        />
                        <span className="priority-options__dot" />
                        <span>
                          <strong>{priority.label}</strong>
                          <small>{priority.description}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <button type="submit" className="submit-ticket">
                  Criar chamado
                  <Icon name="arrow" size={18} />
                </button>
              </form>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}