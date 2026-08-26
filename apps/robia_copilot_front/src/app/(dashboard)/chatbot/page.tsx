"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Plus, Trash2, Menu, X, Brain } from "lucide-react";
import Link from "next/link";

import { sessionStore } from "@/lib/session";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function ChatbotPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialise avec une nouvelle conversation
  useEffect(() => {
    createNewConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations, activeConversationId]);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "Nouvelle conversation",
      messages: [],
      createdAt: new Date(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    // Fermer la sidebar sur mobile après sélection
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const activeConversation = conversations.find(
    conv => conv.id === activeConversationId
  );

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setConversations(prev =>
      prev.map(conv =>
        conv.id === activeConversationId
          ? {
              ...conv,
              messages: [...conv.messages, userMessage],
              title:
                conv.messages.length === 0
                  ? inputValue.slice(0, 30)
                  : conv.title,
            }
          : conv
      )
    );

    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStore.getToken() ?? ""}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: [...activeConversation.messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur API");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.data?.content ||
          "Je suis un assistant IA. Veuillez vérifier la configuration de votre API.",
        timestamp: new Date(),
      };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, assistantMessage],
              }
            : conv
        )
      );
    } catch (error) {
      console.error("Chat Error:", error);

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: `Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}. Veuillez vérifier votre configuration d'API.`,
        timestamp: new Date(),
      };

      setConversations(prev =>
        prev.map(conv =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: [...conv.messages, errorMessage],
              }
            : conv
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50 lg:flex-row">
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed
          inset-y-0
          left-0
          z-40
          w-64
          border-r
          border-slate-200
          bg-white
          transition-transform
          duration-300
          ease-in-out
          flex
          flex-col
          lg:static
          lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-3 sm:p-4 lg:hidden">
          <h2 className="font-semibold text-slate-900">Conversations</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 p-3 sm:p-4">
          <button
            onClick={createNewConversation}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              rounded-lg
              bg-primary
              px-3
              py-2
              text-sm
              sm:text-base
              font-medium
              text-white
              transition-all
              hover:bg-primary/90
            "
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau chat</span>
            <span className="sm:hidden">Nouveau</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <div className="space-y-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv.id)}
                className={`
                  w-full
                  rounded-lg
                  px-3
                  py-2
                  text-left
                  text-xs
                  sm:text-sm
                  transition-all
                  group
                  relative
                  truncate
                  ${
                    activeConversationId === conv.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }
                `}
              >
                <div className="truncate pr-6">{conv.title}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="
                    absolute
                    right-2
                    top-1/2
                    -translate-y-1/2
                    rounded
                    p-1
                    opacity-0
                    transition-all
                    hover:bg-red-100
                    group-hover:opacity-100
                  "
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </button>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-3 py-2 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="truncate text-lg sm:text-2xl font-bold text-slate-900">
                ChatBot IA
              </h1>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 whitespace-nowrap transition-all hover:bg-slate-50 sm:px-4 sm:py-2 sm:text-sm"
            >
              Retour
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
          {activeConversation && activeConversation.messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center px-4">
                <div className="mb-3 sm:mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4 sm:p-6">
                    <svg
                      className="h-10 w-10 sm:h-12 sm:w-12 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="mb-2 text-lg sm:text-2xl font-bold text-slate-900">
                  Bienvenue sur ChatBot IA
                </h2>
                <p className="text-sm sm:text-base text-slate-600">
                  Posez vos questions et recevez des réponses intelligentes
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
              {activeConversation?.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-4 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="shrink-0 hidden sm:block">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        <svg
                          className="h-5 w-5 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-xs sm:max-w-2xl rounded-lg px-3 py-2 sm:px-4 sm:py-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-white rounded-br-none"
                        : "bg-slate-200 text-slate-900 rounded-bl-none"
                    }`}
                  >
                    <p className="wrap-break-word">{message.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        message.role === "user"
                          ? "text-white/70"
                          : "text-slate-600"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 sm:gap-4">
                  <div className="shrink-0 hidden sm:block">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                      <svg
                        className="h-5 w-5 text-primary animate-spin"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="max-w-xs sm:max-w-2xl rounded-lg bg-slate-200 px-3 py-2 sm:px-4 sm:py-3">
                    <div className="flex gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-600"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-600"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Tapez votre message..."
                disabled={isLoading}
                className="
                  flex-1
                  rounded-lg
                  border
                  border-slate-300
                  px-3
                  py-2
                  text-sm
                  outline-none
                  transition-all
                  placeholder:text-slate-400
                  focus:border-primary
                  focus:ring-4
                  focus:ring-primary/10
                  disabled:bg-slate-100
                "
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-primary
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition-all
                  hover:bg-primary/90
                  disabled:bg-slate-300
                  disabled:cursor-not-allowed
                  shrink-0
                "
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Envoyer</span>
              </button>
            </div>
            <p className="mt-2 text-xs flex justify-center items-center  text-slate-500 sm:mt-3">
              <Brain className= "mx-2 w-4 h-4"/> Appuyez sur Entrée pour envoyer rapidement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
