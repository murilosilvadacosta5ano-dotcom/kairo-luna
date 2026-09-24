import { useEffect, useRef } from "react";
import { useGeminiKey } from "../gemini-key";
import { Markdown } from "../markdown";
import { useKairoStore } from "../store";
import type { ChatMessage } from "../types";
import { cn } from "@/lib/utils";

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const geminiKey = useGeminiKey();
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, messages.at(-1)?.text, messages.at(-1)?.streaming]);

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8">
        {!geminiKey ? (
          <button
            type="button"
            onClick={() => useKairoStore.getState().setSettingsOpen(true)}
            className="max-w-xs rounded-3xl bg-kairo-chip px-5 py-4 text-center transition-transform duration-150 active:scale-[0.98]"
          >
            <p className="text-[15px] font-medium text-kairo-fg">Conectar Gemini</p>
            <p className="mt-1 text-[13px] leading-relaxed text-kairo-muted">
              Cole sua chave do Google AI Studio em Ajustes para conversar de verdade.
            </p>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
      <div className="mx-auto flex max-w-xl flex-col gap-5 pb-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[86%] rounded-3xl bg-kairo-surface px-4 py-3">
          {message.images?.length ? (
            <div className={cn("mb-2 grid gap-2", message.images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {message.images.map((img) => (
                <img
                  key={img.id}
                  src={img.dataUrl}
                  alt=""
                  className="max-h-52 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          ) : null}
          {message.text ? (
            <p className="text-pretty text-[15px] leading-relaxed text-kairo-fg">{message.text}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {message.thinking && !message.text ? (
        <p className="kairo-thinking w-fit text-[15px] font-medium">Pensando</p>
      ) : null}
      {message.generatedImage ? (
        <img
          src={message.generatedImage.url}
          alt={message.generatedImage.prompt}
          className="max-h-80 w-full rounded-3xl object-cover"
        />
      ) : null}
      {message.text ? <Markdown text={message.text} /> : null}
      {message.error ? (
        <p className="text-[13px] text-kairo-danger">{message.error}</p>
      ) : null}
      {message.citations?.length ? (
        <div className="flex flex-wrap gap-2">
          {message.citations.slice(0, 4).map((c) => (
            <a
              key={c.url}
              href={c.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-kairo-chip px-3 py-1 text-[12px] text-kairo-muted"
            >
              {c.title || c.url}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
