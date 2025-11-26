"use client";

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import io, { Socket } from 'socket.io-client';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  sender: User;
  receiver: User;
}

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

let socket: Socket | null = null;

export default function ChatPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar Socket.IO y cargar datos
  useEffect(() => {
    if (!session?.user?.email) return;

    const initializeChat = async () => {
      try {
        // Obtener usuario actual
        const userRes = await fetch('/api/auth/users');
        const userData = await userRes.json();
        const currentUser = userData.users.find((u: User) => u.email === session.user?.email);
        
        if (!currentUser) return;
        setCurrentUserId(currentUser.id);

        // Inicializar Socket.IO
        if (!socket) {
          socket = io({
            path: '/socket.io',
          });

          socket.on('connect', () => {
            console.log('Conectado a Socket.IO');
            socket?.emit('register', currentUser.id);
          });

          socket.on('new-message', (message: Message) => {
            console.log('Mensaje recibido:', message);
            
            // Solo agregar el mensaje si es relevante para la conversación actual
            setSelectedUser((currentSelectedUser) => {
              if (currentSelectedUser) {
                const isRelevantMessage = 
                  (message.senderId === currentUser.id && message.receiverId === currentSelectedUser.id) ||
                  (message.senderId === currentSelectedUser.id && message.receiverId === currentUser.id);
                
                if (isRelevantMessage) {
                  setMessages((prev) => {
                    // Reemplazar mensaje temporal con el mensaje real del servidor
                    // o evitar duplicados si ya existe
                    const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'));
                    if (withoutTemp.some(m => m.id === message.id)) {
                      return prev;
                    }
                    return [...withoutTemp, message];
                  });
                }
              }
              return currentSelectedUser;
            });

            // Actualizar conversaciones
            loadConversations();
          });

          socket.on('messages-read', ({ senderId, receiverId }) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.senderId === senderId && m.receiverId === receiverId
                  ? { ...m, read: true }
                  : m
              )
            );
          });
        }

        // Cargar usuarios y conversaciones
        await Promise.all([loadUsers(), loadConversations()]);
        setLoading(false);
      } catch (error) {
        console.error('Error al inicializar chat:', error);
        setLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (socket) {
        socket.off('new-message');
        socket.off('messages-read');
      }
    };
  }, [session]);

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/chat/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?userId=${userId}`);
      const data = await res.json();
      setMessages(data.messages || []);

      // Marcar mensajes como leídos
      if (socket && currentUserId) {
        socket.emit('mark-as-read', {
          senderId: userId,
          receiverId: currentUserId,
        });
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    loadMessages(user.id);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUser || !currentUserId || !socket) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageText.trim(),
      senderId: currentUserId,
      receiverId: selectedUser.id,
      createdAt: new Date().toISOString(),
      read: false,
      sender: {
        id: currentUserId,
        name: session?.user?.name || '',
        email: session?.user?.email || '',
      },
      receiver: {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
      },
    };

    // Agregar mensaje inmediatamente a la UI (optimistic update)
    setMessages((prev) => [...prev, tempMessage]);
    
    // Limpiar el input inmediatamente
    setMessageText('');

    // Enviar al servidor
    socket.emit('send-message', {
      senderId: currentUserId,
      receiverId: selectedUser.id,
      content: tempMessage.content,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-cyan-100 dark:border-slate-700 overflow-hidden">
      <div className="border-b border-cyan-100 dark:border-slate-700 bg-gradient-to-r from-cyan-50 to-emerald-50 dark:from-slate-700 dark:to-slate-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl p-2.5 shadow-md">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chat</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Comunícate con otros usuarios del sistema
            </p>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-280px)]">
        {/* Lista de usuarios / conversaciones */}
        <div className="w-80 border-r border-cyan-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto">
          {/* Usuarios disponibles */}
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Usuarios Disponibles
            </h2>
            <div className="space-y-2">
              {users.map((user) => {
                const conversation = conversations.find(c => c.user.id === user.id);
                const unreadCount = conversation?.unreadCount || 0;

                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all duration-200
                      ${selectedUser?.id === user.id
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${selectedUser?.id === user.id
                          ? 'bg-white/20'
                          : 'bg-gradient-to-br from-cyan-400 to-emerald-400'
                        }
                      `}>
                        <User className={`w-5 h-5 ${selectedUser?.id === user.id ? 'text-white' : 'text-white'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{user.name}</p>
                        {conversation?.lastMessage && (
                          <p className={`text-xs truncate ${selectedUser?.id === user.id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Área de mensajes */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Header del chat */}
              <div className="px-6 py-4 border-b border-cyan-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-900/30">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      No hay mensajes aún. ¡Inicia la conversación!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-md px-4 py-3 rounded-2xl shadow-sm
                            ${isOwn
                              ? 'bg-gradient-to-br from-cyan-500 to-emerald-500 text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-sm'
                            }
                          `}
                        >
                          <p className="text-sm break-words">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(message.createdAt), 'HH:mm', { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input de mensaje */}
              <div className="p-4 border-t border-cyan-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="px-6 py-3 bg-gradient-to-br from-cyan-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Enviar
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900/30">
              <div className="text-center">
                <MessageCircle className="w-24 h-24 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selecciona un usuario
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Elige un usuario de la lista para comenzar a chatear
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
