import { calculateSlaDeadline } from '../services/ticketService.js'

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

function createTicket({
  id,
  code,
  subject,
  description,
  requester,
  category,
  priority,
  status,
  assigneeId,
  createdAt,
  updatedAt,
  replies = [],
  internalNotes = [],
  activity = [],
  resolvedAt = null,
}) {
  return {
    id,
    code,
    subject,
    description,
    requester,
    category,
    priority,
    status,
    assigneeId,
    createdAt,
    updatedAt,
    slaDeadline: calculateSlaDeadline(
      createdAt,
      priority
    ),
    resolvedAt,
    replies,
    internalNotes,
    activity,
  }
}

export function createSeedTickets() {
  return [
    createTicket({
      id: 'ticket-1048',
      code: 'TK-1048',
      subject:
        'Falha ao autenticar no ambiente financeiro',
      description:
        'Usuária não consegue concluir a autenticação no sistema financeiro desde o início do expediente.',
      requester: {
        name: 'Mariana Souza',
        email: 'mariana.souza@empresa.demo',
        department: 'Financeiro',
      },
      category: 'access',
      priority: 'high',
      status: 'waiting',
      assigneeId: 'thiago-tadeu',
      createdAt: '2026-08-30T09:29:00-03:00',
      updatedAt: '2026-08-30T10:20:00-03:00',

      replies: [
        {
          id: 'reply-1048-1',
          author: 'Equipe LTHS',
          message:
            'Solicitação recebida. A equipe está realizando a análise.',
          createdAt:
            '2026-08-30T09:47:00-03:00',
        },
      ],

      internalNotes: [
        {
          id: 'note-1048-1',
          author: 'Thiago Tadeu',
          message:
            'Validar grupo de acesso e sessão SSO antes de solicitar nova autenticação.',
          createdAt:
            '2026-08-30T10:20:00-03:00',
        },
      ],

      activity: [
        createActivity(
          'activity-1048-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-30T09:29:00-03:00'
        ),

        createActivity(
          'activity-1048-2',
          'reply_added',
          'Equipe LTHS',
          'Resposta adicionada ao chamado',
          '2026-08-30T09:47:00-03:00'
        ),

        createActivity(
          'activity-1048-3',
          'internal_note_added',
          'Thiago Tadeu',
          'Nota interna adicionada',
          '2026-08-30T10:20:00-03:00'
        ),
      ],
    }),

    createTicket({
      id: 'ticket-1047',
      code: 'TK-1047',
      subject: 'Notebook sem acesso à VPN',
      description:
        'Usuário relata que o notebook corporativo não consegue estabelecer conexão com a VPN.',
      requester: {
        name: 'Lucas Martins',
        email: 'lucas.martins@empresa.demo',
        department: 'Comercial',
      },
      category: 'network',
      priority: 'medium',
      status: 'in_progress',
      assigneeId: 'mateus-ichiro',
      createdAt: '2026-08-30T07:55:00-03:00',
      updatedAt: '2026-08-30T09:12:00-03:00',

      replies: [
        {
          id: 'reply-1047-1',
          author: 'Mateus Ichiro',
          message:
            'Estamos validando a configuração de rede e o perfil de acesso à VPN.',
          createdAt:
            '2026-08-30T09:12:00-03:00',
        },
      ],

      activity: [
        createActivity(
          'activity-1047-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-30T07:55:00-03:00'
        ),

        createActivity(
          'activity-1047-2',
          'reply_added',
          'Mateus Ichiro',
          'Resposta adicionada ao chamado',
          '2026-08-30T09:12:00-03:00'
        ),
      ],
    }),

    createTicket({
      id: 'ticket-1046',
      code: 'TK-1046',
      subject: 'Solicitação de acesso ao ERP',
      description:
        'Solicitante precisa de acesso ao módulo de pedidos do ERP para iniciar as atividades.',
      requester: {
        name: 'Patrícia Alves',
        email: 'patricia.alves@empresa.demo',
        department: 'Operações',
      },
      category: 'access',
      priority: 'low',
      status: 'waiting',
      assigneeId: 'thiago-tadeu',
      createdAt: '2026-08-30T06:10:00-03:00',
      updatedAt: '2026-08-30T08:35:00-03:00',

      replies: [
        {
          id: 'reply-1046-1',
          author: 'Thiago Tadeu',
          message:
            'A solicitação está em validação com o responsável pelo perfil de acesso.',
          createdAt:
            '2026-08-30T08:35:00-03:00',
        },
      ],

      activity: [
        createActivity(
          'activity-1046-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-30T06:10:00-03:00'
        ),
      ],
    }),

    createTicket({
      id: 'ticket-1045',
      code: 'TK-1045',
      subject:
        'Instabilidade no acesso remoto',
      description:
        'Conexão remota apresenta quedas frequentes durante o expediente.',
      requester: {
        name: 'André Costa',
        email: 'andre.costa@empresa.demo',
        department: 'Engenharia',
      },
      category: 'network',
      priority: 'high',
      status: 'new',
      assigneeId: 'mateus-ichiro',
      createdAt: '2026-08-30T09:58:00-03:00',
      updatedAt: '2026-08-30T09:58:00-03:00',

      activity: [
        createActivity(
          'activity-1045-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-30T09:58:00-03:00'
        ),
      ],
    }),

    createTicket({
      id: 'ticket-1044',
      code: 'TK-1044',
      subject:
        'Erro de sincronização com sistema interno',
      description:
        'Dados cadastrados no sistema principal não estão sendo sincronizados com o módulo interno.',
      requester: {
        name: 'Fernanda Melo',
        email: 'fernanda.melo@empresa.demo',
        department: 'Administrativo',
      },
      category: 'systems',
      priority: 'medium',
      status: 'in_progress',
      assigneeId: 'thiago-tadeu',
      createdAt: '2026-08-30T04:35:00-03:00',
      updatedAt: '2026-08-30T08:50:00-03:00',

      replies: [
        {
          id: 'reply-1044-1',
          author: 'Thiago Tadeu',
          message:
            'Estamos verificando os registros de integração e o processamento da fila.',
          createdAt:
            '2026-08-30T08:50:00-03:00',
        },
      ],

      activity: [
        createActivity(
          'activity-1044-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-30T04:35:00-03:00'
        ),
      ],
    }),

    createTicket({
      id: 'ticket-1043',
      code: 'TK-1043',
      subject:
        'Impressora de rede indisponível',
      description:
        'Impressora compartilhada do setor não aparece disponível para os usuários.',
      requester: {
        name: 'Bruno Lima',
        email: 'bruno.lima@empresa.demo',
        department: 'Logística',
      },
      category: 'devices',
      priority: 'low',
      status: 'waiting',
      assigneeId: 'mateus-ichiro',
      createdAt: '2026-08-29T15:20:00-03:00',
      updatedAt: '2026-08-30T08:10:00-03:00',

      replies: [
        {
          id: 'reply-1043-1',
          author: 'Mateus Ichiro',
          message:
            'A conectividade do equipamento está sendo validada.',
          createdAt:
            '2026-08-30T08:10:00-03:00',
        },
      ],

      activity: [
        createActivity(
          'activity-1043-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-29T15:20:00-03:00'
        ),
      ],
    }),

    createTicket({
      id: 'ticket-1042',
      code: 'TK-1042',
      subject:
        'Atualização de aplicativo corporativo',
      description:
        'Aplicativo corporativo foi atualizado e o chamado foi concluído após validação do usuário.',
      requester: {
        name: 'Juliana Ribeiro',
        email: 'juliana.ribeiro@empresa.demo',
        department: 'Recursos Humanos',
      },
      category: 'systems',
      priority: 'medium',
      status: 'resolved',
      assigneeId: 'thiago-tadeu',
      createdAt: '2026-08-29T08:15:00-03:00',
      updatedAt: '2026-08-29T13:40:00-03:00',
      resolvedAt:
        '2026-08-29T13:40:00-03:00',

      replies: [
        {
          id: 'reply-1042-1',
          author: 'Thiago Tadeu',
          message:
            'Atualização realizada e funcionamento validado.',
          createdAt:
            '2026-08-29T13:35:00-03:00',
        },
      ],

      activity: [
        createActivity(
          'activity-1042-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-29T08:15:00-03:00'
        ),

        createActivity(
          'activity-1042-2',
          'status_changed',
          'Thiago Tadeu',
          'Chamado resolvido',
          '2026-08-29T13:40:00-03:00',
          {
            from: 'in_progress',
            to: 'resolved',
          }
        ),
      ],
    }),

    createTicket({
      id: 'ticket-1041',
      code: 'TK-1041',
      subject:
        'Configuração de novo equipamento',
      description:
        'Novo notebook foi preparado, configurado e entregue ao colaborador.',
      requester: {
        name: 'Ricardo Gomes',
        email: 'ricardo.gomes@empresa.demo',
        department: 'Projetos',
      },
      category: 'devices',
      priority: 'low',
      status: 'resolved',
      assigneeId: 'mateus-ichiro',
      createdAt: '2026-08-28T10:00:00-03:00',
      updatedAt: '2026-08-28T16:15:00-03:00',
      resolvedAt:
        '2026-08-28T16:15:00-03:00',

      replies: [
        {
          id: 'reply-1041-1',
          author: 'Mateus Ichiro',
          message:
            'Equipamento configurado e liberado para utilização.',
          createdAt:
            '2026-08-28T16:10:00-03:00',
        },
      ],

      activity: [
        createActivity(
          'activity-1041-1',
          'ticket_created',
          'Sistema',
          'Chamado criado',
          '2026-08-28T10:00:00-03:00'
        ),

        createActivity(
          'activity-1041-2',
          'status_changed',
          'Mateus Ichiro',
          'Chamado resolvido',
          '2026-08-28T16:15:00-03:00',
          {
            from: 'in_progress',
            to: 'resolved',
          }
        ),
      ],
    }),
  ]
}