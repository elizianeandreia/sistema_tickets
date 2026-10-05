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

  return `${prefix}-${Date.now()}-${Math.floor(
    Math.random() * 100000,
  )}`
}

function normalizeDate(value = new Date()) {
  const date =
    value instanceof Date
      ? value
      : new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return new Date().toISOString()
  }

  return date.toISOString()
}

function normalizeOptions(
  authorOrOptions,
  createdAt,
) {
  if (
    authorOrOptions &&
    typeof authorOrOptions ===
      'object' &&
    !(authorOrOptions instanceof Date)
  ) {
    return {
      author:
        authorOrOptions.author ||
        'Equipe LTHS',

      createdAt:
        normalizeDate(
          authorOrOptions.createdAt ??
            createdAt ??
            new Date(),
        ),
    }
  }

  return {
    author:
      authorOrOptions ||
      'Equipe LTHS',

    createdAt:
      normalizeDate(
        createdAt ??
          new Date(),
      ),
  }
}

function normalizeMessageOptions(
  messageOrOptions,
  author,
  createdAt,
) {
  if (
    messageOrOptions &&
    typeof messageOrOptions ===
      'object'
  ) {
    return {
      message: String(
        messageOrOptions.message ??
          '',
      ).trim(),

      author:
        messageOrOptions.author ||
        author ||
        'Equipe LTHS',

      createdAt:
        normalizeDate(
          messageOrOptions.createdAt ??
            createdAt ??
            new Date(),
        ),
    }
  }

  return {
    message: String(
      messageOrOptions ??
        '',
    ).trim(),

    author:
      author ||
      'Equipe LTHS',

    createdAt:
      normalizeDate(
        createdAt ??
          new Date(),
      ),
  }
}

function createActivity(
  type,
  message,
  author,
  createdAt,
) {
  return {
    id: generateId(
      'activity',
    ),

    type,

    author,

    message,

    createdAt,
  }
}

function getTime(value) {
  const time =
    new Date(value).getTime()

  return Number.isFinite(
    time,
  )
    ? time
    : null
}

function extendDeadline(
  deadline,
  milliseconds,
) {
  const deadlineTime =
    getTime(deadline)

  if (
    deadlineTime === null ||
    !Number.isFinite(
      milliseconds,
    ) ||
    milliseconds <= 0
  ) {
    return deadline
  }

  return new Date(
    deadlineTime +
      milliseconds,
  ).toISOString()
}

function getPausedDuration(
  ticket,
  endTime,
) {
  if (!ticket?.pausedAt) {
    return 0
  }

  const pausedTime =
    getTime(
      ticket.pausedAt,
    )

  const end =
    getTime(endTime)

  if (
    pausedTime === null ||
    end === null
  ) {
    return 0
  }

  return Math.max(
    0,
    end - pausedTime,
  )
}

export function getSlaHours(
  priority,
) {
  return (
    SLA_HOURS[
      priority
    ] ??
    SLA_HOURS.medium
  )
}

export function calculateSlaDeadline(
  createdAt,
  priority = 'medium',
) {
  const createdTime =
    getTime(createdAt)

  if (
    createdTime === null
  ) {
    return null
  }

  const hours =
    getSlaHours(priority)

  return new Date(
    createdTime +
      hours *
        60 *
        60 *
        1000,
  ).toISOString()
}

export function getRemainingMs(
  ticket,
  now = new Date(),
) {
  if (
    !ticket?.slaDeadline
  ) {
    return 0
  }

  const deadline =
    getTime(
      ticket.slaDeadline,
    )

  if (
    deadline === null
  ) {
    return 0
  }

  let referenceTime

  if (
    ticket.status ===
      'waiting' &&
    ticket.pausedAt
  ) {
    referenceTime =
      getTime(
        ticket.pausedAt,
      )
  } else if (
    ticket.status ===
      'resolved' &&
    ticket.resolvedAt
  ) {
    referenceTime =
      getTime(
        ticket.resolvedAt,
      )
  } else {
    referenceTime =
      getTime(now)
  }

  if (
    referenceTime ===
    null
  ) {
    return 0
  }

  return (
    deadline -
    referenceTime
  )
}

export function getSlaState(
  ticket,
  now = new Date(),
) {
  if (
    !ticket?.slaDeadline
  ) {
    return 'unknown'
  }

  const remaining =
    getRemainingMs(
      ticket,
      now,
    )

  if (
    remaining < 0
  ) {
    return 'overdue'
  }

  if (
    ticket.status ===
    'resolved'
  ) {
    return 'healthy'
  }

  const created =
    getTime(
      ticket.createdAt,
    )

  const deadline =
    getTime(
      ticket.slaDeadline,
    )

  if (
    created === null ||
    deadline === null ||
    deadline <= created
  ) {
    return 'healthy'
  }

  const total =
    deadline - created

  const ratio =
    remaining / total

  if (
    ratio <= 0.25
  ) {
    return 'critical'
  }

  if (
    ratio <= 0.5
  ) {
    return 'warning'
  }

  return 'healthy'
}

export function formatSlaRemaining(
  remainingMs,
) {
  if (
    !Number.isFinite(
      remainingMs,
    )
  ) {
    return 'SLA indisponível'
  }

  const overdue =
    remainingMs < 0

  const absolute =
    Math.abs(
      remainingMs,
    )

  const totalMinutes =
    Math.floor(
      absolute /
        60000,
    )

  const hours =
    Math.floor(
      totalMinutes / 60,
    )

  const minutes =
    totalMinutes % 60

  let value = ''

  if (hours > 0) {
    value += `${hours}h `
  }

  value += `${minutes}min`

  return overdue
    ? `${value} excedido`
    : `${value} restantes`
}

export function addReply(
  ticket,
  messageOrOptions,
  author,
  createdAt,
) {
  const options =
    normalizeMessageOptions(
      messageOrOptions,
      author,
      createdAt,
    )

  if (
    !ticket ||
    !options.message ||
    ticket.status ===
      'resolved'
  ) {
    return ticket
  }

  const nextStatus =
    ticket.status ===
    'new'
      ? 'in_progress'
      : ticket.status

  const reply = {
    id: generateId(
      'reply',
    ),

    message:
      options.message,

    author:
      options.author,

    createdAt:
      options.createdAt,
  }

  const activity =
    createActivity(
      'reply_added',
      'Resposta registrada',
      options.author,
      options.createdAt,
    )

  return {
    ...ticket,

    status:
      nextStatus,

    updatedAt:
      options.createdAt,

    replies: [
      ...(ticket.replies ??
        []),
      reply,
    ],

    activity: [
      ...(ticket.activity ??
        []),
      activity,
    ],
  }
}

export function addInternalNote(
  ticket,
  messageOrOptions,
  author,
  createdAt,
) {
  const options =
    normalizeMessageOptions(
      messageOrOptions,
      author,
      createdAt,
    )

  if (
    !ticket ||
    !options.message ||
    ticket.status ===
      'resolved'
  ) {
    return ticket
  }

  const note = {
    id: generateId(
      'note',
    ),

    message:
      options.message,

    author:
      options.author,

    createdAt:
      options.createdAt,
  }

  const activity =
    createActivity(
      'internal_note_added',
      'Nota interna registrada',
      options.author,
      options.createdAt,
    )

  return {
    ...ticket,

    updatedAt:
      options.createdAt,

    internalNotes: [
      ...(ticket.internalNotes ??
        []),
      note,
    ],

    activity: [
      ...(ticket.activity ??
        []),
      activity,
    ],
  }
}

export function changeStatus(
  ticket,
  status,
  authorOrOptions,
  createdAt,
) {
  if (
    !ticket ||
    !VALID_STATUSES.includes(
      status,
    )
  ) {
    return ticket
  }

  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  const previousStatus =
    ticket.status

  if (
    previousStatus ===
      status
  ) {
    return ticket
  }

  let nextDeadline =
    ticket.slaDeadline

  let nextPausedAt =
    ticket.pausedAt ??
    null

  if (
    previousStatus ===
      'waiting' &&
    status !== 'waiting' &&
    ticket.pausedAt
  ) {
    const pausedDuration =
      getPausedDuration(
        ticket,
        options.createdAt,
      )

    nextDeadline =
      extendDeadline(
        ticket.slaDeadline,
        pausedDuration,
      )

    nextPausedAt =
      null
  }

  if (
    status ===
      'waiting' &&
    previousStatus !==
      'waiting'
  ) {
    nextPausedAt =
      options.createdAt
  }

  let resolvedAt =
    ticket.resolvedAt ??
    null

  if (
    status ===
    'resolved'
  ) {
    resolvedAt =
      options.createdAt

    nextPausedAt =
      null
  } else {
    resolvedAt =
      null
  }

  let type =
    'status_changed'

  let message =
    `Status alterado para ${status}`

  if (
    status ===
    'resolved'
  ) {
    type =
      'ticket_resolved'

    message =
      'Chamado finalizado'
  }

  if (
    previousStatus ===
      'resolved' &&
    status ===
      'in_progress'
  ) {
    type =
      'ticket_reopened'

    message =
      'Chamado reaberto'
  }

  if (
    status ===
    'waiting'
  ) {
    message =
      'Chamado pausado'
  }

  if (
    previousStatus ===
      'waiting' &&
    status ===
      'in_progress'
  ) {
    message =
      'Chamado retomado'
  }

  const activity =
    createActivity(
      type,
      message,
      options.author,
      options.createdAt,
    )

  return {
    ...ticket,

    status,

    updatedAt:
      options.createdAt,

    resolvedAt,

    pausedAt:
      nextPausedAt,

    slaDeadline:
      nextDeadline,

    activity: [
      ...(ticket.activity ??
        []),
      activity,
    ],
  }
}

export function markWaiting(
  ticket,
  authorOrOptions,
  createdAt,
) {
  return changeStatus(
    ticket,
    'waiting',
    authorOrOptions,
    createdAt,
  )
}

export function resolveTicket(
  ticket,
  authorOrOptions,
  createdAt,
) {
  return changeStatus(
    ticket,
    'resolved',
    authorOrOptions,
    createdAt,
  )
}

export function reopenTicket(
  ticket,
  authorOrOptions,
  createdAt,
) {
  return changeStatus(
    ticket,
    'in_progress',
    authorOrOptions,
    createdAt,
  )
}

export function changePriority(
  ticket,
  priority,
  authorOrOptions,
  createdAt,
) {
  if (
    !ticket ||
    !VALID_PRIORITIES.includes(
      priority,
    )
  ) {
    return ticket
  }

  if (
    ticket.priority ===
    priority
  ) {
    return ticket
  }

  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  const oldBaseDeadline =
    calculateSlaDeadline(
      ticket.createdAt,
      ticket.priority,
    )

  const newBaseDeadline =
    calculateSlaDeadline(
      ticket.createdAt,
      priority,
    )

  const currentDeadline =
    getTime(
      ticket.slaDeadline,
    )

  const oldBaseTime =
    getTime(
      oldBaseDeadline,
    )

  const newBaseTime =
    getTime(
      newBaseDeadline,
    )

  let pauseExtension = 0

  if (
    currentDeadline !==
      null &&
    oldBaseTime !== null
  ) {
    pauseExtension =
      Math.max(
        0,
        currentDeadline -
          oldBaseTime,
      )
  }

  const slaDeadline =
    newBaseTime === null
      ? newBaseDeadline
      : new Date(
          newBaseTime +
            pauseExtension,
        ).toISOString()

  const activity =
    createActivity(
      'priority_changed',
      `Prioridade alterada para ${priority}`,
      options.author,
      options.createdAt,
    )

  return {
    ...ticket,

    priority,

    slaDeadline,

    updatedAt:
      options.createdAt,

    activity: [
      ...(ticket.activity ??
        []),
      activity,
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
    return ticket
  }

  const options =
    normalizeOptions(
      authorOrOptions,
      createdAt,
    )

  const normalizedAssignee =
    assigneeId ||
    null

  if (
    ticket.assigneeId ===
    normalizedAssignee
  ) {
    return ticket
  }

  const activity =
    createActivity(
      'assignee_changed',
      normalizedAssignee
        ? 'Responsável atualizado'
        : 'Responsável removido',
      options.author,
      options.createdAt,
    )

  return {
    ...ticket,

    assigneeId:
      normalizedAssignee,

    updatedAt:
      options.createdAt,

    activity: [
      ...(ticket.activity ??
        []),
      activity,
    ],
  }
}