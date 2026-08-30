import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  addInternalNote,
  addReply,
  calculateSlaDeadline,
  changeAssignee,
  changePriority,
  markWaiting,
  reopenTicket,
  resolveTicket,
} from '../services/ticketService.js'
import {
  loadWorkspace,
  saveWorkspace,
} from '../utils/storage.js'

const ServiceDeskContext = createContext(null)

const DEFAULT_AUTHOR = 'Equipe LTHS'

function createId(prefix = 'item') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`
}

function getNextTicketCode(tickets) {
  const highest = tickets.reduce((current, ticket) => {
    const numeric = Number(
      String(ticket?.code ?? '').replace(/\D/g, ''),
    )

    return Number.isFinite(numeric)
      ? Math.max(current, numeric)
      : current
  }, 1000)

  return `TK-${highest + 1}`
}

export function ServiceDeskProvider({ children }) {
  const [initialWorkspace] = useState(() => loadWorkspace())

  const [tickets, setTickets] = useState(initialWorkspace.tickets)
  const [team, setTeam] = useState(initialWorkspace.team)
  const [preferences, setPreferences] = useState(
    initialWorkspace.preferences,
  )

  useEffect(() => {
    saveWorkspace(window.localStorage, {
      tickets,
      team,
      preferences,
      version: initialWorkspace.version ?? 1,
    })
  }, [
    initialWorkspace.version,
    preferences,
    team,
    tickets,
  ])

  function updateTicket(ticketId, updater) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) => {
        if (ticket.id !== ticketId) {
          return ticket
        }

        try {
          return updater(ticket)
        } catch (error) {
          console.error(error)
          return ticket
        }
      }),
    )
  }

  function createTicket(input) {
    const now = new Date()
    const createdAt = now.toISOString()
    const priority = input.priority || 'medium'

    const ticket = {
      id: createId('ticket'),
      code: getNextTicketCode(tickets),
      subject: input.subject,
      description: input.description,
      requester: {
        name: input.requesterName,
        email: input.requesterEmail,
        department: input.department || 'Não informado',
      },
      category: input.category || 'general',
      priority,
      status: 'new',
      assigneeId: input.assigneeId || null,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: null,
      slaDeadline: calculateSlaDeadline(createdAt, priority),
      replies: [],
      internalNotes: [],
      activity: [
        {
          id: createId('activity'),
          type: 'ticket_created',
          author: DEFAULT_AUTHOR,
          message: 'Chamado criado',
          createdAt,
        },
      ],
    }

    setTickets((currentTickets) => [ticket, ...currentTickets])
    return ticket
  }

  function replyToTicket(ticketId, message, author = DEFAULT_AUTHOR) {
    updateTicket(ticketId, (ticket) =>
      addReply(ticket, {
        message,
        author,
        createdAt: new Date(),
      }),
    )
  }

  function addNoteToTicket(ticketId, message, author = DEFAULT_AUTHOR) {
    updateTicket(ticketId, (ticket) =>
      addInternalNote(ticket, {
        message,
        author,
        createdAt: new Date(),
      }),
    )
  }

  function setTicketWaiting(ticketId, author = DEFAULT_AUTHOR) {
    updateTicket(ticketId, (ticket) =>
      markWaiting(ticket, {
        author,
        createdAt: new Date(),
      }),
    )
  }

  function closeTicket(ticketId, author = DEFAULT_AUTHOR) {
    updateTicket(ticketId, (ticket) =>
      resolveTicket(ticket, {
        author,
        createdAt: new Date(),
      }),
    )
  }

  function reopenResolvedTicket(ticketId, author = DEFAULT_AUTHOR) {
    updateTicket(ticketId, (ticket) =>
      reopenTicket(ticket, {
        author,
        createdAt: new Date(),
      }),
    )
  }

  function setTicketPriority(ticketId, priority, author = DEFAULT_AUTHOR) {
    updateTicket(ticketId, (ticket) =>
      changePriority(ticket, priority, {
        author,
        createdAt: new Date(),
      }),
    )
  }

  function setTicketAssignee(ticketId, assigneeId, author = DEFAULT_AUTHOR) {
    updateTicket(ticketId, (ticket) =>
      changeAssignee(ticket, assigneeId, {
        author,
        createdAt: new Date(),
      }),
    )
  }

  function setTheme(theme) {
    setPreferences((current) => ({
      ...current,
      theme,
    }))
  }

  const openTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== 'resolved'),
    [tickets],
  )

  const resolvedTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'resolved'),
    [tickets],
  )

  const value = useMemo(
    () => ({
      tickets,
      team,
      preferences,
      openTickets,
      resolvedTickets,
      createTicket,
      replyToTicket,
      addNoteToTicket,
      setTicketWaiting,
      closeTicket,
      reopenResolvedTicket,
      setTicketPriority,
      setTicketAssignee,
      setTheme,
    }),
    [
      openTickets,
      preferences,
      resolvedTickets,
      team,
      tickets,
    ],
  )

  return (
    <ServiceDeskContext.Provider value={value}>
      {children}
    </ServiceDeskContext.Provider>
  )
}

export function useServiceDesk() {
  const context = useContext(ServiceDeskContext)

  if (!context) {
    throw new Error(
      'useServiceDesk deve ser usado dentro de ServiceDeskProvider',
    )
  }

  return context
}