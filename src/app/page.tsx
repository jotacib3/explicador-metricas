import { ExplainerApp } from "@/components/explainer-app";

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-6 pb-8">
      {/* Halo decorativo de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />
      <ExplainerApp />
      <footer className="mt-10 text-center text-sm text-muted-foreground">Hecho por Juan José López</footer>
    </main>
  );
}
