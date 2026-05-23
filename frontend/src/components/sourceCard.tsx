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
        bg-zinc-900/30
        hover:bg-zinc-800/50
        border
        border-zinc-800/50
        rounded-lg
        p-2
        transition-all
        group
      "
    >
      {/* FILE NAME */}

      <div className="text-zinc-200 text-xs font-medium truncate group-hover:text-blue-400">
        {source.metadata.source}
      </div>

      {/* PAGE */}

      <div className="text-zinc-500 text-[10px] mt-0.5">
        Page {source.metadata.page + 1}
      </div>
    </button>
  )
}
