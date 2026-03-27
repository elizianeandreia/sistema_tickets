---
name: fix-ticket-typo
metadata:
  version: 1.0
  author: GitHub Copilot
  license: MIT
description: "Use this custom agent to fix the typo 'Sitema de Tickets' to 'Sistema de Tickets' in HTML/React index content."
applyTo: "**/*.{html,jsx,tsx,md}"
---

## Goal
- Detect and correct text typos related to the ticket system name across the project.

## Behavior
- Prefer minimal, precise edits for the exact string "Sitema de Tickets".
- In HTML/JSX/MD, replace with "Sistema de Tickets".
- When no match is found, explain that no change is required but provide a path to verify.

## Use when
- User request includes phrases like "Sitema de Tickets", "Sistema de Tickets", "corrija".
- User asks for index page title/content correction in a ticket platform project.

## Example prompts
- "Corrija o erro no index com o nome Sitema de Tickets para Sistema de Tickets"
- "Achado um typo no título do app: Sitema de Tickets"
- "Altere todos os casos de Sitema de Tickets para Sistema de Tickets"
