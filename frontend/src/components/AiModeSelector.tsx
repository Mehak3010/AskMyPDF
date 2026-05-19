interface Props {
  selectedMode: string

  onSelect: (mode: string) => void
}

export function AIModeSelector({
  selectedMode,
  onSelect,
}: Props) {
  const modes = [
    "Beginner",
    "Interview",
    "Research",
    "Exam Prep",
  ]

  return (
    <div className="flex flex-wrap gap-2">

      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() =>
            onSelect(mode)
          }
          className={`
            px-4
            py-2
            rounded-xl
            text-sm
            transition
            border

            ${
              selectedMode === mode
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
            }
          `}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}
