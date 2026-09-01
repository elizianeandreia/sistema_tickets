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

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'new', label: 'Novos' },
  { id: 'in_progress', label: 'Em atendimento' },
  { id: 'waiting', label: 'Aguardando' },
  { id: 'resolved', label: 'Resolvidos' },
]

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

function Icon({ name, size = 18 }) {
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
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
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
    activity: <path d="M3 12h4l2.2-5 4 10 2.2-5H21" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
      </>
    ),
    moon: <path d="M20.2 15.4A8 8 0 0 1 8.6 3.8 8.2 8.2 0 1 0 20.2 15.4Z" />,
    arrow: <path d="m9 18 6-6-6-6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 10v6M12 7h.01" />
      </>
    ),
    close: <path d="M6 6l12 12M18 6 6 18" />,
    send: (
      <>
        <path d="m4 4 16 8-16 8 3-8-3-8Z" />
        <path d="M7 12h13" />
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
      {icons[name] ?? icons.info}
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

function getRemainingMs(ticket) {
  if (!ticket?.slaDeadline) return 0

  const deadline = new Date(ticket.slaDeadline).getTime()
  const reference =
    ticket.status === 'resolved' && ticket.resolvedAt
      ? new Date(ticket.resolvedAt).getTime()
      : Date.now()

  if (!Number.isFinite(deadline) || !Number.isFinite(reference)) return 0

  return deadline - reference
}

function getSlaLabel(state) {
  const labels = {
    healthy: 'Dentro do prazo',
    warning: 'Atenção',
    critical: 'Crítico',
    overdue: 'SLA vencido',
  }

  return labels[state] ?? 'Em acompanhamento'
}

function getMessageAuthor(item, fallback = 'Equipe LTHS') {
  return item?.author || item?.authorName || fallback
}

function TicketMessage({ type, author, message, createdAt }) {
  return (
    <article className={`timeline-entry timeline-entry--${type}`}>
      <div className="timeline-entry__rail" aria-hidden="true">
        <span className="timeline-entry__marker" />
      </div>

      <time
        className="timeline-entry__time"
        dateTime={createdAt || undefined}
      >
        {formatCompactDate(createdAt)}
      </time>

      <div className="timeline-entry__content">
        <div className="timeline-entry__meta">
          <strong>{author}</strong>
          <span>
            {type === 'requester'
              ? 'Solicitante'
              : type === 'note'
                ? 'Nota interna'
                : 'Suporte'}
          </span>
        </div>

        <p>{message}</p>
      </div>
    </article>
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
  if (!open) return null

  return (
    <div className="new-ticket-overlay" role="presentation">
      <button
        type="button"
        className="new-ticket-backdrop"
        aria-label="Fechar criação de chamado"
        onClick={onClose}
      />

      <aside
        className="new-ticket-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
      >
        <header className="new-ticket-drawer__header">
          <div>
            <span>NOVO REGISTRO</span>
            <h2 id="new-ticket-title">Criar chamado</h2>
            <p>Registre a solicitação e envie diretamente para a fila.</p>
          </div>

          <button
            type="button"
            className="new-ticket-drawer__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <Icon name="close" />
          </button>
        </header>

        <form className="new-ticket-form" onSubmit={onSubmit}>
          <div className="new-ticket-form__section">
            <div className="new-ticket-form__section-heading">
              <div>
                <strong>Solicitante</strong>
                <small>Identificação de quem abriu o chamado</small>
              </div>
            </div>

            <label>
              <span>Nome *</span>
              <input
                autoFocus
                required
                name="requesterName"
                value={form.requesterName}
                onChange={onChange}
                placeholder="Nome do solicitante"
              />
            </label>

            <div className="new-ticket-form__grid">
              <label>
                <span>E-mail *</span>
                <input
                  required
                  type="email"
                  name="requesterEmail"
                  value={form.requesterEmail}
                  onChange={onChange}
                  placeholder="nome@empresa.com"
                />
              </label>

              <label>
                <span>Departamento</span>
                <input
                  name="department"
                  value={form.department}
                  onChange={onChange}
                  placeholder="Ex.: Financeiro"
                />
              </label>
            </div>
          </div>

          <div className="new-ticket-form__section">
            <div className="new-ticket-form__section-heading">
              <div>
                <strong>Solicitação</strong>
                <small>Contexto necessário para iniciar o atendimento</small>
              </div>
            </div>

            <label>
              <span>Assunto *</span>
              <input
                required
                name="subject"
                value={form.subject}
                onChange={onChange}
                placeholder="Resumo curto do problema"
              />
            </label>

            <label>
              <span>Descrição *</span>
              <textarea
                required
                name="description"
                value={form.description}
                onChange={onChange}
                rows="5"
                placeholder="Descreva o que está acontecendo, impacto e contexto."
              />
            </label>

            <div className="new-ticket-form__grid">
              <label>
                <span>Categoria *</span>
                <select
                  required
                  name="category"
                  value={form.category}
                  onChange={onChange}
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Responsável</span>
                <select
                  name="assigneeId"
                  value={form.assigneeId}
                  onChange={onChange}
                >
                  <option value="">Sem atribuição</option>
                  {team.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="new-ticket-form__section">
            <div className="new-ticket-form__section-heading">
              <div>
                <strong>Prioridade e SLA</strong>
                <small>
                  O prazo de atendimento é definido automaticamente conforme a
                  prioridade
                </small>
              </div>
            </div>

            <div className="priority-card-grid">
              {[
                {
                  value: 'high',
                  label: 'Alta',
                  description: 'Impacto crítico',
                  sla: '2 horas',
                },
                {
                  value: 'medium',
                  label: 'Média',
                  description: 'Impacto moderado',
                  sla: '8 horas',
                },
                {
                  value: 'low',
                  label: 'Baixa',
                  description: 'Impacto reduzido',
                  sla: '24 horas',
                },
              ].map((priority) => (
                <label
                  key={priority.value}
                  className={`priority-card priority-card--${priority.value} ${
                    form.priority === priority.value ? 'is-selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={priority.value}
                    checked={form.priority === priority.value}
                    onChange={onChange}
                  />

                  <span className="priority-card__content">
                    <span className="priority-card__top">
                      <span className="priority-card__title">
                        <i aria-hidden="true" />
                        <strong>{priority.label}</strong>
                      </span>

                      <span className="priority-card__check" aria-hidden="true">
                        <Icon name="check" size={13} />
                      </span>
                    </span>

                    <span className="priority-card__description">
                      {priority.description}
                    </span>

                    <span className="priority-card__sla">
                      <span>SLA</span>
                      <strong>{priority.sla}</strong>
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <footer className="new-ticket-form__footer">
            <button
              type="button"
              className="new-ticket-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button type="submit" className="new-ticket-primary">
              <Icon name="plus" size={16} />
              Criar chamado
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}

export default function App() {
  const {
    tickets,
    team,
    preferences,
    openTickets,
    createTicket,
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
    () => tickets[0]?.id ?? null,
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [replyText, setReplyText] = useState('')
  const [composerMode, setComposerMode] = useState('reply')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [newTicketForm, setNewTicketForm] = useState(EMPTY_FORM)
  const [toast, setToast] = useState('')

  const searchRef = useRef(null)
  const logoPath = `${import.meta.env.BASE_URL}imagem/logo2026.png`

  useEffect(() => {
    document.documentElement.dataset.theme = preferences?.theme ?? 'dark'
  }, [preferences?.theme])

  useEffect(() => {
    if (!tickets.length) {
      setSelectedTicketId(null)
      return
    }

    if (!tickets.some((ticket) => ticket.id === selectedTicketId)) {
      setSelectedTicketId(tickets[0].id)
    }
  }, [selectedTicketId, tickets])

  useEffect(() => {
    if (!toast) return undefined

    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function handleKeyboard(event) {
      const key = event.key.toLowerCase()

      if ((event.ctrlKey || event.metaKey) && key === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }

      if ((event.ctrlKey || event.metaKey) && key === 'n') {
        event.preventDefault()
        setNewTicketOpen(true)
      }

      if (event.key === 'Escape' && newTicketOpen) {
        setNewTicketOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [newTicketOpen])

  const selectedTicket = useMemo(
    () =>
      tickets.find((ticket) => ticket.id === selectedTicketId) ??
      tickets[0] ??
      null,
    [selectedTicketId, tickets],
  )

  const filterCounts = useMemo(() => {
    const counts = {
      all: tickets.length,
      new: 0,
      in_progress: 0,
      waiting: 0,
      resolved: 0,
    }

    tickets.forEach((ticket) => {
      if (counts[ticket.status] !== undefined) {
        counts[ticket.status] += 1
      }
    })

    return counts
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')

    return tickets
      .filter((ticket) => {
        const matchesStatus =
          statusFilter === 'all' || ticket.status === statusFilter

        const requester = getRequester(ticket)
        const assignee =
          team.find((member) => member.id === ticket.assigneeId)?.name ?? ''

        const haystack = [
          ticket.code,
          ticket.subject,
          getTicketDescription(ticket),
          requester.name,
          requester.email,
          requester.department,
          CATEGORY_LABELS[ticket.category] ?? ticket.category,
          PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
          STATUS_LABELS[ticket.status] ?? ticket.status,
          assignee,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('pt-BR')

        return matchesStatus && (!term || haystack.includes(term))
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )
  }, [search, statusFilter, team, tickets])

  const selectedRequester = selectedTicket
    ? getRequester(selectedTicket)
    : null

  const selectedAssignee = selectedTicket
    ? team.find((member) => member.id === selectedTicket.assigneeId)
    : null

  const slaState = selectedTicket
    ? getSlaState(selectedTicket)
    : 'healthy'

  const slaRemaining = selectedTicket
    ? getRemainingMs(selectedTicket)
    : 0

  const highPriorityTickets = openTickets.filter(
    (ticket) => ticket.priority === 'high',
  ).length

  const waitingTickets = openTickets.filter(
    (ticket) => ticket.status === 'waiting',
  ).length

  const eventCount = selectedTicket
    ? 1 +
      (selectedTicket.replies?.length ?? 0) +
      (selectedTicket.internalNotes?.length ?? 0)
    : 0

  function handleSelectTicket(ticketId) {
    setSelectedTicketId(ticketId)
    setReplyText('')
    setComposerMode('reply')
    setDetailsOpen(false)
  }

  function handleComposerSubmit(event) {
    event.preventDefault()

    if (!selectedTicket || !replyText.trim()) return
    if (selectedTicket.status === 'resolved') return

    if (composerMode === 'note') {
      addNoteToTicket(selectedTicket.id, replyText.trim())
      setToast('Nota interna registrada.')
    } else {
      replyToTicket(selectedTicket.id, replyText.trim())
      setToast('Resposta registrada no chamado.')
    }

    setReplyText('')
  }

  function handleComposerKeyDown(event) {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === 'Enter' &&
      replyText.trim()
    ) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function handleResolve() {
    if (!selectedTicket) return
    closeTicket(selectedTicket.id)
    setToast(`${formatTicketCode(selectedTicket.code)} resolvido.`)
  }

  function handleReopen() {
    if (!selectedTicket) return
    reopenResolvedTicket(selectedTicket.id)
    setToast(`${formatTicketCode(selectedTicket.code)} reaberto.`)
  }

  function handleWaiting() {
    if (!selectedTicket || selectedTicket.status === 'resolved') return
    setTicketWaiting(selectedTicket.id)
    setToast('Chamado marcado como aguardando.')
  }

  function handlePriorityChange(event) {
    if (!selectedTicket) return
    setTicketPriority(selectedTicket.id, event.target.value)
    setToast('Prioridade e SLA atualizados.')
  }

  function handleAssigneeChange(event) {
    if (!selectedTicket) return
    setTicketAssignee(selectedTicket.id, event.target.value || null)
    setToast('Responsável atualizado.')
  }

  function handleThemeToggle() {
    setTheme(preferences?.theme === 'light' ? 'dark' : 'light')
  }

  function handleNewTicketChange(event) {
    const { name, value } = event.target
    setNewTicketForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleNewTicketSubmit(event) {
    event.preventDefault()

    const ticket = createTicket({
      requesterName: newTicketForm.requesterName.trim(),
      requesterEmail: newTicketForm.requesterEmail.trim(),
      department: newTicketForm.department.trim(),
      subject: newTicketForm.subject.trim(),
      category: newTicketForm.category,
      description: newTicketForm.description.trim(),
      priority: newTicketForm.priority,
      assigneeId: newTicketForm.assigneeId || null,
    })

    if (!ticket) return

    setSelectedTicketId(ticket.id)
    setStatusFilter('all')
    setSearch('')
    setNewTicketForm(EMPTY_FORM)
    setNewTicketOpen(false)
    setToast(`${formatTicketCode(ticket.code)} criado com sucesso.`)
  }

  function closeNewTicket() {
    setNewTicketOpen(false)
  }

  return (
    <div className="support-app">
      <aside className="nav-rail" aria-label="Navegação principal">
        <div className="nav-rail__brand">
          <img src={logoPath} alt="LTHS Tecnologia" />
        </div>

        <nav className="nav-rail__nav">
          <button
            type="button"
            className="is-active"
            aria-label="Fila de chamados"
          >
            <Icon name="inbox" />
          </button>

          <button
            type="button"
            aria-label="Novo chamado"
            onClick={() => setNewTicketOpen(true)}
          >
            <Icon name="plus" />
          </button>

          <button
            type="button"
            aria-label="Buscar chamados"
            onClick={() => searchRef.current?.focus()}
          >
            <Icon name="search" />
          </button>

          <button
            type="button"
            aria-label="Equipe"
            onClick={() => setDetailsOpen((open) => !open)}
          >
            <Icon name="users" />
          </button>
        </nav>

        <button
          type="button"
          className="nav-rail__help"
          aria-label={
            preferences?.theme === 'light'
              ? 'Ativar modo escuro'
              : 'Ativar modo claro'
          }
          onClick={handleThemeToggle}
        >
          <Icon
            name={preferences?.theme === 'light' ? 'moon' : 'sun'}
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
            type="button"
            className="queue-create"
            onClick={() => setNewTicketOpen(true)}
          >
            <Icon name="plus" size={16} />
            Novo
          </button>
        </header>

        <div className="queue-panel__title">
          <div>
            <span>FILA DE ATENDIMENTO</span>
            <h1>Chamados</h1>
          </div>
          <strong>{openTickets.length}</strong>
        </div>

        <label className="queue-search">
          <Icon name="search" size={16} />
          <input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por código, assunto ou pessoa"
            aria-label="Buscar chamados"
          />
          <kbd>Ctrl K</kbd>
        </label>

        <div className="queue-filters" aria-label="Filtros por status">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={statusFilter === filter.id ? 'is-active' : ''}
              onClick={() => setStatusFilter(filter.id)}
            >
              <span>{filter.label}</span>
              <small>{filterCounts[filter.id]}</small>
            </button>
          ))}
        </div>

        <div className="ticket-list">
          {filteredTickets.length ? (
            filteredTickets.map((ticket) => {
              const requester = getRequester(ticket)
              const active = ticket.id === selectedTicket?.id

              return (
                <button
                  key={ticket.id}
                  type="button"
                  className={`ticket-row ${active ? 'is-active' : ''}`}
                  data-priority={ticket.priority}
                  data-status={ticket.status}
                  onClick={() => handleSelectTicket(ticket.id)}
                >
                  <div className="ticket-row__top">
                    <span>{formatTicketCode(ticket.code)}</span>
                    <time>{formatCompactDate(ticket.updatedAt)}</time>
                  </div>

                  <strong className="ticket-row__subject">
                    {ticket.subject}
                  </strong>

                  <p>{requester.name}</p>

                  <div className="ticket-row__bottom">
                    <span>{PRIORITY_LABELS[ticket.priority]}</span>
                    <span>{STATUS_LABELS[ticket.status]}</span>
                  </div>
                </button>
              )
            })
          ) : (
            <div className="queue-empty-state">
              <Icon name="search" size={24} />
              <strong>Nenhum chamado encontrado</strong>
              <p>Altere a busca ou selecione outro status.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setStatusFilter('all')
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <footer className="queue-health">
          <div>
            <span>Alta prioridade</span>
            <strong>{highPriorityTickets}</strong>
          </div>

          <div>
            <span>Aguardando</span>
            <strong>{waitingTickets}</strong>
          </div>
        </footer>
      </aside>

      <main className="ticket-workspace">
        {selectedTicket ? (
          <>
            <section className="ticket-document">
              <header className="ticket-document__header">
                <div className="ticket-document__identity">
                  <div className="ticket-document__eyebrow">
                    <span>{formatTicketCode(selectedTicket.code)}</span>
                    <i />
                    <span>
                      {CATEGORY_LABELS[selectedTicket.category] ??
                        selectedTicket.category}
                    </span>
                    <i />
                    <span data-status={selectedTicket.status}>
                      {STATUS_LABELS[selectedTicket.status]}
                    </span>
                  </div>

                  <h2>{selectedTicket.subject}</h2>

                  <p>{getTicketDescription(selectedTicket)}</p>
                </div>

                <div
                  className="ticket-document__sla"
                  data-state={slaState}
                >
                  <span>SLA</span>
                  <strong>{formatSlaRemaining(slaRemaining)}</strong>
                  <small>{getSlaLabel(slaState)}</small>
                </div>
              </header>

              <div className="ticket-document__meta">
                <div>
                  <span>SOLICITANTE</span>
                  <strong>{selectedRequester.name}</strong>
                  <small>{selectedRequester.email || 'Sem e-mail'}</small>
                </div>

                <div>
                  <span>DEPARTAMENTO</span>
                  <strong>{selectedRequester.department}</strong>
                  <small>
                    Criado {formatCompactDate(selectedTicket.createdAt)}
                  </small>
                </div>

                <div>
                  <span>RESPONSÁVEL</span>
                  <strong>
                    {selectedAssignee?.name ?? 'Não atribuído'}
                  </strong>
                  <small>
                    {selectedAssignee?.role ?? 'Aguardando atribuição'}
                  </small>
                </div>

                <button
                  type="button"
                  className={`ticket-document__details-toggle ${
                    detailsOpen ? 'is-open' : ''
                  }`}
                  onClick={() => setDetailsOpen((open) => !open)}
                >
                  <span>DETALHES</span>
                  <strong>{detailsOpen ? 'Ocultar' : 'Ver contexto'}</strong>
                  <Icon name="arrow" size={15} />
                </button>
              </div>

              {detailsOpen && (
                <div className="ticket-details">
                  <div>
                    <span>E-mail</span>
                    <strong>
                      {selectedRequester.email || 'Não informado'}
                    </strong>
                  </div>

                  <div>
                    <span>Categoria</span>
                    <strong>
                      {CATEGORY_LABELS[selectedTicket.category] ??
                        selectedTicket.category}
                    </strong>
                  </div>

                  <div>
                    <span>Criado em</span>
                    <strong>
                      {formatDateTime(selectedTicket.createdAt)}
                    </strong>
                  </div>

                  <div>
                    <span>Atualizado em</span>
                    <strong>
                      {formatDateTime(selectedTicket.updatedAt)}
                    </strong>
                  </div>
                </div>
              )}

              <div className="ticket-document__body">
                <section
                  key={selectedTicket.id}
                  className="conversation-panel"
                >
                  <header className="conversation-heading">
                    <div>
                      <span>REGISTRO DO ATENDIMENTO</span>
                      <h3>Histórico do chamado</h3>
                    </div>
                    <strong>
                      {eventCount} {eventCount === 1 ? 'evento' : 'eventos'}
                    </strong>
                  </header>

                  <div className="conversation-timeline">
                    <TicketMessage
                      type="requester"
                      author={selectedRequester.name}
                      message={getTicketDescription(selectedTicket)}
                      createdAt={selectedTicket.createdAt}
                    />

                    {(selectedTicket.replies ?? []).map((reply) => (
                      <TicketMessage
                        key={reply.id}
                        type="reply"
                        author={getMessageAuthor(reply)}
                        message={reply.message}
                        createdAt={reply.createdAt}
                      />
                    ))}

                    {(selectedTicket.internalNotes ?? []).map((note) => (
                      <TicketMessage
                        key={note.id}
                        type="note"
                        author={getMessageAuthor(note)}
                        message={note.message}
                        createdAt={note.createdAt}
                      />
                    ))}
                  </div>

                  {selectedTicket.status === 'resolved' ? (
                    <div className="resolved-composer-state">
                      <Icon name="check" />
                      <div>
                        <strong>Chamado concluído</strong>
                        <p>
                          Reabra o ticket para registrar uma nova interação.
                        </p>
                      </div>
                      <button type="button" onClick={handleReopen}>
                        Reabrir chamado
                      </button>
                    </div>
                  ) : (
                    <form
                      className="reply-composer"
                      onSubmit={handleComposerSubmit}
                    >
                      <div className="reply-composer__tabs">
                        <button
                          type="button"
                          className={
                            composerMode === 'reply' ? 'is-active' : ''
                          }
                          onClick={() => setComposerMode('reply')}
                        >
                          Resposta pública
                        </button>

                        <button
                          type="button"
                          className={
                            composerMode === 'note' ? 'is-active' : ''
                          }
                          onClick={() => setComposerMode('note')}
                        >
                          Nota interna
                        </button>
                      </div>

                      <textarea
                        value={replyText}
                        onChange={(event) => setReplyText(event.target.value)}
                        onKeyDown={handleComposerKeyDown}
                        placeholder={
                          composerMode === 'note'
                            ? 'Registre uma observação visível apenas para a equipe...'
                            : 'Escreva uma resposta para o solicitante...'
                        }
                        rows="4"
                      />

                      <footer className="reply-composer__footer">
                        <span>
                          {composerMode === 'note'
                            ? 'Somente a equipe verá esta nota.'
                            : 'A resposta será registrada no histórico.'}
                        </span>

                        <button
                          type="submit"
                          disabled={!replyText.trim()}
                        >
                          <Icon name="send" size={15} />
                          {composerMode === 'note'
                            ? 'Registrar nota'
                            : 'Enviar resposta'}
                        </button>
                      </footer>
                    </form>
                  )}
                </section>
              </div>
            </section>

            <div className="operations-bar">
              <label className="operations-bar__field">
                <span>RESPONSÁVEL</span>
                <select
                  value={selectedTicket.assigneeId ?? ''}
                  onChange={handleAssigneeChange}
                  disabled={selectedTicket.status === 'resolved'}
                >
                  <option value="">Não atribuído</option>
                  {team.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="operations-bar__field">
                <span>PRIORIDADE</span>
                <select
                  value={selectedTicket.priority}
                  onChange={handlePriorityChange}
                  disabled={selectedTicket.status === 'resolved'}
                >
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </label>

              <div
                className="operations-bar__sla"
                data-state={slaState}
              >
                <span>SLA ATUAL</span>
                <strong>{formatSlaRemaining(slaRemaining)}</strong>
                <small>{getSlaLabel(slaState)}</small>
              </div>

              <div className="operations-bar__actions">
                {selectedTicket.status === 'resolved' ? (
                  <button
                    type="button"
                    className="operation-primary"
                    onClick={handleReopen}
                  >
                    Reabrir
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="operation-secondary"
                      onClick={handleWaiting}
                      disabled={selectedTicket.status === 'waiting'}
                    >
                      <Icon name="clock" size={15} />
                      {selectedTicket.status === 'waiting'
                        ? 'Aguardando'
                        : 'Aguardar'}
                    </button>

                    <button
                      type="button"
                      className="operation-primary"
                      onClick={handleResolve}
                    >
                      <Icon name="check" size={15} />
                      Resolver
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        ) : (
          <section className="workspace-empty-state">
            <div>
              <Icon name="inbox" size={28} />
              <span>SERVICE DESK</span>
              <h2>A fila está vazia</h2>
              <p>Crie um chamado para iniciar o atendimento.</p>
              <button
                type="button"
                onClick={() => setNewTicketOpen(true)}
              >
                <Icon name="plus" size={16} />
                Novo chamado
              </button>
            </div>
          </section>
        )}
      </main>

      <NewTicketDrawer
        open={newTicketOpen}
        form={newTicketForm}
        team={team}
        onChange={handleNewTicketChange}
        onClose={closeNewTicket}
        onSubmit={handleNewTicketSubmit}
      />

      {toast && (
        <div className="app-toast" role="status">
          <Icon name="check" size={16} />
          <span>{toast}</span>
          <button
            type="button"
            onClick={() => setToast('')}
            aria-label="Fechar aviso"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
