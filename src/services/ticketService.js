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
  if (
    typeof crypto !== 'undefined' &&
    crypto.randomUUID
  ) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 10)

  return `${prefix}-${Date.now()}-${randomPart}`
}

function normalizeDate(
  value = new Date(),
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error('Data inválida.')
  }

  return date
}

function normalizeOptions(
  authorOrOptions,
  createdAt,
) {
  if (
    authorOrOptions &&
    typeof authorOrOptions === 'object' &&
    !(authorOrOptions instanceof Date)
  ) {
    return {
      author:
        authorOrOptions.author ||
        'Equipe LTHS',
      createdAt:
        authorOrOptions.createdAt ||
        new Date(),
    }
  }

  return {
    author:
      authorOrOptions ||
      'Equipe LTHS',
    createdAt:
      createdAt || new Date(),
  }
}

function normalizeMessageOptions(
  messageOrOptions,
  author,
  createdAt,
) {
  if (
    messageOrOptions &&
    typeof messageOrOptions === 'object'
  ) {
    return {
      message:
        messageOrOptions.message,
      author:
        messageOrOptions.author ||
        'Equipe LTHS',
      createdAt:
        messageOrOptions.createdAt ||
        new Date(),
    }
  }

  return {
    message: messageOrOptions,
    author:
      author || 'Equipe LTHS',
    createdAt:
      createdAt || new Date(),
  }
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
      createdAt,
    ).toISOString(),
    meta,
  }
}

export function getSlaHours(
  priority,
) {
  return (
    SLA_HOURS[priority] ??
    SLA_HOURS.medium
  )
}

export function calculateSlaDeadline(
  createdAt,
  priority,
) {
  const created =
    normalizeDate(createdAt)

  const hours =
    getSlaHours(priority)

  return new Date(
    created.getTime() +
      hours * 60 * 60 * 1000,
  ).toISOString()
}

export function getRemainingMs(
  ticket,
  referenceDate = new Date(),
) {
  if (!ticket?.slaDeadline) {
    return 0
  }

  const deadline =
    normalizeDate(
      ticket.slaDeadline,
    ).getTime()

  const reference =
    ticket.status === 'resolved' &&
    ticket.resolvedAt
      ? normalizeDate(
          ticket.resolvedAt,
        ).getTime()
      : normalizeDate(
          referenceDate,
        ).getTime()

  return deadline - reference
}

export function getSlaState(
  ticket,
  referenceDate = new Date(),
) {
  if (!ticket) {
    return 'unknown'
  }

  const remainingMs =
    getRemainingMs(
      ticket,
      referenceDate,
    )

  if (
    ticket.status === 'resolved'
  ) {
    return remainingMs < 0
      ? 'overdue'
      : 'healthy'
  }

  if (remainingMs < 0) {
    return 'overdue'
  }

  const totalDuration =
    getSlaHours(
      ticket.priority,
    ) *
    60 *
    60 *
    1000

  if (totalDuration <= 0) {
    return 'healthy'
  }

  const ratio =
    remainingMs / totalDuration

  if (ratio <= 0.25) {
    return 'critical'
  }

  if (ratio <= 0.5) {
    return 'warning'
  }

  return 'healthy'
}

export function formatSlaRemaining(
  remainingMs,
) {
  if (
    typeof remainingMs !==
      'number' ||
    !Number.isFinite(remainingMs)
  ) {
    return 'Indisponível'
  }

  const overdue =
    remainingMs < 0

  const absoluteMs =
    Math.abs(remainingMs)

  const totalMinutes =
    Math.floor(
      absoluteMs / 60_000,
    )

  const hours =
    Math.floor(
      totalMinutes / 60,
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

  return overdue
    ? `${formatted} excedido`
    : `${formatted} restantes`
}

export function addReply(
  ticket,
  messageOrOptions,
  author,
  createdAt,
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.',
    )
  }

  const options =
    normalizeMessageOptions(
      messageOrOptions,
      author,
      createdAt,
    )

  const normalizedMessage =
    String(
      options.message ?? '',
    ).trim()

  if (!normalizedMessage) {
    throw new Error(
      'A resposta não pode estar vazia.',
    )
  }

  if (
    ticket.status === 'resolved'
  ) {
    throw new Error(
      'Não é possível responder um ticket resolvido. Reabra o ticket primeiro.',
    )
  }

  const now =
    normalizeDate(
      options.createdAt,
    )

  const previousStatus =
    ticket.status

  const nextStatus =
    previousStatus === 'new'
      ? 'in_progress'
      : previousStatus

  const reply = {
    id: generateId('reply'),
    author: options.author,
    message: normalizedMessage,
    createdAt: now.toISOString(),
  }

  const activity = [
    ...(ticket.activity ?? []),
  ]

  if (
    previousStatus === 'new'
  ) {
    activity.push(
      createActivity({
        type: 'status_changed',
        author: options.author,
        message:
          'Status alterado de Novo para Em atendimento',
        createdAt: now,
        meta: {
          from: 'new',
          to: 'in_progress',
        },
      }),
    )
  }

  activity.push(
    createActivity({
      type: 'reply_added',
      author: options.author,
      message:
        'Resposta adicionada ao chamado',
      createdAt: now,
    }),
  )

  return {
    ...ticket,
    status: nextStatus,
    replies: [
      ...(ticket.replies ?? []),
      reply,
    ],
    updatedAt: now.toISOString(),
    activity,
  }
}

export function addInternalNote(
  ticket,
  messageOrOptions,
  author,
  createdAt,
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.',
    )
  }

  const options =
    normalizeMessageOptions(
      messageOrOptions,
      author,
      createdAt,
    )

  const normalizedMessage =
    String(
      options.message ?? '',
    ).trim()

  if (!normalizedMessage) {
    throw new Error(
      'A nota interna não pode estar vazia.',
    )
  }

  if (
    ticket.status === 'resolved'
  ) {
    throw new Error(
      'Não é possível adicionar nota em um ticket resolvido. Reabra o ticket primeiro.',
    )
  }

  const now =
    normalizeDate(
      options.createdAt,
    )

  const note = {
    id: generateId('note'),
    author: options.author,
    message: normalizedMessage,
    createdAt: now.toISOString(),
  }

  return {
    ...ticket,
    internalNotes: [
      ...(ticket.internalNotes ??
        []),
      note,
    ],
    updatedAt: now.toISOString(),
    activity: [
      ...(ticket.activity ?? []),
      createActivity({
        type:
          'internal_note_added',
        author: options.author,
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
  authorOrOptions,
  createdAt,
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.',
    )
  }

  if (
    !VALID_STATUSES.includes(
      status,
    )
  ) {
    throw new Error(
      'Status inválido.',
    )
  }

  if (
    ticket.status === status
  ) {
    return ticket
  }

  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  const now =
    normalizeDate(
      options.createdAt,
    )

  const previousStatus =
    ticket.status

  let type = 'status_changed'
  let message =
    'Status do chamado alterado'

  if (status === 'resolved') {
    type = 'ticket_resolved'
    message = 'Chamado finalizado'
  } else if (
    previousStatus ===
      'resolved' &&
    status === 'in_progress'
  ) {
    type = 'ticket_reopened'
    message = 'Chamado reaberto'
  }

  return {
    ...ticket,
    status,
    resolvedAt:
      status === 'resolved'
        ? now.toISOString()
        : null,
    updatedAt: now.toISOString(),
    activity: [
      ...(ticket.activity ?? []),
      createActivity({
        type,
        author: options.author,
        message,
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
  authorOrOptions,
  createdAt,
) {
  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  return changeStatus(
    ticket,
    'waiting',
    options,
  )
}

export function resolveTicket(
  ticket,
  authorOrOptions,
  createdAt,
) {
  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  return changeStatus(
    ticket,
    'resolved',
    options,
  )
}

export function reopenTicket(
  ticket,
  authorOrOptions,
  createdAt,
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.',
    )
  }

  if (
    ticket.status !== 'resolved'
  ) {
    throw new Error(
      'Somente tickets resolvidos podem ser reabertos.',
    )
  }

  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  return changeStatus(
    ticket,
    'in_progress',
    options,
  )
}

export function changePriority(
  ticket,
  priority,
  authorOrOptions,
  createdAt,
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.',
    )
  }

  if (
    !VALID_PRIORITIES.includes(
      priority,
    )
  ) {
    throw new Error(
      'Prioridade inválida.',
    )
  }

  if (
    ticket.priority === priority
  ) {
    return ticket
  }

  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  const now =
    normalizeDate(
      options.createdAt,
    )

  const previousPriority =
    ticket.priority

  const slaDeadline =
    calculateSlaDeadline(
      ticket.createdAt,
      priority,
    )

  return {
    ...ticket,
    priority,
    slaDeadline,
    updatedAt: now.toISOString(),
    activity: [
      ...(ticket.activity ?? []),
      createActivity({
        type: 'priority_changed',
        author: options.author,
        message:
          'Prioridade do chamado alterada',
        createdAt: now,
        meta: {
          from: previousPriority,
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
  authorOrOptions,
  createdAt,
) {
  if (!ticket) {
    throw new Error(
      'Ticket não informado.',
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

  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  const now =
    normalizeDate(
      options.createdAt,
    )

  const previousAssignee =
    ticket.assigneeId ?? null

  return {
    ...ticket,
    assigneeId:
      normalizedAssignee,
    updatedAt: now.toISOString(),
    activity: [
      ...(ticket.activity ?? []),
      createActivity({
        type: 'assignee_changed',
        author: options.author,
        message:
          normalizedAssignee
            ? 'Responsável pelo chamado alterado'
            : 'Responsável pelo chamado removido',
        createdAt: now,
        meta: {
          from: previousAssignee,
          to: normalizedAssignee,
        },
      }),
    ],
  }
}