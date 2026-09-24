import { Fragment, type ReactNode } from "react";

export function Markdown({ text }: { text: string }) {
  const blocks = splitBlocks(text);
  return (
    <div className="flex flex-col gap-3 text-pretty text-[15px] leading-[1.55] text-kairo-fg">
      {blocks.map((block, i) => (
        <Fragment key={i}>{renderBlock(block)}</Fragment>
      ))}
    </div>
  );
}

type Block =
  | { type: "code"; lang: string; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "h"; level: 1 | 2 | 3; text: string }
  | { type: "quote"; text: string }
  | { type: "p"; text: string };

function splitBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) {
        buf.push(lines[i] ?? "");
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", lang, code: buf.join("\n") });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push({ type: "ol", items });
      continue;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const marks = heading[1] ?? "#";
      const level = Math.min(marks.length, 3) as 1 | 2 | 3;
      blocks.push({
        type: "h",
        level,
        text: heading[2] ?? "",
      });
      i += 1;
      continue;
    }
    if (line.startsWith("> ")) {
      blocks.push({ type: "quote", text: line.slice(2) });
      i += 1;
      continue;
    }
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    const buf = [line];
    i += 1;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^(```|#{1,3}\s+|[-*]\s+|\d+\.\s+|> )/.test(lines[i] ?? "")
    ) {
      buf.push(lines[i] ?? "");
      i += 1;
    }
    blocks.push({ type: "p", text: buf.join(" ") });
  }
  return blocks;
}

function renderBlock(block: Block): ReactNode {
  switch (block.type) {
    case "code":
      return (
        <pre className="overflow-x-auto rounded-xl bg-kairo-surface-2 px-3 py-3 text-[13px] leading-relaxed text-kairo-fg">
          <code>{block.code}</code>
        </pre>
      );
    case "ul":
      return (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="flex list-decimal flex-col gap-1 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ol>
      );
    case "h": {
      const cls =
        block.level === 1
          ? "text-lg font-semibold tracking-tight"
          : block.level === 2
            ? "text-base font-semibold tracking-tight"
            : "text-[15px] font-semibold";
      return <p className={cls}>{inline(block.text)}</p>;
    }
    case "quote":
      return (
        <p className="border-l-2 border-kairo-elevated pl-3 text-kairo-muted">
          {inline(block.text)}
        </p>
      );
    default:
      return <p>{inline(block.text)}</p>;
  }
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))|(!\[[^\]]*\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("`")) {
      out.push(
        <code
          key={key++}
          className="rounded-md bg-kairo-surface px-1 py-0.5 font-mono text-[13px]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      out.push(
        <strong key={key++} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      out.push(
        <em key={key++} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("![")) {
      const img = /!\[([^\]]*)\]\(([^)]+)\)/.exec(token);
      if (img && isSafeUrl(img[2])) {
        out.push(
          <img
            key={key++}
            src={img[2]}
            alt={img[1]}
            className="mt-2 max-h-72 w-full rounded-2xl object-cover"
          />,
        );
      }
    } else {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(token);
      if (link && isSafeUrl(link[2])) {
        out.push(
          <a
            key={key++}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="text-kairo-accent underline-offset-2 hover:underline"
          >
            {link[1]}
          </a>,
        );
      } else {
        out.push(token);
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function isSafeUrl(url: string) {
  return /^https?:\/\//i.test(url);
}
