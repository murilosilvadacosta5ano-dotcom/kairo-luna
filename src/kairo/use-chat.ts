import { useRef } from "react";
import { getGeminiKey } from "./gemini-key";
import { useKairoStore } from "./store";
import type { ChatImage, Citation } from "./types";

export function useKairoChat() {
  const abortRef = useRef<AbortController | null>(null);

  const send = async (rawText: string, images: ChatImage[]) => {
    const text = rawText.trim();
    if (!text && images.length === 0) return;
    const store = useKairoStore.getState();
    if (store.isStreaming()) return;

    if (!getGeminiKey()) {
      store.setSettingsOpen(true);
      return;
    }

    const { convId, assistantId } = store.startUserTurn(text, images);
    const imageMode = store.imageMode;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      if (imageMode) {
        await generateImage(convId, assistantId, text || "Uma imagem", ac.signal);
        return;
      }
      await streamChat(convId, assistantId, ac.signal);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        useKairoStore.getState().finishAssistant(convId, assistantId);
        return;
      }
      useKairoStore
        .getState()
        .failAssistant(
          convId,
          assistantId,
          err instanceof Error ? err.message : "Não foi possível responder.",
        );
    }
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  return { send, stop };
}

function authHeaders(): HeadersInit {
  const key = getGeminiKey();
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-gemini-key": key } : {}),
  };
}

async function generateImage(
  convId: string,
  assistantId: string,
  prompt: string,
  signal: AbortSignal,
) {
  const res = await fetch("/api/kairo/image", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ prompt }),
    signal,
  });
  const body = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !body.url) {
    if (res.status === 401) useKairoStore.getState().setSettingsOpen(true);
    useKairoStore
      .getState()
      .failAssistant(convId, assistantId, body.error || "Não foi possível criar a imagem.");
    return;
  }
  useKairoStore.getState().setGeneratedImage(convId, assistantId, {
    url: body.url,
    prompt,
  });
  useKairoStore
    .getState()
    .appendDelta(convId, assistantId, `Imagem gerada a partir de: *${prompt}*`);
  useKairoStore.getState().finishAssistant(convId, assistantId);
}

async function streamChat(convId: string, assistantId: string, signal: AbortSignal) {
  const state = useKairoStore.getState();
  const conv = state.conversations.find((c) => c.id === convId);
  if (!conv) return;
  const messages = conv.messages
    .filter((m) => m.id !== assistantId)
    .map((m) => ({
      role: m.role,
      text: m.text,
      images: m.images,
    }));

  const res = await fetch("/api/kairo/chat", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: state.modelId,
      webSearch: state.webSearch,
      messages,
    }),
    signal,
  });

  if (!res.ok) {
    let error = `Falha (${res.status}).`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) error = j.error;
    } catch {
      /* ignore */
    }
    if (res.status === 401) useKairoStore.getState().setSettingsOpen(true);
    useKairoStore.getState().failAssistant(convId, assistantId, error);
    return;
  }

  if (!res.body) {
    useKairoStore.getState().failAssistant(convId, assistantId, "Resposta vazia.");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n");
    buffer = chunks.pop() ?? "";
    for (const line of chunks) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data) continue;
      try {
        const evt = JSON.parse(data) as {
          type: string;
          text?: string;
          error?: string;
          citations?: Citation[];
        };
        if (evt.type === "thinking") {
          useKairoStore.getState().setThinking(convId, assistantId, true);
        } else if (evt.type === "delta" && evt.text) {
          useKairoStore.getState().appendDelta(convId, assistantId, evt.text);
        } else if (evt.type === "citations" && evt.citations) {
          useKairoStore.getState().setCitations(convId, assistantId, evt.citations);
        } else if (evt.type === "error") {
          useKairoStore
            .getState()
            .failAssistant(convId, assistantId, evt.error || "Erro ao gerar.");
        } else if (evt.type === "done") {
          useKairoStore.getState().finishAssistant(convId, assistantId);
        }
      } catch {
        /* skip */
      }
    }
  }
  useKairoStore.getState().finishAssistant(convId, assistantId);
}

export function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 600));
  u.lang = "pt-BR";
  u.rate = 1.02;
  window.speechSynthesis.speak(u);
}
