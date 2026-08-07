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

const priorityAliases = {
  alta: 'alto',
  alto: 'alto',
  high: 'alto',
  media: 'medio',
  'média': 'medio',
  medio: 'medio',
  'médio': 'medio',
  medium: 'medio',
  baixa: 'baixo',
  baixo: 'baixo',
  low: 'baixo',
};

function normalizePriority(value) {
  const normalizedValue = String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR');

  return priorityAliases[normalizedValue] || 'medio';
}

function normalizeStatus(value) {
  const normalizedValue = String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR');

  const resolvedValues = [
    'resolvido',
    'resolvida',
    'resolved',
    'fechado',
    'fechada',
    'closed',
  ];

  return resolvedValues.includes(normalizedValue)
    ? 'resolvido'
    : 'aberto';
}

function Icon({ name, size = 18 }) {
  const icons = {
    inbox: (
      <>
        <path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
        <path d="M4 14h4l2 3h4l2-3h4" />
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
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.2 2" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12.5 4.2 4.2L19 7" />,
    reopen: (
      <>
        <path d="M4 7v5h5" />
        <path d="M5.4 12a7.5 7.5 0 1 0 2.1-5.2L4 10" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.7 9.5a2.4 2.4 0 1 1 3.9 1.9c-.9.7-1.6 1.2-1.6 2.6" />
        <path d="M12 17v.01" />
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
      strokeWidth="1.85"
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

    return Array.isArray(parsed)
      ? parsed.map((ticket) => ({
          ...ticket,
          urgencia: normalizePriority(ticket?.urgencia),
          status: normalizeStatus(ticket?.status),
          replies: Array.isArray(ticket?.replies)
            ? ticket.replies
            : [],
        }))
      : [];
  } catch {
    return [];
  }
}

function getInitials(name) {
  return String(name || 'Usuário')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getTicketCode(id) {
  return `#${String(id).slice(-5).padStart(5, '0')}`;
}

function formatDate(item) {
  const date = new Date(item.createdAt || Number(item.id));

  if (Number.isNaN(date.getTime())) {
    return 'Agora';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(',', ' ·');
}

export default function App() {
  const [tickets, setTickets] = useState(getStoredTickets);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState('medio');
  const [replyText, setReplyText] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const composePanelRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    if (!confirmation) return undefined;

    const timer = window.setTimeout(() => {
      setConfirmation('');
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [confirmation]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');

    return tickets.filter((ticket) => {
      const matchesPriority =
        filter === 'todos' || ticket.urgencia === filter;

      const text =
        `${ticket.nome} ${ticket.email} ${ticket.descricao}`.toLocaleLowerCase(
          'pt-BR',
        );

      return matchesPriority && (!term || text.includes(term));
    });
  }, [filter, search, tickets]);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ||
    tickets[0] ||
    null;

  const selectedPriority =
    priorities[selectedTicket?.urgencia] || priorities.medio;

  const selectedStatus = normalizeStatus(selectedTicket?.status);
  const isResolved = selectedStatus === 'resolvido';

  function focusNewTicket() {
    composePanelRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    window.setTimeout(() => {
      document.getElementById('ticket-nome')?.focus();
    }, 220);
  }

  function handleAddTicket(event) {
    event.preventDefault();

    if (!nome.trim() || !email.trim() || !descricao.trim()) {
      return;
    }

    const ticket = {
      id: Date.now(),
      nome: nome.trim(),
      email: email.trim(),
      descricao: descricao.trim(),
      urgencia,
      createdAt: new Date().toISOString(),
      status: 'aberto',
      replies: [],
    };

    setTickets((currentTickets) => [
      ticket,
      ...currentTickets,
    ]);

    setSelectedTicketId(ticket.id);
    setFilter('todos');
    setSearch('');
    setNome('');
    setEmail('');
    setDescricao('');
    setUrgencia('medio');

    setConfirmation(
      `Ticket ${getTicketCode(ticket.id)} criado e enviado para a fila.`,
    );
  }

  function handleDelete(id) {
    const remaining = tickets.filter(
      (ticket) => ticket.id !== id,
    );

    setTickets(remaining);

    if (selectedTicket?.id === id) {
      setSelectedTicketId(remaining[0]?.id ?? null);
    }
  }

  function handleReply(event) {
    event.preventDefault();

    if (!selectedTicket || !replyText.trim() || isResolved) {
      return;
    }

    const reply = {
      id: Date.now(),
      author: 'Equipe LTHS',
      message: replyText.trim(),
      createdAt: new Date().toISOString(),
    };

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              replies: [...(ticket.replies || []), reply],
            }
          : ticket,
      ),
    );

    setReplyText('');

    setConfirmation(
      `Resposta registrada no ticket ${getTicketCode(
        selectedTicket.id,
      )}.`,
    );
  }

  function handleToggleStatus() {
    if (!selectedTicket) return;

    const nextStatus = isResolved
      ? 'aberto'
      : 'resolvido';

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === selectedTicket.id
          ? {
              ...ticket,
              status: nextStatus,
              resolvedAt:
                nextStatus === 'resolvido'
                  ? new Date().toISOString()
                  : null,
            }
          : ticket,
      ),
    );

    setConfirmation(
      nextStatus === 'resolvido'
        ? `Ticket ${getTicketCode(
            selectedTicket.id,
          )} marcado como resolvido.`
        : `Ticket ${getTicketCode(
            selectedTicket.id,
          )} reaberto.`,
    );
  }

  const logoPath =
    `${import.meta.env.BASE_URL}imagem/logo2026.png`;

  return (
    <div className="support-app">
      <aside
        className="nav-rail"
        aria-label="Navegação principal"
      >
        <div className="nav-rail__brand">
          <img
            src={logoPath}
            alt="LTHS Tecnologia"
          />
        </div>

        <nav className="nav-rail__nav">
          <button
            type="button"
            className="is-active"
            aria-label="Tickets"
          >
            <Icon name="inbox" />
          </button>

          <button
            type="button"
            onClick={focusNewTicket}
            aria-label="Novo ticket"
          >
            <Icon name="plus" />
          </button>

          <button
            type="button"
            onClick={() => setFilter('alto')}
            aria-label="Tickets de alta prioridade"
          >
            <Icon name="ticket" />
          </button>
        </nav>

        <button
          type="button"
          className="nav-rail__help"
          aria-label="Ajuda"
        >
          <Icon name="help" />
        </button>
      </aside>

      <aside className="queue-panel">
        <header className="queue-panel__header">
          <div className="brand-lockup">
            <strong>Central de suporte</strong>

            <span>
              <i />
              Operação online
            </span>
          </div>

          <button
            type="button"
            className="queue-create"
            onClick={focusNewTicket}
          >
            <Icon name="plus" size={16} />
            Novo
          </button>
        </header>

        <div className="queue-panel__title">
          <div>
            <span>CAIXA DE ENTRADA</span>
            <h1>Chamados</h1>
          </div>

          <b>{tickets.length}</b>
        </div>

        <label className="queue-search">
          <Icon name="search" size={17} />

          <input
            type="search"
            placeholder="Buscar tickets"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Buscar tickets"
          />
        </label>

        <div
          className="queue-filters"
          aria-label="Filtrar tickets"
        >
          {[
            ['todos', 'Todos'],
            ['alto', 'Alta'],
            ['medio', 'Média'],
            ['baixo', 'Baixa'],
          ].map(([value, label]) => (
            <button
              type="button"
              className={
                filter === value ? 'is-selected' : ''
              }
              key={value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="queue-list"
          aria-label="Lista de tickets"
        >
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => {
              const priority =
                priorities[ticket.urgencia] ||
                priorities.medio;

              const ticketStatus =
                normalizeStatus(ticket.status);

              const isSelected =
                selectedTicket?.id === ticket.id;

              return (
                <button
                  type="button"
                  className={`queue-ticket ${
                    isSelected ? 'is-selected' : ''
                  }`}
                  data-priority={
                    ticket.urgencia || 'medio'
                  }
                  data-status={ticketStatus}
                  key={ticket.id}
                  onClick={() =>
                    setSelectedTicketId(ticket.id)
                  }
                >
                  <span className="queue-ticket__meta">
                    {getTicketCode(ticket.id)}
                    <i />
                    {formatDate(ticket)}
                  </span>

                  <strong>{ticket.nome}</strong>

                  <p>{ticket.descricao}</p>

                  <span className="queue-ticket__footer">
                    <span className="queue-ticket__priority">
                      {priority.label}
                    </span>

                    <span className="queue-ticket__status">
                      {ticketStatus === 'resolvido'
                        ? 'Resolvido'
                        : 'Aberto'}
                    </span>
                  </span>
                </button>
              );
            })
          ) : (
            <div className="queue-empty">
              <Icon name="inbox" size={22} />

              <strong>Nenhum ticket aqui</strong>

              <span>
                Ajuste os filtros ou crie um novo chamado.
              </span>
            </div>
          )}
        </div>
      </aside>

      <main className="ticket-workspace">
        <header className="workspace-toolbar">
          <div className="workspace-toolbar__title">
            <span>Atendimento / Tickets</span>

            <strong>
              {selectedTicket
                ? getTicketCode(selectedTicket.id)
                : 'Sem ticket selecionado'}
            </strong>
          </div>

          <div className="workspace-toolbar__actions">
            <span>
              <i />
              Ambiente ativo
            </span>

            <button
              type="button"
              onClick={focusNewTicket}
            >
              <Icon name="plus" size={16} />
              Abrir ticket
            </button>
          </div>
        </header>

        {confirmation && (
          <div
            className="ticket-notice"
            role="status"
          >
            {confirmation}
          </div>
        )}

        {selectedTicket ? (
          <section className="ticket-view">
            <header className="ticket-view__header">
              <div>
                <div
                  className="ticket-state"
                  data-status={selectedStatus}
                >
                  <span>
                    <i />
                    {isResolved
                      ? 'Resolvido'
                      : 'Aberto'}
                  </span>

                  <span className="ticket-view__code">
                    {getTicketCode(selectedTicket.id)}
                  </span>
                </div>

                <h2>
                  Solicitação de {selectedTicket.nome}
                </h2>

                <p>
                  {isResolved
                    ? `Resolvida após o atendimento iniciado em ${formatDate(
                        selectedTicket,
                      )}.`
                    : `Recebida ${formatDate(
                        selectedTicket,
                      )} e aguardando acompanhamento.`}
                </p>
              </div>

              <div className="ticket-view__actions">
                <span
                  className="priority-tag"
                  data-priority={
                    selectedTicket.urgencia || 'medio'
                  }
                >
                  {selectedPriority.label} prioridade
                </span>

                <button
                  type="button"
                  className="resolve-ticket"
                  data-status={selectedStatus}
                  onClick={handleToggleStatus}
                >
                  <Icon
                    name={
                      isResolved ? 'reopen' : 'check'
                    }
                    size={16}
                  />

                  {isResolved
                    ? 'Reabrir ticket'
                    : 'Marcar como resolvido'}
                </button>
              </div>
            </header>

            <div className="ticket-view__content">
              <section className="ticket-thread">
                <header>
                  <div>
                    <span>
                      DETALHES DA SOLICITAÇÃO
                    </span>

                    <h3>Histórico do atendimento</h3>
                  </div>

                  <span
                    className="thread-status"
                    data-status={selectedStatus}
                  >
                    <i />

                    {isResolved
                      ? 'Atendimento encerrado'
                      : 'Em atendimento'}
                  </span>
                </header>

                <article className="request-message">
                  <span className="request-message__avatar">
                    {getInitials(selectedTicket.nome)}
                  </span>

                  <div>
                    <header>
                      <strong>
                        {selectedTicket.nome}
                      </strong>

                      <span>
                        {formatDate(selectedTicket)}
                      </span>
                    </header>

                    <p>
                      {selectedTicket.descricao}
                    </p>
                  </div>
                </article>

                {(selectedTicket.replies || []).map(
                  (reply) => (
                    <article
                      className="support-message"
                      key={reply.id}
                    >
                      <div>
                        <header>
                          <strong>
                            {reply.author ||
                              'Equipe LTHS'}
                          </strong>

                          <span>
                            {formatDate(reply)}
                          </span>
                        </header>

                        <p>{reply.message}</p>
                      </div>

                      <span className="support-message__avatar">
                        LT
                      </span>
                    </article>
                  ),
                )}

                <div className="ticket-event">
                  <span />

                  <p>
                    <strong>Ticket criado</strong> · A
                    solicitação foi adicionada à fila.
                  </p>
                </div>

                {isResolved && (
                  <div className="ticket-event ticket-event--resolved">
                    <span />

                    <p>
                      <strong>Ticket resolvido</strong> · O
                      atendimento foi encerrado pela equipe.
                    </p>
                  </div>
                )}

                <form
                  className="reply-composer"
                  onSubmit={handleReply}
                >
                  <label htmlFor="ticket-reply">
                    Responder ao solicitante
                  </label>

                  <textarea
                    id="ticket-reply"
                    value={replyText}
                    onChange={(event) =>
                      setReplyText(event.target.value)
                    }
                    placeholder={
                      isResolved
                        ? 'Reabra o ticket para enviar uma nova resposta.'
                        : 'Escreva a resposta do atendimento...'
                    }
                    rows={4}
                    disabled={isResolved}
                  />

                  <div className="reply-composer__footer">
                    <span>
                      {isResolved
                        ? 'O atendimento está encerrado.'
                        : 'A resposta será registrada no histórico do ticket.'}
                    </span>

                    <button
                      type="submit"
                      disabled={
                        isResolved ||
                        !replyText.trim()
                      }
                    >
                      Responder
                      <Icon
                        name="arrow"
                        size={16}
                      />
                    </button>
                  </div>
                </form>
              </section>

              <aside className="ticket-details">
                <section>
                  <span className="ticket-details__label">
                    SOLICITANTE
                  </span>

                  <div className="requester-card">
                    <span>
                      {getInitials(selectedTicket.nome)}
                    </span>

                    <div>
                      <strong>
                        {selectedTicket.nome}
                      </strong>

                      <small>Solicitante</small>
                    </div>
                  </div>

                  <dl>
                    <div>
                      <dt>
                        <Icon
                          name="mail"
                          size={15}
                        />
                        E-mail
                      </dt>

                      <dd>
                        {selectedTicket.email}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        <Icon
                          name="clock"
                          size={15}
                        />
                        Registrado
                      </dt>

                      <dd>
                        {formatDate(selectedTicket)}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section
                  className="ticket-details__priority"
                  data-priority={
                    selectedTicket.urgencia || 'medio'
                  }
                >
                  <span className="ticket-details__label">
                    PRIORIZAÇÃO
                  </span>

                  <strong>
                    {selectedPriority.label}
                  </strong>

                  <p>
                    {selectedPriority.description}
                  </p>
                </section>

                <section
                  className="ticket-details__status"
                  data-status={selectedStatus}
                >
                  <span className="ticket-details__label">
                    STATUS
                  </span>

                  <strong>
                    {isResolved
                      ? 'Resolvido'
                      : 'Aberto'}
                  </strong>

                  <p>
                    {isResolved
                      ? 'Atendimento concluído pela equipe.'
                      : 'Chamado disponível para atendimento.'}
                  </p>
                </section>

                <button
                  type="button"
                  className="delete-ticket"
                  onClick={() =>
                    handleDelete(selectedTicket.id)
                  }
                >
                  <Icon name="trash" size={16} />
                  Excluir ticket
                </button>
              </aside>
            </div>
          </section>
        ) : (
          <section className="workspace-empty">
            <span>
              <Icon name="ticket" size={28} />
            </span>

            <h2>Nenhum ticket selecionado</h2>

            <p>
              Crie um novo chamado ou ajuste os filtros
              para visualizar uma solicitação.
            </p>

            <button
              type="button"
              onClick={focusNewTicket}
            >
              Criar ticket
              <Icon name="arrow" size={16} />
            </button>
          </section>
        )}
      </main>

      <aside
        className="compose-panel"
        ref={composePanelRef}
      >
        <header className="compose-panel__header">
          <div>
            <span>NOVO TICKET</span>
            <h2>Abrir solicitação</h2>
          </div>

          <span>
            <Icon name="ticket" size={17} />
          </span>
        </header>

        <p className="compose-panel__intro">
          Descreva a demanda para ela entrar na fila de
          atendimento.
        </p>

        <form
          className="compose-form"
          onSubmit={handleAddTicket}
        >
          <label>
            <span>Nome completo</span>

            <input
              id="ticket-nome"
              type="text"
              placeholder="Como devemos chamar você?"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              required
            />
          </label>

          <label>
            <span>E-mail para retorno</span>

            <input
              type="email"
              placeholder="voce@empresa.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </label>

          <label>
            <span>Solicitação</span>

            <textarea
              placeholder="Conte o que aconteceu e inclua as informações importantes para o atendimento."
              value={descricao}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
              rows={6}
              required
            />
          </label>

          <fieldset>
            <legend>Prioridade</legend>

            <div className="priority-picker">
              {Object.entries(priorities).map(
                ([value, priority]) => (
                  <label
                    className={
                      urgencia === value
                        ? 'is-selected'
                        : ''
                    }
                    data-priority={value}
                    key={value}
                  >
                    <input
                      type="radio"
                      name="prioridade"
                      value={value}
                      checked={urgencia === value}
                      onChange={(event) =>
                        setUrgencia(
                          event.target.value,
                        )
                      }
                    />

                    <span className="priority-picker__dot" />

                    <span>
                      <strong>
                        {priority.label}
                      </strong>

                      <small>
                        {priority.description}
                      </small>
                    </span>
                  </label>
                ),
              )}
            </div>
          </fieldset>

          <button
            type="submit"
            className="submit-ticket"
          >
            Criar ticket
            <Icon name="arrow" size={17} />
          </button>
        </form>
      </aside>
    </div>
  );
}