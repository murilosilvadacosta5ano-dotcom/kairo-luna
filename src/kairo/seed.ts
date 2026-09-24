import { uid } from "./ids";
import type { Conversation } from "./types";

function msg(
  role: "user" | "assistant",
  text: string,
  createdAt: number,
): Conversation["messages"][number] {
  return { id: uid("m"), role, text, createdAt };
}

export function seedConversations(): Conversation[] {
  const now = Date.now();
  const todayA = now - 1000 * 60 * 42;
  const todayB = now - 1000 * 60 * 110;
  const todayC = now - 1000 * 60 * 180;
  const august = new Date(2026, 7, 14, 16, 20).getTime();

  return [
    {
      id: uid("c"),
      title: "Casual Chat",
      createdAt: todayA,
      updatedAt: todayA,
      messages: [
        msg("user", "Oi, tudo bem? Me conta uma curiosidade rápida.", todayA - 4000),
        msg(
          "assistant",
          "Tudo sim. Uma boa: polvos têm três corações — dois bombeiam sangue para as brânquias e o terceiro para o resto do corpo. Quando nadam, o coração principal para, por isso eles preferem rastejar.",
          todayA,
        ),
      ],
    },
    {
      id: uid("c"),
      title: "DeskiSecure e Loja",
      createdAt: todayB,
      updatedAt: todayB,
      messages: [
        msg(
          "user",
          "Quero um app DeskiSecure com loja: o que colocar na home?",
          todayB - 8000,
        ),
        msg(
          "assistant",
          "Na home, priorize confiança e conversão:\n\n1. **Status de proteção** — um cartão claro (protegido / atenção) com a última varredura.\n2. **Ações rápidas** — varrer agora, cofre, VPN.\n3. **Loja em destaque** — 2–3 planos ou add-ons, não um catálogo inteiro.\n4. **Atividade recente** — ameaças bloqueadas, compras, alertas.\n\nO resto (detalhes de plano, histórico, suporte) fica um toque abaixo.",
          todayB,
        ),
      ],
    },
    {
      id: uid("c"),
      title: "Capacidades do Claude",
      createdAt: todayC,
      updatedAt: todayC,
      messages: [
        msg("user", "Quais são as capacidades do Claude, em resumo?", todayC - 5000),
        msg(
          "assistant",
          "Em linhas gerais, o Claude é forte em:\n\n- **Texto longo** — leitura, resumo e análise de documentos extensos\n- **Código** — explicar, refatorar e revisar com cuidado\n- **Raciocínio** — tarefas que pedem passo a passo\n- **Escrita** — tom controlado, edição e reescrita\n\nLimitações típicas: não opera seu computador sozinho sem ferramentas, e o conhecimento pode estar defasado sem busca.",
          todayC,
        ),
      ],
    },
    {
      id: uid("c"),
      title: "Ensemble IA 0,5B",
      createdAt: august,
      updatedAt: august,
      messages: [
        msg(
          "user",
          "O que é um ensemble de modelos de 0,5B parâmetros?",
          august - 6000,
        ),
        msg(
          "assistant",
          "É um time de modelos **pequenos** (cerca de 500 milhões de parâmetros cada) que votam ou se especializam, em vez de um único modelo gigante.\n\nA ideia: cada um é barato e rápido; juntos podem acertar mais do que um sozinho, principalmente se forem treinados de formas diferentes. O custo de servir vários 0,5B ainda pode ser menor que um modelo de dezenas de bilhões — com a troca de ser menos “geral” em tarefas abertas.",
          august,
        ),
      ],
    },
  ];
}

export function emptyConversation(): Conversation {
  const now = Date.now();
  return {
    id: uid("c"),
    title: "Novo chat",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function titleFromText(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "Novo chat";
  return clean.length > 42 ? `${clean.slice(0, 42).trim()}…` : clean;
}
