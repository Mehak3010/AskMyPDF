import { useState } from "react"
import type { Flashcard } from "../types/flashcard"

interface Props {
  cards: Flashcard[]
  onClose: () => void
}

export function FlashcardView({
  cards,
  onClose,
}: Props) {
  const [currentCard, setCurrentCard] =
    useState(0)

  const [flipped, setFlipped] =
    useState(false)

  const card = cards[currentCard]

  function nextCard() {
    if (
      currentCard <
      cards.length - 1
    ) {
      setCurrentCard(
        (prev) => prev + 1
      )

      setFlipped(false)
    }
  }

  function prevCard() {
    if (currentCard > 0) {
      setCurrentCard(
        (prev) => prev - 1
      )

      setFlipped(false)
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
          max-w-3xl

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
              text-2xl
              font-bold
              text-white
            "
          >
            Flashcards
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

        {/* COUNTER */}

        <div
          className="
            text-center
            text-zinc-400

            mb-6
          "
        >
          Card {currentCard + 1}
          {" / "}
          {cards.length}
        </div>

        {/* CARD */}

        <div
          className="
            perspective-[1000px]
            h-[320px]
          "
        >
          <div
            onClick={() =>
              setFlipped(!flipped)
            }
            className={`
              relative
              w-full
              h-full

              cursor-pointer

              transition-transform
              duration-700

              [transform-style:preserve-3d]

              ${
                flipped
                  ? "[transform:rotateY(180deg)]"
                  : ""
              }
            `}
          >

            {/* FRONT */}

            <div
              className="
                absolute
                inset-0

                bg-zinc-900

                border
                border-zinc-800

                rounded-3xl

                p-8

                flex
                items-center
                justify-center

                text-center

                [backface-visibility:hidden]
              "
            >
              <div>
                <div
                  className="
                    text-sm
                    text-zinc-500
                    mb-4
                  "
                >
                  Question
                </div>

                <div
                  className="
                    text-2xl
                    text-white
                    font-medium
                  "
                >
                  {card.front}
                </div>
              </div>
            </div>

    {/* BACK */}

    <div
      className="
        absolute
        inset-0

        bg-blue-950/40

        border
        border-blue-500/30

        rounded-3xl

        p-8

        flex
        items-center
        justify-center

        text-center

        [transform:rotateY(180deg)]

        [backface-visibility:hidden]
      "
    >
      <div>
        <div
          className="
            text-sm
            text-blue-300
            mb-4
          "
        >
          Answer
        </div>

        <div
          className="
            text-lg
            text-white
            leading-relaxed
          "
        >
          {card.back}
        </div>
      </div>
    </div>

  </div>
</div>
          

        {/* FLIP HINT */}

        <div
          className="
            mt-4
            text-center
            text-zinc-400
            text-sm
          "
        >
          Click card to flip
        </div>

        {/* NAVIGATION */}

        <div
          className="
            mt-8

            flex
            items-center
            justify-between
          "
        >
          <button
            onClick={prevCard}
            disabled={currentCard === 0}
            className="
              px-5
              py-3

              rounded-xl

              bg-zinc-800
              hover:bg-zinc-700

              disabled:opacity-50
              disabled:hover:bg-zinc-800

              text-white

              transition
            "
          >
            ← Previous
          </button>

          <button
            onClick={nextCard}
            disabled={
              currentCard ===
              cards.length - 1
            }
            className="
              px-5
              py-3

              rounded-xl

              bg-blue-600
              hover:bg-blue-500

              disabled:opacity-50
              disabled:hover:bg-blue-600

              text-white

              transition
            "
          >
            Next →
          </button>
        </div>
        </div>
      </div>
  )
}