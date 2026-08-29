const SLA_HOURS = {
  high: 2,
  medium: 8,
  low: 24,
}

function addMinutes(referenceDate, minutes) {
  return new Date(
    referenceDate.getTime() + minutes * 60_000
  ).toISOString()
}

function calculateDeadline(createdAt, priority) {
  const hours = SLA_HOURS[priority] ?? SLA_HOURS.medium

  return new Date(
    new Date(createdAt).getTime() + hours * 3_600_000
  ).toISOString()
}

function createActivity(
  id,
  type,
  author,
  message,
  createdAt,
  meta = {}
) {
  return {
    id,
    type,
    author,
    message,
    createdAt,
    meta,
  }
}

export function createSeedTickets(referenceDate = new Date()) {
  const tickets = [
    {
      number: '1048',
      subject: 'Falha ao autenticar no ambiente financeiro',

      description:
        'Usuária não consegue concluir a autenticação no sistema financeiro desde o início do expediente.',

      requester: {
        name: 'Mariana Souza',
        email: 'mariana.souza@empresa.demo',
        department: 'Financeiro',
      },

      category: 'access',
      priority: 'high',
      status: 'in_progress',
      assigneeId: 'camila-rocha',

      createdMinutesAgo: 82,
      updatedMinutesAgo: 18,

      note:
        'Validar grupo de acesso e sessão SSO antes de solicitar nova autenticação.',
    },

    {
      number: '1047',
      subject: 'Notebook sem acesso à VPN',

      description:
        'Notebook corporativo não estabelece conexão com a VPN após atualização do sistema.',

      requester: {
        name: 'Lucas Martins',
        email: 'lucas.martins@empresa.demo',
        department: 'Comercial',
      },

      category: 'network',
      priority: 'medium',
      status: 'in_progress',
      assigneeId: 'rafael-lima',

      createdMinutesAgo: 228,
      updatedMinutesAgo: 54,
    },

    {
      number: '1046',
      subject: 'Solicitação de acesso ao ERP',

      description:
        'Nova colaboradora precisa de perfil de consulta no ERP utilizado pelo departamento.',

      requester: {
        name: 'Patrícia Alves',
        email: 'patricia.alves@empresa.demo',
        department: 'Compras',
      },

      category: 'access',
      priority: 'low',
      status: 'waiting',
      assigneeId: 'camila-rocha',

      createdMinutesAgo: 540,
      updatedMinutesAgo: 130,
    },

    {
      number: '1045',
      subject: 'Instabilidade no acesso remoto',

      description:
        'Sessão remota desconecta de forma intermitente durante o expediente.',

      requester: {
        name: 'André Costa',
        email: 'andre.costa@empresa.demo',
        department: 'Operações',
      },

      category: 'network',
      priority: 'high',
      status: 'new',
      assigneeId: 'rafael-lima',

      createdMinutesAgo: 106,
      updatedMinutesAgo: 106,
    },

    {
      number: '1044',
      subject: 'Erro de sincronização com sistema interno',

      description:
        'Registros processados não aparecem no painel de acompanhamento do sistema.',

      requester: {
        name: 'Fernanda Melo',
        email: 'fernanda.melo@empresa.demo',
        department: 'Projetos',
      },

      category: 'systems',
      priority: 'medium',
      status: 'in_progress',
      assigneeId: 'equipe-lths',

      createdMinutesAgo: 410,
      updatedMinutesAgo: 62,
    },

    {
      number: '1043',
      subject: 'Impressora de rede indisponível',

      description:
        'Fila de impressão do setor administrativo permanece offline.',

      requester: {
        name: 'João Ribeiro',
        email: 'joao.ribeiro@empresa.demo',
        department: 'Administrativo',
      },

      category: 'devices',
      priority: 'low',
      status: 'resolved',
      assigneeId: 'rafael-lima',

      createdMinutesAgo: 1500,
      updatedMinutesAgo: 980,
    },

    {
      number: '1042',
      subject: 'Solicitação de criação de usuário',

      description:
        'Criar usuário para novo integrante com acesso padrão ao ambiente interno.',

      requester: {
        name: 'Beatriz Lima',
        email: 'beatriz.lima@empresa.demo',
        department: 'RH',
      },

      category: 'access',
      priority: 'low',
      status: 'resolved',
      assigneeId: 'equipe-lths',

      createdMinutesAgo: 2500,
      updatedMinutesAgo: 1800,
    },

    {
      number: '1041',
      subject: 'Lentidão em estação de trabalho',

      description:
        'Estação apresenta lentidão ao iniciar aplicações corporativas.',

      requester: {
        name: 'Carlos Nunes',
        email: 'carlos.nunes@empresa.demo',
        department: 'Engenharia',
      },

      category: 'devices',
      priority: 'medium',
      status: 'waiting',
      assigneeId: 'rafael-lima',

      createdMinutesAgo: 620,
      updatedMinutesAgo: 220,
    },
  ]

  return tickets.map((ticket) => {
    const createdAt = addMinutes(
      referenceDate,
      -ticket.createdMinutesAgo
    )

    const updatedAt = addMinutes(
      referenceDate,
      -ticket.updatedMinutesAgo
    )

    const resolvedAt =
      ticket.status === 'resolved'
        ? updatedAt
        : null

    const replies =
      ticket.status !== 'new'
        ? [
            {
              id: `reply-${ticket.number}-1`,

              author: 'Equipe LTHS',

              message:
                ticket.status === 'resolved'
                  ? 'Atendimento concluído e validado com o solicitante.'
                  : 'Solicitação recebida. A equipe está realizando a análise.',

              createdAt: addMinutes(
                new Date(createdAt),
                18
              ),
            },
          ]
        : []

    const internalNotes = ticket.note
      ? [
          {
            id: `note-${ticket.number}-1`,
            author: 'Camila Rocha',
            message: ticket.note,
            createdAt: addMinutes(
              new Date(updatedAt),
              -13
            ),
          },
        ]
      : []

    const activity = [
      createActivity(
        `activity-${ticket.number}-created`,
        'ticket_created',
        ticket.requester.name,
        'Ticket criado',
        createdAt
      ),

      createActivity(
        `activity-${ticket.number}-assigned`,
        'assignee_changed',
        'Equipe LTHS',
        'Responsável definido',
        addMinutes(
          new Date(createdAt),
          8
        ),
        {
          assigneeId: ticket.assigneeId,
        }
      ),
    ]

    return {
      id: `ticket-${ticket.number}`,
      code: `TK-${ticket.number}`,

      subject: ticket.subject,
      description: ticket.description,

      requester: ticket.requester,

      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,

      assigneeId: ticket.assigneeId,

      createdAt,
      updatedAt,
      resolvedAt,

      slaDeadline: calculateDeadline(
        createdAt,
        ticket.priority
      ),

      replies,
      internalNotes,
      activity,

      demonstrative: true,
    }
  })
}