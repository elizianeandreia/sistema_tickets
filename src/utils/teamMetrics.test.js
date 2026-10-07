import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getMemberTickets,
  getTeamMetrics,
} from './teamMetrics.js'

const now =
  '2026-10-07T14:00:00.000Z'

const team = [
  {
    id: 'thiago-tadeu',
    name: 'Thiago Tadeu',
    role: 'Analista de suporte',
    specialty: 'Acessos e sistemas corporativos',
    initials: 'TT',
    status: 'online',
  },
  {
    id: 'mateus-ichiro',
    name: 'Mateus Ichiro',
    role: 'Analista de infraestrutura',
    specialty: 'Rede, VPN e dispositivos',
    initials: 'MI',
    status: 'online',
  },
]

const tickets = [
  {
    id: '1',
    code: 'TK-1001',
    subject: 'Acesso ao sistema',
    assigneeId: 'thiago-tadeu',
    priority: 'high',
    status: 'in_progress',
    createdAt:
      '2026-10-07T10:00:00.000Z',
    updatedAt:
      '2026-10-07T10:00:00.000Z',
    slaDeadline:
      '2026-10-07T12:00:00.000Z',
    pausedAt: null,
    resolvedAt: null,
  },
  {
    id: '2',
    code: 'TK-1002',
    subject: 'Configurar VPN',
    assigneeId: 'mateus-ichiro',
    priority: 'medium',
    status: 'waiting',
    createdAt:
      '2026-10-07T11:00:00.000Z',
    updatedAt:
      '2026-10-07T12:00:00.000Z',
    slaDeadline:
      '2026-10-07T19:00:00.000Z',
    pausedAt:
      '2026-10-07T12:00:00.000Z',
    resolvedAt: null,
  },
  {
    id: '3',
    code: 'TK-1003',
    subject: 'Chamado concluído',
    assigneeId: 'thiago-tadeu',
    priority: 'low',
    status: 'resolved',
    createdAt:
      '2026-10-06T10:00:00.000Z',
    updatedAt:
      '2026-10-06T12:00:00.000Z',
    slaDeadline:
      '2026-10-08T10:00:00.000Z',
    resolvedAt:
      '2026-10-06T12:00:00.000Z',
    pausedAt: null,
  },
]

test('deve retornar somente tickets abertos atribuídos ao integrante', () => {
  const result =
    getMemberTickets(
      tickets,
      'thiago-tadeu',
    )

  assert.equal(
    result.length,
    1,
  )

  assert.equal(
    result[0].id,
    '1',
  )
})

test('deve calcular a carga da equipe', () => {
  const result =
    getTeamMetrics(
      team,
      tickets,
      now,
    )

  const thiago =
    result.find(
      (member) =>
        member.id ===
        'thiago-tadeu',
    )

  const mateus =
    result.find(
      (member) =>
        member.id ===
        'mateus-ichiro',
    )

  assert.equal(
    thiago.openTickets,
    1,
  )

  assert.equal(
    thiago.overdueTickets,
    1,
  )

  assert.equal(
    thiago.highPriorityTickets,
    1,
  )

  assert.equal(
    mateus.openTickets,
    1,
  )

  assert.equal(
    mateus.pausedTickets,
    1,
  )

  assert.equal(
    mateus.overdueTickets,
    0,
  )
})