import React, { useState, useEffect } from 'react';

export default function App() {
  const [tickets, setTickets] = useState(() => {
    const saved = localStorage.getItem('tickets');
    return saved ? JSON.parse(saved) : [];
  });

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [descricao, setDescricao] = useState('');
  const [urgencia, setUrgencia] = useState('baixo');

  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);

  function handleAddTicket(e) {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !descricao.trim()) return;

    const newTicket = {
      id: Date.now(),
      nome,
      email,
      descricao,
      urgencia,
    };

    setTickets([newTicket, ...tickets]);
    setNome('');
    setEmail('');
    setDescricao('');
    setUrgencia('baixo');
  }

  function handleDelete(id) {
    setTickets(tickets.filter(ticket => ticket.id !== id));
  }

  return (
    <div className="container">
      <h1>Sistema de Tickets</h1>
      <form onSubmit={handleAddTicket}>
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={e => setNome(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <textarea
          placeholder="Descrição do problema"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          required
          rows={3}
        />
        <select value={urgencia} onChange={e => setUrgencia(e.target.value)}>
          <option value="baixo">Baixo</option>
          <option value="medio">Médio</option>
          <option value="alto">Alto</option>
        </select>
        <button type="submit">Criar Ticket</button>
      </form>
      <ul>
        {tickets.map(({ id, nome, email, descricao, urgencia }) => (
          <li key={id} className="ticket">
            <div className="ticket-info">
              <strong>{nome}</strong>
              <small>{email}</small>
              <p>{descricao}</p>
            </div>
            <div className={`ticket-priority ${urgencia}`}>
              {urgencia.toUpperCase()}
            </div>
            <button className="delete-btn" onClick={() => handleDelete(id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
