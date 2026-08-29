import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  loadWorkspace,
  saveWorkspace,
} from '../utils/storage.js'

import {
  addInternalNote,
  addReply,
  changeAssignee,
  changePriority,
  markWaiting,
  reopenTicket,
  resolveTicket,
} from '../services/ticketService.js'

const ServiceDeskContext = createContext(null)

export function ServiceDeskProvider({
  children,
}) {
  const [workspace, setWorkspace] =
    useState(() => loadWorkspace())

  useEffect(() => {
    saveWorkspace(
      window.localStorage,
      workspace
    )
  }, [workspace])

  function updateTicket(
    ticketId,
    updater
  ) {
    setWorkspace(
      (currentWorkspace) => ({
        ...currentWorkspace,

        tickets:
          currentWorkspace.tickets.map(
            (ticket) =>
              ticket.id === ticketId
                ? updater(ticket)
                : ticket
          ),
      })
    )
  }

  function replyToTicket(
    ticketId,
    data
  ) {
    updateTicket(
      ticketId,
      (ticket) =>
        addReply(ticket, data)
    )
  }

  function addNoteToTicket(
    ticketId,
    data
  ) {
    updateTicket(
      ticketId,
      (ticket) =>
        addInternalNote(
          ticket,
          data
        )
    )
  }

  function setTicketWaiting(
    ticketId,
    data = {}
  ) {
    updateTicket(
      ticketId,
      (ticket) =>
        markWaiting(
          ticket,
          data
        )
    )
  }

  function closeTicket(
    ticketId,
    data = {}
  ) {
    updateTicket(
      ticketId,
      (ticket) =>
        resolveTicket(
          ticket,
          data
        )
    )
  }

  function reopenResolvedTicket(
    ticketId,
    data = {}
  ) {
    updateTicket(
      ticketId,
      (ticket) =>
        reopenTicket(
          ticket,
          data
        )
    )
  }

  function setTicketPriority(
    ticketId,
    priority,
    data = {}
  ) {
    updateTicket(
      ticketId,
      (ticket) =>
        changePriority(
          ticket,
          priority,
          data
        )
    )
  }

  function setTicketAssignee(
    ticketId,
    assigneeId,
    data = {}
  ) {
    updateTicket(
      ticketId,
      (ticket) =>
        changeAssignee(
          ticket,
          assigneeId,
          data
        )
    )
  }

  function setTheme(theme) {
    setWorkspace(
      (currentWorkspace) => ({
        ...currentWorkspace,

        preferences: {
          ...currentWorkspace.preferences,

          theme:
            theme === 'light'
              ? 'light'
              : 'dark',
        },
      })
    )
  }

  const openTickets =
    useMemo(
      () =>
        workspace.tickets.filter(
          (ticket) =>
            ticket.status !==
            'resolved'
        ),
      [workspace.tickets]
    )

  const resolvedTickets =
    useMemo(
      () =>
        workspace.tickets.filter(
          (ticket) =>
            ticket.status ===
            'resolved'
        ),
      [workspace.tickets]
    )

  const value = {
    workspace,

    tickets:
      workspace.tickets,

    team:
      workspace.team,

    preferences:
      workspace.preferences,

    openTickets,
    resolvedTickets,

    replyToTicket,
    addNoteToTicket,

    setTicketWaiting,
    closeTicket,
    reopenResolvedTicket,

    setTicketPriority,
    setTicketAssignee,

    setTheme,
  }

  return (
    <ServiceDeskContext.Provider
      value={value}
    >
      {children}
    </ServiceDeskContext.Provider>
  )
}

export function useServiceDesk() {
  const context =
    useContext(
      ServiceDeskContext
    )

  if (!context) {
    throw new Error(
      'useServiceDesk deve ser utilizado dentro de ServiceDeskProvider.'
    )
  }

  return context
}