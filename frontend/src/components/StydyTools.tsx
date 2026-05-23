interface Props {
  onSelect: (prompt: string) => void
}

export function StudyTools({
  onSelect,
}: Props) {
  const tools = [
    {
      title: "Summarize",
      prompt: "Summarize this document",
    },

    {
      title: "Quiz",
      prompt:
        "Generate 10 MCQs from this document",
    },

    {
      title: "Viva",
      prompt:
        "Generate viva questions from this document",
    },

    {
      title: "Key Topics",
      prompt:
        "List important topics from this PDF",
    },

    {
      title: "Explain Simply",
      prompt:
        "Explain this PDF in simple language",
    },
  ]

  return (
    <div className="flex flex-wrap gap-3">
      
      {tools.map((tool) => (
        <button
          key={tool.title}
          onClick={() =>
            onSelect(tool.prompt)
          }
          className="
            px-4
            py-2
            rounded-xl
            bg-zinc-900
            hover:bg-zinc-800
            border
            border-zinc-800
            text-sm
            text-white
            transition
          "
        >
          {tool.title}
        </button>
      ))}
    </div>
  )
}
