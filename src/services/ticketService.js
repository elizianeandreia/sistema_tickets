const SLA_HOURS = {
  high: 2,
  medium: 8,
  low: 24,
}

const VALID_PRIORITIES = [
  'high',
  'medium',
  'low',
]

const VALID_STATUSES = [
  'new',
  'in_progress',
  'waiting',
  'resolved',
]

function generateId(prefix = 'item') {
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 10)

  return `${prefix}-${Date.now()}-${randomPart}`
}

function normalizeDate(value = new Date()) {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Data inválida.')
  }

  return date
}

function createActivity({
  type,
  author,
  message,
  createdAt,
  meta = {},
}) {
  return {
    id: generateId('activity'),
    type,
    author,
    message,
    createdAt: normalizeDate(
      createdAt
    ).toISOString(),
    meta,
  }
}

export function getSlaHours(
  priority
) {
  return (
    SLA_HOURS[priority] ??
    SLA_HOURS.medium
  )
}

export function calculateSlaDeadline(
  createdAt,
  priority
) {
  const created =
    normalizeDate(createdAt)

  const hours =
    getSlaHours(priority)

  return new Date(
    created.getTime() +
      hours * 60 * 60 * 1000
  ).toISOString()
}

export function getSlaState(
  ticket,
  referenceDate = new Date()
) {
  if (!ticket) {
    return {
      state: 'unknown',
      remainingMs: 0,
      percentage: 0,
    }
  }

  if (
    ticket.status === 'resolved'
  ) {
    return {
      state: 'resolved',
      remainingMs: 0,
      percentage: 100,
    }
  }

  const now =
    normalizeDate(referenceDate)

  const created =
    normalizeDate(
      ticket.createdAt
    )

  const deadline =
    normalizeDate(
      ticket.slaDeadline
    )

  const totalDuration =
    deadline.getTime() -
    created.getTime()

  const remainingMs =
    deadline.getTime() -
    now.getTime()

  if (remainingMs <= 0) {
    return {
      state: 'breached',
      remainingMs,
      percentage: 100,
    }
  }

  const elapsed =
    now.getTime() -
    created.getTime()

  const percentage =
    totalDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (elapsed /
              totalDuration) *
              100
          )
        )
      : 0

  if (percentage >= 80) {
    return {
      state: 'critical',
      remainingMs,
      percentage,
    }
  }

  if (percentage >= 50) {
    return {
      state: 'attention',
      remainingMs,
      percentage,
    }
  }

  return {
    state: 'healthy',
    remainingMs,
    percentage,
  }
}

export function formatSlaRemaining(
  remainingMs
) {
  if (
    typeof remainingMs !==
    'number'
  ) {
    return 'Indisponível'
  }

  const breached =
    remainingMs < 0

  const absoluteMs =
    Math.abs(remainingMs)

  const totalMinutes =
    Math.floor(
      absoluteMs / 60_000
    )

  const hours =
    Math.floor(
      totalMinutes / 60
    )

  const minutes =
    totalMinutes % 60

  let formatted = ''

  if (hours > 0) {
    formatted += `${hours}h`
  }

  if (
    minutes > 0 ||
    hours === 0
  ) {
    if (formatted) {
      formatted += ' '
    }

    formatted += `${minutes}min`
  }

  return breached
    ? `${formatted} excedido`
    : `${formatted} restantes`
}

export function addReply(
  ticket,
  {
    message,
    author = 'Equipe LTHS',
    createdAt = new Date(),
  }
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.'
    )
  }

  const normalizedMessage =
    String(message ?? '').trim()

  if (!normalizedMessage) {
    throw new Error(
      'A resposta não pode estar vazia.'
    )
  }

  if (
    ticket.status === 'resolved'
  ) {
    throw new Error(
      'Não é possível responder um ticket resolvido. Reabra o ticket primeiro.'
    )
  }

  const now =
    normalizeDate(createdAt)

  const reply = {
    id: generateId('reply'),
    author,
    message: normalizedMessage,
    createdAt: now.toISOString(),
  }

  const previousStatus =
    ticket.status

  const nextStatus =
    previousStatus === 'new'
      ? 'in_progress'
      : previousStatus

  const activity = [
    ...(ticket.activity ?? []),

    createActivity({
      type: 'reply_added',
      author,
      message:
        'Resposta adicionada ao chamado',
      createdAt: now,
    }),
  ]

  if (
    previousStatus === 'new'
  ) {
    activity.push(
      createActivity({
        type: 'status_changed',
        author,
        message:
          'Status alterado de Novo para Em atendimento',
        createdAt: now,
        meta: {
          from: 'new',
          to: 'in_progress',
        },
      })
    )
  }

  return {
    ...ticket,

    status: nextStatus,

    replies: [
      ...(ticket.replies ?? []),
      reply,
    ],

    updatedAt:
      now.toISOString(),

    activity,
  }
}

export function addInternalNote(
  ticket,
  {
    message,
    author = 'Equipe LTHS',
    createdAt = new Date(),
  }
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.'
    )
  }

  const normalizedMessage =
    String(message ?? '').trim()

  if (!normalizedMessage) {
    throw new Error(
      'A nota interna não pode estar vazia.'
    )
  }

  const now =
    normalizeDate(createdAt)

  const note = {
    id: generateId('note'),
    author,
    message: normalizedMessage,
    createdAt: now.toISOString(),
  }

  return {
    ...ticket,

    internalNotes: [
      ...(ticket.internalNotes ?? []),
      note,
    ],

    updatedAt:
      now.toISOString(),

    activity: [
      ...(ticket.activity ?? []),

      createActivity({
        type:
          'internal_note_added',
        author,
        message:
          'Nota interna adicionada',
        createdAt: now,
      }),
    ],
  }
}

export function changeStatus(
  ticket,
  status,
  {
    author = 'Equipe LTHS',
    createdAt = new Date(),
  } = {}
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.'
    )
  }

  if (
    !VALID_STATUSES.includes(
      status
    )
  ) {
    throw new Error(
      'Status inválido.'
    )
  }

  if (
    ticket.status === status
  ) {
    return ticket
  }

  const now =
    normalizeDate(createdAt)

  const previousStatus =
    ticket.status

  return {
    ...ticket,

    status,

    resolvedAt:
      status === 'resolved'
        ? now.toISOString()
        : null,

    updatedAt:
      now.toISOString(),

    activity: [
      ...(ticket.activity ?? []),

      createActivity({
        type: 'status_changed',
        author,
        message:
          'Status do chamado alterado',
        createdAt: now,
        meta: {
          from: previousStatus,
          to: status,
        },
      }),
    ],
  }
}

export function markWaiting(
  ticket,
  options = {}
) {
  return changeStatus(
    ticket,
    'waiting',
    options
  )
}

export function resolveTicket(
  ticket,
  options = {}
) {
  return changeStatus(
    ticket,
    'resolved',
    options
  )
}

export function reopenTicket(
  ticket,
  {
    author = 'Equipe LTHS',
    createdAt = new Date(),
  } = {}
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.'
    )
  }

  if (
    ticket.status !== 'resolved'
  ) {
    throw new Error(
      'Somente tickets resolvidos podem ser reabertos.'
    )
  }

  const now =
    normalizeDate(createdAt)

  return {
    ...ticket,

    status: 'in_progress',

    resolvedAt: null,

    updatedAt:
      now.toISOString(),

    activity: [
      ...(ticket.activity ?? []),

      createActivity({
        type: 'ticket_reopened',
        author,
        message:
          'Chamado reaberto',
        createdAt: now,
        meta: {
          from: 'resolved',
          to: 'in_progress',
        },
      }),
    ],
  }
}

export function changePriority(
  ticket,
  priority,
  {
    author = 'Equipe LTHS',
    createdAt = new Date(),
  } = {}
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.'
    )
  }

  if (
    !VALID_PRIORITIES.includes(
      priority
    )
  ) {
    throw new Error(
      'Prioridade inválida.'
    )
  }

  if (
    ticket.priority === priority
  ) {
    return ticket
  }

  const now =
    normalizeDate(createdAt)

  const previousPriority =
    ticket.priority

  const slaDeadline =
    calculateSlaDeadline(
      ticket.createdAt,
      priority
    )

  return {
    ...ticket,

    priority,

    slaDeadline,

    updatedAt:
      now.toISOString(),

    activity: [
      ...(ticket.activity ?? []),

      createActivity({
        type: 'priority_changed',
        author,
        message:
          'Prioridade do chamado alterada',
        createdAt: now,
        meta: {
          from:
            previousPriority,
          to: priority,
          slaDeadline,
        },
      }),
    ],
  }
}

export function changeAssignee(
  ticket,
  assigneeId,
  {
    author = 'Equipe LTHS',
    createdAt = new Date(),
  } = {}
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.'
    )
  }

  const normalizedAssignee =
    assigneeId || null

  if (
    ticket.assigneeId ===
    normalizedAssignee
  ) {
    return ticket
  }

  const now =
    normalizeDate(createdAt)

  const previousAssignee =
    ticket.assigneeId ?? null

  return {
    ...ticket,

    assigneeId:
      normalizedAssignee,

    updatedAt:
      now.toISOString(),

    activity: [
      ...(ticket.activity ?? []),

      createActivity({
        type: 'assignee_changed',
        author,

        message:
          normalizedAssignee
            ? 'Responsável pelo chamado alterado'
            : 'Responsável pelo chamado removido',

        createdAt: now,

        meta: {
          from:
            previousAssignee,
          to:
            normalizedAssignee,
        },
      }),
    ],
  }
}