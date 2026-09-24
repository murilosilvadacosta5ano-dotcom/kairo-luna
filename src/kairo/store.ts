import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyConversation, seedConversations, titleFromText } from "./seed";
import { uid } from "./ids";
import type {
  ChatImage,
  ChatMessage,
  Citation,
  Conversation,
  KairoModelId,
  KairoView,
} from "./types";

type KairoState = {
  hydrated: boolean;
  view: KairoView;
  searchQuery: string;
  conversations: Conversation[];
  activeId: string | null;
  modelId: KairoModelId;
  webSearch: boolean;
  imageMode: boolean;
  plusOpen: boolean;
  modelOpen: boolean;
  settingsOpen: boolean;
  draftImages: ChatImage[];
  aborting: boolean;
  setHydrated: () => void;
  setView: (view: KairoView) => void;
  setSearchQuery: (q: string) => void;
  setModelId: (id: KairoModelId) => void;
  toggleWebSearch: () => void;
  setImageMode: (on: boolean) => void;
  setPlusOpen: (open: boolean) => void;
  setModelOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  newChat: () => void;
  openConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addDraftImage: (dataUrl: string) => void;
  removeDraftImage: (id: string) => void;
  clearDraftImages: () => void;
  startUserTurn: (text: string, images: ChatImage[]) => { convId: string; assistantId: string };
  appendDelta: (convId: string, assistantId: string, delta: string) => void;
  setThinking: (convId: string, assistantId: string, thinking: boolean) => void;
  setGeneratedImage: (
    convId: string,
    assistantId: string,
    image: { url: string; prompt: string },
  ) => void;
  setCitations: (convId: string, assistantId: string, citations: Citation[]) => void;
  finishAssistant: (convId: string, assistantId: string) => void;
  failAssistant: (convId: string, assistantId: string, error: string) => void;
  isStreaming: () => boolean;
};

function patchMessage(
  conversations: Conversation[],
  convId: string,
  messageId: string,
  patch: (m: ChatMessage) => ChatMessage,
): Conversation[] {
  return conversations.map((c) => {
    if (c.id !== convId) return c;
    return {
      ...c,
      updatedAt: Date.now(),
      messages: c.messages.map((m) => (m.id === messageId ? patch(m) : m)),
    };
  });
}

export const useKairoStore = create<KairoState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      view: "chat",
      searchQuery: "",
      conversations: [],
      activeId: null,
      modelId: "luna",
      webSearch: false,
      imageMode: false,
      plusOpen: false,
      modelOpen: false,
      settingsOpen: false,
      draftImages: [],
      aborting: false,
      setHydrated: () => {
        const { conversations, activeId } = get();
        if (conversations.length === 0) {
          const seeded = seedConversations();
          const blank = emptyConversation();
          set({
            hydrated: true,
            conversations: [blank, ...seeded],
            activeId: blank.id,
          });
          return;
        }
        set({
          hydrated: true,
          activeId: activeId ?? conversations[0]?.id ?? null,
        });
      },
      setView: (view) => set({ view, modelOpen: false, plusOpen: false }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setModelId: (modelId) => set({ modelId, modelOpen: false }),
      toggleWebSearch: () => set({ webSearch: !get().webSearch }),
      setImageMode: (imageMode) => set({ imageMode }),
      setPlusOpen: (plusOpen) => set({ plusOpen }),
      setModelOpen: (modelOpen) => set({ modelOpen }),
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      newChat: () => {
        const current = get().conversations.find((c) => c.id === get().activeId);
        if (current && current.messages.length === 0) {
          set({
            view: "chat",
            imageMode: false,
            plusOpen: false,
            modelOpen: false,
            draftImages: [],
          });
          return;
        }
        const blank = emptyConversation();
        set({
          conversations: [blank, ...get().conversations],
          activeId: blank.id,
          view: "chat",
          imageMode: false,
          plusOpen: false,
          modelOpen: false,
          draftImages: [],
        });
      },
      openConversation: (id) =>
        set({
          activeId: id,
          view: "chat",
          imageMode: false,
          plusOpen: false,
          modelOpen: false,
        }),
      deleteConversation: (id) => {
        const rest = get().conversations.filter((c) => c.id !== id);
        const activeId = get().activeId === id ? (rest[0]?.id ?? null) : get().activeId;
        set({ conversations: rest, activeId });
      },
      addDraftImage: (dataUrl) => {
        const images = get().draftImages;
        if (images.length >= 4) return;
        set({
          draftImages: [...images, { id: uid("img"), dataUrl }],
          plusOpen: false,
          view: "chat",
        });
      },
      removeDraftImage: (id) =>
        set({ draftImages: get().draftImages.filter((i) => i.id !== id) }),
      clearDraftImages: () => set({ draftImages: [] }),
      startUserTurn: (text, images) => {
        let convId = get().activeId;
        let conversations = get().conversations;
        if (!convId) {
          const blank = emptyConversation();
          convId = blank.id;
          conversations = [blank, ...conversations];
        }
        const now = Date.now();
        const user: ChatMessage = {
          id: uid("m"),
          role: "user",
          text,
          images: images.length ? images : undefined,
          createdAt: now,
        };
        const assistant: ChatMessage = {
          id: uid("m"),
          role: "assistant",
          text: "",
          createdAt: now + 1,
          streaming: true,
          thinking: true,
        };
        conversations = conversations.map((c) => {
          if (c.id !== convId) return c;
          const nextMessages = [...c.messages, user, assistant];
          const titled =
            c.messages.length === 0 ? titleFromText(text || "Imagem") : c.title;
          return {
            ...c,
            title: titled,
            updatedAt: now,
            messages: nextMessages,
          };
        });
        set({
          conversations,
          activeId: convId,
          draftImages: [],
          view: "chat",
          plusOpen: false,
        });
        return { convId, assistantId: assistant.id };
      },
      appendDelta: (convId, assistantId, delta) =>
        set({
          conversations: patchMessage(
            get().conversations,
            convId,
            assistantId,
            (m) => ({
              ...m,
              text: m.text + delta,
              thinking: false,
            }),
          ),
        }),
      setThinking: (convId, assistantId, thinking) =>
        set({
          conversations: patchMessage(
            get().conversations,
            convId,
            assistantId,
            (m) => ({ ...m, thinking }),
          ),
        }),
      setGeneratedImage: (convId, assistantId, image) =>
        set({
          conversations: patchMessage(
            get().conversations,
            convId,
            assistantId,
            (m) => ({
              ...m,
              generatedImage: image,
              thinking: false,
            }),
          ),
        }),
      setCitations: (convId, assistantId, citations) =>
        set({
          conversations: patchMessage(
            get().conversations,
            convId,
            assistantId,
            (m) => ({ ...m, citations }),
          ),
        }),
      finishAssistant: (convId, assistantId) =>
        set({
          conversations: patchMessage(
            get().conversations,
            convId,
            assistantId,
            (m) => ({
              ...m,
              streaming: false,
              thinking: false,
            }),
          ),
        }),
      failAssistant: (convId, assistantId, error) =>
        set({
          conversations: patchMessage(
            get().conversations,
            convId,
            assistantId,
            (m) => ({
              ...m,
              streaming: false,
              thinking: false,
              error,
              text: m.text || "",
            }),
          ),
        }),
      isStreaming: () =>
        get().conversations.some((c) => c.messages.some((m) => m.streaming)),
    }),
    {
      name: "kairo-v1",
      partialize: (s) => ({
        conversations: s.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            streaming: false,
            thinking: false,
          })),
        })),
        activeId: s.activeId,
        modelId: s.modelId,
        webSearch: s.webSearch,
      }),
    },
  ),
);

export function listedConversations(conversations: Conversation[]) {
  return conversations
    .filter((c) => c.messages.length > 0)
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
