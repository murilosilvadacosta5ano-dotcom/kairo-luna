import { modelById, SYSTEM_PROMPT } from "../models";
import type { KairoModelId } from "../types";

export type IncomingImage = { dataUrl: string };
export type IncomingMessage = {
  role: "user" | "assistant";
  text: string;
  images?: IncomingImage[];
};

type ChatBody = {
  model?: unknown;
  messages?: unknown;
  webSearch?: unknown;
};

type GeminiPart =
  | { text: string; thought?: boolean }
  | { inlineData: { mimeType: string; data: string } }
  | { inline_data: { mime_type: string; data: string } };

type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

const CHAT_FALLBACKS: Record<KairoModelId, string[]> = {
  luna: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
  fast: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"],
};

const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-2.5-flash-image-preview",
  "gemini-2.0-flash-preview-image-generation",
];

export function parseChatBody(raw: unknown): {
  modelId: KairoModelId;
  messages: IncomingMessage[];
  webSearch: boolean;
} {
  const body = (raw ?? {}) as ChatBody;
  const modelId: KairoModelId = body.model === "fast" ? "fast" : "luna";
  if (!Array.isArray(body.messages)) {
    throw new Error("Mensagens inválidas.");
  }
  const messages: IncomingMessage[] = body.messages
    .slice(-24)
    .map((m) => {
      const row = m as IncomingMessage;
      const role: IncomingMessage["role"] = row.role === "assistant" ? "assistant" : "user";
      const text = typeof row.text === "string" ? row.text.slice(0, 8000) : "";
      const images = Array.isArray(row.images)
        ? row.images
            .filter((img) => typeof img?.dataUrl === "string" && img.dataUrl.startsWith("data:image/"))
            .slice(0, 2)
        : undefined;
      return { role, text, images };
    })
    .filter((m) => m.text.trim() || (m.images && m.images.length > 0));
  if (messages.length === 0) throw new Error("Escreva uma mensagem.");
  return { modelId, messages, webSearch: Boolean(body.webSearch) };
}

export function resolveGeminiKey(request: Request): string | undefined {
  const header = normalizeKey(request.headers.get("x-gemini-key"));
  if (header) return header;
  return (
    normalizeKey(process.env.GEMINI_API_KEY) ||
    normalizeKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY) ||
    normalizeKey(process.env.GOOGLE_API_KEY)
  );
}

function normalizeKey(raw: string | undefined | null): string | undefined {
  const v = raw?.trim().replace(/^["']+|["']+$/g, "");
  return v || undefined;
}

function toGeminiContents(messages: IncomingMessage[]): GeminiContent[] {
  const contents: GeminiContent[] = [];
  for (const m of messages) {
    const role: "user" | "model" = m.role === "assistant" ? "model" : "user";
    const parts: GeminiPart[] = [];
    if (m.role === "user") {
      const images = m.images ?? [];
      for (const img of images) {
        const parsed = parseDataUrl(img.dataUrl);
        if (parsed) parts.push({ inlineData: { mimeType: parsed.mime, data: parsed.data } });
      }
      parts.push({ text: m.text.trim() || (images.length ? "Analise esta imagem." : " ") });
    } else {
      parts.push({ text: m.text || " " });
    }
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts.push(...parts);
    else contents.push({ role, parts });
  }
  return contents;
}

function parseDataUrl(dataUrl: string): { mime: string; data: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mime: match[1], data: match[2] };
}

function chatPayload(opts: {
  messages: IncomingMessage[];
  webSearch: boolean;
  modelId: KairoModelId;
}) {
  const payload: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: toGeminiContents(opts.messages),
    generationConfig: {
      temperature: opts.modelId === "fast" ? 0.5 : 0.8,
      maxOutputTokens: opts.modelId === "fast" ? 1024 : 2048,
    },
  };
  if (opts.webSearch) {
    payload.tools = [{ google_search: {} }];
  }
  return payload;
}

export async function geminiChatStream(opts: {
  modelId: KairoModelId;
  messages: IncomingMessage[];
  webSearch: boolean;
  apiKey?: string;
}): Promise<Response> {
  if (!opts.apiKey) {
    return Response.json(
      { error: "Cole sua chave da API Gemini em Ajustes para conversar." },
      { status: 401 },
    );
  }

  const models = unique([modelById(opts.modelId).apiModel, ...CHAT_FALLBACKS[opts.modelId]]);
  let lastStatus = 502;
  let lastDetail = "";

  for (const model of models) {
    let payload = chatPayload(opts);
    let res = await callGemini(model, payload, opts.apiKey, true);

    if (!res.ok && opts.webSearch && (res.status === 400 || res.status === 404)) {
      payload = chatPayload({ ...opts, webSearch: false });
      res = await callGemini(model, payload, opts.apiKey, true);
    }

    if (res.ok && res.body) {
      return new Response(mapGeminiSse(res.body), {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    lastStatus = res.status;
    lastDetail = await res.text().catch(() => "");
    console.error("[kairo] Gemini chat error", model, res.status, lastDetail.slice(0, 400));

    if (res.status === 401 || res.status === 403) break;
    if (res.status === 429) break;
    if (res.status !== 404 && res.status !== 400) break;
  }

  return Response.json(
    { error: friendlyGeminiError(lastStatus, lastDetail) },
    { status: lastStatus === 401 || lastStatus === 403 ? 401 : 502 },
  );
}

function callGemini(
  model: string,
  payload: Record<string, unknown>,
  apiKey: string,
  stream: boolean,
) {
  const method = stream ? "streamGenerateContent" : "generateContent";
  const qs = stream ? "?alt=sse" : "";
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}${qs}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
}

function mapGeminiSse(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };
      const seenCitations = new Set<string>();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n");
          buffer = parts.pop() ?? "";
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let data = trimmed;
            if (data.startsWith("data:")) data = data.slice(5).trim();
            if (!data || data === "[DONE]" || data.startsWith("event:")) continue;
            if (data.startsWith("[") && !data.endsWith("]")) {
              buffer = `${data}\n${buffer}`;
              continue;
            }
            try {
              const json = JSON.parse(data) as GeminiChunk | GeminiChunk[];
              const chunks = Array.isArray(json) ? json : [json];
              for (const chunk of chunks) {
                if (chunk.error?.message) {
                  send({ type: "error", error: friendlyGeminiError(0, chunk.error.message) });
                  continue;
                }
                const candidate = chunk.candidates?.[0];
                const geminiParts = candidate?.content?.parts ?? [];
                for (const part of geminiParts) {
                  if ("thought" in part && part.thought && "text" in part) {
                    send({ type: "thinking" });
                    continue;
                  }
                  if ("text" in part && part.text) send({ type: "delta", text: part.text });
                }
                const citations = extractCitations(candidate?.groundingMetadata);
                const fresh = citations.filter((c) => {
                  if (seenCitations.has(c.url)) return false;
                  seenCitations.add(c.url);
                  return true;
                });
                if (fresh.length) send({ type: "citations", citations: fresh });
              }
            } catch {
              /* skip malformed chunk */
            }
          }
        }
        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Falha ao gerar resposta.",
        });
      } finally {
        controller.close();
      }
    },
  });
}

type GroundingMeta = {
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
};

type GeminiChunk = {
  error?: { message?: string };
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    groundingMetadata?: GroundingMeta;
  }>;
};

function extractCitations(meta: GroundingMeta | undefined) {
  const chunks = meta?.groundingChunks ?? [];
  return chunks
    .map((c) => ({
      url: c.web?.uri ?? "",
      title: c.web?.title || hostname(c.web?.uri ?? ""),
    }))
    .filter((c) => c.url);
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function friendlyGeminiError(status: number, detail: string) {
  const lower = detail.toLowerCase();
  if (status === 429 || lower.includes("resource_exhausted") || lower.includes("quota")) {
    return "Cota da Gemini esgotada. Confira o plano no Google AI Studio.";
  }
  if (status === 403 || lower.includes("permission") || lower.includes("api_key_invalid")) {
    return "Chave Gemini inválida ou sem permissão. Revise em Ajustes.";
  }
  if (status === 401 || lower.includes("unauthenticated") || lower.includes("api key")) {
    return "Chave Gemini inválida. Cole uma chave nova em Ajustes.";
  }
  if (lower.includes("safety") || lower.includes("blocked")) {
    return "A Gemini bloqueou esta solicitação. Tente outra formulação.";
  }
  return "Não foi possível gerar a resposta. Tente de novo.";
}

export async function geminiGenerateImage(
  prompt: string,
  apiKey?: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!apiKey) return { ok: false, error: "Cole sua chave da API Gemini em Ajustes." };

  const clean = prompt.trim().slice(0, 1800);
  if (!clean) return { ok: false, error: "Descreva a imagem." };

  let lastError = "Falha ao gerar imagem.";

  for (const model of IMAGE_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `Generate a high-quality image: ${clean}` }],
            },
          ],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
      },
    );
    if (!res.ok) {
      lastError = friendlyGeminiError(res.status, await res.text().catch(() => ""));
      continue;
    }
    const body = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: { mimeType?: string; data?: string };
            inline_data?: { mime_type?: string; data?: string };
          }>;
        };
      }>;
    };
    const url = firstInlineImage(body.candidates?.[0]?.content?.parts);
    if (url) return { ok: true, url };
  }

  const imagen = await tryImagen(clean, apiKey);
  if (imagen.ok) return imagen;
  return { ok: false, error: imagen.error || lastError };
}

async function tryImagen(
  prompt: string,
  apiKey: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const models = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"];
  let lastError = "";
  for (const model of models) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1" },
        }),
      },
    );
    if (!res.ok) {
      lastError = friendlyGeminiError(res.status, await res.text().catch(() => ""));
      continue;
    }
    const body = (await res.json()) as {
      predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
    };
    const b64 = body.predictions?.[0]?.bytesBase64Encoded;
    const mime = body.predictions?.[0]?.mimeType || "image/png";
    if (b64) return { ok: true, url: `data:${mime};base64,${b64}` };
  }
  return { ok: false, error: lastError || "Falha ao gerar imagem." };
}

function firstInlineImage(
  parts:
    | Array<{
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
      }>
    | undefined,
): string | null {
  if (!parts) return null;
  for (const part of parts) {
    const mime = part.inlineData?.mimeType || part.inline_data?.mime_type || "image/png";
    const data = part.inlineData?.data || part.inline_data?.data;
    if (data) return `data:${mime};base64,${data}`;
  }
  return null;
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}
