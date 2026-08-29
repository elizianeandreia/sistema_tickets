import { TEAM } from '../data/team.js'
import { createSeedTickets } from '../data/seedTickets.js'

export const STORAGE_KEYS = {
  tickets: 'lths-service-desk:tickets',
  team: 'lths-service-desk:team',
  preferences: 'lths-service-desk:preferences',
  version: 'lths-service-desk:version',
}

const CURRENT_VERSION = 1

const PRIORITY_MAP = {
  alto: 'high',
  alta: 'high',
  high: 'high',

  medio: 'medium',
  médio: 'medium',
  media: 'medium',
  média: 'medium',
  medium: 'medium',

  baixo: 'low',
  baixa: 'low',
  low: 'low',
}

const LEGACY_STATUS_MAP = {
  aberto: 'in_progress',

  resolvido: 'resolved',
  resolved: 'resolved',

  fechado: 'resolved',
  closed: 'resolved',
}

const SLA_HOURS = {
  high: 2,
  medium: 8,
  low: 24,
}

function safeParse(value, fallback = null) {
  try {
    if (value == null) {
      return fallback
    }

    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function validDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function calculateDeadline(createdAt, priority) {
  const hours =
    SLA_HOURS[priority] ??
    SLA_HOURS.medium

  return new Date(
    new Date(createdAt).getTime() +
      hours * 3_600_000
  ).toISOString()
}

function normalizeReply(
  reply,
  index,
  fallbackDate
) {
  if (!reply || typeof reply !== 'object') {
    return null
  }

  const message = String(
    reply.message ??
      reply.text ??
      reply.mensagem ??
      ''
  ).trim()

  if (!message) {
    return null
  }

  return {
    ...reply,

    id: String(
      reply.id ??
        `legacy-reply-${index}`
    ),

    author: String(
      reply.author ??
        reply.autor ??
        'Equipe LTHS'
    ),

    message,

    createdAt:
      validDate(reply.createdAt) ??
      fallbackDate,
  }
}

export function migrateLegacyTicket(
  ticket,
  index = 0
) {
  if (
    !ticket ||
    typeof ticket !== 'object'
  ) {
    return null
  }

  const createdAt =
    validDate(ticket.createdAt) ??
    new Date().toISOString()

  const rawPriority = String(
    ticket.urgencia ??
      ticket.priority ??
      'medium'
  ).toLowerCase()

  const priority =
    PRIORITY_MAP[rawPriority] ??
    'medium'

  const rawStatus = String(
    ticket.status ??
      'aberto'
  ).toLowerCase()

  let status =
    LEGACY_STATUS_MAP[rawStatus]

  if (!status) {
    const validStatuses = [
      'new',
      'in_progress',
      'waiting',
      'resolved',
    ]

    status = validStatuses.includes(
      rawStatus
    )
      ? rawStatus
      : 'in_progress'
  }

  const replies = Array.isArray(
    ticket.replies
  )
    ? ticket.replies
        .map((reply, replyIndex) =>
          normalizeReply(
            reply,
            replyIndex,
            createdAt
          )
        )
        .filter(Boolean)
    : []

  const latestReply =
    replies.at(-1)?.createdAt

  const updatedAt =
    validDate(ticket.updatedAt) ??
    latestReply ??
    createdAt

  const originalId = String(
    ticket.id ??
      `legacy-${index + 1}`
  )

  const id = originalId.startsWith(
    'ticket-'
  )
    ? originalId
    : `ticket-${originalId}`

  const code = String(
    ticket.code ??
      `TK-${String(originalId)
        .slice(-5)
        .padStart(5, '0')}`
  )

  const subject = String(
    ticket.assunto ??
      ticket.subject ??
      ticket.descricao ??
      ticket.description ??
      'Solicitação de atendimento'
  )
    .trim()
    .slice(0, 120)

  const description = String(
    ticket.descricao ??
      ticket.description ??
      subject
  ).trim()

  const requesterName = String(
    ticket.nome ??
      ticket.requester?.name ??
      'Solicitante'
  ).trim()

  const requesterEmail = String(
    ticket.email ??
      ticket.requester?.email ??
      ''
  ).trim()

  const requesterDepartment = String(
    ticket.departamento ??
      ticket.requester?.department ??
      'Não informado'
  ).trim()

  const resolvedAt =
    status === 'resolved'
      ? validDate(
          ticket.resolvedAt
        ) ?? updatedAt
      : null

  return {
    id,
    code,

    subject,
    description,

    requester: {
      name: requesterName,
      email: requesterEmail,

      department:
        requesterDepartment ||
        'Não informado',
    },

    category: String(
      ticket.categoria ??
        ticket.category ??
        'general'
    ),

    priority,
    status,

    assigneeId:
      ticket.assigneeId ?? null,

    createdAt,
    updatedAt,
    resolvedAt,

    slaDeadline:
      ticket.slaDeadline
        ? validDate(
            ticket.slaDeadline
          ) ??
          calculateDeadline(
            createdAt,
            priority
          )
        : calculateDeadline(
            createdAt,
            priority
          ),

    replies,

    internalNotes:
      Array.isArray(
        ticket.internalNotes
      )
        ? ticket.internalNotes
        : [],

    activity: [
      {
        id: `activity-${originalId}-migration`,

        type: 'ticket_migrated',

        author: 'Equipe LTHS',

        message:
          'Ticket migrado para o novo Service Desk',

        createdAt,

        meta: {
          migrated: true,
        },
      },
    ],

    demonstrative: false,
  }
}

function isNewTicket(ticket) {
  if (
    !ticket ||
    typeof ticket !== 'object'
  ) {
    return false
  }

  if (!ticket.requester) {
    return false
  }

  if (!ticket.subject) {
    return false
  }

  if (
    ![
      'high',
      'medium',
      'low',
    ].includes(ticket.priority)
  ) {
    return false
  }

  if (
    ![
      'new',
      'in_progress',
      'waiting',
      'resolved',
    ].includes(ticket.status)
  ) {
    return false
  }

  return true
}

export function saveWorkspace(
  storage,
  workspace
) {
  storage.setItem(
    STORAGE_KEYS.tickets,
    JSON.stringify(
      workspace.tickets ?? []
    )
  )

  storage.setItem(
    STORAGE_KEYS.team,
    JSON.stringify(
      workspace.team ?? TEAM
    )
  )

  storage.setItem(
    STORAGE_KEYS.preferences,
    JSON.stringify(
      workspace.preferences ?? {
        theme: 'dark',
      }
    )
  )

  storage.setItem(
    STORAGE_KEYS.version,
    String(
      workspace.version ??
        CURRENT_VERSION
    )
  )

  return workspace
}

export function resetWorkspace(
  storage = window.localStorage
) {
  const workspace = {
    tickets: createSeedTickets(),

    team: TEAM,

    preferences: {
      theme: 'dark',
    },

    version: CURRENT_VERSION,
  }

  saveWorkspace(
    storage,
    workspace
  )

  return workspace
}

export function loadWorkspace(
  storage = window.localStorage
) {
  const currentTickets =
    storage.getItem(
      STORAGE_KEYS.tickets
    )

  let tickets = []

  if (currentTickets !== null) {
    const parsed = safeParse(
      currentTickets,
      []
    )

    if (Array.isArray(parsed)) {
      tickets =
        parsed.filter(isNewTicket)
    }
  } else {
    const legacyTickets =
      safeParse(
        storage.getItem(
          'tickets'
        ),
        []
      )

    if (
      Array.isArray(
        legacyTickets
      )
    ) {
      tickets =
        legacyTickets
          .map(
            migrateLegacyTicket
          )
          .filter(Boolean)
    }
  }

  if (!tickets.length) {
    tickets =
      createSeedTickets()
  }

  const savedTeam =
    safeParse(
      storage.getItem(
        STORAGE_KEYS.team
      ),
      null
    )

  const team =
    Array.isArray(savedTeam) &&
    savedTeam.length
      ? savedTeam
      : TEAM

  const savedPreferences =
    safeParse(
      storage.getItem(
        STORAGE_KEYS.preferences
      ),
      null
    )

  const legacyTheme =
    storage.getItem(
      'support-theme'
    )

  const preferences =
    savedPreferences &&
    typeof savedPreferences ===
      'object'
      ? {
          ...savedPreferences,

          theme:
            savedPreferences.theme ===
            'light'
              ? 'light'
              : 'dark',
        }
      : {
          theme:
            legacyTheme ===
            'light'
              ? 'light'
              : 'dark',
        }

  const savedVersion =
    Number(
      storage.getItem(
        STORAGE_KEYS.version
      )
    )

  const workspace = {
    tickets,
    team,
    preferences,

    version:
      savedVersion ||
      CURRENT_VERSION,
  }

  saveWorkspace(
    storage,
    workspace
  )

  return workspace
}