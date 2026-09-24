export type KairoView = "chat" | "history" | "search" | "camera" | "voice";

export type KairoModelId = "luna" | "fast";

export type MessageRole = "user" | "assistant";

export type ChatImage = {
  id: string;
  dataUrl: string;
};

export type Citation = {
  url: string;
  title: string;
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  text: string;
  images?: ChatImage[];
  generatedImage?: {
    url: string;
    prompt: string;
  };
  citations?: Citation[];
  createdAt: number;
  streaming?: boolean;
  thinking?: boolean;
  error?: string;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
};

export type KairoModel = {
  id: KairoModelId;
  label: string;
  subtitle: string;
  apiModel: string;
};
