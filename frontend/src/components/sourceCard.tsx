interface Props {
  source: any

  onNavigate?: (page: number) => void

  onOpenPdf?: (
    url: string,
    sourceName?: string
  ) => void
}

export function SourceCard({
  source,
  onNavigate,
  onOpenPdf,
}: Props) {
  return (
    <button
      onClick={() => {
        onOpenPdf?.(
            source.metadata.url,
            source.metadata.source
        )

        onNavigate?.(source.metadata.page)
      }}
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
      {/* FILE NAME */}

      <div className="text-white font-medium">
        {source.metadata.source}
      </div>

      {/* PAGE */}

      <div className="text-zinc-400 text-sm mt-1">
        Page {source.metadata.page + 1}
      </div>

      {/* COLLECTION */}

      <div className="text-zinc-500 text-xs mt-2">
        {source.metadata.collection}
      </div>
    </button>
  )
}
