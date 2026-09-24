import { cn } from "@/lib/utils";

export function VoiceOrb({
  listening = false,
  className,
}: {
  listening?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "kairo-orb kairo-orb-glow relative grid size-10 place-items-center overflow-hidden rounded-full",
        listening && "kairo-orb-listen",
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-px rounded-full bg-black/25" />
      <span className="relative flex h-4 items-end gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="kairo-wave-bar w-0.5 origin-bottom rounded-full bg-white"
            style={{
              height: `${10 + ((i * 7) % 9)}px`,
              animation: `kairo-wave ${0.7 + (i % 3) * 0.12}s ease-in-out ${i * 0.08}s infinite`,
            }}
          />
        ))}
      </span>
    </span>
  );
}
