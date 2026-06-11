interface Definition {
  term: string
  meaning: string
}

interface VivaQuestion {
  question: string
  answer: string
}

interface ExamPrepData {
  important_topics: string[]
  long_questions: string[]
  short_questions: string[]
  definitions: Definition[]
  viva_questions: VivaQuestion[]
}

interface Props {
  data: ExamPrepData
  onClose: () => void
}

export function ExamPrepView({
  data,
  onClose,
}: Props) {
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

        flex
        items-center
        justify-center
      "
    >
      <div
        className="
          w-full
          max-w-5xl

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
              text-3xl
              font-bold
              text-white
            "
          >
            Exam Prep
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

        {/* IMPORTANT TOPICS */}

        <SectionTitle
          title="Important Topics"
        />

        <ul className="space-y-3 mb-10">
          {data.important_topics.map(
            (topic, index) => (
              <li
                key={index}
                className="
                  bg-zinc-900
                  border
                  border-zinc-800
                  rounded-xl
                  p-4
                  text-zinc-200
                "
              >
                {topic}
              </li>
            )
          )}
        </ul>

        {/* LONG QUESTIONS */}

        <SectionTitle
          title="Long Questions"
        />

        <div className="space-y-4 mb-10">
          {data.long_questions.map(
            (question, index) => (
              <Card
                key={index}
                content={`${index + 1}. ${question}`}
              />
            )
          )}
        </div>

        {/* SHORT QUESTIONS */}

        <SectionTitle
          title="Short Questions"
        />

        <div className="space-y-4 mb-10">
          {data.short_questions.map(
            (question, index) => (
              <Card
                key={index}
                content={`${index + 1}. ${question}`}
              />
            )
          )}
        </div>

        {/* DEFINITIONS */}

        <SectionTitle
          title="Definitions"
        />

        <div className="space-y-4 mb-10">
          {data.definitions.map(
            (item, index) => (
              <div
                key={index}
                className="
                  bg-zinc-900
                  border
                  border-zinc-800
                  rounded-xl
                  p-4
                "
              >
                <div
                  className="
                    text-blue-300
                    font-semibold
                    mb-2
                  "
                >
                  {item.term}
                </div>

                <div
                  className="
                    text-zinc-300
                  "
                >
                  {item.meaning}
                </div>
              </div>
            )
          )}
        </div>

        {/* VIVA */}

        <SectionTitle
          title="Viva Questions"
        />

        <div className="space-y-4">
          {data.viva_questions.map(
            (item, index) => (
              <div
                key={index}
                className="
                  bg-zinc-900
                  border
                  border-zinc-800
                  rounded-xl
                  p-4
                "
              >
                <div
                  className="
                    text-white
                    font-medium
                    mb-3
                  "
                >
                  Q{index + 1}.{" "}
                  {item.question}
                </div>

                <div
                  className="
                    text-zinc-300
                  "
                >
                  {item.answer}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({
  title,
}: {
  title: string
}) {
  return (
    <h3
      className="
        text-2xl
        font-semibold
        text-white

        mb-5
      "
    >
      {title}
    </h3>
  )
}

function Card({
  content,
}: {
  content: string
}) {
  return (
    <div
      className="
        bg-zinc-900

        border
        border-zinc-800

        rounded-xl

        p-4

        text-zinc-200
      "
    >
      {content}
    </div>
  )
}