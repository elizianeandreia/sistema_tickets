import test from 'node:test'
import assert from 'node:assert/strict'

import {
  addInternalNote,
  addReply,
  calculateSlaDeadline,
  changeAssignee,
  changePriority,
  getSlaHours,
  getSlaState,
  markWaiting,
  reopenTicket,
  resolveTicket,
} from './ticketService.js'

function createTicket(overrides = {}) {
  return {
    id: 'ticket-test',
    code: 'TK-9999',

    subject: 'Ticket de teste',
    description: 'Descrição do chamado',

    requester: {
      name: 'Usuário Teste',
      email: 'usuario@empresa.demo',
      department: 'TI',
    },

    category: 'general',

    priority: 'medium',
    status: 'new',

    assigneeId: null,

    createdAt: '2026-08-29T12:00:00.000Z',
    updatedAt: '2026-08-29T12:00:00.000Z',

    resolvedAt: null,

    slaDeadline: '2026-08-29T20:00:00.000Z',

    replies: [],
    internalNotes: [],
    activity: [],

    ...overrides,
  }
}

test('SLA deve ser 2h para alta, 8h para média e 24h para baixa', () => {
  assert.equal(getSlaHours('high'), 2)
  assert.equal(getSlaHours('medium'), 8)
  assert.equal(getSlaHours('low'), 24)
})

test('deve calcular o prazo do SLA a partir da criação', () => {
  const deadline = calculateSlaDeadline(
    '2026-08-29T12:00:00.000Z',
    'high'
  )

  assert.equal(
    deadline,
    '2026-08-29T14:00:00.000Z'
  )
})

test('primeira resposta deve mover ticket novo para em atendimento', () => {
  const ticket = createTicket()

  const updated = addReply(ticket, {
    message: 'Estamos analisando.',
    author: 'Thiago Tadeu',
    createdAt: '2026-08-29T12:30:00.000Z',
  })

  assert.equal(
    updated.status,
    'in_progress'
  )

  assert.equal(
    updated.replies.length,
    1
  )

  assert.equal(
    updated.replies[0].message,
    'Estamos analisando.'
  )
})

test('nota interna não deve alterar o status do ticket', () => {
  const ticket = createTicket({
    status: 'new',
  })

  const updated = addInternalNote(ticket, {
    message: 'Verificar permissões.',
    author: 'Thiago Tadeu',
    createdAt: '2026-08-29T12:40:00.000Z',
  })

  assert.equal(
    updated.status,
    'new'
  )

  assert.equal(
    updated.internalNotes.length,
    1
  )
})

test('deve colocar chamado aguardando solicitante', () => {
  const ticket = createTicket({
    status: 'in_progress',
  })

  const updated = markWaiting(ticket, {
    author: 'Equipe LTHS',
    createdAt: '2026-08-29T13:00:00.000Z',
  })

  assert.equal(
    updated.status,
    'waiting'
  )
})

test('deve resolver um ticket', () => {
  const ticket = createTicket({
    status: 'in_progress',
  })

  const updated = resolveTicket(ticket, {
    createdAt: '2026-08-29T14:00:00.000Z',
  })

  assert.equal(
    updated.status,
    'resolved'
  )

  assert.equal(
    updated.resolvedAt,
    '2026-08-29T14:00:00.000Z'
  )
})

test('deve reabrir um ticket resolvido', () => {
  const ticket = createTicket({
    status: 'resolved',
    resolvedAt: '2026-08-29T14:00:00.000Z',
  })

  const updated = reopenTicket(ticket, {
    createdAt: '2026-08-29T15:00:00.000Z',
  })

  assert.equal(
    updated.status,
    'in_progress'
  )

  assert.equal(
    updated.resolvedAt,
    null
  )
})

test('mudança de prioridade deve recalcular SLA', () => {
  const ticket = createTicket({
    priority: 'medium',
  })

  const updated = changePriority(
    ticket,
    'high',
    {
      createdAt: '2026-08-29T13:00:00.000Z',
    }
  )

  assert.equal(
    updated.priority,
    'high'
  )

  assert.equal(
    updated.slaDeadline,
    '2026-08-29T14:00:00.000Z'
  )
})

test('deve alterar responsável', () => {
  const ticket = createTicket()

  const updated = changeAssignee(
    ticket,
    'thiago-tadeu'
  )

  assert.equal(
    updated.assigneeId,
    'thiago-tadeu'
  )
})

test('deve identificar SLA vencido', () => {
  const ticket = createTicket({
    priority: 'high',
    slaDeadline: '2026-08-29T14:00:00.000Z',
  })

  const sla = getSlaState(
    ticket,
    '2026-08-29T15:00:00.000Z'
  )

  assert.equal(
    sla.state,
    'breached'
  )

  assert.ok(
    sla.remainingMs < 0
  )
})