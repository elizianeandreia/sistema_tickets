import { useEffect, useMemo, useState } from 'react'
import './App.css'

import { useServiceDesk } from './context/ServiceDeskContext.jsx'

import {
  formatCompactDate,
  formatTicketCode,
  getInitials,
} from './utils/formatters.js'

import {
  formatSlaRemaining,
  getSlaState,
} from './services/ticketService.js'

const STATUS_LABELS = {
  new: 'Novo',
  in_progress: 'Em atendimento',
  waiting: 'Aguardando',
  resolved: 'Resolvido',
}

const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

const CATEGORY_LABELS = {
  access: 'Acessos',
  network: 'Rede',
  systems: 'Sistemas',
  devices: 'Dispositivos',
  general: 'Geral',
}

function Icon({ name, size = 18 }) {
  const paths = {
    inbox: (
      <>
        <path d="M4 5.5h16v13H4z" />
        <path d="M4 14h4l2 2h4l2-2h4" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),

    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M6 20c0-3.5 2.5-6 6-6s6 2.5 6 6" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3.5 2.5-6 6-6 2 0 3.8.8 4.8 2" />
        <path d="M15 6.5a3 3 0 0 1 0 5.5" />
        <path d="M16 14c3 0 5 2.2 5 5" />
      </>
    ),

    activity: (
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    ),

    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
      </>
    ),

    moon: (
      <path d="M20 15.2A8 8 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />
    ),

    arrow: (
      <>
        <path d="M5 12h13" />
        <path d="m14 8 4 4-4 4" />
      </>
    ),

    info: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 11v5" />
        <path d="M12 8h.01" />
      </>
    ),
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function getRequester(ticket) {
  const requester = ticket?.requester ?? {}

  return {
    name:
      requester.name ||
      ticket?.requesterName ||
      ticket?.customerName ||
      'Solicitante',

    email:
      requester.email ||
      ticket?.requesterEmail ||
      ticket?.email ||
      '',

    department:
      requester.department ||
      ticket?.department ||
      'Não informado',
  }
}

function getTicketDescription(ticket) {
  return (
    ticket?.description ||
    ticket?.message ||
    ticket?.requesterMessage ||
    ticket?.initialMessage ||
    'Chamado registrado para análise da equipe de suporte.'
  )
}

function TicketMessage({
  type,
  author,
  role,
  message,
  createdAt,
}) {
  return (
    <article className={`timeline-entry timeline-entry--${type}`}>
      <div className="timeline-entry__rail">
        <span className="timeline-entry__marker" />
      </div>

      <div className="timeline-entry__time">
        {formatCompactDate(createdAt)}
      </div>

      <div className="timeline-entry__content">
        <div className="timeline-entry__meta">
          <strong>{author}</strong>
          <span>{role}</span>
        </div>

        <p>{message}</p>
      </div>
    </article>
  )
}

function App() {
  const {
    tickets,
    team,
    preferences,
    openTickets,
    resolvedTickets,
    replyToTicket,
    addNoteToTicket,
    setTicketWaiting,
    closeTicket,
    reopenResolvedTicket,
    setTicketPriority,
    setTicketAssignee,
    setTheme,
  } = useServiceDesk()

  const [selectedTicketId, setSelectedTicketId] = useState(
    tickets[0]?.id ?? null
  )

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [replyText, setReplyText] = useState('')
  const [composerMode, setComposerMode] = useState('reply')
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme =
      preferences.theme || 'dark'
  }, [preferences.theme])

  useEffect(() => {
    if (!tickets.length) {
      setSelectedTicketId(null)
      return
    }

    const exists = tickets.some(
      (ticket) => ticket.id === selectedTicketId
    )

    if (!exists) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [tickets, selectedTicketId])

  const selectedTicket = useMemo(
    () =>
      tickets.find(
        (ticket) => ticket.id === selectedTicketId
      ) ?? null,
    [tickets, selectedTicketId]
  )

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase()

    return tickets.filter((ticket) => {
      const requester = getRequester(ticket)

      const matchesStatus =
        statusFilter === 'all' ||
        ticket.status === statusFilter

      const searchable = [
        ticket.code,
        ticket.subject,
        ticket.title,
        requester.name,
        requester.department,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !normalizedSearch ||
        searchable.includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [tickets, search, statusFilter])

  const selectedRequester =
    getRequester(selectedTicket)

  const selectedAssignee = team.find(
    (member) =>
      member.id === selectedTicket?.assigneeId
  )

  const sla = selectedTicket
    ? getSlaState(selectedTicket)
    : null

  const highPriorityTickets =
    tickets.filter(
      (ticket) =>
        ticket.priority === 'high' &&
        ticket.status !== 'resolved'
    ).length

  const waitingTickets =
    tickets.filter(
      (ticket) => ticket.status === 'waiting'
    ).length

  const logoPath =
    `${import.meta.env.BASE_URL}imagem/logo2026.png`

  function handleSelectTicket(ticketId) {
    setSelectedTicketId(ticketId)
    setReplyText('')
    setComposerMode('reply')
    setDetailsOpen(false)
  }

  function handleComposerSubmit(event) {
    event.preventDefault()

    if (!selectedTicket) return

    const message = replyText.trim()

    if (!message) return

    if (composerMode === 'note') {
      addNoteToTicket(selectedTicket.id, {
        message,
        author: selectedAssignee?.name || 'Equipe LTHS',
      })
    } else {
      replyToTicket(selectedTicket.id, {
        message,
        author: selectedAssignee?.name || 'Equipe LTHS',
      })
    }

    setReplyText('')
  }

  function handleResolve() {
    if (!selectedTicket) return

    closeTicket(selectedTicket.id, {
      author: selectedAssignee?.name || 'Equipe LTHS',
    })
  }

  function handleReopen() {
    if (!selectedTicket) return

    reopenResolvedTicket(selectedTicket.id, {
      author: selectedAssignee?.name || 'Equipe LTHS',
    })
  }

  function handleWaiting() {
    if (!selectedTicket) return

    setTicketWaiting(selectedTicket.id, {
      author: selectedAssignee?.name || 'Equipe LTHS',
    })
  }

  function handlePriorityChange(event) {
    if (!selectedTicket) return

    setTicketPriority(
      selectedTicket.id,
      event.target.value,
      {
        author:
          selectedAssignee?.name || 'Equipe LTHS',
      }
    )
  }

  function handleAssigneeChange(event) {
    if (!selectedTicket) return

    setTicketAssignee(
      selectedTicket.id,
      event.target.value || null,
      {
        author: 'Equipe LTHS',
      }
    )
  }

  function toggleTheme() {
    setTheme(
      preferences.theme === 'light'
        ? 'dark'
        : 'light'
    )
  }

  return (
    <div className="support-app">
      <aside className="nav-rail">
        <div className="nav-rail__brand">
          <img
            src={logoPath}
            alt="LTHS Tecnologia"
          />
        </div>

        <nav
          className="nav-rail__nav"
          aria-label="Navegação principal"
        >
          <button
            className="is-active"
            type="button"
            aria-label="Chamados"
            title="Chamados"
          >
            <Icon name="inbox" />
          </button>

          <button
            type="button"
            aria-label="Equipe"
            title="Equipe"
          >
            <Icon name="users" />
          </button>

          <button
            type="button"
            aria-label="Operação"
            title="Operação"
          >
            <Icon name="activity" />
          </button>
        </nav>

        <button
          className="nav-rail__help"
          type="button"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          <Icon
            name={
              preferences.theme === 'light'
                ? 'moon'
                : 'sun'
            }
          />
        </button>
      </aside>

      <aside className="queue-panel">
        <header className="queue-panel__header">
          <div className="brand-lockup">
            <strong>Service Desk</strong>

            <span>
              <i />
              Operação online
            </span>
          </div>

          <button
            className="queue-create"
            type="button"
          >
            <Icon name="plus" size={15} />
            Novo
          </button>
        </header>

        <div className="queue-panel__title">
          <div>
            <span>Central de suporte</span>
            <h1>Chamados</h1>
          </div>

          <b>{openTickets.length}</b>
        </div>

        <label className="queue-search">
          <Icon name="search" size={15} />

          <input
            type="search"
            placeholder="Buscar chamados"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <div className="queue-filters">
          <button
            type="button"
            className={
              statusFilter === 'all'
                ? 'is-selected'
                : ''
            }
            onClick={() =>
              setStatusFilter('all')
            }
          >
            Todos
          </button>

          <button
            type="button"
            className={
              statusFilter === 'new'
                ? 'is-selected'
                : ''
            }
            onClick={() =>
              setStatusFilter('new')
            }
          >
            Novos
          </button>

          <button
            type="button"
            className={
              statusFilter === 'in_progress'
                ? 'is-selected'
                : ''
            }
            onClick={() =>
              setStatusFilter('in_progress')
            }
          >
            Em atendimento
          </button>
        </div>

        <div className="ticket-list">
          {filteredTickets.length ? (
            filteredTickets.map((ticket) => {
              const requester =
                getRequester(ticket)

              const ticketSla =
                getSlaState(ticket)

              const subject =
                ticket.subject ||
                ticket.title ||
                'Chamado sem título'

              return (
                <button
                  key={ticket.id}
                  type="button"
                  className={`ticket-row ${
                    ticket.id === selectedTicketId
                      ? 'is-active'
                      : ''
                  }`}
                  onClick={() =>
                    handleSelectTicket(ticket.id)
                  }
                >
                  <div className="ticket-row__top">
                    <span className="ticket-code">
                      {formatTicketCode(
                        ticket.code
                      )}
                    </span>

                    <span
                      className={`priority-dot priority-dot--${ticket.priority}`}
                    >
                      {
                        PRIORITY_LABELS[
                          ticket.priority
                        ]
                      }
                    </span>
                  </div>

                  <strong className="ticket-row__subject">
                    {subject}
                  </strong>

                  <span className="ticket-row__requester">
                    {requester.name}
                  </span>

                  <div className="ticket-row__footer">
                    <span>
                      {
                        STATUS_LABELS[
                          ticket.status
                        ]
                      }
                    </span>

                    {ticket.status !==
                      'resolved' && (
                      <span
                        className={`sla-text sla-text--${ticketSla.state}`}
                      >
                        <Icon
                          name="clock"
                          size={12}
                        />

                        {formatSlaRemaining(
                          ticketSla.remainingMs
                        )}
                      </span>
                    )}
                  </div>
                </button>
              )
            })
          ) : (
            <div className="empty-state">
              <strong>
                Nenhum chamado encontrado
              </strong>

              <span>
                Ajuste os filtros ou a busca.
              </span>
            </div>
          )}
        </div>

        <footer className="queue-health">
          <span>
            <b>{openTickets.length}</b>
            ativos
          </span>

          <span>
            <b>{highPriorityTickets}</b>
            alta
          </span>

          <span>
            <b>{waitingTickets}</b>
            aguardando
          </span>
        </footer>
      </aside>

      <main className="ticket-workspace">
        {selectedTicket ? (
          <>
            <section className="ticket-document">
              <header className="ticket-document__header">
                <div className="ticket-document__identity">
                  <div className="ticket-document__eyebrow">
                    <span>
                      {formatTicketCode(
                        selectedTicket.code
                      )}
                    </span>

                    <span>/</span>

                    <span>
                      {
                        CATEGORY_LABELS[
                          selectedTicket.category
                        ] ||
                        selectedTicket.category ||
                        'Geral'
                      }
                    </span>

                    <span
                      className={`ticket-status ticket-status--${selectedTicket.status}`}
                    >
                      {
                        STATUS_LABELS[
                          selectedTicket.status
                        ]
                      }
                    </span>
                  </div>

                  <h2>
                    {selectedTicket.subject ||
                      selectedTicket.title ||
                      'Chamado sem título'}
                  </h2>

                  <p>
                    Aberto por{' '}
                    <strong>
                      {selectedRequester.name}
                    </strong>{' '}
                    em{' '}
                    {formatCompactDate(
                      selectedTicket.createdAt
                    )}
                  </p>
                </div>

                <div
                  className={`ticket-document__sla ticket-document__sla--${sla.state}`}
                >
                  <span>SLA</span>

                  <strong>
                    {selectedTicket.status ===
                    'resolved'
                      ? 'Concluído'
                      : formatSlaRemaining(
                          sla.remainingMs
                        )}
                  </strong>

                  <small>
                    {
                      PRIORITY_LABELS[
                        selectedTicket.priority
                      ]
                    }{' '}
                    prioridade
                  </small>
                </div>
              </header>

              <div className="ticket-document__meta">
                <div>
                  <span>Solicitante</span>
                  <strong>
                    {selectedRequester.name}
                  </strong>
                </div>

                <div>
                  <span>Departamento</span>
                  <strong>
                    {selectedRequester.department}
                  </strong>
                </div>

                <div>
                  <span>Responsável</span>
                  <strong>
                    {selectedAssignee?.name ||
                      'Não atribuído'}
                  </strong>
                </div>

                <button
                  type="button"
                  className="ticket-document__details"
                  onClick={() =>
                    setDetailsOpen(
                      (current) => !current
                    )
                  }
                >
                  <Icon name="info" size={14} />

                  {detailsOpen
                    ? 'Ocultar detalhes'
                    : 'Detalhes'}
                </button>
              </div>

              {detailsOpen && (
                <div className="ticket-details">
                  <div>
                    <span>E-mail</span>
                    <strong>
                      {selectedRequester.email ||
                        'Não informado'}
                    </strong>
                  </div>

                  <div>
                    <span>Categoria</span>
                    <strong>
                      {
                        CATEGORY_LABELS[
                          selectedTicket.category
                        ]
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Criado em</span>
                    <strong>
                      {formatCompactDate(
                        selectedTicket.createdAt
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Última atualização</span>
                    <strong>
                      {formatCompactDate(
                        selectedTicket.updatedAt
                      )}
                    </strong>
                  </div>
                </div>
              )}

              <div className="ticket-document__body">
                <section className="conversation-panel">
                  <div className="conversation-heading">
                    <span>Registro do atendimento</span>

                    <b>
                      {
                        (selectedTicket.replies
                          ?.length || 0) +
                        (selectedTicket
                          .internalNotes?.length ||
                          0) +
                        1
                      }{' '}
                      eventos
                    </b>
                  </div>

                  <div className="conversation-timeline">
                    <TicketMessage
                      type="requester"
                      author={selectedRequester.name}
                      role="Solicitante"
                      message={getTicketDescription(
                        selectedTicket
                      )}
                      createdAt={
                        selectedTicket.createdAt
                      }
                    />

                    {[
                      ...(selectedTicket.replies ||
                        []).map((reply) => ({
                        ...reply,
                        timelineType: 'support',
                        role: 'Suporte',
                      })),

                      ...(selectedTicket.internalNotes ||
                        []).map((note) => ({
                        ...note,
                        timelineType: 'note',
                        role: 'Nota interna',
                      })),
                    ]
                      .sort(
                        (a, b) =>
                          new Date(a.createdAt) -
                          new Date(b.createdAt)
                      )
                      .map((item) => (
                        <TicketMessage
                          key={item.id}
                          type={
                            item.timelineType
                          }
                          author={
                            item.author ||
                            'Equipe LTHS'
                          }
                          role={item.role}
                          message={item.message}
                          createdAt={
                            item.createdAt
                          }
                        />
                      ))}
                  </div>

                  {selectedTicket.status ===
                  'resolved' ? (
                    <div className="reply-composer reply-composer--resolved">
                      <div className="reply-composer__resolved">
                        <span>
                          Chamado encerrado
                        </span>

                        <strong>
                          O atendimento foi
                          concluído.
                        </strong>

                        <button
                          type="button"
                          className="secondary-action"
                          onClick={handleReopen}
                        >
                          Reabrir chamado
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form
                      className="reply-composer"
                      onSubmit={
                        handleComposerSubmit
                      }
                    >
                      <div className="composer-tabs">
                        <button
                          type="button"
                          className={
                            composerMode ===
                            'reply'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            setComposerMode(
                              'reply'
                            )
                          }
                        >
                          Resposta pública
                        </button>

                        <button
                          type="button"
                          className={
                            composerMode ===
                            'note'
                              ? 'is-active'
                              : ''
                          }
                          onClick={() =>
                            setComposerMode(
                              'note'
                            )
                          }
                        >
                          Nota interna
                        </button>
                      </div>

                      <textarea
                        value={replyText}
                        onChange={(event) =>
                          setReplyText(
                            event.target.value
                          )
                        }
                        placeholder={
                          composerMode ===
                          'reply'
                            ? 'Escreva uma resposta para o solicitante...'
                            : 'Registre uma observação interna para a equipe...'
                        }
                      />

                      <footer className="reply-composer__footer">
                        <span>
                          {composerMode ===
                          'reply'
                            ? 'Visível ao solicitante'
                            : 'Visível apenas à equipe'}
                        </span>

                        <button
                          className="primary-action"
                          type="submit"
                          disabled={
                            !replyText.trim()
                          }
                        >
                          {composerMode ===
                          'reply'
                            ? 'Enviar resposta'
                            : 'Adicionar nota'}

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </button>
                      </footer>
                    </form>
                  )}
                </section>
              </div>
            </section>

            <section className="operations-bar">
              <label className="operations-bar__field">
                <span>Responsável</span>

                <select
                  value={
                    selectedTicket.assigneeId ||
                    ''
                  }
                  onChange={
                    handleAssigneeChange
                  }
                >
                  <option value="">
                    Não atribuído
                  </option>

                  {team.map((member) => (
                    <option
                      key={member.id}
                      value={member.id}
                    >
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="operations-bar__field">
                <span>Prioridade</span>

                <select
                  value={
                    selectedTicket.priority
                  }
                  onChange={
                    handlePriorityChange
                  }
                >
                  <option value="high">
                    Alta · SLA 2h
                  </option>

                  <option value="medium">
                    Média · SLA 8h
                  </option>

                  <option value="low">
                    Baixa · SLA 24h
                  </option>
                </select>
              </label>

              <div
                className={`operations-bar__sla operations-bar__sla--${sla.state}`}
              >
                <span>SLA operacional</span>

                <strong>
                  {selectedTicket.status ===
                  'resolved'
                    ? 'Resolvido'
                    : formatSlaRemaining(
                        sla.remainingMs
                      )}
                </strong>
              </div>

              <div className="operations-bar__actions">
                {selectedTicket.status ===
                'resolved' ? (
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={handleReopen}
                  >
                    Reabrir
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={handleWaiting}
                      disabled={
                        selectedTicket.status ===
                        'waiting'
                      }
                    >
                      {selectedTicket.status ===
                      'waiting'
                        ? 'Aguardando'
                        : 'Aguardar'}
                    </button>

                    <button
                      type="button"
                      className="primary-action"
                      onClick={handleResolve}
                    >
                      <Icon
                        name="check"
                        size={15}
                      />
                      Resolver
                    </button>
                  </>
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="workspace-empty">
            <Icon
              name="inbox"
              size={26}
            />

            <h2>
              Nenhum chamado selecionado
            </h2>

            <p>
              Selecione um item da fila para
              iniciar o atendimento.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App