interface Props {
  onSelect: (prompt: string) => void
  onQuiz: () => void
  onFlashcards: () => void
  onExamPrep: () => void
}

export function StudyTools({
  onSelect,
  onQuiz,
  onFlashcards,
  onExamPrep,
}: Props) {
  const tools = [
    {
      title: "Summarize",
      prompt: "Summarize this document",
    },

    {
      title: "Quiz",
      prompt: "QUIZ_MODE",
    },

    {
      title: "Flashcards",
      prompt: "FLASHCARD_MODE",
    },

    {
      title: "Exam Prep",
      prompt: "EXAM_PREP_MODE",
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

    {
      title: "Exam Prep",
      prompt: "EXAM_PREP_MODE",
    }
  ]

  return (
    <div className="flex flex-wrap gap-3">
      
      {tools.map((tool) => (
        <button
          key={tool.title}
          onClick={() => {
            if (tool.prompt === "QUIZ_MODE") {
              onQuiz()
              return
            }

            if (tool.prompt === "FLASHCARD_MODE") {
              onFlashcards()
              return
            }

            if (
              tool.prompt ===
              "EXAM_PREP_MODE"
            ) {
              onExamPrep()
              return
            }

            onSelect(tool.prompt)
          }}
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
