import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { useServiceDesk } from './context/ServiceDeskContext.jsx'
import {
  formatCompactDate,
  formatTicketCode,
  formatDateTime,
} from './utils/formatters.js'
import {
  formatSlaRemaining,
  getRemainingMs,
  getSlaHours,
  getSlaState,
} from './services/ticketService.js'
import {
  getTeamMetrics,
} from './utils/teamMetrics.js'

const STATUS_LABELS = {
  new: 'A fazer',
  in_progress: 'Atendendo',
  waiting: 'Pausado',
  resolved: 'Finalizado',
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

const BOARD_COLUMNS = [
  {
    id: 'new',
    title: 'A FAZER',
    icon: 'flag',
    tone: 'todo',
  },
  {
    id: 'in_progress',
    title: 'ATENDENDO',
    icon: 'play',
    tone: 'progress',
  },
  {
    id: 'waiting',
    title: 'PAUSADO',
    icon: 'pause',
    tone: 'waiting',
  },
  {
    id: 'resolved',
    title: 'FINALIZADO',
    icon: 'check',
    tone: 'done',
  },
]

const DRAG_TRANSITIONS = {
  new: ['in_progress', 'resolved'],
  in_progress: ['waiting', 'resolved'],
  waiting: ['in_progress', 'resolved'],
  resolved: ['in_progress'],
}

const EMPTY_FORM = {
  requesterName: '',
  requesterEmail: '',
  department: '',
  subject: '',
  category: 'general',
  description: '',
  priority: 'medium',
  assigneeId: '',
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
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m16 16 4 4" />
      </>
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
    ),

    check: (
      <path d="m5 12 4 4L19 6" />
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),

    user: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.5 20c.7-4.1 3-6.2 6.5-6.2s5.8 2.1 6.5 6.2" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8.5" r="3" />
        <path d="M3.5 19c.6-3.6 2.5-5.4 5.5-5.4s4.9 1.8 5.5 5.4" />
        <path d="M15.5 6.5a2.6 2.6 0 0 1 0 5.1M17 14c2 .5 3.2 2.1 3.5 4.7" />
      </>
    ),

    chart: (
      <>
        <path d="M5 20V10M12 20V4M19 20v-7" />
        <path d="M3 20h18" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),

    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      </>
    ),

    moon: (
      <path d="M20.2 15.4A8 8 0 0 1 8.6 3.8 8.2 8.2 0 1 0 20.2 15.4Z" />
    ),

    close: (
      <path d="M6 6l12 12M18 6 6 18" />
    ),

    trash: (
      <>
        <path d="M4 7h16" />
        <path d="M9 7V4h6v3" />
        <path d="M7 7l1 13h8l1-13" />
        <path d="M10 11v5M14 11v5" />
      </>
    ),

    send: (
      <>
        <path d="m4 4 16 8-16 8 3-8-3-8Z" />
        <path d="M7 12h13" />
      </>
    ),

    flag: (
      <>
        <path d="M5 21V4" />
        <path d="M5 5h10l-1.8 3L15 11H5" />
      </>
    ),

    play: (
      <path d="m9 7 8 5-8 5V7Z" />
    ),

    pause: (
      <>
        <path d="M9 7v10M15 7v10" />
      </>
    ),

    bell: (
      <>
        <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7" />
        <path d="M10 20h4" />
      </>
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
      {icons[name] ?? icons.inbox}
    </svg>
  )
}

function getRequester(ticket) {
  const requester =
    ticket?.requester ?? {}

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

function getSlaLabel(state) {
  const labels = {
    healthy: 'Dentro do prazo',
    warning: 'Atenção',
    critical: 'Crítico',
    overdue: 'SLA vencido',
  }

  return (
    labels[state] ??
    'Em acompanhamento'
  )
}

function getInitials(name = '') {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) => part[0],
      )
      .join('')
      .toUpperCase() || 'LT'
  )
}

function getSlaProgress(
  ticket,
  now,
) {
  if (
    ticket?.status ===
    'resolved'
  ) {
    return 100
  }

  const total =
    getSlaHours(
      ticket?.priority,
    ) *
    60 *
    60 *
    1000

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return 0
  }

  const remaining =
    getRemainingMs(
      ticket,
      now,
    )

  if (remaining <= 0) {
    return 100
  }

  const elapsed =
    total - remaining

  return Math.max(
    3,
    Math.min(
      100,
      Math.round(
        (elapsed / total) * 100,
      ),
    ),
  )
}

function getMessageAuthor(
  item,
  fallback = 'Equipe LTHS',
) {
  return (
    item?.author ||
    item?.authorName ||
    fallback
  )
}

function canMoveTicket(
  ticket,
  nextStatus,
) {
  if (
    !ticket ||
    ticket.status ===
      nextStatus
  ) {
    return false
  }

  return (
    DRAG_TRANSITIONS[
      ticket.status
    ]?.includes(
      nextStatus,
    ) ?? false
  )
}

function TicketMessage({
  type,
  author,
  message,
  createdAt,
}) {
  return (
    <article
      className={`timeline-entry timeline-entry--${type}`}
    >
      <div className="timeline-entry__avatar">
        {getInitials(author)}
      </div>

      <div className="timeline-entry__content">
        <div className="timeline-entry__meta">
          <strong>
            {author}
          </strong>

          <span>
            {type === 'requester'
              ? 'Solicitante'
              : type === 'note'
                ? 'Nota interna'
                : 'Suporte'}
          </span>

          <time
            dateTime={
              createdAt ||
              undefined
            }
          >
            {formatCompactDate(
              createdAt,
            )}
          </time>
        </div>

        <p>{message}</p>
      </div>
    </article>
  )
}

function Dashboard({
  tickets,
  team,
  now,
  onOpenTicket,
}) {
  const metrics =
    useMemo(() => {
      const open =
        tickets.filter(
          (ticket) =>
            ticket.status !==
            'resolved',
        )

      const overdue =
        open.filter(
          (ticket) =>
            getSlaState(
              ticket,
              now,
            ) ===
            'overdue',
        )

      return {
        total: tickets.length,

        open: open.length,

        inProgress:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              'in_progress',
          ).length,

        waiting:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              'waiting',
          ).length,

        resolved:
          tickets.filter(
            (ticket) =>
              ticket.status ===
              'resolved',
          ).length,

        overdue:
          overdue.length,
      }
    }, [
      now,
      tickets,
    ])

  const priorityData =
    useMemo(() => {
      const total =
        tickets.length || 1

      return [
        {
          id: 'high',
          label: 'Alta',
          count:
            tickets.filter(
              (ticket) =>
                ticket.priority ===
                'high',
            ).length,
        },
        {
          id: 'medium',
          label: 'Média',
          count:
            tickets.filter(
              (ticket) =>
                ticket.priority ===
                'medium',
            ).length,
        },
        {
          id: 'low',
          label: 'Baixa',
          count:
            tickets.filter(
              (ticket) =>
                ticket.priority ===
                'low',
            ).length,
        },
      ].map(
        (item) => ({
          ...item,

          percentage:
            Math.round(
              (
                item.count /
                total
              ) *
                100,
            ),
        }),
      )
    }, [tickets])

  const statusData =
    useMemo(
      () =>
        BOARD_COLUMNS.map(
          (column) => ({
            id: column.id,

            label:
              STATUS_LABELS[
                column.id
              ],

            count:
              tickets.filter(
                (ticket) =>
                  ticket.status ===
                  column.id,
              ).length,
          }),
        ),
      [tickets],
    )

  const attentionTickets =
    useMemo(() => {
      const score = (
        ticket,
      ) => {
        const slaState =
          getSlaState(
            ticket,
            now,
          )

        if (
          slaState ===
          'overdue'
        ) {
          return 100
        }

        if (
          slaState ===
          'critical'
        ) {
          return 80
        }

        if (
          ticket.priority ===
          'high'
        ) {
          return 60
        }

        if (
          slaState ===
          'warning'
        ) {
          return 40
        }

        return 0
      }

      return tickets
        .filter(
          (ticket) =>
            ticket.status !==
              'resolved' &&
            score(ticket) >
              0,
        )
        .sort(
          (a, b) =>
            score(b) -
              score(a) ||
            new Date(
              a.slaDeadline,
            ).getTime() -
              new Date(
                b.slaDeadline,
              ).getTime(),
        )
        .slice(0, 5)
    }, [
      now,
      tickets,
    ])

  const teamData =
    useMemo(
      () =>
        getTeamMetrics(
          team,
          tickets,
          now,
        ),
      [
        now,
        team,
        tickets,
      ],
    )

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span>
            CENTRAL DE
            ATENDIMENTO
          </span>

          <h1>
            Visão geral
          </h1>

          <p>
            Acompanhe os
            principais indicadores
            da operação de suporte.
          </p>
        </div>

        <div className="dashboard-heading__status">
          <span className="dashboard-live-dot" />

          Dados atualizados
          automaticamente
        </div>
      </div>

      <section className="dashboard-stats">
        <article className="dashboard-stat">
          <div className="dashboard-stat__icon">
            <Icon name="inbox" />
          </div>

          <div>
            <span>
              Total de tickets
            </span>

            <strong>
              {metrics.total}
            </strong>

            <small>
              Todos os chamados
            </small>
          </div>
        </article>

        <article className="dashboard-stat">
          <div className="dashboard-stat__icon">
            <Icon name="flag" />
          </div>

          <div>
            <span>
              Em aberto
            </span>

            <strong>
              {metrics.open}
            </strong>

            <small>
              Aguardando conclusão
            </small>
          </div>
        </article>

        <article className="dashboard-stat">
          <div className="dashboard-stat__icon">
            <Icon name="play" />
          </div>

          <div>
            <span>
              Em atendimento
            </span>

            <strong>
              {metrics.inProgress}
            </strong>

            <small>
              Em andamento
            </small>
          </div>
        </article>

        <article className="dashboard-stat">
          <div className="dashboard-stat__icon">
            <Icon name="pause" />
          </div>

          <div>
            <span>
              Pausados
            </span>

            <strong>
              {metrics.waiting}
            </strong>

            <small>
              SLA congelado
            </small>
          </div>
        </article>

        <article className="dashboard-stat">
          <div className="dashboard-stat__icon">
            <Icon name="check" />
          </div>

          <div>
            <span>
              Finalizados
            </span>

            <strong>
              {metrics.resolved}
            </strong>

            <small>
              Chamados concluídos
            </small>
          </div>
        </article>

        <article
          className={`dashboard-stat ${
            metrics.overdue >
            0
              ? 'dashboard-stat--danger'
              : ''
          }`}
        >
          <div className="dashboard-stat__icon">
            <Icon name="clock" />
          </div>

          <div>
            <span>
              SLA vencido
            </span>

            <strong>
              {metrics.overdue}
            </strong>

            <small>
              Exigem atenção
            </small>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <header className="dashboard-card__header">
            <div>
              <span>
                PRIORIDADES
              </span>

              <h2>
                Distribuição
              </h2>
            </div>

            <strong>
              {tickets.length}
            </strong>
          </header>

          <div className="dashboard-priority-list">
            {priorityData.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="dashboard-priority"
                >
                  <div className="dashboard-priority__top">
                    <span>
                      {
                        item.label
                      }
                    </span>

                    <strong>
                      {
                        item.count
                      }
                    </strong>
                  </div>

                  <div className="dashboard-priority__track">
                    <span
                      data-priority={
                        item.id
                      }
                      style={{
                        width:
                          `${item.percentage}%`,
                      }}
                    />
                  </div>

                  <small>
                    {
                      item.percentage
                    }
                    % do total
                  </small>
                </div>
              ),
            )}
          </div>
        </article>

        <article className="dashboard-card">
          <header className="dashboard-card__header">
            <div>
              <span>
                FLUXO
              </span>

              <h2>
                Tickets por status
              </h2>
            </div>
          </header>

          <div className="dashboard-status-list">
            {statusData.map(
              (item) => (
                <div
                  key={
                    item.id
                  }
                  className="dashboard-status"
                  data-status={
                    item.id
                  }
                >
                  <span className="dashboard-status__dot" />

                  <div>
                    <span>
                      {
                        item.label
                      }
                    </span>

                    <small>
                      Chamados nesta
                      etapa
                    </small>
                  </div>

                  <strong>
                    {
                      item.count
                    }
                  </strong>
                </div>
              ),
            )}
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--wide">
        <article className="dashboard-card dashboard-card--attention">
          <header className="dashboard-card__header">
            <div>
              <span>
                MONITORAMENTO
              </span>

              <h2>
                Tickets que exigem
                atenção
              </h2>
            </div>

            <span className="dashboard-card__badge">
              {
                attentionTickets.length
              }
            </span>
          </header>

          {attentionTickets.length ? (
            <div className="attention-list">
              {attentionTickets.map(
                (ticket) => {
                  const requester =
                    getRequester(
                      ticket,
                    )

                  const state =
                    getSlaState(
                      ticket,
                      now,
                    )

                  const remaining =
                    getRemainingMs(
                      ticket,
                      now,
                    )

                  return (
                    <button
                      key={
                        ticket.id
                      }
                      type="button"
                      className="attention-ticket"
                      data-sla={
                        state
                      }
                      onClick={() =>
                        onOpenTicket(
                          ticket.id,
                        )
                      }
                    >
                      <div className="attention-ticket__main">
                        <span>
                          {formatTicketCode(
                            ticket.code,
                          )}
                        </span>

                        <strong>
                          {
                            ticket.subject
                          }
                        </strong>

                        <small>
                          {
                            requester.name
                          }{' '}
                          ·{' '}
                          {
                            requester.department
                          }
                        </small>
                      </div>

                      <div className="attention-ticket__meta">
                        <span
                          className={`priority-pill priority-pill--${ticket.priority}`}
                        >
                          {
                            PRIORITY_LABELS[
                              ticket
                                .priority
                            ]
                          }
                        </span>

                        <strong>
                          {getSlaLabel(
                            state,
                          )}
                        </strong>

                        <small>
                          {formatSlaRemaining(
                            remaining,
                          )}
                        </small>
                      </div>
                    </button>
                  )
                },
              )}
            </div>
          ) : (
            <div className="dashboard-empty">
              <Icon name="check" />

              <strong>
                Nenhum ticket
                crítico
              </strong>

              <span>
                Não há chamados que
                exijam atenção
                imediata.
              </span>
            </div>
          )}
        </article>

        <article className="dashboard-card">
          <header className="dashboard-card__header">
            <div>
              <span>
                EQUIPE
              </span>

              <h2>
                Carga atual
              </h2>
            </div>
          </header>

          <div className="team-summary">
            {teamData.map(
              (member) => (
                <div
                  key={
                    member.id
                  }
                  className="team-summary__item"
                >
                  <span className="avatar">
                    {member.initials ||
                      getInitials(
                        member.name,
                      )}
                  </span>

                  <div className="team-summary__identity">
                    <strong>
                      {
                        member.name
                      }
                    </strong>

                    <small>
                      {
                        member.role
                      }
                    </small>
                  </div>

                  <div className="team-summary__count">
                    <strong>
                      {
                        member.openTickets
                      }
                    </strong>

                    <span>
                      abertos
                    </span>
                  </div>

                  {member.overdueTickets >
                    0 && (
                    <span className="team-summary__alert">
                      {
                        member.overdueTickets
                      }{' '}
                      vencido
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
        </article>
      </section>
    </main>
  )
}

function TeamPage({
  team,
  tickets,
  now,
  onOpenTicket,
}) {
  const members =
    useMemo(
      () =>
        getTeamMetrics(
          team,
          tickets,
          now,
        ),
      [
        now,
        team,
        tickets,
      ],
    )

  const totalOpen =
    members.reduce(
      (
        total,
        member,
      ) =>
        total +
        member.openTickets,
      0,
    )

  const totalOverdue =
    members.reduce(
      (
        total,
        member,
      ) =>
        total +
        member.overdueTickets,
      0,
    )

  const totalHigh =
    members.reduce(
      (
        total,
        member,
      ) =>
        total +
        member.highPriorityTickets,
      0,
    )

  return (
    <main className="team-page">
      <div className="team-page__heading">
        <div>
          <span>
            CENTRAL DE
            ATENDIMENTO
          </span>

          <h1>
            Equipe
          </h1>

          <p>
            Acompanhe a distribuição
            dos chamados entre os
            responsáveis.
          </p>
        </div>

        <div className="team-page__summary">
          <span>
            <strong>
              {members.length}
            </strong>{' '}
            integrantes
          </span>

          <span>
            <strong>
              {totalOpen}
            </strong>{' '}
            tickets abertos
          </span>

          <span>
            <strong>
              {totalOverdue}
            </strong>{' '}
            vencidos
          </span>
        </div>
      </div>

      <section className="team-metrics">
        <article className="team-metric">
          <span>
            Integrantes
          </span>

          <strong>
            {members.length}
          </strong>

          <small>
            Equipe cadastrada
          </small>
        </article>

        <article className="team-metric">
          <span>
            Chamados abertos
          </span>

          <strong>
            {totalOpen}
          </strong>

          <small>
            Distribuídos na equipe
          </small>
        </article>

        <article className="team-metric">
          <span>
            Alta prioridade
          </span>

          <strong>
            {totalHigh}
          </strong>

          <small>
            Em acompanhamento
          </small>
        </article>

        <article
          className={`team-metric ${
            totalOverdue >
            0
              ? 'team-metric--danger'
              : ''
          }`}
        >
          <span>
            SLA vencido
          </span>

          <strong>
            {totalOverdue}
          </strong>

          <small>
            Exigem atenção
          </small>
        </article>
      </section>

      <section className="team-members-grid">
        {members.map(
          (member) => (
            <article
              key={
                member.id
              }
              className="team-member-card"
            >
              <header className="team-member-card__header">
                <div className="team-member-card__avatar">
                  {member.initials ||
                    getInitials(
                      member.name,
                    )}
                </div>

                <div className="team-member-card__identity">
                  <div className="team-member-card__name">
                    <h2>
                      {
                        member.name
                      }
                    </h2>

                    <span
                      className={`team-member-status team-member-status--${member.status}`}
                    >
                      {
                        member.status ===
                        'online'
                          ? 'Online'
                          : 'Offline'
                      }
                    </span>
                  </div>

                  <p>
                    {
                      member.role
                    }
                  </p>

                  <small>
                    {
                      member.specialty
                    }
                  </small>
                </div>
              </header>

              <div className="team-member-card__stats">
                <div>
                  <strong>
                    {
                      member.openTickets
                    }
                  </strong>

                  <span>
                    Abertos
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      member.inProgressTickets
                    }
                  </strong>

                  <span>
                    Atendendo
                  </span>
                </div>

                <div>
                  <strong>
                    {
                      member.pausedTickets
                    }
                  </strong>

                  <span>
                    Pausados
                  </span>
                </div>

                <div
                  className={
                    member.overdueTickets >
                    0
                      ? 'is-danger'
                      : ''
                  }
                >
                  <strong>
                    {
                      member.overdueTickets
                    }
                  </strong>

                  <span>
                    Vencidos
                  </span>
                </div>
              </div>

              <section className="team-member-tickets">
                <header>
                  <div>
                    <span>
                      CHAMADOS
                    </span>

                    <strong>
                      Tickets atribuídos
                    </strong>
                  </div>

                  <span>
                    {
                      member.openTickets
                    }
                  </span>
                </header>

                {member.tickets.length ? (
                  <div className="team-member-ticket-list">
                    {member.tickets.map(
                      (ticket) => {
                        const requester =
                          getRequester(
                            ticket,
                          )

                        const slaState =
                          getSlaState(
                            ticket,
                            now,
                          )

                        const remaining =
                          getRemainingMs(
                            ticket,
                            now,
                          )

                        return (
                          <button
                            key={
                              ticket.id
                            }
                            type="button"
                            className="team-member-ticket"
                            data-sla={
                              slaState
                            }
                            onClick={() =>
                              onOpenTicket(
                                ticket.id,
                              )
                            }
                          >
                            <div className="team-member-ticket__main">
                              <span>
                                {formatTicketCode(
                                  ticket.code,
                                )}
                              </span>

                              <strong>
                                {
                                  ticket.subject
                                }
                              </strong>

                              <small>
                                {
                                  requester.name
                                }{' '}
                                ·{' '}
                                {
                                  requester.department
                                }
                              </small>
                            </div>

                            <div className="team-member-ticket__meta">
                              <span
                                className={`priority-pill priority-pill--${ticket.priority}`}
                              >
                                {
                                  PRIORITY_LABELS[
                                    ticket
                                      .priority
                                  ]
                                }
                              </span>

                              <strong>
                                {
                                  STATUS_LABELS[
                                    ticket
                                      .status
                                  ]
                                }
                              </strong>

                              <small>
                                {formatSlaRemaining(
                                  remaining,
                                )}
                              </small>
                            </div>
                          </button>
                        )
                      },
                    )}
                  </div>
                ) : (
                  <div className="team-member-empty">
                    <Icon
                      name="check"
                      size={17}
                    />

                    <span>
                      Nenhum chamado
                      aberto atribuído.
                    </span>
                  </div>
                )}
              </section>
            </article>
          ),
        )}
      </section>
    </main>
  )
}

function NewTicketDrawer({
  open,
  form,
  team,
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) {
    return null
  }

  return (
    <div
      className="modal-layer"
      role="presentation"
    >
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Fechar criação de chamado"
        onClick={onClose}
      />

      <aside
        className="new-ticket-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
      >
        <header className="drawer-header">
          <div>
            <span>
              NOVO REGISTRO
            </span>

            <h2 id="new-ticket-title">
              Criar chamado
            </h2>

            <p>
              Registre a solicitação e
              envie diretamente para a
              fila.
            </p>
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Fechar"
          >
            <Icon name="close" />
          </button>
        </header>

        <form
          className="new-ticket-form"
          onSubmit={onSubmit}
        >
          <section className="form-section">
            <div className="form-section__title">
              <strong>
                Solicitante
              </strong>

              <small>
                Dados de quem abriu o
                chamado
              </small>
            </div>

            <label>
              <span>Nome *</span>

              <input
                autoFocus
                required
                name="requesterName"
                value={
                  form.requesterName
                }
                onChange={onChange}
                placeholder="Nome do solicitante"
              />
            </label>

            <div className="form-grid">
              <label>
                <span>E-mail *</span>

                <input
                  required
                  type="email"
                  name="requesterEmail"
                  value={
                    form.requesterEmail
                  }
                  onChange={onChange}
                  placeholder="nome@empresa.com"
                />
              </label>

              <label>
                <span>
                  Departamento
                </span>

                <input
                  name="department"
                  value={
                    form.department
                  }
                  onChange={onChange}
                  placeholder="Ex.: Financeiro"
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__title">
              <strong>
                Solicitação
              </strong>

              <small>
                Contexto necessário para
                o atendimento
              </small>
            </div>

            <label>
              <span>Assunto *</span>

              <input
                required
                name="subject"
                value={
                  form.subject
                }
                onChange={onChange}
                placeholder="Resumo curto do problema"
              />
            </label>

            <label>
              <span>Descrição *</span>

              <textarea
                required
                name="description"
                value={
                  form.description
                }
                onChange={onChange}
                rows="5"
                placeholder="Descreva o problema, impacto e contexto."
              />
            </label>

            <div className="form-grid">
              <label>
                <span>
                  Categoria *
                </span>

                <select
                  required
                  name="category"
                  value={
                    form.category
                  }
                  onChange={onChange}
                >
                  {Object.entries(
                    CATEGORY_LABELS,
                  ).map(
                    ([
                      value,
                      label,
                    ]) => (
                      <option
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {
                          label
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label>
                <span>
                  Responsável
                </span>

                <select
                  name="assigneeId"
                  value={
                    form.assigneeId
                  }
                  onChange={onChange}
                >
                  <option value="">
                    Sem atribuição
                  </option>

                  {team.map(
                    (member) => (
                      <option
                        key={
                          member.id
                        }
                        value={
                          member.id
                        }
                      >
                        {
                          member.name
                        }
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="form-section__title">
              <strong>
                Prioridade
              </strong>

              <small>
                O SLA é calculado
                automaticamente
              </small>
            </div>

            <div className="priority-grid">
              {[
                [
                  'high',
                  'Alta',
                  '2h',
                ],
                [
                  'medium',
                  'Média',
                  '8h',
                ],
                [
                  'low',
                  'Baixa',
                  '24h',
                ],
              ].map(
                ([
                  value,
                  label,
                  sla,
                ]) => (
                  <label
                    key={
                      value
                    }
                    className={`priority-option priority-option--${value} ${
                      form.priority ===
                      value
                        ? 'is-selected'
                        : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={
                        value
                      }
                      checked={
                        form.priority ===
                        value
                      }
                      onChange={
                        onChange
                      }
                    />

                    <span>
                      <strong>
                        {label}
                      </strong>

                      <small>
                        SLA {sla}
                      </small>
                    </span>
                  </label>
                ),
              )}
            </div>
          </section>

          <footer className="drawer-footer">
            <button
              type="button"
              className="button button--ghost"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button button--primary"
            >
              <Icon
                name="plus"
                size={16}
              />

              Criar chamado
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}

function ConfirmDeleteDialog({
  open,
  ticket,
  onCancel,
  onConfirm,
}) {
  if (
    !open ||
    !ticket
  ) {
    return null
  }

  return (
    <div
      className="confirm-overlay"
      role="presentation"
    >
      <button
        type="button"
        className="confirm-backdrop"
        aria-label="Cancelar exclusão"
        onClick={onCancel}
      />

      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-ticket-title"
        aria-describedby="delete-ticket-description"
      >
        <div
          className="confirm-dialog__icon"
          aria-hidden="true"
        >
          <Icon
            name="trash"
            size={20}
          />
        </div>

        <div className="confirm-dialog__content">
          <span>
            EXCLUSÃO PERMANENTE
          </span>

          <h2 id="delete-ticket-title">
            Excluir{' '}
            {formatTicketCode(
              ticket.code,
            )}
            ?
          </h2>

          <p id="delete-ticket-description">
            Esta ação removerá
            permanentemente o chamado e
            todo o seu histórico.
          </p>

          <strong>
            {ticket.subject}
          </strong>
        </div>

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="confirm-dialog__cancel"
            onClick={onCancel}
            autoFocus
          >
            Cancelar
          </button>

          <button
            type="button"
            className="confirm-dialog__danger"
            onClick={onConfirm}
          >
            <Icon
              name="trash"
              size={15}
            />

            Excluir ticket
          </button>
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const {
    tickets,
    team,
    preferences,
    createTicket,
    replyToTicket,
    addNoteToTicket,
    setTicketWaiting,
    resumeTicket,
    closeTicket,
    reopenResolvedTicket,
    setTicketPriority,
    setTicketAssignee,
    deleteTicket,
    setTheme,
  } = useServiceDesk()

  const [
    activeView,
    setActiveView,
  ] = useState(
    'tickets',
  )

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] = useState(
    () =>
      tickets[0]?.id ??
      null,
  )

  const [
    search,
    setSearch,
  ] = useState('')

  const [
    replyText,
    setReplyText,
  ] = useState('')

  const [
    composerMode,
    setComposerMode,
  ] = useState('reply')

  const [
    ticketPanelOpen,
    setTicketPanelOpen,
  ] = useState(false)

  const [
    newTicketOpen,
    setNewTicketOpen,
  ] = useState(false)

  const [
    newTicketForm,
    setNewTicketForm,
  ] = useState(
    EMPTY_FORM,
  )

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState(false)

  const [
    toast,
    setToast,
  ] = useState('')

  const [
    draggedTicketId,
    setDraggedTicketId,
  ] = useState(null)

  const [
    dragTargetStatus,
    setDragTargetStatus,
  ] = useState(null)

  const [
    slaNow,
    setSlaNow,
  ] = useState(
    () => new Date(),
  )

  const searchRef =
    useRef(null)

  const suppressCardClickRef =
    useRef(false)

  const logoPath =
    `${import.meta.env.BASE_URL}imagem/logo2026.png`

  const currentTheme =
    preferences?.theme ===
    'dark'
      ? 'dark'
      : 'light'

  useEffect(() => {
    document.documentElement.dataset.theme =
      currentTheme
  }, [currentTheme])

  useEffect(() => {
    const migrationKey =
      'lths-service-desk:kanban-light-default-v1'

    if (
      !window.localStorage.getItem(
        migrationKey,
      )
    ) {
      setTheme('light')

      window.localStorage.setItem(
        migrationKey,
        '1',
      )
    }
  }, [setTheme])

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setSlaNow(
            new Date(),
          )
        },
        60000,
      )

    return () =>
      window.clearInterval(
        timer,
      )
  }, [])

  useEffect(() => {
    if (!tickets.length) {
      setSelectedTicketId(null)
      return
    }

    if (
      !tickets.some(
        (ticket) =>
          ticket.id ===
          selectedTicketId,
      )
    ) {
      setSelectedTicketId(
        tickets[0].id,
      )
    }
  }, [
    selectedTicketId,
    tickets,
  ])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer =
      window.setTimeout(
        () =>
          setToast(''),
        3200,
      )

    return () =>
      window.clearTimeout(
        timer,
      )
  }, [toast])

  useEffect(() => {
    function handleKeyboard(
      event,
    ) {
      const key =
        event.key.toLowerCase()

      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        key === 'k'
      ) {
        event.preventDefault()

        setActiveView(
          'tickets',
        )

        window.setTimeout(
          () =>
            searchRef.current?.focus(),
          0,
        )
      }

      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        key === 'n'
      ) {
        event.preventDefault()

        setNewTicketOpen(
          true,
        )
      }

      if (
        event.key ===
        'Escape'
      ) {
        if (
          deleteConfirmation
        ) {
          setDeleteConfirmation(
            false,
          )
        } else if (
          newTicketOpen
        ) {
          setNewTicketOpen(
            false,
          )
        } else if (
          ticketPanelOpen
        ) {
          setTicketPanelOpen(
            false,
          )
        }
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyboard,
    )

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeyboard,
      )
  }, [
    deleteConfirmation,
    newTicketOpen,
    ticketPanelOpen,
  ])

  const selectedTicket =
    useMemo(
      () =>
        tickets.find(
          (ticket) =>
            ticket.id ===
            selectedTicketId,
        ) ??
        tickets[0] ??
        null,
      [
        selectedTicketId,
        tickets,
      ],
    )

  const boardTickets =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLocaleLowerCase(
            'pt-BR',
          )

      return tickets
        .filter(
          (ticket) => {
            if (!term) {
              return true
            }

            const requester =
              getRequester(
                ticket,
              )

            const assignee =
              team.find(
                (member) =>
                  member.id ===
                  ticket.assigneeId,
              )?.name ?? ''

            const haystack = [
              ticket.code,
              ticket.subject,
              getTicketDescription(
                ticket,
              ),
              requester.name,
              requester.email,
              requester.department,
              CATEGORY_LABELS[
                ticket.category
              ] ??
                ticket.category,
              PRIORITY_LABELS[
                ticket.priority
              ] ??
                ticket.priority,
              STATUS_LABELS[
                ticket.status
              ] ??
                ticket.status,
              assignee,
            ]
              .filter(Boolean)
              .join(' ')
              .toLocaleLowerCase(
                'pt-BR',
              )

            return haystack.includes(
              term,
            )
          },
        )
        .sort(
          (a, b) =>
            new Date(
              b.updatedAt ||
                b.createdAt,
            ).getTime() -
            new Date(
              a.updatedAt ||
                a.createdAt,
            ).getTime(),
        )
    }, [
      search,
      team,
      tickets,
    ])

  const selectedRequester =
    selectedTicket
      ? getRequester(
          selectedTicket,
        )
      : null

  const selectedAssignee =
    selectedTicket
      ? team.find(
          (member) =>
            member.id ===
            selectedTicket.assigneeId,
        )
      : null

  const selectedSlaState =
    selectedTicket
      ? getSlaState(
          selectedTicket,
          slaNow,
        )
      : 'healthy'

  const selectedSlaRemaining =
    selectedTicket
      ? getRemainingMs(
          selectedTicket,
          slaNow,
        )
      : 0

  function handleSelectTicket(
    ticketId,
  ) {
    if (
      suppressCardClickRef.current
    ) {
      return
    }

    setSelectedTicketId(
      ticketId,
    )

    setReplyText('')

    setComposerMode(
      'reply',
    )

    setDeleteConfirmation(
      false,
    )

    setTicketPanelOpen(
      true,
    )
  }

  function handleExternalTicketOpen(
    ticketId,
  ) {
    setActiveView(
      'tickets',
    )

    setSelectedTicketId(
      ticketId,
    )

    setReplyText('')

    setComposerMode(
      'reply',
    )

    setDeleteConfirmation(
      false,
    )

    setTicketPanelOpen(
      true,
    )
  }

  function handleComposerSubmit(
    event,
  ) {
    event.preventDefault()

    if (
      !selectedTicket ||
      !replyText.trim() ||
      selectedTicket.status ===
        'resolved'
    ) {
      return
    }

    if (
      composerMode ===
      'note'
    ) {
      addNoteToTicket(
        selectedTicket.id,
        replyText.trim(),
      )

      setToast(
        'Nota interna registrada.',
      )
    } else {
      replyToTicket(
        selectedTicket.id,
        replyText.trim(),
      )

      setToast(
        'Resposta registrada no chamado.',
      )
    }

    setReplyText('')
  }

  function handleComposerKeyDown(
    event,
  ) {
    if (
      (
        event.ctrlKey ||
        event.metaKey
      ) &&
      event.key ===
        'Enter' &&
      replyText.trim()
    ) {
      event.preventDefault()

      event.currentTarget.form?.requestSubmit()
    }
  }

  function handleResolve() {
    if (!selectedTicket) {
      return
    }

    closeTicket(
      selectedTicket.id,
    )

    setToast(
      `${formatTicketCode(
        selectedTicket.code,
      )} resolvido.`,
    )
  }

  function handleReopen() {
    if (!selectedTicket) {
      return
    }

    reopenResolvedTicket(
      selectedTicket.id,
    )

    setToast(
      `${formatTicketCode(
        selectedTicket.code,
      )} reaberto.`,
    )
  }

  function handleWaiting() {
    if (
      !selectedTicket ||
      selectedTicket.status ===
        'resolved' ||
      selectedTicket.status ===
        'waiting'
    ) {
      return
    }

    setTicketWaiting(
      selectedTicket.id,
    )

    setToast(
      'Chamado pausado.',
    )
  }

  function handleResume() {
    if (
      !selectedTicket ||
      selectedTicket.status !==
        'waiting'
    ) {
      return
    }

    resumeTicket(
      selectedTicket.id,
    )

    setToast(
      'Chamado retomado e movido para Atendendo.',
    )
  }

  function handlePriorityChange(
    event,
  ) {
    if (!selectedTicket) {
      return
    }

    setTicketPriority(
      selectedTicket.id,
      event.target.value,
    )

    setToast(
      'Prioridade e SLA atualizados.',
    )
  }

  function handleAssigneeChange(
    event,
  ) {
    if (!selectedTicket) {
      return
    }

    setTicketAssignee(
      selectedTicket.id,
      event.target.value ||
        null,
    )

    setToast(
      'Responsável atualizado.',
    )
  }

  function handleDeleteRequest() {
    if (!selectedTicket) {
      return
    }

    setDeleteConfirmation(
      true,
    )
  }

  function handleDeleteConfirm() {
    if (!selectedTicket) {
      return
    }

    const deletedId =
      selectedTicket.id

    const deletedCode =
      formatTicketCode(
        selectedTicket.code,
      )

    const nextTicket =
      tickets.find(
        (ticket) =>
          ticket.id !==
          deletedId,
      ) ?? null

    deleteTicket(
      deletedId,
    )

    setSelectedTicketId(
      nextTicket?.id ??
        null,
    )

    setDeleteConfirmation(
      false,
    )

    setTicketPanelOpen(
      false,
    )

    setReplyText('')

    setComposerMode(
      'reply',
    )

    setToast(
      `${deletedCode} excluído permanentemente.`,
    )
  }

  function handleThemeToggle() {
    setTheme(
      currentTheme ===
        'light'
        ? 'dark'
        : 'light',
    )
  }

  function handleNewTicketChange(
    event,
  ) {
    const {
      name,
      value,
    } = event.target

    setNewTicketForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    )
  }

  function handleNewTicketSubmit(
    event,
  ) {
    event.preventDefault()

    const ticket =
      createTicket({
        requesterName:
          newTicketForm.requesterName.trim(),

        requesterEmail:
          newTicketForm.requesterEmail.trim(),

        department:
          newTicketForm.department.trim(),

        subject:
          newTicketForm.subject.trim(),

        category:
          newTicketForm.category,

        description:
          newTicketForm.description.trim(),

        priority:
          newTicketForm.priority,

        assigneeId:
          newTicketForm.assigneeId ||
          null,
      })

    if (!ticket) {
      return
    }

    setSelectedTicketId(
      ticket.id,
    )

    setSearch('')

    setNewTicketForm(
      EMPTY_FORM,
    )

    setNewTicketOpen(
      false,
    )

    setActiveView(
      'tickets',
    )

    setTicketPanelOpen(
      true,
    )

    setToast(
      `${formatTicketCode(
        ticket.code,
      )} criado com sucesso.`,
    )
  }

  function handleDragStart(
    event,
    ticket,
  ) {
    suppressCardClickRef.current =
      true

    setDraggedTicketId(
      ticket.id,
    )

    setDragTargetStatus(
      null,
    )

    event.dataTransfer.effectAllowed =
      'move'

    event.dataTransfer.setData(
      'text/plain',
      ticket.id,
    )
  }

  function handleDragEnd() {
    setDraggedTicketId(
      null,
    )

    setDragTargetStatus(
      null,
    )

    window.setTimeout(
      () => {
        suppressCardClickRef.current =
          false
      },
      0,
    )
  }

  function handleDragOver(
    event,
    status,
  ) {
    const ticket =
      tickets.find(
        (item) =>
          item.id ===
          draggedTicketId,
      )

    if (
      !canMoveTicket(
        ticket,
        status,
      )
    ) {
      event.dataTransfer.dropEffect =
        'none'

      if (
        dragTargetStatus ===
        status
      ) {
        setDragTargetStatus(
          null,
        )
      }

      return
    }

    event.preventDefault()

    event.dataTransfer.dropEffect =
      'move'

    if (
      dragTargetStatus !==
      status
    ) {
      setDragTargetStatus(
        status,
      )
    }
  }

  function handleDrop(
    event,
    status,
  ) {
    event.preventDefault()

    const ticketId =
      draggedTicketId ||
      event.dataTransfer.getData(
        'text/plain',
      )

    const ticket =
      tickets.find(
        (item) =>
          item.id ===
          ticketId,
      )

    setDraggedTicketId(
      null,
    )

    setDragTargetStatus(
      null,
    )

    if (!ticket) {
      return
    }

    if (
      !canMoveTicket(
        ticket,
        status,
      )
    ) {
      if (
        ticket.status !==
        status
      ) {
        setToast(
          `Não é possível mover de ${STATUS_LABELS[ticket.status]} para ${STATUS_LABELS[status]}.`,
        )
      }

      return
    }

    if (
      status ===
      'in_progress'
    ) {
      if (
        ticket.status ===
        'resolved'
      ) {
        reopenResolvedTicket(
          ticket.id,
        )

        setToast(
          `${formatTicketCode(
            ticket.code,
          )} reaberto e movido para Atendendo.`,
        )
      } else {
        resumeTicket(
          ticket.id,
        )

        setToast(
          ticket.status ===
            'waiting'
            ? `${formatTicketCode(
                ticket.code,
              )} retomado.`
            : `${formatTicketCode(
                ticket.code,
              )} movido para Atendendo.`,
        )
      }

      return
    }

    if (
      status ===
      'waiting'
    ) {
      setTicketWaiting(
        ticket.id,
      )

      setToast(
        `${formatTicketCode(
          ticket.code,
        )} pausado.`,
      )

      return
    }

    if (
      status ===
      'resolved'
    ) {
      closeTicket(
        ticket.id,
      )

      setToast(
        `${formatTicketCode(
          ticket.code,
        )} finalizado.`,
      )
    }
  }

  const breadcrumbTitle =
    activeView ===
    'dashboard'
      ? 'Visão geral'
      : activeView ===
          'team'
        ? 'Equipe'
        : 'Tickets'

  const breadcrumbSubtitle =
    activeView ===
    'dashboard'
      ? 'Painel de atendimento'
      : activeView ===
          'team'
        ? 'Gestão da equipe'
        : 'Listagem de Tickets'

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
            className={
              activeView ===
              'dashboard'
                ? 'is-active'
                : ''
            }
            aria-label="Visão geral"
            onClick={() => {
              setActiveView(
                'dashboard',
              )

              setTicketPanelOpen(
                false,
              )
            }}
          >
            <Icon name="chart" />
          </button>

          <button
            type="button"
            className={
              activeView ===
              'tickets'
                ? 'is-active'
                : ''
            }
            aria-label="Tickets"
            onClick={() => {
              setActiveView(
                'tickets',
              )

              setTicketPanelOpen(
                false,
              )
            }}
          >
            <Icon name="inbox" />
          </button>

          <button
            type="button"
            aria-label="Novo ticket"
            onClick={() =>
              setNewTicketOpen(
                true,
              )
            }
          >
            <Icon name="plus" />
          </button>

          <button
            type="button"
            className={
              activeView ===
              'team'
                ? 'is-active'
                : ''
            }
            aria-label="Equipe"
            onClick={() => {
              setActiveView(
                'team',
              )

              setTicketPanelOpen(
                false,
              )
            }}
          >
            <Icon name="users" />
          </button>

          <button
            type="button"
            aria-label="Configurações"
          >
            <Icon name="settings" />
          </button>
        </nav>

        <button
          type="button"
          className="nav-rail__theme"
          aria-label={
            currentTheme ===
            'light'
              ? 'Ativar modo escuro'
              : 'Ativar modo claro'
          }
          onClick={
            handleThemeToggle
          }
        >
          <Icon
            name={
              currentTheme ===
              'light'
                ? 'moon'
                : 'sun'
            }
          />
        </button>
      </aside>

      <div className="app-content">
        <header className="topbar">
          <div className="topbar__breadcrumb">
            <strong>
              {
                breadcrumbTitle
              }
            </strong>

            <span>•</span>

            <span>
              {
                breadcrumbSubtitle
              }
            </span>
          </div>

          <div className="topbar__actions">
            {activeView ===
              'tickets' && (
              <label className="global-search">
                <Icon
                  name="search"
                  size={16}
                />

                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Buscar"
                  aria-label="Buscar tickets"
                />

                <kbd>
                  Ctrl K
                </kbd>
              </label>
            )}

            <button
              type="button"
              className="topbar-icon"
              aria-label="Notificações"
            >
              <Icon
                name="bell"
                size={17}
              />
            </button>

            <button
              type="button"
              className="topbar-icon"
              aria-label="Alternar tema"
              onClick={
                handleThemeToggle
              }
            >
              <Icon
                name={
                  currentTheme ===
                  'light'
                    ? 'moon'
                    : 'sun'
                }
                size={17}
              />
            </button>

            <button
              type="button"
              className="new-ticket-button"
              onClick={() =>
                setNewTicketOpen(
                  true,
                )
              }
            >
              <Icon
                name="plus"
                size={16}
              />

              Novo ticket
            </button>
          </div>
        </header>

        {activeView ===
        'dashboard' ? (
          <Dashboard
            tickets={
              tickets
            }
            team={team}
            now={slaNow}
            onOpenTicket={
              handleExternalTicketOpen
            }
          />
        ) : activeView ===
          'team' ? (
          <TeamPage
            team={team}
            tickets={
              tickets
            }
            now={slaNow}
            onOpenTicket={
              handleExternalTicketOpen
            }
          />
        ) : (
          <main className="kanban-page">
            <div className="kanban-page__heading">
              <div>
                <span>
                  CENTRAL DE
                  ATENDIMENTO
                </span>

                <h1>
                  Tickets
                </h1>

                <p>
                  Acompanhe os
                  chamados por etapa
                  de atendimento.
                </p>
              </div>

              <div className="kanban-summary">
                <span>
                  <strong>
                    {
                      tickets.length
                    }
                  </strong>{' '}
                  total
                </span>

                <span>
                  <strong>
                    {
                      tickets.filter(
                        (ticket) =>
                          ticket.status !==
                          'resolved',
                      ).length
                    }
                  </strong>{' '}
                  em aberto
                </span>
              </div>
            </div>

            <div
              className="kanban-board"
              aria-label="Quadro de tickets por status"
            >
              {BOARD_COLUMNS.map(
                (column) => {
                  const columnTickets =
                    boardTickets.filter(
                      (ticket) =>
                        ticket.status ===
                        column.id,
                    )

                  const isDropTarget =
                    dragTargetStatus ===
                    column.id

                  return (
                    <section
                      key={
                        column.id
                      }
                      className={`kanban-column ${
                        isDropTarget
                          ? 'is-drop-target'
                          : ''
                      }`}
                      data-tone={
                        column.tone
                      }
                      onDragOver={(
                        event,
                      ) =>
                        handleDragOver(
                          event,
                          column.id,
                        )
                      }
                      onDrop={(
                        event,
                      ) =>
                        handleDrop(
                          event,
                          column.id,
                        )
                      }
                      style={
                        isDropTarget
                          ? {
                              outline:
                                '2px dashed currentColor',
                              outlineOffset:
                                '-2px',
                            }
                          : undefined
                      }
                    >
                      <header className="kanban-column__header">
                        <div>
                          <span className="kanban-column__icon">
                            <Icon
                              name={
                                column.icon
                              }
                              size={
                                15
                              }
                            />
                          </span>

                          <strong>
                            {
                              column.title
                            }
                          </strong>
                        </div>

                        <span className="kanban-column__count">
                          {
                            columnTickets.length
                          }
                        </span>
                      </header>

                      <div className="kanban-column__body">
                        {columnTickets.map(
                          (
                            ticket,
                          ) => {
                            const requester =
                              getRequester(
                                ticket,
                              )

                            const assignee =
                              team.find(
                                (
                                  member,
                                ) =>
                                  member.id ===
                                  ticket.assigneeId,
                              )

                            const slaState =
                              getSlaState(
                                ticket,
                                slaNow,
                              )

                            const remaining =
                              getRemainingMs(
                                ticket,
                                slaNow,
                              )

                            const progress =
                              getSlaProgress(
                                ticket,
                                slaNow,
                              )

                            const isDragging =
                              draggedTicketId ===
                              ticket.id

                            return (
                              <button
                                key={
                                  ticket.id
                                }
                                type="button"
                                className={`ticket-card ${
                                  isDragging
                                    ? 'is-dragging'
                                    : ''
                                }`}
                                data-priority={
                                  ticket.priority
                                }
                                data-sla={
                                  slaState
                                }
                                draggable
                                onDragStart={(
                                  event,
                                ) =>
                                  handleDragStart(
                                    event,
                                    ticket,
                                  )
                                }
                                onDragEnd={
                                  handleDragEnd
                                }
                                onClick={() =>
                                  handleSelectTicket(
                                    ticket.id,
                                  )
                                }
                              >
                                <div className="ticket-card__top">
                                  <span className="ticket-code">
                                    {formatTicketCode(
                                      ticket.code,
                                    )}
                                  </span>
                                </div>

                                <span className="ticket-category">
                                  {CATEGORY_LABELS[
                                    ticket
                                      .category
                                  ] ??
                                    ticket.category}
                                </span>

                                <strong className="ticket-card__subject">
                                  {
                                    ticket.subject
                                  }
                                </strong>

                                <p className="ticket-card__requester">
                                  {
                                    requester.name
                                  }
                                </p>

                                <small className="ticket-card__department">
                                  {
                                    requester.department
                                  }
                                </small>

                                <div className="ticket-card__meta">
                                  <div className="ticket-assignee">
                                    <span className="avatar">
                                      {getInitials(
                                        assignee?.name ??
                                          'LTHS',
                                      )}
                                    </span>

                                    <span>
                                      {assignee?.name ??
                                        'Não atribuído'}
                                    </span>
                                  </div>

                                  <span
                                    className={`priority-pill priority-pill--${ticket.priority}`}
                                  >
                                    {
                                      PRIORITY_LABELS[
                                        ticket
                                          .priority
                                      ]
                                    }
                                  </span>

                                  <time>
                                    {formatCompactDate(
                                      ticket.updatedAt ||
                                        ticket.createdAt,
                                    )}
                                  </time>
                                </div>

                                <div className="ticket-card__sla">
                                  <div className="sla-track">
                                    <span
                                      style={{
                                        width:
                                          `${progress}%`,
                                      }}
                                    />
                                  </div>

                                  <div>
                                    <span>
                                      {ticket.status ===
                                      'resolved'
                                        ? 'Concluído'
                                        : getSlaLabel(
                                            slaState,
                                          )}
                                    </span>

                                    <strong>
                                      {ticket.status ===
                                      'resolved'
                                        ? 'Finalizado'
                                        : formatSlaRemaining(
                                            remaining,
                                          )}
                                    </strong>
                                  </div>
                                </div>
                              </button>
                            )
                          },
                        )}

                        {!columnTickets.length && (
                          <div className="column-empty">
                            <span>
                              Nenhum ticket
                              nesta etapa
                            </span>
                          </div>
                        )}
                      </div>
                    </section>
                  )
                },
              )}
            </div>
          </main>
        )}
      </div>

      {ticketPanelOpen &&
        selectedTicket && (
          <div
            className="modal-layer"
            role="presentation"
          >
            <button
              type="button"
              className="modal-backdrop"
              aria-label="Fechar detalhes do ticket"
              onClick={() =>
                setTicketPanelOpen(
                  false,
                )
              }
            />

            <aside
              className="ticket-detail-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ticket-detail-title"
            >
              <header className="drawer-header ticket-detail-drawer__header">
                <div>
                  <span>
                    {formatTicketCode(
                      selectedTicket.code,
                    )}{' '}
                    ·{' '}
                    {CATEGORY_LABELS[
                      selectedTicket
                        .category
                    ] ??
                      selectedTicket.category}
                  </span>

                  <h2 id="ticket-detail-title">
                    {
                      selectedTicket.subject
                    }
                  </h2>

                  <p>
                    {getTicketDescription(
                      selectedTicket,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  className="icon-button"
                  onClick={() =>
                    setTicketPanelOpen(
                      false,
                    )
                  }
                  aria-label="Fechar detalhes"
                >
                  <Icon name="close" />
                </button>
              </header>

              <div className="ticket-detail-scroll">
                <section className="detail-overview">
                  <div>
                    <span>
                      SOLICITANTE
                    </span>

                    <strong>
                      {
                        selectedRequester.name
                      }
                    </strong>

                    <small>
                      {selectedRequester.email ||
                        'Sem e-mail'}
                    </small>
                  </div>

                  <div>
                    <span>
                      DEPARTAMENTO
                    </span>

                    <strong>
                      {
                        selectedRequester.department
                      }
                    </strong>

                    <small>
                      {formatDateTime(
                        selectedTicket.createdAt,
                      )}
                    </small>
                  </div>

                  <div>
                    <span>
                      STATUS
                    </span>

                    <strong>
                      {
                        STATUS_LABELS[
                          selectedTicket
                            .status
                        ]
                      }
                    </strong>

                    <small>
                      Atualizado{' '}
                      {formatCompactDate(
                        selectedTicket.updatedAt,
                      )}
                    </small>
                  </div>

                  <div
                    data-sla={
                      selectedSlaState
                    }
                  >
                    <span>
                      SLA
                    </span>

                    <strong>
                      {selectedTicket.status ===
                      'resolved'
                        ? 'Finalizado'
                        : formatSlaRemaining(
                            selectedSlaRemaining,
                          )}
                    </strong>

                    <small>
                      {getSlaLabel(
                        selectedSlaState,
                      )}
                    </small>
                  </div>
                </section>

                <section className="detail-controls">
                  <label>
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
                      disabled={
                        selectedTicket.status ===
                        'resolved'
                      }
                    >
                      <option value="">
                        Não atribuído
                      </option>

                      {team.map(
                        (member) => (
                          <option
                            key={
                              member.id
                            }
                            value={
                              member.id
                            }
                          >
                            {
                              member.name
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
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
                      disabled={
                        selectedTicket.status ===
                        'resolved'
                      }
                    >
                      <option value="high">
                        Alta
                      </option>

                      <option value="medium">
                        Média
                      </option>

                      <option value="low">
                        Baixa
                      </option>
                    </select>
                  </label>
                </section>

                <section className="conversation-panel">
                  <header className="conversation-heading">
                    <div>
                      <span>
                        HISTÓRICO
                      </span>

                      <h3>
                        Atendimento
                      </h3>
                    </div>
                  </header>

                  <div className="conversation-timeline">
                    <TicketMessage
                      type="requester"
                      author={
                        selectedRequester.name
                      }
                      message={getTicketDescription(
                        selectedTicket,
                      )}
                      createdAt={
                        selectedTicket.createdAt
                      }
                    />

                    {(
                      selectedTicket.replies ??
                      []
                    ).map(
                      (reply) => (
                        <TicketMessage
                          key={
                            reply.id
                          }
                          type="reply"
                          author={getMessageAuthor(
                            reply,
                          )}
                          message={
                            reply.message
                          }
                          createdAt={
                            reply.createdAt
                          }
                        />
                      ),
                    )}

                    {(
                      selectedTicket.internalNotes ??
                      []
                    ).map(
                      (note) => (
                        <TicketMessage
                          key={
                            note.id
                          }
                          type="note"
                          author={getMessageAuthor(
                            note,
                          )}
                          message={
                            note.message
                          }
                          createdAt={
                            note.createdAt
                          }
                        />
                      ),
                    )}
                  </div>

                  {selectedTicket.status ===
                  'resolved' ? (
                    <div className="resolved-state">
                      <Icon name="check" />

                      <div>
                        <strong>
                          Chamado
                          finalizado
                        </strong>

                        <p>
                          Reabra o ticket
                          para registrar
                          uma nova
                          interação.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={
                          handleReopen
                        }
                      >
                        Reabrir
                      </button>
                    </div>
                  ) : (
                    <form
                      className="reply-composer"
                      onSubmit={
                        handleComposerSubmit
                      }
                    >
                      <div className="reply-composer__tabs">
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
                              'reply',
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
                              'note',
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
                          event,
                        ) =>
                          setReplyText(
                            event.target
                              .value,
                          )
                        }
                        onKeyDown={
                          handleComposerKeyDown
                        }
                        placeholder={
                          composerMode ===
                          'note'
                            ? 'Registre uma observação para a equipe...'
                            : 'Escreva uma resposta para o solicitante...'
                        }
                        rows="4"
                      />

                      <footer>
                        <span>
                          {composerMode ===
                          'note'
                            ? 'Somente a equipe verá esta nota.'
                            : 'A resposta ficará registrada no histórico.'}
                        </span>

                        <button
                          type="submit"
                          disabled={
                            !replyText.trim()
                          }
                        >
                          <Icon
                            name="send"
                            size={15}
                          />

                          {composerMode ===
                          'note'
                            ? 'Registrar nota'
                            : 'Enviar resposta'}
                        </button>
                      </footer>
                    </form>
                  )}
                </section>
              </div>

              <footer className="ticket-detail-actions">
                <div className="ticket-detail-assignee">
                  <span className="avatar">
                    {getInitials(
                      selectedAssignee?.name ??
                        'LTHS',
                    )}
                  </span>

                  <div>
                    <span>
                      Responsável
                    </span>

                    <strong>
                      {selectedAssignee?.name ??
                        'Não atribuído'}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  className="button button--danger"
                  onClick={
                    handleDeleteRequest
                  }
                >
                  <Icon
                    name="trash"
                    size={15}
                  />

                  Excluir
                </button>

                {selectedTicket.status ===
                'resolved' ? (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={
                      handleReopen
                    }
                  >
                    <Icon
                      name="play"
                      size={15}
                    />

                    Reabrir chamado
                  </button>
                ) : (
                  <div className="ticket-detail-actions__buttons">
                    {selectedTicket.status ===
                    'waiting' ? (
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={
                          handleResume
                        }
                      >
                        <Icon
                          name="play"
                          size={15}
                        />

                        Retomar
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={
                          handleWaiting
                        }
                      >
                        <Icon
                          name="pause"
                          size={15}
                        />

                        Pausar
                      </button>
                    )}

                    <button
                      type="button"
                      className="button button--success"
                      onClick={
                        handleResolve
                      }
                    >
                      <Icon
                        name="check"
                        size={15}
                      />

                      Finalizar
                    </button>
                  </div>
                )}
              </footer>
            </aside>
          </div>
        )}

      <ConfirmDeleteDialog
        open={
          deleteConfirmation
        }
        ticket={
          selectedTicket
        }
        onCancel={() =>
          setDeleteConfirmation(
            false,
          )
        }
        onConfirm={
          handleDeleteConfirm
        }
      />

      <NewTicketDrawer
        open={newTicketOpen}
        form={newTicketForm}
        team={team}
        onChange={
          handleNewTicketChange
        }
        onClose={() =>
          setNewTicketOpen(
            false,
          )
        }
        onSubmit={
          handleNewTicketSubmit
        }
      />

      {toast && (
        <div
          className="app-toast"
          role="status"
        >
          <Icon
            name="check"
            size={16}
          />

          <span>
            {toast}
          </span>

          <button
            type="button"
            onClick={() =>
              setToast('')
            }
            aria-label="Fechar aviso"
          >
            <Icon
              name="close"
              size={14}
            />
          </button>
        </div>
      )}
    </div>
  )
}