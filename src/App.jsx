import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import './legibilidade.css'

const priorities = {
  alto: {
    label: 'Alta',
    description: 'Impacto imediato',
    sla: '2h',
  },
  medio: {
    label: 'Média',
    description: 'Precisa de atenção',
    sla: '8h',
  },
  baixo: {
    label: 'Baixa',
    description: 'Pode ser programado',
    sla: '24h',
  },
}

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
}

const categoryLabels = {
  acesso: 'Acesso',
  sistema: 'Sistema',
  infraestrutura: 'Infraestrutura',
  financeiro: 'Financeiro',
  geral: 'Geral',
}

function normalizePriority(value) {
  return (
    priorityAliases[
      String(value || '')
        .trim()
        .toLocaleLowerCase('pt-BR')
    ] || 'medio'
  )
}

function normalizeStatus(value) {
  const status = String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR')

  return [
    'resolvido',
    'resolvida',
    'resolved',
    'fechado',
    'fechada',
    'closed',
  ].includes(status)
    ? 'resolvido'
    : 'aberto'
}

function Icon({ name, size = 18 }) {
  const icons = {
    inbox: (
      <>
        <path d="M4 4h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
        <path d="M4 14h4l2 3h4l2-3h4" />
      </>
    ),

    plus: (
      <path d="M12 5v14M5 12h14" />
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

    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </>
    ),

    mail: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="2"
        />

        <path d="m4 7 8 6 8-6" />
      </>
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

    arrow: (
      <path d="M5 12h14m-6-6 6 6-6 6" />
    ),

    check: (
      <path d="m5 12.5 4.2 4.2L19 7" />
    ),

    reopen: (
      <>
        <path d="M4 7v5h5" />
        <path d="M5.4 12a7.5 7.5 0 1 0 2.1-5.2L4 10" />
      </>
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

    bolt: (
      <path d="m13.5 2-8 11h6l-1 9 8-12h-6l1-8Z" />
    ),

    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20V7" />
      </>
    ),

    settings: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3"
        />

        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),

    chevron: (
      <path d="m9 18 6-6-6-6" />
    ),

    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
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
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  )
}

function getStoredTickets() {
  try {
    const saved =
      localStorage.getItem(
        'tickets',
      )

    const parsed =
      saved
        ? JSON.parse(saved)
        : []

    return Array.isArray(parsed)
      ? parsed.map(
          ticket => ({
            ...ticket,

            urgencia:
              normalizePriority(
                ticket?.urgencia,
              ),

            status:
              normalizeStatus(
                ticket?.status,
              ),

            replies:
              Array.isArray(
                ticket?.replies,
              )
                ? ticket.replies
                : [],

            categoria:
              ticket?.categoria ||
              'geral',

            assunto:
              ticket?.assunto ||
              '',
          }),
        )
      : []
  } catch {
    return []
  }
}

function getInitials(name) {
  return String(
    name || 'Usuário',
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      part =>
        part[0],
    )
    .join('')
    .toUpperCase()
}

function getTicketCode(id) {
  return `#${String(id)
    .slice(-5)
    .padStart(5, '0')}`
}

function formatDate(
  item,
  mode = 'short',
) {
  const date =
    new Date(
      item?.createdAt ||
        Number(item?.id),
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Agora'
  }

  if (
    mode === 'full'
  ) {
    return new Intl.DateTimeFormat(
      'pt-BR',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      },
    ).format(date)
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    },
  )
    .format(date)
    .replace(
      ',',
      ' ·',
    )
}

function getTicketSubject(
  ticket,
) {
  if (
    ticket
      ?.assunto
      ?.trim()
  ) {
    return ticket
      .assunto
      .trim()
  }

  const description =
    String(
      ticket?.descricao ||
        '',
    ).trim()

  if (!description) {
    return `Solicitação de ${
      ticket?.nome ||
      'usuário'
    }`
  }

  return (
    description.length > 58
      ? `${description
          .slice(0, 58)
          .trim()}…`
      : description
  )
}

function getLastActivity(
  ticket,
) {
  const replies =
    Array.isArray(
      ticket?.replies,
    )
      ? ticket.replies
      : []

  return (
    replies[
      replies.length - 1
    ] ||
    ticket
  )
}

export default function App() {
  const [
    tickets,
    setTickets,
  ] =
    useState(
      getStoredTickets,
    )

  const [
    theme,
    setTheme,
  ] =
    useState(() => {
      const savedTheme =
        localStorage.getItem(
          'support-theme',
        )

      return (
        savedTheme ===
          'light' ||
        savedTheme ===
          'dark'
          ? savedTheme
          : 'dark'
      )
    })

  const [
    selectedTicketId,
    setSelectedTicketId,
  ] =
    useState(null)

  const [
    view,
    setView,
  ] =
    useState(
      'todos',
    )

  const [
    search,
    setSearch,
  ] =
    useState('')

  const [
    replyText,
    setReplyText,
  ] =
    useState('')

  const [
    toast,
    setToast,
  ] =
    useState('')

  const [
    isComposeOpen,
    setIsComposeOpen,
  ] =
    useState(false)

  const [
    nome,
    setNome,
  ] =
    useState('')

  const [
    email,
    setEmail,
  ] =
    useState('')

  const [
    assunto,
    setAssunto,
  ] =
    useState('')

  const [
    categoria,
    setCategoria,
  ] =
    useState(
      'geral',
    )

  const [
    descricao,
    setDescricao,
  ] =
    useState('')

  const [
    urgencia,
    setUrgencia,
  ] =
    useState(
      'medio',
    )

  const searchRef =
    useRef(null)

  const logoPath =
    `${import.meta.env.BASE_URL}imagem/logo2026.png`

  useEffect(
    () => {
      localStorage.setItem(
        'tickets',
        JSON.stringify(
          tickets,
        ),
      )
    },
    [tickets],
  )

  useEffect(
    () => {
      document
        .documentElement
        .dataset
        .theme =
          theme

      localStorage.setItem(
        'support-theme',
        theme,
      )
    },
    [theme],
  )

  useEffect(
    () => {
      if (!toast) {
        return undefined
      }

      const timer =
        window.setTimeout(
          () =>
            setToast(''),
          3800,
        )

      return () =>
        window.clearTimeout(
          timer,
        )
    },
    [toast],
  )

  useEffect(
    () => {
      function handleKeyboard(
        event,
      ) {
        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key
            .toLowerCase() ===
            'k'
        ) {
          event.preventDefault()

          searchRef
            .current
            ?.focus()
        }

        if (
          (
            event.ctrlKey ||
            event.metaKey
          ) &&
          event.key
            .toLowerCase() ===
            'n'
        ) {
          event.preventDefault()

          setIsComposeOpen(
            true,
          )
        }

        if (
          event.key ===
          'Escape'
        ) {
          setIsComposeOpen(
            false,
          )
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
    },
    [],
  )

  const stats =
    useMemo(
      () => {
        const open =
          tickets.filter(
            ticket =>
              normalizeStatus(
                ticket.status,
              ) ===
              'aberto',
          ).length

        const resolved =
          tickets.filter(
            ticket =>
              normalizeStatus(
                ticket.status,
              ) ===
              'resolvido',
          ).length

        const high =
          tickets.filter(
            ticket =>
              normalizeStatus(
                ticket.status,
              ) ===
                'aberto' &&
              normalizePriority(
                ticket.urgencia,
              ) ===
                'alto',
          ).length

        const replies =
          tickets.reduce(
            (
              total,
              ticket,
            ) =>
              total +
              (
                ticket
                  .replies
                  ?.length ||
                0
              ),
            0,
          )

        return {
          total:
            tickets.length,

          open,

          resolved,

          high,

          replies,

          resolvedRate:
            tickets.length >
            0
              ? Math.round(
                  (
                    resolved /
                    tickets.length
                  ) *
                    100,
                )
              : 0,
        }
      },
      [tickets],
    )

  const filteredTickets =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLocaleLowerCase(
              'pt-BR',
            )

        return tickets
          .filter(
            ticket => {
              const status =
                normalizeStatus(
                  ticket.status,
                )

              const priority =
                normalizePriority(
                  ticket.urgencia,
                )

              const matchesView =
                view ===
                  'todos' ||
                (
                  view ===
                    'abertos' &&
                  status ===
                    'aberto'
                ) ||
                (
                  view ===
                    'resolvidos' &&
                  status ===
                    'resolvido'
                ) ||
                (
                  view ===
                    'alta' &&
                  status ===
                    'aberto' &&
                  priority ===
                    'alto'
                )

              const searchableText =
                [
                  ticket.nome,
                  ticket.email,
                  ticket.descricao,
                  ticket.assunto,

                  categoryLabels[
                    ticket
                      .categoria
                  ] ||
                    ticket.categoria,

                  getTicketCode(
                    ticket.id,
                  ),
                ]
                  .join(' ')
                  .toLocaleLowerCase(
                    'pt-BR',
                  )

              return (
                matchesView &&
                (
                  !term ||
                  searchableText
                    .includes(
                      term,
                    )
                )
              )
            },
          )
          .sort(
            (
              a,
              b,
            ) => {
              const aStatus =
                normalizeStatus(
                  a.status,
                )

              const bStatus =
                normalizeStatus(
                  b.status,
                )

              if (
                aStatus !==
                bStatus
              ) {
                return (
                  aStatus ===
                  'aberto'
                    ? -1
                    : 1
                )
              }

              const weight = {
                alto: 3,
                medio: 2,
                baixo: 1,
              }

              const priorityDiff =
                weight[
                  normalizePriority(
                    b.urgencia,
                  )
                ] -
                weight[
                  normalizePriority(
                    a.urgencia,
                  )
                ]

              if (
                priorityDiff !==
                0
              ) {
                return priorityDiff
              }

              return (
                new Date(
                  getLastActivity(
                    b,
                  ).createdAt ||
                    b.createdAt,
                ) -
                new Date(
                  getLastActivity(
                    a,
                  ).createdAt ||
                    a.createdAt,
                )
              )
            },
          )
      },
      [
        search,
        tickets,
        view,
      ],
    )

  const selectedTicket =
    tickets.find(
      ticket =>
        ticket.id ===
        selectedTicketId,
    ) ||
    filteredTickets[0] ||
    tickets[0] ||
    null

  const selectedPriority =
    priorities[
      normalizePriority(
        selectedTicket
          ?.urgencia,
      )
    ] ||
    priorities.medio

  const selectedStatus =
    normalizeStatus(
      selectedTicket
        ?.status,
    )

  const isResolved =
    selectedStatus ===
    'resolvido'

  const navigation = [
    {
      id: 'todos',
      label:
        'Todos os tickets',
      icon: 'inbox',
      count:
        stats.total,
    },

    {
      id: 'abertos',
      label:
        'Em atendimento',
      icon: 'clock',
      count:
        stats.open,
    },

    {
      id: 'alta',
      label:
        'Alta prioridade',
      icon: 'bolt',
      count:
        stats.high,
    },

    {
      id: 'resolvidos',
      label:
        'Resolvidos',
      icon: 'check',
      count:
        stats.resolved,
    },
  ]

  function resetCompose() {
    setNome('')
    setEmail('')
    setAssunto('')
    setCategoria(
      'geral',
    )
    setDescricao('')
    setUrgencia(
      'medio',
    )
  }

  function handleAddTicket(
    event,
  ) {
    event.preventDefault()

    if (
      !nome.trim() ||
      !email.trim() ||
      !assunto.trim() ||
      !descricao.trim()
    ) {
      return
    }

    const ticket = {
      id:
        Date.now(),

      nome:
        nome.trim(),

      email:
        email.trim(),

      assunto:
        assunto.trim(),

      categoria,

      descricao:
        descricao.trim(),

      urgencia,

      createdAt:
        new Date()
          .toISOString(),

      status:
        'aberto',

      replies: [],
    }

    setTickets(
      current => [
        ticket,
        ...current,
      ],
    )

    setSelectedTicketId(
      ticket.id,
    )

    setView(
      'todos',
    )

    setSearch('')

    setIsComposeOpen(
      false,
    )

    resetCompose()

    setToast(
      `Ticket ${getTicketCode(
        ticket.id,
      )} criado com sucesso.`,
    )
  }

  function handleDelete(id) {
    const ticket =
      tickets.find(
        item =>
          item.id === id,
      )

    if (!ticket) {
      return
    }

    const confirmed =
      window.confirm(
        `Excluir definitivamente o ticket ${getTicketCode(
          id,
        )}?`,
      )

    if (!confirmed) {
      return
    }

    const remaining =
      tickets.filter(
        item =>
          item.id !== id,
      )

    setTickets(
      remaining,
    )

    if (
      selectedTicket
        ?.id === id
    ) {
      setSelectedTicketId(
        remaining[0]
          ?.id ??
          null,
      )
    }

    setToast(
      `Ticket ${getTicketCode(
        id,
      )} excluído.`,
    )
  }

  function handleReply(
    event,
  ) {
    event.preventDefault()

    if (
      !selectedTicket ||
      !replyText.trim() ||
      isResolved
    ) {
      return
    }

    const reply = {
      id:
        Date.now(),

      author:
        'Equipe LTHS',

      message:
        replyText.trim(),

      createdAt:
        new Date()
          .toISOString(),
    }

    setTickets(
      current =>
        current.map(
          ticket =>
            ticket.id ===
            selectedTicket.id
              ? {
                  ...ticket,

                  replies: [
                    ...(
                      ticket
                        .replies ||
                      []
                    ),

                    reply,
                  ],
                }
              : ticket,
        ),
    )

    setReplyText('')

    setToast(
      `Resposta adicionada ao ${getTicketCode(
        selectedTicket.id,
      )}.`,
    )
  }

  function handleToggleStatus() {
    if (!selectedTicket) {
      return
    }

    const nextStatus =
      isResolved
        ? 'aberto'
        : 'resolvido'

    setTickets(
      current =>
        current.map(
          ticket =>
            ticket.id ===
            selectedTicket.id
              ? {
                  ...ticket,

                  status:
                    nextStatus,

                  resolvedAt:
                    nextStatus ===
                    'resolvido'
                      ? new Date()
                          .toISOString()
                      : null,
                }
              : ticket,
        ),
    )

    setToast(
      nextStatus ===
      'resolvido'
        ? `${getTicketCode(
            selectedTicket.id,
          )} marcado como resolvido.`
        : `${getTicketCode(
            selectedTicket.id,
          )} reaberto.`,
    )
  }

  return (
    <div
      className="support-app"
      data-theme={theme}
    >

      <aside className="app-sidebar">

        <div className="sidebar-brand">

          <div className="sidebar-logo">

            <img
              src={logoPath}
              alt="LTHS Tecnologia"
            />

          </div>

          <div>

            <strong>
              LTHS Desk
            </strong>

            <span>
              Service operations
            </span>

          </div>

        </div>

        <div className="sidebar-section-label">
          ATENDIMENTO
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Navegação dos tickets"
        >

          {navigation.map(
            item => (

              <button
                type="button"
                className={
                  view ===
                  item.id
                    ? 'is-active'
                    : ''
                }
                key={item.id}
                onClick={() =>
                  setView(
                    item.id,
                  )
                }
              >

                <span className="sidebar-nav__icon">

                  <Icon
                    name={
                      item.icon
                    }
                    size={18}
                  />

                </span>

                <span className="sidebar-nav__label">
                  {item.label}
                </span>

                <span className="sidebar-nav__count">
                  {item.count}
                </span>

              </button>

            ),
          )}

        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        <nav className="sidebar-nav sidebar-nav--muted">

          <button
            type="button"
            onClick={() =>
              searchRef
                .current
                ?.focus()
            }
          >

            <span className="sidebar-nav__icon">

              <Icon
                name="search"
                size={18}
              />

            </span>

            <span className="sidebar-nav__label">
              Busca rápida
            </span>

            <span className="keyboard-hint">
              Ctrl K
            </span>

          </button>

          <button type="button">

            <span className="sidebar-nav__icon">

              <Icon
                name="chart"
                size={18}
              />

            </span>

            <span className="sidebar-nav__label">
              Relatórios
            </span>

          </button>

          <button type="button">

            <span className="sidebar-nav__icon">

              <Icon
                name="settings"
                size={18}
              />

            </span>

            <span className="sidebar-nav__label">
              Configurações
            </span>

          </button>

        </nav>

        <div className="sidebar-footer">

          <div className="sidebar-status">

            <span className="online-dot" />

            <div>

              <small>
                STATUS DO AMBIENTE
              </small>

              <strong>
                Operação online
              </strong>

            </div>

          </div>

          <div className="sidebar-profile">

            <div className="profile-avatar">
              LT
            </div>

            <div>

              <strong>
                Equipe LTHS
              </strong>

              <span>
                Administradora
              </span>

            </div>

            <Icon
              name="chevron"
              size={16}
            />

          </div>

          <div className="sidebar-developed">

            <span>
              DESENVOLVIDO POR
            </span>

            <strong>
              LTHS Tecnologia
            </strong>

          </div>

        </div>

      </aside>

      <main className="app-main">

        <header className="app-topbar">

          <div className="topbar-title">

            <span>
              SUPORTE / CENTRAL DE ATENDIMENTO
            </span>

            <strong>
              Service Desk
            </strong>

          </div>

          <label className="global-search">

            <Icon
              name="search"
              size={18}
            />

            <input
              ref={searchRef}
              type="search"
              placeholder="Buscar por ticket, solicitante ou descrição"
              value={search}
              onChange={
                event =>
                  setSearch(
                    event
                      .target
                      .value,
                  )
              }
            />

            <kbd>
              Ctrl K
            </kbd>

          </label>

          <div className="topbar-actions">

            <div className="environment-status">

              <span className="online-dot" />

              Online

            </div>

            <button
              type="button"
              className="icon-action"
              aria-label={
                theme ===
                'dark'
                  ? 'Ativar modo claro'
                  : 'Ativar modo escuro'
              }
              onClick={() =>
                setTheme(
                  current =>
                    current ===
                    'dark'
                      ? 'light'
                      : 'dark',
                )
              }
            >

              <Icon
                name={
                  theme ===
                  'dark'
                    ? 'sun'
                    : 'moon'
                }
                size={18}
              />

            </button>

            <button
              type="button"
              className="new-ticket-button"
              onClick={() =>
                setIsComposeOpen(
                  true,
                )
              }
            >

              <Icon
                name="plus"
                size={18}
              />

              Novo ticket

              <span>
                Ctrl N
              </span>

            </button>

          </div>

        </header>

        <section className="overview-strip">

          <div className="overview-heading">

            <span>
              OPERAÇÃO DE SUPORTE
            </span>

            <h1>
              Fila de atendimento
            </h1>

            <p>
              Controle solicitações, prioridades e histórico
              em uma única central.
            </p>

          </div>

          <div className="overview-metrics">

            <article>

              <div>

                <span>
                  EM ABERTO
                </span>

                <i className="metric-signal metric-signal--blue" />

              </div>

              <strong>
                {stats.open}
              </strong>

              <small>
                tickets ativos
              </small>

            </article>

            <article>

              <div>

                <span>
                  ALTA PRIORIDADE
                </span>

                <i className="metric-signal metric-signal--red" />

              </div>

              <strong>
                {stats.high}
              </strong>

              <small>
                exigem atenção
              </small>

            </article>

            <article>

              <div>

                <span>
                  RESOLVIDOS
                </span>

                <i className="metric-signal metric-signal--green" />

              </div>

              <strong>
                {stats.resolved}
              </strong>

              <small>
                {stats.resolvedRate}% da base
              </small>

            </article>

            <article>

              <div>

                <span>
                  INTERAÇÕES
                </span>

                <i className="metric-signal metric-signal--violet" />

              </div>

              <strong>
                {stats.replies}
              </strong>

              <small>
                respostas registradas
              </small>

            </article>

          </div>

        </section>

        <section className="desk-grid">

          <aside className="ticket-queue">

            <header className="queue-header">

              <div>

                <span>
                  CAIXA DE ENTRADA
                </span>

                <h2>
                  {
                    navigation.find(
                      item =>
                        item.id ===
                        view,
                    )?.label ||
                    'Tickets'
                  }
                </h2>

              </div>

              <div className="queue-total">
                {
                  filteredTickets.length
                }
              </div>

            </header>

            <div className="queue-tools">

              <label>

                <Icon
                  name="search"
                  size={17}
                />

                <input
                  type="search"
                  placeholder="Filtrar esta fila"
                  value={search}
                  onChange={
                    event =>
                      setSearch(
                        event
                          .target
                          .value,
                      )
                  }
                />

              </label>

              <button
                type="button"
                aria-label="Opções de filtro"
              >

                <Icon
                  name="filter"
                  size={17}
                />

              </button>

            </div>

            <div className="queue-list">

              {
                filteredTickets.length >
                0
                  ? filteredTickets.map(
                      ticket => {

                        const priority =
                          priorities[
                            normalizePriority(
                              ticket.urgencia,
                            )
                          ] ||
                          priorities.medio

                        const status =
                          normalizeStatus(
                            ticket.status,
                          )

                        const active =
                          selectedTicket
                            ?.id ===
                          ticket.id

                        return (

                          <button
                            type="button"
                            className={`queue-card ${
                              active
                                ? 'is-active'
                                : ''
                            }`}
                            data-priority={
                              normalizePriority(
                                ticket.urgencia,
                              )
                            }
                            data-status={
                              status
                            }
                            key={
                              ticket.id
                            }
                            onClick={() =>
                              setSelectedTicketId(
                                ticket.id,
                              )
                            }
                          >

                            <div className="queue-card__top">

                              <span className="ticket-code">
                                {
                                  getTicketCode(
                                    ticket.id,
                                  )
                                }
                              </span>

                              <span className="queue-card__date">
                                {
                                  formatDate(
                                    getLastActivity(
                                      ticket,
                                    ),
                                  )
                                }
                              </span>

                            </div>

                            <strong>
                              {
                                getTicketSubject(
                                  ticket,
                                )
                              }
                            </strong>

                            <p>
                              {
                                ticket.descricao
                              }
                            </p>

                            <div className="queue-card__bottom">

                              <span className="requester-chip">

                                <i>
                                  {
                                    getInitials(
                                      ticket.nome,
                                    )
                                  }
                                </i>

                                {
                                  ticket.nome
                                }

                              </span>

                              <span
                                className="priority-pill"
                                data-priority={
                                  normalizePriority(
                                    ticket.urgencia,
                                  )
                                }
                              >
                                {
                                  priority.label
                                }
                              </span>

                            </div>

                            <div className="queue-card__status">

                              <i />

                              {
                                status ===
                                'resolvido'
                                  ? 'Resolvido'
                                  : 'Aberto'
                              }

                            </div>

                          </button>

                        )
                      },
                    )
                  : (

                    <div className="queue-empty">

                      <strong>
                        Nenhum ticket nesta fila
                      </strong>

                      <p>
                        Ajuste a busca ou crie uma nova solicitação.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setIsComposeOpen(
                            true,
                          )
                        }
                      >
                        Criar ticket
                      </button>

                    </div>

                  )
              }

            </div>

          </aside>

          <section className="ticket-stage">

            {
              selectedTicket
                ? (
                  <>

                    <header className="ticket-header">

                      <div className="ticket-header__main">

                        <div className="ticket-header__meta">

                          <span
                            className="status-pill"
                            data-status={
                              selectedStatus
                            }
                          >

                            <i />

                            {
                              isResolved
                                ? 'Resolvido'
                                : 'Em atendimento'
                            }

                          </span>

                          <span className="ticket-code">
                            {
                              getTicketCode(
                                selectedTicket.id,
                              )
                            }
                          </span>

                          <span className="ticket-category">
                            {
                              categoryLabels[
                                selectedTicket
                                  .categoria
                              ] ||
                              'Geral'
                            }
                          </span>

                        </div>

                        <h2>
                          {
                            getTicketSubject(
                              selectedTicket,
                            )
                          }
                        </h2>

                        <p>
                          Aberto por{' '}

                          <strong>
                            {
                              selectedTicket.nome
                            }
                          </strong>

                          {' '}em{' '}

                          {
                            formatDate(
                              selectedTicket,
                              'full',
                            )
                          }
                        </p>

                      </div>

                      <div className="ticket-header__actions">

                        <span
                          className="priority-pill priority-pill--large"
                          data-priority={
                            normalizePriority(
                              selectedTicket
                                .urgencia,
                            )
                          }
                        >
                          {
                            selectedPriority.label
                          } prioridade
                        </span>

                        <button
                          type="button"
                          className="resolve-button"
                          data-status={
                            selectedStatus
                          }
                          onClick={
                            handleToggleStatus
                          }
                        >

                          <Icon
                            name={
                              isResolved
                                ? 'reopen'
                                : 'check'
                            }
                            size={17}
                          />

                          {
                            isResolved
                              ? 'Reabrir'
                              : 'Resolver ticket'
                          }

                        </button>

                      </div>

                    </header>

                    <div className="ticket-layout">

                      <section className="conversation-panel">

                        <div className="conversation-heading">

                          <div>

                            <span>
                              CONVERSA
                            </span>

                            <h3>
                              Histórico do atendimento
                            </h3>

                          </div>

                          <div
                            className="conversation-state"
                            data-status={
                              selectedStatus
                            }
                          >

                            <i />

                            {
                              isResolved
                                ? 'Encerrado'
                                : 'Ao vivo'
                            }

                          </div>

                        </div>

                        <div className="conversation-thread">

                          <article className="message message--requester">

                            <div className="message-avatar">
                              {
                                getInitials(
                                  selectedTicket.nome,
                                )
                              }
                            </div>

                            <div className="message-body">

                              <header>

                                <div>

                                  <strong>
                                    {
                                      selectedTicket.nome
                                    }
                                  </strong>

                                  <span>
                                    Solicitante
                                  </span>

                                </div>

                                <time>
                                  {
                                    formatDate(
                                      selectedTicket,
                                    )
                                  }
                                </time>

                              </header>

                              <p>
                                {
                                  selectedTicket.descricao
                                }
                              </p>

                            </div>

                          </article>

                          <div className="timeline-event">

                            <span className="timeline-event__icon">

                              <Icon
                                name="clock"
                                size={14}
                              />

                            </span>

                            <p>
                              Ticket{' '}

                              <strong>
                                {
                                  getTicketCode(
                                    selectedTicket.id,
                                  )
                                }
                              </strong>

                              {' '}entrou na fila de atendimento.
                            </p>

                          </div>

                          {
                            (
                              selectedTicket.replies ||
                              []
                            ).map(
                              reply => (

                                <article
                                  className="message message--support"
                                  key={
                                    reply.id
                                  }
                                >

                                  <div className="message-avatar">
                                    LT
                                  </div>

                                  <div className="message-body">

                                    <header>

                                      <div>

                                        <strong>
                                          {
                                            reply.author ||
                                            'Equipe LTHS'
                                          }
                                        </strong>

                                        <span>
                                          Atendimento
                                        </span>

                                      </div>

                                      <time>
                                        {
                                          formatDate(
                                            reply,
                                          )
                                        }
                                      </time>

                                    </header>

                                    <p>
                                      {
                                        reply.message
                                      }
                                    </p>

                                  </div>

                                </article>

                              ),
                            )
                          }

                          {
                            isResolved &&
                            (

                              <div className="timeline-event timeline-event--resolved">

                                <span className="timeline-event__icon">

                                  <Icon
                                    name="check"
                                    size={14}
                                  />

                                </span>

                                <p>
                                  Atendimento encerrado e ticket marcado como{' '}

                                  <strong>
                                    resolvido
                                  </strong>.
                                </p>

                              </div>

                            )
                          }

                        </div>

                        <form
                          className="reply-box"
                          onSubmit={
                            handleReply
                          }
                        >

                          <div className="reply-box__header">

                            <div>

                              <span>
                                RESPONDER COMO
                              </span>

                              <strong>
                                Equipe LTHS
                              </strong>

                            </div>

                            <span className="reply-mode">

                              <span className="online-dot" />

                              Resposta interna

                            </span>

                          </div>

                          <textarea
                            value={
                              replyText
                            }
                            onChange={
                              event =>
                                setReplyText(
                                  event
                                    .target
                                    .value,
                                )
                            }
                            placeholder={
                              isResolved
                                ? 'Reabra o ticket para enviar uma nova resposta.'
                                : 'Escreva uma resposta clara para o solicitante...'
                            }
                            rows={4}
                            disabled={
                              isResolved
                            }
                          />

                          <footer>

                            <span>
                              {
                                isResolved
                                  ? 'O ticket está encerrado.'
                                  : 'A mensagem ficará registrada no histórico.'
                              }
                            </span>

                            <button
                              type="submit"
                              disabled={
                                isResolved ||
                                !replyText.trim()
                              }
                            >

                              Enviar resposta

                              <Icon
                                name="arrow"
                                size={16}
                              />

                            </button>

                          </footer>

                        </form>

                      </section>

                      <aside className="context-panel">

                        <section className="context-section">

                          <span className="context-label">
                            SOLICITANTE
                          </span>

                          <div className="requester-profile">

                            <div>
                              {
                                getInitials(
                                  selectedTicket.nome,
                                )
                              }
                            </div>

                            <span>

                              <strong>
                                {
                                  selectedTicket.nome
                                }
                              </strong>

                              <small>
                                Solicitante do ticket
                              </small>

                            </span>

                          </div>

                          <dl className="context-list">

                            <div>

                              <dt>

                                <Icon
                                  name="mail"
                                  size={16}
                                />

                                E-mail

                              </dt>

                              <dd>
                                {
                                  selectedTicket.email
                                }
                              </dd>

                            </div>

                            <div>

                              <dt>

                                <Icon
                                  name="clock"
                                  size={16}
                                />

                                Criado em

                              </dt>

                              <dd>
                                {
                                  formatDate(
                                    selectedTicket,
                                  )
                                }
                              </dd>

                            </div>

                            <div>

                              <dt>

                                <Icon
                                  name="inbox"
                                  size={16}
                                />

                                Categoria

                              </dt>

                              <dd>
                                {
                                  categoryLabels[
                                    selectedTicket
                                      .categoria
                                  ] ||
                                  'Geral'
                                }
                              </dd>

                            </div>

                          </dl>

                        </section>

                        <section className="context-section">

                          <span className="context-label">
                            NÍVEL DE SERVIÇO
                          </span>

                          <div
                            className="sla-card"
                            data-priority={
                              normalizePriority(
                                selectedTicket
                                  .urgencia,
                              )
                            }
                          >

                            <div>

                              <span>
                                PRIORIDADE
                              </span>

                              <strong>
                                {
                                  selectedPriority.label
                                }
                              </strong>

                            </div>

                            <div>

                              <span>
                                SLA ALVO
                              </span>

                              <strong>
                                {
                                  selectedPriority.sla
                                }
                              </strong>

                            </div>

                          </div>

                          <p className="sla-description">
                            {
                              selectedPriority.description
                            }. O tempo de resposta é apresentado como referência operacional.
                          </p>

                        </section>

                        <section className="context-section">

                          <span className="context-label">
                            STATUS
                          </span>

                          <div
                            className="status-overview"
                            data-status={
                              selectedStatus
                            }
                          >

                            <span>

                              <i />

                              {
                                isResolved
                                  ? 'Resolvido'
                                  : 'Aberto'
                              }

                            </span>

                            <p>
                              {
                                isResolved
                                  ? 'O atendimento foi concluído pela equipe.'
                                  : 'O chamado permanece disponível para atendimento.'
                              }
                            </p>

                          </div>

                        </section>

                        <section className="context-section context-section--danger">

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              handleDelete(
                                selectedTicket.id,
                              )
                            }
                          >

                            <Icon
                              name="trash"
                              size={16}
                            />

                            Excluir ticket

                          </button>

                        </section>

                      </aside>

                    </div>

                  </>
                )
                : (

                  <div className="stage-empty">

                    <span>
                      CENTRAL DE ATENDIMENTO
                    </span>

                    <h2>
                      Nenhum ticket selecionado
                    </h2>

                    <p>
                      Crie uma solicitação ou escolha um ticket na fila para abrir o painel de atendimento.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setIsComposeOpen(
                          true,
                        )
                      }
                    >

                      <Icon
                        name="plus"
                        size={17}
                      />

                      Abrir novo ticket

                    </button>

                  </div>

                )
            }

          </section>

        </section>

      </main>

      <nav className="mobile-nav">

        {
          navigation.map(
            item => (

              <button
                type="button"
                className={
                  view ===
                  item.id
                    ? 'is-active'
                    : ''
                }
                key={
                  item.id
                }
                onClick={() =>
                  setView(
                    item.id,
                  )
                }
              >

                <Icon
                  name={
                    item.icon
                  }
                  size={19}
                />

                <span>
                  {
                    item.label
                      .split(' ')[0]
                  }
                </span>

              </button>

            ),
          )
        }

        <button
          type="button"
          className="mobile-add"
          onClick={() =>
            setIsComposeOpen(
              true,
            )
          }
        >

          <Icon
            name="plus"
            size={20}
          />

        </button>

      </nav>

      {
        isComposeOpen &&
        (

          <div
            className="compose-backdrop"
            onMouseDown={() =>
              setIsComposeOpen(
                false,
              )
            }
          >

            <section
              className="compose-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-ticket-title"
              onMouseDown={
                event =>
                  event
                    .stopPropagation()
              }
            >

              <header className="compose-modal__header">

                <div>

                  <span>
                    NOVA SOLICITAÇÃO
                  </span>

                  <h2 id="new-ticket-title">
                    Abrir ticket
                  </h2>

                  <p>
                    Registre a demanda com as informações essenciais.
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setIsComposeOpen(
                      false,
                    )
                  }
                  aria-label="Fechar"
                >
                  ×
                </button>

              </header>

              <form
                className="compose-form"
                onSubmit={
                  handleAddTicket
                }
              >

                <label className="form-field form-field--wide">

                  <span>
                    Assunto
                  </span>

                  <input
                    type="text"
                    placeholder="Ex: Falha no acesso ao painel"
                    value={
                      assunto
                    }
                    onChange={
                      event =>
                        setAssunto(
                          event
                            .target
                            .value,
                        )
                    }
                    required
                  />

                </label>

                <label className="form-field">

                  <span>
                    Nome do solicitante
                  </span>

                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={
                      nome
                    }
                    onChange={
                      event =>
                        setNome(
                          event
                            .target
                            .value,
                        )
                    }
                    required
                  />

                </label>

                <label className="form-field">

                  <span>
                    E-mail para retorno
                  </span>

                  <input
                    type="email"
                    placeholder="nome@empresa.com"
                    value={
                      email
                    }
                    onChange={
                      event =>
                        setEmail(
                          event
                            .target
                            .value,
                        )
                    }
                    required
                  />

                </label>

                <label className="form-field">

                  <span>
                    Categoria
                  </span>

                  <select
                    value={
                      categoria
                    }
                    onChange={
                      event =>
                        setCategoria(
                          event
                            .target
                            .value,
                        )
                    }
                  >

                    <option value="geral">
                      Geral
                    </option>

                    <option value="acesso">
                      Acesso
                    </option>

                    <option value="sistema">
                      Sistema
                    </option>

                    <option value="infraestrutura">
                      Infraestrutura
                    </option>

                    <option value="financeiro">
                      Financeiro
                    </option>

                  </select>

                </label>

                <fieldset className="form-field">

                  <legend>
                    Prioridade
                  </legend>

                  <div className="priority-select">

                    {
                      Object.entries(
                        priorities,
                      ).map(
                        (
                          [
                            value,
                            priority,
                          ],
                        ) => (

                          <label
                            className={
                              urgencia ===
                              value
                                ? 'is-selected'
                                : ''
                            }
                            data-priority={
                              value
                            }
                            key={
                              value
                            }
                          >

                            <input
                              type="radio"
                              name="prioridade"
                              value={
                                value
                              }
                              checked={
                                urgencia ===
                                value
                              }
                              onChange={
                                event =>
                                  setUrgencia(
                                    event
                                      .target
                                      .value,
                                  )
                              }
                            />

                            <i />

                            <span>
                              {
                                priority.label
                              }
                            </span>

                          </label>

                        ),
                      )
                    }

                  </div>

                </fieldset>

                <label className="form-field form-field--wide">

                  <span>
                    Descrição da solicitação
                  </span>

                  <textarea
                    placeholder="Explique o que aconteceu, o impacto e qualquer informação relevante para o atendimento."
                    value={
                      descricao
                    }
                    onChange={
                      event =>
                        setDescricao(
                          event
                            .target
                            .value,
                        )
                    }
                    rows={6}
                    required
                  />

                </label>

                <footer className="compose-form__footer">

                  <span>
                    O ticket será salvo localmente neste navegador.
                  </span>

                  <div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        setIsComposeOpen(
                          false,
                        )
                      }
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                    >

                      Criar ticket

                      <Icon
                        name="arrow"
                        size={16}
                      />

                    </button>

                  </div>

                </footer>

              </form>

            </section>

          </div>

        )
      }

      {
        toast &&
        (

          <div
            className="toast"
            role="status"
          >

            <span>

              <Icon
                name="check"
                size={15}
              />

            </span>

            {toast}

          </div>

        )
      }

    </div>
  )
}