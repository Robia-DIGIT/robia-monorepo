import { useState, useCallback } from "react";

import { sessionStore } from "@/lib/session";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * Custom hook for ChatGPT 5 integration
 *
 * Usage:
 * const { messages, isLoading, error, sendMessage } = useChat({
 *   model: "gpt-4-turbo",
 *   temperature: 0.7,
 *   max_tokens: 2000
 * });
 *
 * // Send a message
 * await sendMessage("Hello, how are you?");
 */

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      setError(null);

      // Add user message to the list
      const userMessage: ChatMessage = {
        role: "user",
        content,
      };

      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStore.getToken() ?? ""}`,
          },
          body: JSON.stringify({
            model: options.model || "gpt-4-turbo",
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 2000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Unknown error occurred");
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.data.content,
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        console.error("Chat error:", err);

        // Remove the user message if there was an error
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [messages, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
