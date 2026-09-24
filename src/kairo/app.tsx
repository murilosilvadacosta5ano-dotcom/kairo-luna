import { useEffect } from "react";
import { ChatHeader } from "./components/chat-header";
import { Composer } from "./components/composer";
import { HistoryScreen } from "./components/history-screen";
import { MessageList } from "./components/messages";
import { ModelMenu } from "./components/model-menu";
import {
  CameraOverlay,
  FilePicker,
  PlusSheet,
  SettingsSheet,
  VoiceOverlay,
} from "./components/overlays";
import { useKairoStore } from "./store";
import type { ChatMessage } from "./types";

const EMPTY_MESSAGES: ChatMessage[] = [];

export function KairoApp() {
  const view = useKairoStore((s) => s.view);
  const activeId = useKairoStore((s) => s.activeId);
  const messages = useKairoStore((s) => {
    const c = s.conversations.find((x) => x.id === s.activeId);
    return c?.messages ?? EMPTY_MESSAGES;
  });

  useEffect(() => {
    const persist = useKairoStore.persist;
    const finish = () => useKairoStore.getState().setHydrated();
    if (persist.hasHydrated()) finish();
    return persist.onFinishHydration(finish);
  }, []);

  const historyOpen = view === "history" || view === "search";

  return (
    <div className="flex min-h-dvh justify-center bg-kairo-bg text-kairo-fg">
      <div className="relative flex h-dvh w-full max-w-md flex-col overflow-hidden bg-kairo-bg sm:max-w-lg">
        <div
          className="flex h-full flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: historyOpen ? "translateX(-8%)" : "translateX(0)" }}
          inert={historyOpen || undefined}
          aria-hidden={historyOpen}
        >
          <ChatHeader />
          <ModelMenu />
          <MessageList key={activeId ?? "empty"} messages={messages} />
          <Composer />
        </div>

        <div
          className="absolute inset-0 z-30 bg-kairo-bg transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            transform: historyOpen ? "translateX(0)" : "translateX(-100%)",
            opacity: historyOpen ? 1 : 0,
            pointerEvents: historyOpen ? "auto" : "none",
          }}
          inert={!historyOpen || undefined}
          aria-hidden={!historyOpen}
        >
          <HistoryScreen />
        </div>

        <PlusSheet />
        <SettingsSheet />
        <CameraOverlay />
        <VoiceOverlay />
        <FilePicker />
      </div>
    </div>
  );
}
