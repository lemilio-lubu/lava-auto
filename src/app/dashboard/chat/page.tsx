"use client";

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

let socket: any;

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    // initialize socket
    if (!socket) socket = io(undefined, { path: '/api/socket' });

    socket.on('new-message', (msg: any) => {
      setMessages((s) => [...s, msg]);
    });

    fetch('/api/socket');

    return () => {
      socket.off('new-message');
    };
  }, []);

  function send() {
    if (!text) return;
    socket.emit('send-message', { content: text, userId: 'anonymous', createdAt: new Date().toISOString() });
    setText('');
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Chat en Tiempo Real</h2>
      <div className="border border-border rounded p-4 h-80 overflow-auto bg-surface-muted">
        {messages.length === 0 && <p className="text-on-surface-muted">No hay mensajes aún...</p>}
        {messages.map((m, i) => (
          <div key={i} className="mb-2 p-2 bg-surface rounded">
            <strong className="text-primary">{m.userId}</strong>: {m.content}
            <small className="text-xs text-on-surface-muted ml-2">{new Date(m.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-4">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Escribe un mensaje..."
          className="flex-1 p-2 rounded bg-surface-muted border border-border text-on-surface" 
        />
        <button onClick={send} className="px-4 py-2 bg-primary rounded text-primary-contrast hover:opacity-90">
          Enviar
        </button>
      </div>
    </div>
  );
}
