import { useState } from "react"
import type { VivaQuestion } from "../types/viva"

interface Props {
  questions: VivaQuestion[]
  onClose: () => void
}

export function VivaView({
  questions,
  onClose,
}: Props) {

  const [current, setCurrent] =
    useState(0)

  const [showAnswer, setShowAnswer] =
    useState(false)

  const question =
    questions[current]

  function nextQuestion() {

    if (
      current <
      questions.length - 1
    ) {
      setCurrent(
        prev => prev + 1
      )

      setShowAnswer(false)
    }
  }

  function prevQuestion() {

    if (current > 0) {

      setCurrent(
        prev => prev - 1
      )

      setShowAnswer(false)
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50

        bg-black/70
        backdrop-blur-sm

        flex
        items-center
        justify-center

        p-6
      "
    >
      <div
        className="
          w-full
          max-w-4xl

          bg-[#0f172a]

          border
          border-zinc-800

          rounded-3xl

          p-8
        "
      >

        <div
          className="
            flex
            justify-between
            items-center

            mb-8
          "
        >
          <h2
            className="
              text-3xl
              font-bold
              text-white
            "
          >
            Viva Practice
          </h2>

          <button
            onClick={onClose}
            className="
              text-zinc-400
              hover:text-white
            "
          >
            ✕
          </button>
        </div>

        <div
          className="
            text-center
            text-zinc-400
            mb-6
          "
        >
          Question {current + 1}
          {" / "}
          {questions.length}
        </div>

        <div
          className="
            bg-zinc-900

            border
            border-zinc-800

            rounded-2xl

            p-8

            mb-6
          "
        >
          <h3
            className="
              text-2xl
              font-semibold
              text-white
              mb-6
            "
          >
            {question.question}
          </h3>

          {showAnswer && (
            <div
              className="
                mt-6

                bg-blue-950/30

                border
                border-blue-500/30

                rounded-xl

                p-5

                text-zinc-200
              "
            >
              {question.answer}
            </div>
          )}
        </div>

        <div
          className="
            flex
            justify-center

            mb-8
          "
        >
          <button
            onClick={() =>
              setShowAnswer(
                !showAnswer
              )
            }
            className="
              px-6
              py-3

              rounded-xl

              bg-blue-600
              hover:bg-blue-500

              text-white
            "
          >
            {showAnswer
              ? "Hide Answer"
              : "Show Answer"}
          </button>
        </div>

        <div
          className="
            flex
            justify-between
          "
        >
          <button
            onClick={prevQuestion}
            disabled={current === 0}
            className="
              px-5
              py-3

              rounded-xl

              bg-zinc-800

              disabled:opacity-50

              text-white
            "
          >
            Previous
          </button>

          <button
            onClick={nextQuestion}
            disabled={
              current ===
              questions.length - 1
            }
            className="
              px-5
              py-3

              rounded-xl

              bg-blue-600

              disabled:opacity-50

              text-white
            "
          >
            Next
          </button>
        </div>

      </div>
    </div>
  )
}