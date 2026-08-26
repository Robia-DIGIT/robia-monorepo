import { NextRequest, NextResponse } from "next/server";

/**
 * ChatGPT 5 API Integration
 *
 * This endpoint is configured to work with OpenAI's ChatGPT 5 API.
 *
 * Prerequisites:
 * 1. Add OPENAI_API_KEY to your .env.local file
 * 2. Export the key to your environment
 * 3. Install openai package: npm install openai
 *
 * Usage:
 * POST /api/chat
 * Body: {
 *   "model": "gpt-4-turbo" or "gpt-5" (when available),
 *   "messages": [
 *     { "role": "user", "content": "Your message" }
 *   ],
 *   "temperature": 0.7,
 *   "max_tokens": 2000
 * }
 */

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

const ALLOWED_MODELS = new Set(["gpt-4-turbo", "gpt-5"]);

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "https://robia-back.vercel.app";
}

function getAuthHeader(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

async function isValidSession(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthHeader(request);
    if (!token || !(await isValidSession(token))) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "A valid authenticated session is required.",
        },
        { status: 401 },
      );
    }

    const body: ChatRequest = await request.json();

    // Validate API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is not configured",
          message:
            "Please add OPENAI_API_KEY to your .env.local file and restart the server",
        },
        { status: 500 }
      );
    }

    // Validate messages
    if (
      !body.messages ||
      !Array.isArray(body.messages) ||
      body.messages.length === 0 ||
      body.messages.length > 20
    ) {
      return NextResponse.json(
        {
          error: "Invalid messages format",
          message: "Messages must be an array of message objects",
        },
        { status: 400 }
      );
    }

    const model = body.model || "gpt-4-turbo";
    if (!ALLOWED_MODELS.has(model)) {
      return NextResponse.json(
        {
          error: "Invalid model",
          message: "The requested model is not allowed.",
        },
        { status: 400 },
      );
    }

    const sanitizedMessages = body.messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string",
      )
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 4000),
      }));

    if (!sanitizedMessages.length) {
      return NextResponse.json(
        {
          error: "Invalid messages format",
          message: "At least one valid message is required.",
        },
        { status: 400 },
      );
    }

    // Forward request to OpenAI API
    // For GPT-5 when available, otherwise use gpt-4-turbo
    const maxTokens = Math.min(body.max_tokens ?? 2000, 2000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: sanitizedMessages,
        temperature: body.temperature ?? 0.7,
        max_tokens: maxTokens,
        top_p: body.top_p ?? 1,
        frequency_penalty: body.frequency_penalty ?? 0,
        presence_penalty: body.presence_penalty ?? 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);

      return NextResponse.json(
        {
          error: "OpenAI API Error",
          message: errorData.error?.message || "Unknown error occurred",
          details: errorData.error,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: {
        content:
          data.choices[0]?.message?.content ||
          "No response from the model",
        model: data.model,
        usage: data.usage,
        id: data.id,
      },
    });
  } catch (error) {
    console.error("Chat API Error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Chat API is ready. Please use POST method to send messages.",
  });
}
