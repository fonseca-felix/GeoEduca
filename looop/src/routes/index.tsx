import { createFileRoute } from "@tanstack/react-router";
import { Presentation } from "@/components/Presentation";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "GeoEduca · O Brasil nas Pistas" },
      { name: "description", content: "Apresentação imersiva da plataforma gamificada que transforma o ensino de Geografia em expedição." },
      { property: "og:title", content: "GeoEduca · O Brasil nas Pistas" },
      { property: "og:description", content: "A plataforma gamificada que transforma o ensino de Geografia em uma expedição interativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Presentation,
});
