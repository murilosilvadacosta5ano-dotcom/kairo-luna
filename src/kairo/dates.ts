const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function dateGroupLabel(ts: number, now = new Date()): string {
  const day = startOfDay(new Date(ts));
  const today = startOfDay(now);
  const yesterday = today - 86_400_000;
  if (day === today) return "Hoje";
  if (day === yesterday) return "Ontem";
  const d = new Date(ts);
  if (d.getFullYear() === now.getFullYear()) return MONTHS[d.getMonth()] ?? "";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function groupByDate<T extends { updatedAt: number }>(items: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  const index = new Map<string, number>();
  for (const item of items) {
    const label = dateGroupLabel(item.updatedAt);
    const existing = index.get(label);
    if (existing === undefined) {
      index.set(label, groups.length);
      groups.push({ label, items: [item] });
    } else {
      groups[existing]?.items.push(item);
    }
  }
  return groups;
}
