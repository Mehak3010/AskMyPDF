interface Props {
  source: any
  onNavigate?: (page: number) => void
}

export function SourceCard({ source, onNavigate }: Props) {
  return (
    <button
      onClick={() =>
        onNavigate?.(source.metadata.page)
      }
      className="
        w-full
        text-left
        bg-zinc-900
        hover:bg-zinc-800
        border
        border-zinc-800
        rounded-xl
        p-3
        transition
      "
    >
      <div className="text-white font-medium">
        {source.metadata.source}
      </div>

      <div className="text-zinc-400 text-sm mt-1">
        Page {source.metadata.page + 1}
      </div>

      <div className="text-zinc-500 text-xs mt-2">
        {source.metadata.collection}
      </div>
    </button>
  )
}