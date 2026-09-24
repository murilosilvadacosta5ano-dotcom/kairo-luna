import { createFileRoute } from "@tanstack/react-router";
import { KairoApp } from "@/kairo/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <KairoApp />;
}
