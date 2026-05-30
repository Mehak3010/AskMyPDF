import {
  useState,
  useEffect,
  useRef,
} from "react"

import type { QuizQuestion } from "../types/quiz"

interface Props {
  questions: QuizQuestion[]
  onClose: () => void
}

export function QuizView({
  questions,
  onClose,
}: Props) {
  const [currentQuestion, setCurrentQuestion] =
    useState(0)

  const [selectedAnswer, setSelectedAnswer] =
    useState<string | null>(null)

  const [score, setScore] =
    useState(0)

  const [userAnswers, setUserAnswers] =
    useState<string[]>([])

  const [finished, setFinished] =
    useState(false)

  const question =
    questions[currentQuestion]

  const resultRef =
    useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (finished) {
      resultRef.current?.scrollTo({
        top: 0,
      })
    }
  }, [finished])


  function handleNext() {
    if (!selectedAnswer) return

    setUserAnswers((prev) => [
      ...prev,
      selectedAnswer,
    ])

    if (
      selectedAnswer === question.answer
    ) {
      setScore((prev) => prev + 1)
    }

    if (
      currentQuestion ===
      questions.length - 1
    ) {
      setFinished(true)
      return
    }

    setCurrentQuestion(
      (prev) => prev + 1
    )

    setSelectedAnswer(null)
  }

  // =========================
  // RESULT SCREEN
  // =========================

  if (finished) {
    const percentage = Math.round(
      (score / questions.length) * 100
    )

    return (
      <div
        className="
          fixed
          inset-0
          z-50

          bg-black/70
          backdrop-blur-sm

          overflow-y-auto

          p-6
        "
      >
        <div
          ref={resultRef}
          className="
            mx-auto

            w-full
            max-w-4xl

            max-h-[90vh]

            overflow-y-auto

            my-10

            bg-[#0f172a]

            border
            border-zinc-800

            rounded-3xl

            p-8
          "
        >
          <h2
            className="
              text-3xl
              font-bold
              text-white
              mb-6
            "
          >
            Quiz Complete 
          </h2>

          <div
            className="
              text-center
              py-8
            "
          >
            <div
              className="
                text-6xl
                font-bold
                text-blue-400
              "
            >
              {score}/{questions.length}
            </div>

            <div
              className="
                mt-3
                text-zinc-400
              "
            >
              Score
            </div>

            <div
              className="
                mt-6

                text-2xl
                font-semibold
                text-white
              "
            >
              {percentage}%
            </div>

            <div
              className="
                mt-8

                bg-zinc-900
                border
                border-zinc-800

                rounded-2xl

                p-4

                text-left
              "
            >
              <h3
                className="
                  text-white
                  font-semibold
                  mb-2
                "
              >
                Performance Analysis
              </h3>

              <p
                className="
                  text-zinc-400
                  text-sm
                "
              >
                You answered {score} out of{" "}
                {questions.length}
                {" "}
                questions correctly.
              </p>
            </div>
          </div>

          <h3
            className="
              mt-8
              mb-4

              text-xl
              font-semibold
              text-white
            "
          >
            Question Review
          </h3>

          <div className="mt-8 space-y-4">
            {questions.map((question, index) => {
              const userAnswer =
                userAnswers[index] ??
                "No Answer"

              const correct =
                userAnswer ===
                question.answer

              return (
                <div
                  key={index}
                  className="
                    bg-zinc-900
                    border
                    border-zinc-800
                    rounded-2xl
                    p-4
                  "
                >
                  <h4
                    className="
                      text-white
                      font-medium
                      mb-3
                    "
                  >
                    {index + 1}. {question.question}
                  </h4>

                  <div
                    className={`
                      inline-flex
                      px-3
                      py-1

                      rounded-full

                      text-sm
                      font-medium

                      mb-3

                      ${
                        correct
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }
                    `}
                  >
                    {correct
                      ? "✓ Correct"
                      : "✗ Incorrect"}
                  </div>

                  <div
                    className={
                      correct
                        ? `
                          bg-green-500/20
                          border
                          border-green-500
                          rounded-xl
                          p-3
                        `
                        : `
                          bg-red-500/20
                          border
                          border-red-500
                          rounded-xl
                          p-3
                        `
                    }
                  >
                    Your Answer: {userAnswer}
                  </div>

                  <div
                    className="
                      mt-2

                      bg-green-500/20
                      border
                      border-green-500

                      rounded-xl

                      p-3
                    "
                  >
                    Correct Answer:
                    {" "}
                    {question.answer}
                  </div>

                  <div
                    className="
                      mt-3

                      bg-blue-500/10
                      border
                      border-blue-500/30

                      rounded-xl

                      p-4
                    "
                  >
                    <div
                      className="
                        text-blue-300
                        font-medium
                        mb-2
                      "
                    >
                      Explanation
                    </div>

                    <p
                      className="
                        text-zinc-300
                        text-sm
                        leading-relaxed
                      "
                    >
                      💡 {question.explanation}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

        <div
          className="
            pt-6
            mt-8
          "
        >
          <button
            onClick={onClose}
            className="
              w-full

              py-3

              rounded-xl

              bg-blue-600
              hover:bg-blue-500

              text-white
              font-medium
            "
          >
            Close Quiz
          </button>
        </div>
        </div>
      </div>
    )
  }

  // =========================
  // QUIZ SCREEN
  // =========================

  return (
    <div
      className="
        fixed
        inset-0
        z-50

        bg-black/70
        backdrop-blur-sm

        overflow-y-auto

        p-6
      "
    >
      <div
        className="
          w-full
          max-w-4xl

          max-h-[90vh]

          overflow-y-auto

          bg-[#0f172a]

          border
          border-zinc-800

          rounded-3xl

          p-8
        "
      >
        {/* HEADER */}

        <div
          className="
            flex
            items-center
            justify-between
            mb-8
          "
        >
          <h2
            className="
              text-xl
              font-bold
              text-white
            "
          >
            Quiz Mode
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

        {/* PROGRESS */}

        <div
          className="
            mb-6
          "
        >
          <div
            className="
              flex
              justify-between

              text-sm
              text-zinc-400

              mb-2
            "
          >
            <span>
              Question {currentQuestion + 1}
            </span>

            <span>
              {questions.length}
            </span>
          </div>

          <div
            className="
              h-2

              bg-zinc-800

              rounded-full
            "
          >
            <div
              className="
                h-full

                bg-blue-500

                rounded-full

                transition-all
                duration-300
              "
              style={{
                width: `${
                  ((currentQuestion + 1) /
                    questions.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION */}

        <h3
          className="
            text-2xl
            font-semibold
            text-white

            mb-8
          "
        >
          {question.question}
        </h3>



        {/* OPTIONS */}

        <div
          className="
            space-y-3
          "
        >
          {question.options.map(
            (option) => (
              <button
                key={option}
                onClick={() =>
                  setSelectedAnswer(option)
                }
                className={`
                  w-full

                  text-left

                  p-4

                  rounded-xl

                  border

                  transition-all

                  ${
                    selectedAnswer === option
                      ? `
                        border-blue-500
                        bg-blue-500/10
                      `
                      : `
                        border-zinc-700
                        hover:border-zinc-500
                      `
                  }
                `}
              >
                {option}
              </button>
            )
          )}
        </div>

        {/* FOOTER */}

        <div
          className="
            mt-8

            flex
            justify-end
          "
        >
          <button
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="
              px-6
              py-3

              rounded-xl

              bg-blue-600
              hover:bg-blue-500

              disabled:opacity-50

              text-white
              font-medium
            "
          >
            {currentQuestion ===
            questions.length - 1
              ? "Finish Quiz"
              : "Next Question"}
          </button>
        </div>
      </div>
    </div>
  )
}