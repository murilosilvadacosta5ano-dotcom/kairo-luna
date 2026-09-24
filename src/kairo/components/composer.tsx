import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ArrowUp, Camera, Compass, ImageIcon, Mic, Plus, ScanLine, Square } from "lucide-react";
import { useKairoChat } from "../use-chat";
import { useKairoStore } from "../store";
import { VoiceOrb } from "./voice-orb";
import { cn } from "@/lib/utils";

export function Composer() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState("");
  const draftImages = useKairoStore((s) => s.draftImages);
  const webSearch = useKairoStore((s) => s.webSearch);
  const imageMode = useKairoStore((s) => s.imageMode);
  const streaming = useKairoStore((s) =>
    s.conversations.some((c) => c.messages.some((m) => m.streaming)),
  );
  const hasMessages = useKairoStore((s) => {
    const c = s.conversations.find((x) => x.id === s.activeId);
    return Boolean(c && c.messages.length > 0);
  });
  const { send, stop } = useKairoChat();

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  useEffect(() => {
    autosize();
  }, [draft, draftImages.length, imageMode]);

  const submit = () => {
    if (!draft.trim() && draftImages.length === 0) return;
    void send(draft, draftImages);
    setDraft("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const hasDraft = Boolean(draft.trim()) || draftImages.length > 0;

  return (
    <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
      {!hasMessages ? (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ActionChip
            icon={<ImageIcon className="size-4" strokeWidth={1.75} />}
            label="Criar Imagens"
            active={imageMode}
            onClick={() => {
              useKairoStore.getState().setImageMode(!imageMode);
              textareaRef.current?.focus();
            }}
          />
          <ActionChip
            icon={<Camera className="size-4" strokeWidth={1.75} />}
            label="Abrir Câmera"
            onClick={() => useKairoStore.getState().setView("camera")}
          />
          <ActionChip
            icon={<ScanLine className="size-4" strokeWidth={1.75} />}
            label="Analisar foto"
            onClick={() => document.getElementById("kairo-file-input")?.click()}
          />
        </div>
      ) : null}

      <div className="rounded-composer bg-kairo-composer px-3.5 pt-3.5 pb-2.5">
        {draftImages.length ? (
          <div className="mb-2 flex gap-2 overflow-x-auto">
            {draftImages.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => useKairoStore.getState().removeDraftImage(img.id)}
                className="relative shrink-0"
                aria-label="Remover imagem"
              >
                <img src={img.dataUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-kairo-fg text-[11px] text-kairo-bg">
                  ×
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={imageMode ? "Descreva a imagem…" : "Mensagem"}
          onInput={autosize}
          onKeyDown={onKey}
          suppressHydrationWarning
          className="min-h-12 max-h-36 w-full resize-none bg-transparent text-[17px] leading-snug text-kairo-fg outline-none placeholder:text-kairo-subtle"
        />

        <div className="mt-2 flex items-center gap-1.5">
          <IconBtn
            label="Anexar"
            onClick={() => useKairoStore.getState().setPlusOpen(true)}
          >
            <Plus className="size-5" strokeWidth={1.75} />
          </IconBtn>

          <button
            type="button"
            onClick={() => useKairoStore.getState().toggleWebSearch()}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors duration-150",
              webSearch ? "bg-kairo-elevated text-kairo-fg" : "bg-kairo-surface text-kairo-fg",
            )}
          >
            <Compass className="size-3.5" strokeWidth={2} />
            Pesquisa na Web
          </button>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              aria-label="Galeria"
              onClick={() => document.getElementById("kairo-file-input")?.click()}
              className="grid size-9 place-items-center text-kairo-fg"
            >
              <ScanLine className="size-5" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              aria-label="Ditado"
              onClick={() => useKairoStore.getState().setView("voice")}
              className="grid size-9 place-items-center text-kairo-fg"
            >
              <Mic className="size-5" strokeWidth={1.75} />
            </button>

            {streaming ? (
              <button
                type="button"
                aria-label="Parar"
                onClick={stop}
                className="grid size-10 place-items-center rounded-full bg-kairo-fg text-kairo-bg transition-transform duration-150 active:scale-[0.96]"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            ) : hasDraft ? (
              <button
                type="button"
                aria-label="Enviar"
                onClick={submit}
                className="grid size-10 place-items-center rounded-full bg-kairo-fg text-kairo-bg transition-transform duration-150 active:scale-[0.96]"
              >
                <ArrowUp className="size-5" strokeWidth={2.25} />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Modo de voz"
                onClick={() => useKairoStore.getState().setView("voice")}
                className="transition-transform duration-150 active:scale-[0.96]"
              >
                <VoiceOrb />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionChip({
  icon,
  label,
  onClick,
  active,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-kairo-fg transition-transform duration-150 active:scale-[0.97]",
        active ? "bg-kairo-elevated" : "bg-kairo-chip",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full bg-kairo-surface text-kairo-fg transition-transform duration-150 active:scale-[0.96]"
    >
      {children}
    </button>
  );
}
