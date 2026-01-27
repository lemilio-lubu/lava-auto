"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/lib/api-client';
import io, { Socket } from 'socket.io-client';
import { MessageCircle, Send, User, Clock, Check, CheckCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatUser {
  id: string;
  name: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  other_user_id: string;
  other_user_name: string;
  last_message_at: string;
  unread_count: number;
}

const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'http://localhost:4005';

let socket: Socket | null = null;

export default function ChatPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatApi.getConversations(token);
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [token]);

  // Initialize Socket.IO and load data
  useEffect(() => {
    if (authLoading || !user || !token) return;

    const initializeChat = async () => {
      try {
        // Load conversations
        await loadConversations();
        
        // Initialize Socket.IO for real-time messaging
        if (!socket) {
          socket = io(NOTIFICATION_SERVICE_URL, {
            path: '/socket.io',
            auth: { token }
          });

          socket.on('connect', () => {
            console.log('Connected to Socket.IO');
            socket?.emit('register', user.id);
          });

          socket.on('new-message', (message: Message) => {
            // Reload conversations to update unread counts
            loadConversations();
            
            // Update messages if conversation is active
            setSelectedUser((currentSelectedUser) => {
              if (currentSelectedUser && user) {
                const isRelevantMessage = 
                  (message.senderId === user.id && message.receiverId === currentSelectedUser.id) ||
                  (message.senderId === currentSelectedUser.id && message.receiverId === user.id);
                
                if (isRelevantMessage) {
                  setMessages((prev) => {
                    // Replace temp message with real message from server
                    const withoutTemp = prev.filter(m => !m.id.startsWith('temp-'));
                    const exists = withoutTemp.some(m => m.id === message.id);
                    
                    if (exists) return prev;
                    return [...withoutTemp, message];
                  });
                }
              }
              return currentSelectedUser;
            });
          });

          socket.on('messages-read', ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.senderId === senderId && m.receiverId === receiverId
                  ? { ...m, read: true }
                  : m
              )
            );
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
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
  }, [authLoading, user, token, loadConversations]);

  const loadMessages = async (otherUserId: string) => {
    if (!token) return;
    try {
      const data = await chatApi.getConversation(otherUserId, token);
      setMessages(data || []);

      // Mark messages as read via socket
      if (socket && user) {
        socket.emit('mark-as-read', {
          senderId: otherUserId,
          receiverId: user.id,
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    const chatUser: ChatUser = {
      id: conversation.other_user_id,
      name: conversation.other_user_name,
    };
    setSelectedUser(chatUser);
    loadMessages(conversation.other_user_id);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedUser || !user || !token) return;

    const content = messageText.trim();
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      senderId: user.id,
      receiverId: selectedUser.id,
      createdAt: new Date().toISOString(),
      read: false,
    };

    // Optimistic update
    setMessages((prev) => [...prev, tempMessage]);
    setMessageText('');
    setSending(true);

    try {
      // Send via API
      await chatApi.sendMessage(selectedUser.id, content, token);
      
      // Also emit via socket for real-time delivery
      if (socket) {
        socket.emit('send-message', {
          senderId: user.id,
          receiverId: selectedUser.id,
          content,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter(m => m.id !== tempMessage.id));
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto mb-4" />
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
        {/* Conversations list */}
        <div className="w-80 border-r border-cyan-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Conversaciones
            </h2>
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No tienes conversaciones aún
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.other_user_id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all duration-200
                      ${selectedUser?.id === conversation.other_user_id
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-slate-700'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${selectedUser?.id === conversation.other_user_id
                          ? 'bg-white/20'
                          : 'bg-gradient-to-br from-cyan-400 to-emerald-400'
                        }
                      `}>
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {conversation.other_user_name}
                        </p>
                        <p className={`text-xs ${selectedUser?.id === conversation.other_user_id ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                          {format(new Date(conversation.last_message_at), 'dd/MM HH:mm', { locale: es })}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-cyan-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {selectedUser.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Messages */}
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
                    const isOwn = message.senderId === user?.id;
                    const isTemporary = message.id.startsWith('temp-');
                    
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
                            <span>
                              {format(new Date(message.createdAt), 'HH:mm', { locale: es })}
                            </span>
                            {isOwn && (
                              <>
                                {isTemporary ? (
                                  <Clock className="w-3.5 h-3.5 ml-1" />
                                ) : message.read ? (
                                  <CheckCheck className="w-3.5 h-3.5 ml-1 text-blue-200" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 ml-1" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-cyan-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe un mensaje..."
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sending}
                    className="px-6 py-3 bg-gradient-to-br from-cyan-500 to-emerald-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
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
                  Selecciona una conversación
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Elige una conversación de la lista para ver los mensajes
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
