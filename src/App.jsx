import { useEffect, useMemo, useState } from 'react'

import './App.css'

import {
  useServiceDesk,
} from './context/ServiceDeskContext.jsx'

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

function Icon({
  name,
  size = 18,
}) {
  const icons = {
    inbox: (
      <>
        <path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
        <path d="M4 14h4l2 3h4l2-3h4" />
      </>
    ),

    search: (
      <>
        <circle
          cx="10.8"
          cy="10.8"
          r="6.3"
        />
        <path d="m16 16 4 4" />
      </>
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    check: (
      <path d="m5 12.5 4.2 4.2L19 7" />
    ),

    clock: (
      <>
        <circle
          cx="12"
          cy="12"
          r="8.5"
        />
        <path d="M12 7v5l3.2 2" />
      </>
    ),

    user: (
      <>
        <circle
          cx="12"
          cy="8"
          r="3.5"
        />
        <path d="M5 20c.8-4 3-6 7-6s6.2 2 7 6" />
      </>
    ),

    users: (
      <>
        <circle
          cx="9"
          cy="8"
          r="3"
        />
        <path d="M3.5 19c.6-3.5 2.5-5.3 5.5-5.3 3.1 0 5 1.8 5.6 5.3" />
        <path d="M15 6.2a2.7 2.7 0 0 1 0 5.2" />
        <path d="M16.2 14c2.3.4 3.7 2.1 4.3 5" />
      </>
    ),

    activity: (
      <path d="M3 12h4l2-6 4 12 2-6h6" />
    ),

    sun: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3.5"
        />
        <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2" />
        <path d="m5.3 5.3 1.4 1.4m10.6 10.6 1.4 1.4m0-13.4-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </>
    ),

    moon: (
      <path d="M20 15.4A8.2 8.2 0 0 1 8.6 4a8.3 8.3 0 1 0 11.4 11.4Z" />
    ),

    chevron: (
      <path d="m9 18 6-6-6-6" />
    ),
  }

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name] ?? icons.activity}
    </svg>
  )
}

export default function App() {
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

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState(
    () => tickets[0]?.id ?? null
  )

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    replyText,
    setReplyText,
  ] = useState('')

  const [
    composerMode,
    setComposerMode,
  ] = useState('reply')

  useEffect(() => {
    document.documentElement.dataset.theme =
      preferences.theme
  }, [preferences.theme])

  useEffect(() => {
    if (
      selectedTicketId &&
      tickets.some(
        (ticket) =>
          ticket.id ===
          selectedTicketId
      )
    ) {
      return
    }

    setSelectedTicketId(
      tickets[0]?.id ?? null
    )
  }, [
    tickets,
    selectedTicketId,
  ])

  const selectedTicket =
    useMemo(
      () =>
        tickets.find(
          (ticket) =>
            ticket.id ===
            selectedTicketId
        ) ??
        tickets[0] ??
        null,
      [
        tickets,
        selectedTicketId,
      ]
    )

  const filteredTickets =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLocaleLowerCase(
            'pt-BR'
          )

      return tickets.filter(
        (ticket) => {
          const matchesStatus =
            statusFilter ===
              'all' ||
            ticket.status ===
              statusFilter

          if (!matchesStatus) {
            return false
          }

          if (
            !normalizedSearch
          ) {
            return true
          }

          const searchableText = [
            ticket.code,
            ticket.subject,
            ticket.description,
            ticket.requester
              ?.name,
            ticket.requester
              ?.email,
            ticket.requester
              ?.department,
            ticket.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'pt-BR'
            )

          return searchableText.includes(
            normalizedSearch
          )
        }
      )
    }, [
      tickets,
      search,
      statusFilter,
    ])

  const highPriorityTickets =
    useMemo(
      () =>
        openTickets.filter(
          (ticket) =>
            ticket.priority ===
            'high'
        ),
      [openTickets]
    )

  const waitingTickets =
    useMemo(
      () =>
        tickets.filter(
          (ticket) =>
            ticket.status ===
            'waiting'
        ),
      [tickets]
    )

  const selectedSla =
    selectedTicket
      ? getSlaState(
          selectedTicket
        )
      : null

  const selectedAssignee =
    selectedTicket
      ? team.find(
          (member) =>
            member.id ===
            selectedTicket.assigneeId
        )
      : null

  function handleSelectTicket(
    ticketId
  ) {
    setSelectedTicketId(
      ticketId
    )

    setReplyText('')
  }

  function handleComposerSubmit(
    event
  ) {
    event.preventDefault()

    if (
      !selectedTicket ||
      !replyText.trim()
    ) {
      return
    }

    if (
      selectedTicket.status ===
      'resolved'
    ) {
      return
    }

    const data = {
      message:
        replyText.trim(),

      author:
        'Equipe LTHS',

      createdAt:
        new Date(),
    }

    if (
      composerMode === 'note'
    ) {
      addNoteToTicket(
        selectedTicket.id,
        data
      )
    } else {
      replyToTicket(
        selectedTicket.id,
        data
      )
    }

    setReplyText('')
  }

  function handleResolve() {
    if (!selectedTicket) {
      return
    }

    closeTicket(
      selectedTicket.id,
      {
        author:
          'Equipe LTHS',
      }
    )
  }

  function handleReopen() {
    if (!selectedTicket) {
      return
    }

    reopenResolvedTicket(
      selectedTicket.id,
      {
        author:
          'Equipe LTHS',
      }
    )
  }

  function handleWaiting() {
    if (!selectedTicket) {
      return
    }

    setTicketWaiting(
      selectedTicket.id,
      {
        author:
          'Equipe LTHS',
      }
    )
  }

  function handlePriorityChange(
    event
  ) {
    if (!selectedTicket) {
      return
    }

    setTicketPriority(
      selectedTicket.id,
      event.target.value,
      {
        author:
          'Equipe LTHS',
      }
    )
  }

  function handleAssigneeChange(
    event
  ) {
    if (!selectedTicket) {
      return
    }

    setTicketAssignee(
      selectedTicket.id,
      event.target.value ||
        null,
      {
        author:
          'Equipe LTHS',
      }
    )
  }

  function toggleTheme() {
    setTheme(
      preferences.theme ===
        'dark'
        ? 'light'
        : 'dark'
    )
  }

  const logoPath =
    `${import.meta.env.BASE_URL}imagem/logo2026.png`

  return (
    <div
      className="support-app"
      data-theme={
        preferences.theme
      }
    >
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
            aria-label="Equipe"
          >
            <Icon name="users" />
          </button>

          <button
            type="button"
            aria-label="Indicadores"
          >
            <Icon name="activity" />
          </button>
        </nav>

        <button
          type="button"
          className="nav-rail__help"
          onClick={
            toggleTheme
          }
          aria-label={
            preferences.theme ===
            'dark'
              ? 'Ativar tema claro'
              : 'Ativar tema escuro'
          }
        >
          <Icon
            name={
              preferences.theme ===
              'dark'
                ? 'sun'
                : 'moon'
            }
          />
        </button>
      </aside>

      <aside className="queue-panel">
        <header className="queue-panel__header">
          <div className="brand-lockup">
            <strong>
              Service Desk
            </strong>

            <span>
              <i />
              Operação online
            </span>
          </div>

          <button
            type="button"
            className="queue-create"
          >
            <Icon
              name="plus"
              size={16}
            />

            Novo
          </button>
        </header>

        <div className="queue-panel__title">
          <div>
            <span>
              CENTRAL DE SUPORTE
            </span>

            <h1>
              Chamados
            </h1>
          </div>

          <b>
            {
              openTickets.length
            }
          </b>
        </div>

        <label className="queue-search">
          <Icon
            name="search"
            size={17}
          />

          <input
            type="search"
            placeholder="Buscar chamados"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            aria-label="Buscar chamados"
          />
        </label>

        <div
          className="queue-filters"
          aria-label="Filtrar chamados"
        >
          <button
            type="button"
            className={
              statusFilter ===
              'all'
                ? 'is-selected'
                : ''
            }
            onClick={() =>
              setStatusFilter(
                'all'
              )
            }
          >
            Todos
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              'new'
                ? 'is-selected'
                : ''
            }
            onClick={() =>
              setStatusFilter(
                'new'
              )
            }
          >
            Novos
          </button>

          <button
            type="button"
            className={
              statusFilter ===
              'in_progress'
                ? 'is-selected'
                : ''
            }
            onClick={() =>
              setStatusFilter(
                'in_progress'
              )
            }
          >
            Em atendimento
          </button>
        </div>

        <div className="ticket-list">
          {filteredTickets.map(
            (ticket) => {
              const sla =
                getSlaState(
                  ticket
                )

              return (
                <button
                  type="button"
                  key={
                    ticket.id
                  }
                  className={`ticket-row ${
                    selectedTicket
                      ?.id ===
                    ticket.id
                      ? 'is-active'
                      : ''
                  }`}
                  onClick={() =>
                    handleSelectTicket(
                      ticket.id
                    )
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
                          ticket
                            .priority
                        ]
                      }
                    </span>
                  </div>

                  <strong className="ticket-row__subject">
                    {
                      ticket.subject
                    }
                  </strong>

                  <span className="ticket-row__requester">
                    {
                      ticket
                        .requester
                        ?.name
                    }
                  </span>

                  <div className="ticket-row__footer">
                    <span>
                      {
                        STATUS_LABELS[
                          ticket
                            .status
                        ]
                      }
                    </span>

                    {ticket.status !==
                      'resolved' && (
                      <span
                        className={`sla-text sla-text--${sla.state}`}
                      >
                        <Icon
                          name="clock"
                          size={13}
                        />

                        {formatSlaRemaining(
                          sla.remainingMs
                        )}
                      </span>
                    )}
                  </div>
                </button>
              )
            }
          )}

          {!filteredTickets
            .length && (
            <div className="empty-state">
              <strong>
                Nenhum chamado
                encontrado
              </strong>

              <span>
                Ajuste a busca
                ou os filtros.
              </span>
            </div>
          )}
        </div>
      </aside>

      <main className="ticket-workspace">
        {selectedTicket ? (
          <>
            <header className="ticket-header">
              <div className="ticket-header__main">
                <div className="ticket-header__eyebrow">
                  <span>
                    {formatTicketCode(
                      selectedTicket.code
                    )}
                  </span>

                  <span>
                    {
                      CATEGORY_LABELS[
                        selectedTicket
                          .category
                      ] ??
                      selectedTicket
                        .category
                    }
                  </span>

                  <span
                    className={`ticket-status ticket-status--${selectedTicket.status}`}
                  >
                    {
                      STATUS_LABELS[
                        selectedTicket
                          .status
                      ]
                    }
                  </span>
                </div>

                <h2>
                  {
                    selectedTicket.subject
                  }
                </h2>

                <p>
                  Aberto por{' '}
                  <strong>
                    {
                      selectedTicket
                        .requester
                        ?.name
                    }
                  </strong>{' '}
                  em{' '}
                  {formatCompactDate(
                    selectedTicket.createdAt
                  )}
                </p>
              </div>

              <div className="ticket-header__actions">
                {selectedTicket.status !==
                  'resolved' ? (
                  <>
                    <button
                      type="button"
                      className="secondary-action"
                      onClick={
                        handleWaiting
                      }
                    >
                      Aguardar
                    </button>

                    <button
                      type="button"
                      className="primary-action"
                      onClick={
                        handleResolve
                      }
                    >
                      <Icon
                        name="check"
                        size={16}
                      />

                      Resolver
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="primary-action"
                    onClick={
                      handleReopen
                    }
                  >
                    Reabrir
                  </button>
                )}
              </div>
            </header>

            <div className="ticket-layout">
              <section className="conversation-panel">
                <article className="message-card message-card--requester">
                  <div className="message-card__avatar">
                    {getInitials(
                      selectedTicket
                        .requester
                        ?.name
                    )}
                  </div>

                  <div className="message-card__content">
                    <header>
                      <div>
                        <strong>
                          {
                            selectedTicket
                              .requester
                              ?.name
                          }
                        </strong>

                        <span>
                          Solicitante
                        </span>
                      </div>

                      <time>
                        {formatCompactDate(
                          selectedTicket.createdAt
                        )}
                      </time>
                    </header>

                    <p>
                      {
                        selectedTicket.description
                      }
                    </p>
                  </div>
                </article>

                {(
                  selectedTicket.replies ??
                  []
                ).map(
                  (reply) => (
                    <article
                      className="message-card message-card--support"
                      key={
                        reply.id
                      }
                    >
                      <div className="message-card__avatar">
                        LT
                      </div>

                      <div className="message-card__content">
                        <header>
                          <div>
                            <strong>
                              {
                                reply.author
                              }
                            </strong>

                            <span>
                              Suporte
                            </span>
                          </div>

                          <time>
                            {formatCompactDate(
                              reply.createdAt
                            )}
                          </time>
                        </header>

                        <p>
                          {
                            reply.message
                          }
                        </p>
                      </div>
                    </article>
                  )
                )}

                {(
                  selectedTicket.internalNotes ??
                  []
                ).map(
                  (note) => (
                    <article
                      className="message-card message-card--note"
                      key={
                        note.id
                      }
                    >
                      <div className="message-card__avatar">
                        LT
                      </div>

                      <div className="message-card__content">
                        <header>
                          <div>
                            <strong>
                              {
                                note.author
                              }
                            </strong>

                            <span>
                              Nota
                              interna
                            </span>
                          </div>

                          <time>
                            {formatCompactDate(
                              note.createdAt
                            )}
                          </time>
                        </header>

                        <p>
                          {
                            note.message
                          }
                        </p>
                      </div>
                    </article>
                  )
                )}

                <form
                  className="reply-composer"
                  onSubmit={
                    handleComposerSubmit
                  }
                >
                  {selectedTicket.status ===
                  'resolved' ? (
                    <div className="reply-composer__resolved">
                      Este chamado
                      está resolvido.
                      Reabra o ticket
                      para registrar
                      uma nova
                      interação.
                    </div>
                  ) : (
                    <>
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
                          Resposta
                          pública
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
                        value={
                          replyText
                        }
                        onChange={(
                          event
                        ) =>
                          setReplyText(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder={
                          composerMode ===
                          'reply'
                            ? 'Escreva uma resposta para o solicitante...'
                            : 'Registre uma observação interna para a equipe...'
                        }
                      />

                      <div className="reply-composer__footer">
                        <span>
                          {composerMode ===
                          'reply'
                            ? 'Visível para o solicitante'
                            : 'Visível somente para a equipe'}
                        </span>

                        <button
                          type="submit"
                          className="primary-action"
                          disabled={
                            !replyText.trim()
                          }
                        >
                          {composerMode ===
                          'reply'
                            ? 'Enviar resposta'
                            : 'Adicionar nota'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </section>

              <aside className="context-panel">
                <section className="context-section">
                  <span className="context-section__label">
                    SOLICITANTE
                  </span>

                  <div className="requester-profile">
                    <div className="requester-profile__avatar">
                      {getInitials(
                        selectedTicket
                          .requester
                          ?.name
                      )}
                    </div>

                    <div>
                      <strong>
                        {
                          selectedTicket
                            .requester
                            ?.name
                        }
                      </strong>

                      <span>
                        {
                          selectedTicket
                            .requester
                            ?.email
                        }
                      </span>
                    </div>
                  </div>

                  <div className="context-field">
                    <span>
                      Departamento
                    </span>

                    <strong>
                      {selectedTicket
                        .requester
                        ?.department ||
                        'Não informado'}
                    </strong>
                  </div>
                </section>

                <section className="context-section">
                  <span className="context-section__label">
                    ATENDIMENTO
                  </span>

                  <label className="context-control">
                    <span>
                      Responsável
                    </span>

                    <select
                      value={
                        selectedTicket.assigneeId ??
                        ''
                      }
                      onChange={
                        handleAssigneeChange
                      }
                    >
                      <option value="">
                        Não atribuído
                      </option>

                      {team.map(
                        (member) => (
                          <option
                            value={
                              member.id
                            }
                            key={
                              member.id
                            }
                          >
                            {
                              member.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {selectedAssignee && (
                    <div className="assignee-summary">
                      <div>
                        {selectedAssignee.initials}
                      </div>

                      <span>
                        <strong>
                          {
                            selectedAssignee.name
                          }
                        </strong>

                        <small>
                          {
                            selectedAssignee.role
                          }
                        </small>
                      </span>
                    </div>
                  )}

                  <label className="context-control">
                    <span>
                      Prioridade
                    </span>

                    <select
                      value={
                        selectedTicket.priority
                      }
                      onChange={
                        handlePriorityChange
                      }
                    >
                      <option value="high">
                        Alta · SLA
                        2h
                      </option>

                      <option value="medium">
                        Média · SLA
                        8h
                      </option>

                      <option value="low">
                        Baixa · SLA
                        24h
                      </option>
                    </select>
                  </label>
                </section>

                <section className="context-section">
                  <span className="context-section__label">
                    SLA
                  </span>

                  <div
                    className={`sla-card sla-card--${selectedSla?.state}`}
                  >
                    <div className="sla-card__top">
                      <Icon
                        name="clock"
                        size={18}
                      />

                      <span>
                        {
                          PRIORITY_LABELS[
                            selectedTicket
                              .priority
                          ]
                        }
                      </span>
                    </div>

                    <strong>
                      {selectedTicket.status ===
                      'resolved'
                        ? 'Concluído'
                        : formatSlaRemaining(
                            selectedSla
                              ?.remainingMs
                          )}
                    </strong>

                    {selectedTicket.status !==
                      'resolved' && (
                      <div className="sla-progress">
                        <span
                          style={{
                            width: `${selectedSla?.percentage ?? 0}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : (
          <div className="workspace-empty">
            <Icon
              name="inbox"
              size={30}
            />

            <h2>
              Nenhum chamado
            </h2>

            <p>
              Ainda não existem
              chamados disponíveis.
            </p>
          </div>
        )}
      </main>

      <section
        className="service-summary"
        aria-label="Resumo da operação"
      >
        <div>
          <span>
            Chamados ativos
          </span>

          <strong>
            {openTickets.length}
          </strong>
        </div>

        <div>
          <span>
            Alta prioridade
          </span>

          <strong>
            {
              highPriorityTickets.length
            }
          </strong>
        </div>

        <div>
          <span>
            Aguardando
          </span>

          <strong>
            {
              waitingTickets.length
            }
          </strong>
        </div>

        <div>
          <span>
            Resolvidos
          </span>

          <strong>
            {
              resolvedTickets.length
            }
          </strong>
        </div>
      </section>
    </div>
  )
}