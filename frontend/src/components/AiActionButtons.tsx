interface Props {
  content: string
  onAction: (prompt: string) => void
  onQuiz: () => void
  onFlashcards: () => void
  onExamPrep: () => void
  onViva: () => void
}

export function AIActionButtons({
  onAction,
  onQuiz,
  onFlashcards,
  onViva,
}: Props) {
  const actions: (
    | { kind: "prompt"; label: string; prompt: string }
    | { kind: "action"; label: string; action: () => void }
  )[] = [
    {
      kind: "prompt",
      label: "Summarize",
      prompt:
        "Summarize the previous response in concise bullet points",
    },

    {
      kind: "action",
      label: "Quiz",
      action: onQuiz,
    },

    {
      kind: "action",
      label: "Flashcards",
      action: onFlashcards,
    },

    {
      kind: "action",
      label: "Viva",
      action: onViva,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => {
            if (action.kind === "action") {
              action.action()
            } else {
              onAction(action.prompt)
            }
          }}
          className="
            px-3
            py-1.5
            text-xs
            rounded-lg
            bg-zinc-800
            hover:bg-zinc-700
            border
            border-zinc-700
            text-zinc-300
            transition
          "
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
