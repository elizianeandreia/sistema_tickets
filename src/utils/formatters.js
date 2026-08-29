export function getInitials(name = '') {
  const initials = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return initials || 'LT'
}

export function formatTicketCode(code) {
  const normalizedCode = String(code || '')

  if (normalizedCode.startsWith('#')) {
    return normalizedCode
  }

  return `#${normalizedCode}`
}

export function formatDateTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Data indisponível'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatCompactDate(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Agora'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}