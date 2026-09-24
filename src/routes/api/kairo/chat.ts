import { createFileRoute } from "@tanstack/react-router";
import { geminiChatStream, parseChatBody, resolveGeminiKey } from "@/kairo/server/gemini";

export const Route = createFileRoute("/api/kairo/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = await request.json();
          const parsed = parseChatBody(raw);
          return await geminiChatStream({
            ...parsed,
            apiKey: resolveGeminiKey(request),
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Pedido inválido.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
