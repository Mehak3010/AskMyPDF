interface Props {
  content: string
  onAction: (prompt: string) => void
  onQuiz: () => void
  onFlashcards: () => void
  onExamPrep: () => void
  onViva: () => void
}

export function AIActionButtons({
  content,
  onAction,
  onQuiz,
  onFlashcards,
  onExamPrep,
  onViva,
}: Props) {
  const actions = [
    {
      label: "Summarize",
      prompt:
        "Summarize the previous response in concise bullet points",
    },

    {
      label: "Quiz",
      action: onQuiz,
    },

    {
      label: "Flashcards",
      action: onFlashcards,
    },

    {
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
            if ('action' in action) {
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
