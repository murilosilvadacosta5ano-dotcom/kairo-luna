import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { groupByDate } from "../dates";
import { listedConversations, useKairoStore } from "../store";
import { cn } from "@/lib/utils";

export function HistoryScreen() {
  const view = useKairoStore((s) => s.view);
  const conversations = useKairoStore((s) => s.conversations);
  const searchQuery = useKairoStore((s) => s.searchQuery);
  const searching = view === "search";
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const listed = useMemo(() => {
    const all = listedConversations(conversations);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q)),
    );
  }, [conversations, searchQuery]);

  const groups = useMemo(() => groupByDate(listed), [listed]);

  return (
    <section className="relative flex h-full flex-col bg-kairo-bg">
      <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-1">
        <button
          type="button"
          aria-label="Ajustes"
          onClick={() => useKairoStore.getState().setSettingsOpen(true)}
          className="grid size-11 place-items-center rounded-full bg-kairo-chip text-kairo-fg transition-transform duration-150 active:scale-[0.96]"
        >
          <SlidersHorizontal className="size-5" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="Voltar ao chat"
          onClick={() => useKairoStore.getState().setView("chat")}
          className="grid size-11 place-items-center rounded-full bg-kairo-chip text-kairo-fg transition-transform duration-150 active:scale-[0.96]"
        >
          <ChevronRight className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex items-center justify-between px-5 pt-4 pb-5">
        <h1 className="font-display text-[28px] leading-none font-semibold tracking-tight text-kairo-fg">
          Histórico de conversas
        </h1>
        <button
          type="button"
          aria-label="Novo chat"
          onClick={() => useKairoStore.getState().newChat()}
          className="grid size-11 place-items-center rounded-full bg-kairo-chip text-kairo-fg transition-transform duration-150 active:scale-[0.96]"
        >
          <Plus className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      {searching ? (
        <div className="px-4 pb-4">
          <div className="flex h-12 items-center gap-2 rounded-full bg-kairo-chip px-4">
            <Search className="size-4 text-kairo-muted" strokeWidth={1.75} />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => useKairoStore.getState().setSearchQuery(e.target.value)}
              placeholder="Buscar conversas"
              className="h-full w-full bg-transparent text-[15px] text-kairo-fg outline-none placeholder:text-kairo-subtle"
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => useKairoStore.getState().setSearchQuery("")}
              >
                <X className="size-4 text-kairo-muted" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">
        {groups.length === 0 ? (
          <p className="px-1 pt-8 text-sm text-kairo-muted">Nenhuma conversa encontrada.</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-6">
              <span className="mb-3 inline-flex rounded-full bg-kairo-chip px-3 py-1 text-[13px] font-medium text-kairo-fg">
                {group.label}
              </span>
              <div className="flex flex-col gap-2">
                {group.items.map((c) => (
                  <div key={c.id} className="relative">
                    <button
                      type="button"
                      onClick={() => useKairoStore.getState().openConversation(c.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setPendingDelete(c.id);
                      }}
                      className="flex min-h-14 w-full items-center rounded-card bg-kairo-chip px-4 py-4 text-left text-[17px] font-normal text-kairo-fg transition-transform duration-150 active:scale-[0.99]"
                    >
                      <span className="truncate">{c.title}</span>
                    </button>
                    {pendingDelete === c.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          useKairoStore.getState().deleteConversation(c.id);
                          setPendingDelete(null);
                        }}
                        className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 rounded-full bg-kairo-danger px-3 py-1.5 text-[12px] font-medium text-white"
                      >
                        <Trash2 className="size-3.5" />
                        Apagar
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() =>
            useKairoStore.getState().setView(searching ? "history" : "search")
          }
          className={cn(
            "pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-kairo-chip px-6 text-[16px] font-medium text-kairo-fg shadow-[0_8px_30px_rgb(0_0_0_/_0.45)] transition-transform duration-150 active:scale-[0.97]",
          )}
        >
          <Search className="size-4" strokeWidth={1.75} />
          {searching ? "Fechar" : "Buscar"}
        </button>
      </div>
    </section>
  );
}
