import { createFileRoute } from "@tanstack/react-router";
import { geminiGenerateImage, resolveGeminiKey } from "@/kairo/server/gemini";

export const Route = createFileRoute("/api/kairo/image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const raw = (await request.json()) as { prompt?: unknown };
          const prompt = typeof raw.prompt === "string" ? raw.prompt : "";
          const result = await geminiGenerateImage(prompt, resolveGeminiKey(request));
          if (!result.ok) {
            const status = result.error.includes("Ajustes") ? 401 : 502;
            return Response.json({ error: result.error }, { status });
          }
          return Response.json({ url: result.url });
        } catch {
          return Response.json({ error: "Pedido inválido." }, { status: 400 });
        }
      },
    },
  },
});
