import type { Card } from "@/lib/board";

interface CardTileProps {
  card: Card;
  dragging?: boolean;
  onDelete?: () => void;
}

export default function CardTile({ card, dragging = false, onDelete }: CardTileProps) {
  return (
    <div
      className={[
        "group rounded-xl border bg-white p-3 text-left shadow-sm transition",
        dragging
          ? "rotate-2 cursor-grabbing border-primary/50 shadow-xl ring-2 ring-primary/30"
          : "border-slate-200/80 hover:border-primary/50 hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-navy">{card.title}</h3>
        {onDelete ? (
          <button
            type="button"
            aria-label={`Delete card: ${card.title}`}
            title={`Delete card: ${card.title}`}
            onClick={onDelete}
            className="-mr-0.5 -mt-0.5 rounded-md p-1 text-muted opacity-0 transition hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="h-3.5 w-3.5"
            >
              <path d="M3 6h18" strokeLinecap="round" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" strokeLinecap="round" />
              <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" strokeLinecap="round" />
              <path d="M10 11v6M14 11v6" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </div>
      {card.details ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{card.details}</p>
      ) : null}
    </div>
  );
}