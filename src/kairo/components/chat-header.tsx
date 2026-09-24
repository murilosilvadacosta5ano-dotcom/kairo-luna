import { ChevronDown, Menu, SquarePen } from "lucide-react";
import { modelById } from "../models";
import { useKairoStore } from "../store";
import { cn } from "@/lib/utils";

export function ChatHeader() {
  const modelId = useKairoStore((s) => s.modelId);
  const modelOpen = useKairoStore((s) => s.modelOpen);
  const model = modelById(modelId);

  return (
    <header className="relative z-20 flex items-center gap-2 px-4 pt-3 pb-2">
      <button
        type="button"
        aria-label="Histórico de conversas"
        onClick={() => useKairoStore.getState().setView("history")}
        className="grid h-11 w-12 shrink-0 place-items-center rounded-full bg-kairo-chip text-kairo-fg transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        <Menu className="size-5" strokeWidth={1.75} />
      </button>

      <button
        type="button"
        onClick={() => useKairoStore.getState().setModelOpen(!modelOpen)}
        className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-kairo-chip px-3 text-kairo-fg transition-transform duration-150 ease-out active:scale-[0.98]"
      >
        <span className="truncate text-[15px] font-medium tracking-tight">
          {model.label}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-kairo-muted transition-transform duration-200",
            modelOpen && "rotate-180",
          )}
          strokeWidth={2}
        />
      </button>

      <button
        type="button"
        aria-label="Novo chat"
        onClick={() => useKairoStore.getState().newChat()}
        className="grid h-11 w-12 shrink-0 place-items-center rounded-full bg-kairo-chip text-kairo-fg transition-transform duration-150 ease-out active:scale-[0.96]"
      >
        <SquarePen className="size-5" strokeWidth={1.75} />
      </button>
    </header>
  );
}
