import Board from "@/components/Board";

export default function Home() {
  return (
    <div className="mx-auto flex h-dvh max-w-[1700px] flex-col px-6 py-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Kanban</p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-navy">Launch Board</h1>
          <div className="mt-2.5 h-1 w-14 rounded-full bg-accent" aria-hidden="true" />
        </div>
        <p className="pb-1 text-sm text-muted">
          Drag cards between columns to update their status.
        </p>
      </header>
      <Board />
    </div>
  );
}