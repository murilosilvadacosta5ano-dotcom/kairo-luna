import { Check } from "lucide-react";
import { KAIRO_MODELS } from "../models";
import { useKairoStore } from "../store";
import { cn } from "@/lib/utils";

export function ModelMenu() {
  const open = useKairoStore((s) => s.modelOpen);
  const modelId = useKairoStore((s) => s.modelId);
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="absolute inset-0 z-30"
        aria-label="Fechar modelos"
        onClick={() => useKairoStore.getState().setModelOpen(false)}
      />
      <div className="absolute top-16 right-4 left-4 z-40 origin-top scale-100 rounded-3xl bg-kairo-surface p-2 shadow-[0_16px_50px_rgb(0_0_0_/_0.55)] transition-opacity duration-200">
        {KAIRO_MODELS.map((m) => {
          const active = m.id === modelId;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => useKairoStore.getState().setModelId(m.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors duration-150",
                active ? "bg-kairo-elevated/80" : "hover:bg-white/5",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-kairo-fg">
                  {m.label}
                </span>
                <span className="block text-[13px] text-kairo-muted">{m.subtitle}</span>
              </span>
              {active ? <Check className="size-4 text-kairo-fg" strokeWidth={2} /> : null}
            </button>
          );
        })}
      </div>
    </>
  );
}
