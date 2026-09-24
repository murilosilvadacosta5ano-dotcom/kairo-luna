import { useEffect, useRef, useState } from "react";
import { Camera, Eye, EyeOff, ImageIcon, Mic, X } from "lucide-react";
import { getGeminiKey, setGeminiKey, useGeminiKey } from "../gemini-key";
import { resizeDataUrl, resizeImageFile } from "../resize-image";
import { useKairoChat } from "../use-chat";
import { listedConversations, useKairoStore } from "../store";
import { VoiceOrb } from "./voice-orb";

export function FilePicker() {
  return (
    <input
      id="kairo-file-input"
      type="file"
      accept="image/*"
      className="hidden"
      suppressHydrationWarning
      onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        try {
          const dataUrl = await resizeImageFile(file);
          useKairoStore.getState().addDraftImage(dataUrl);
        } catch {
          /* ignore */
        }
      }}
    />
  );
}

export function PlusSheet() {
  const open = useKairoStore((s) => s.plusOpen);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Fechar"
        onClick={() => useKairoStore.getState().setPlusOpen(false)}
      />
      <div className="relative z-10 w-full rounded-t-sheet bg-kairo-surface-2 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-kairo-elevated" />
        <SheetRow
          icon={<Camera className="size-5" />}
          label="Câmera"
          onClick={() => useKairoStore.getState().setView("camera")}
        />
        <SheetRow
          icon={<ImageIcon className="size-5" />}
          label="Fotos"
          onClick={() => document.getElementById("kairo-file-input")?.click()}
        />
        <SheetRow
          icon={<Mic className="size-5" />}
          label="Mensagem de voz"
          onClick={() => useKairoStore.getState().setView("voice")}
        />
      </div>
    </div>
  );
}

function SheetRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-2 flex h-14 w-full items-center gap-3 rounded-2xl bg-kairo-chip px-4 text-[16px] text-kairo-fg"
    >
      {icon}
      {label}
    </button>
  );
}

export function SettingsSheet() {
  const open = useKairoStore((s) => s.settingsOpen);
  const savedKey = useGeminiKey();
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(getGeminiKey());
      setShow(false);
      setSavedFlash(false);
    }
  }, [open]);

  if (!open) return null;
  const count = listedConversations(useKairoStore.getState().conversations).length;
  const connected = Boolean(savedKey);

  const saveKey = () => {
    setGeminiKey(draft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end bg-black/50">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Fechar ajustes"
        onClick={() => useKairoStore.getState().setSettingsOpen(false)}
      />
      <div className="relative z-10 max-h-[88%] w-full overflow-y-auto rounded-t-sheet bg-kairo-surface-2 px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-kairo-elevated" />
        <p className="mb-1 px-1 text-lg font-semibold">Kairo</p>
        <p className="mb-5 px-1 text-[13px] text-kairo-muted">
          Assistente com Gemini: respostas, imagens, câmera e busca na web. {count}{" "}
          conversas neste aparelho.
        </p>

        <div className="mb-3 rounded-2xl bg-kairo-chip px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[15px] font-medium">Chave da API Gemini</p>
            <span
              className={
                connected
                  ? "rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400"
                  : "rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-kairo-muted"
              }
            >
              {connected ? "Conectada" : "Ausente"}
            </span>
          </div>
          <p className="mb-3 text-[12px] leading-relaxed text-kairo-muted">
            Cole a chave do Google AI Studio. Ela fica só neste aparelho e é enviada
            ao Gemini nas suas mensagens.
          </p>
          <div className="flex h-12 items-center gap-2 rounded-2xl bg-kairo-surface-2 px-3">
            <input
              type={show ? "text" : "password"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="AIza…"
              autoComplete="off"
              spellCheck={false}
              className="h-full min-w-0 flex-1 bg-transparent text-[14px] tracking-wide text-kairo-fg outline-none placeholder:text-kairo-subtle"
            />
            <button
              type="button"
              aria-label={show ? "Ocultar chave" : "Mostrar chave"}
              onClick={() => setShow((v) => !v)}
              className="grid size-8 place-items-center text-kairo-muted"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={saveKey}
            className="mt-3 flex h-11 w-full items-center justify-center rounded-2xl bg-kairo-fg text-[15px] font-medium text-kairo-bg"
          >
            {savedFlash ? "Chave salva" : "Salvar chave"}
          </button>
          {savedKey ? (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setGeminiKey("");
              }}
              className="mt-2 w-full py-2 text-center text-[12px] text-kairo-muted"
            >
              Remover chave
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("kairo-v1");
            window.location.reload();
          }}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-kairo-chip text-[15px] font-medium text-kairo-danger"
        >
          Limpar histórico
        </button>
      </div>
    </div>
  );
}

export function CameraOverlay() {
  const view = useKairoStore((s) => s.view);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view !== "camera") return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
      } catch {
        setError("Não foi possível abrir a câmera. Permita o acesso ou envie uma foto.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [view]);

  if (view !== "camera") return null;

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const raw = canvas.toDataURL("image/jpeg", 0.85);
    const dataUrl = await resizeDataUrl(raw);
    useKairoStore.getState().addDraftImage(dataUrl);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black">
      <div className="flex justify-end p-4">
        <button
          type="button"
          aria-label="Fechar câmera"
          onClick={() => useKairoStore.getState().setView("chat")}
          className="grid size-11 place-items-center rounded-full bg-kairo-chip text-kairo-fg"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        {error ? (
          <div className="absolute inset-0 grid place-items-center px-8 text-center text-sm text-kairo-muted">
            {error}
          </div>
        ) : null}
      </div>
      <div className="flex justify-center py-8">
        <button
          type="button"
          aria-label="Capturar"
          onClick={() => void capture()}
          className="size-16 rounded-full border-4 border-white bg-white/20"
        />
      </div>
    </div>
  );
}

type SpeechRec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export function VoiceOverlay() {
  const view = useKairoStore((s) => s.view);
  const { send } = useKairoChat();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    if (view !== "voice") {
      recRef.current?.stop();
      setListening(false);
      setTranscript("");
      return;
    }
    const Ctor = (window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRec })
        .webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (ev) => {
      const parts: string[] = [];
      for (let i = 0; i < ev.results.length; i++) {
        const alt = ev.results[i]?.[0]?.transcript;
        if (alt) parts.push(alt);
      }
      setTranscript(parts.join(" ").trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
    return () => {
      rec.stop();
    };
  }, [view]);

  if (view !== "voice") return null;

  const sendVoice = async () => {
    const text = transcript.trim();
    recRef.current?.stop();
    useKairoStore.getState().setView("chat");
    if (!text) return;
    await send(text, []);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-kairo-bg">
      <div className="flex justify-end p-4">
        <button
          type="button"
          aria-label="Fechar voz"
          onClick={() => useKairoStore.getState().setView("chat")}
          className="grid size-11 place-items-center rounded-full bg-kairo-chip text-kairo-fg"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-8">
        <VoiceOrb listening={listening} className="size-28" />
        <p className="text-center text-[15px] text-kairo-muted">
          {transcript || (listening ? "Pode falar…" : "Toque no microfone para ditado")}
        </p>
      </div>
      <div className="flex justify-center gap-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => {
            if (listening) {
              recRef.current?.stop();
              setListening(false);
            } else {
              try {
                recRef.current?.start();
                setListening(true);
              } catch {
                /* already started */
              }
            }
          }}
          className="grid size-14 place-items-center rounded-full bg-kairo-chip text-kairo-fg"
          aria-label="Microfone"
        >
          <Mic className="size-6" />
        </button>
        <button
          type="button"
          onClick={() => void sendVoice()}
          disabled={!transcript.trim()}
          className="h-14 rounded-full bg-kairo-fg px-8 text-[15px] font-medium text-kairo-bg disabled:opacity-40"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
