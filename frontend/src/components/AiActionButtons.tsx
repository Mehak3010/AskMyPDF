interface Props {
  content: string
  onAction: (prompt: string) => void
}

export function AIActionButtons({
  content,
  onAction,
}: Props) {
  const actions = [
    {
      label: "Summarize",
      prompt:
        "Summarize the previous response in concise bullet points",
    },

    {
      label: "Quiz",
      prompt:
        "Generate quiz questions from the previous response",
    },

    {
      label: "Flashcards",
      prompt:
        "Create flashcards from the previous response",
    },

    {
      label: "Viva",
      prompt:
        "Generate viva questions from the previous response",
    },
  ]

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() =>
            onAction(action.prompt)
          }
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
