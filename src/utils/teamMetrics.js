import {
  getSlaState,
} from '../services/ticketService.js'

export function getMemberTickets(
  tickets,
  memberId,
) {
  return tickets.filter(
    (ticket) =>
      ticket.assigneeId ===
        memberId &&
      ticket.status !==
        'resolved',
  )
}

export function getTeamMetrics(
  team,
  tickets,
  now = new Date(),
) {
  return team.map(
    (member) => {
      const memberTickets =
        getMemberTickets(
          tickets,
          member.id,
        )

      const overdueTickets =
        memberTickets.filter(
          (ticket) =>
            getSlaState(
              ticket,
              now,
            ) ===
            'overdue',
        ).length

      const highPriorityTickets =
        memberTickets.filter(
          (ticket) =>
            ticket.priority ===
            'high',
        ).length

      const pausedTickets =
        memberTickets.filter(
          (ticket) =>
            ticket.status ===
            'waiting',
        ).length

      const inProgressTickets =
        memberTickets.filter(
          (ticket) =>
            ticket.status ===
            'in_progress',
        ).length

      const newTickets =
        memberTickets.filter(
          (ticket) =>
            ticket.status ===
            'new',
        ).length

      return {
        ...member,

        tickets:
          memberTickets,

        openTickets:
          memberTickets.length,

        overdueTickets,

        highPriorityTickets,

        pausedTickets,

        inProgressTickets,

        newTickets,
      }
    },
  )
}