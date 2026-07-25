export interface StudyKitSection {
  title: string
  items: string[]
}

interface QAItem {
  question: string
  answer: string | string[]
}

interface DefinitionItem {
  term: string
  meaning: string
}

interface MCQItem {
  question: string
  answer: string
  explanation: string
}

interface StudyKitData {
  summary?: string
  important_topics?: string[]
  definitions?: DefinitionItem[]
  long_questions?: QAItem[]
  short_questions?: QAItem[]
  important_questions?: QAItem[]
  viva_questions?: QAItem[]
  mcq_revision?: MCQItem[]
  revision_sheet?: string[]
}

export function buildStudyKit(
  studyKit: StudyKitData
) {

  const sections: StudyKitSection[] = []

  // =====================
  // EXECUTIVE SUMMARY
  // =====================

  if (
    studyKit?.summary
  ) {

    sections.push({
      title:
        "Executive Summary",

      items: [
        studyKit.summary
      ],
    })
  }

  // =====================
  // IMPORTANT TOPICS
  // =====================

  if (
    studyKit?.important_topics
  ) {

    sections.push({
      title:
        "Important Topics",

      items:
        studyKit.important_topics.map(
          (
            topic: string,
            index: number
          ) =>
      `${index + 1}. ${topic}`
        )
    })
  }

  // =====================
  // DEFINITIONS
  // =====================

  if (
    studyKit?.definitions
  ) {

    sections.push({
      title:
        "Key Definitions",

      items:
        studyKit.definitions.map(
          (
            d: DefinitionItem,
            index: number
          ) =>
      `${index + 1}. ${d.term}

      Meaning: ${d.meaning}
      
      `
        )
    })
  }

  // =====================
  // LONG QUESTIONS
  // =====================

  if (
    studyKit?.long_questions
    ) {

    sections.push({
        title:
        "Expected Long Questions",

        items:
          studyKit.long_questions.map(
            (
              q: QAItem,
              index: number
            ) =>

              [
                `${index + 1}. ${q.question}`,
                "",
                "Answer:",
                ...(Array.isArray(q.answer)
                  ? q.answer.map(
                      (point: string) =>
                        `• ${point}`
                    )
                  : [q.answer]),
              ].join("\n")
          ),
    })
}

  // =====================
  // SHORT QUESTIONS
  // =====================

  if (
    studyKit?.short_questions
  ) {

    sections.push({
      title:
        "Expected Short Questions",

      items:
        studyKit.short_questions.map(
          (
            q: QAItem,
            index: number
          ) =>
      `${index + 1}. ${q.question}

      Answer: ${q.answer}`
        ),
    })
  }

  // =====================
  // IMPORTANT QUESTIONS
  // =====================

  if (
    studyKit?.important_questions
  ) {

    sections.push({
      title:
        "Most Important Questions",

      items:
        studyKit.important_questions.map(
          (
            q: QAItem,
            index: number
          ) =>

            [
              `${index + 1}. ${q.question}`,
              "",
              "Answer:",
              ...(Array.isArray(q.answer)
                ? q.answer.map(
                    (point: string) =>
                      `• ${point}`
                  )
                : [q.answer]),
            ].join("\n")
        ),
    })
  }

  // =====================
  // VIVA CORNER
  // =====================

  if (
    studyKit?.viva_questions
  ) {

    sections.push({
      title:
        "Viva Corner",

      items:
        studyKit.viva_questions.map(
          (
            q: QAItem,
            index: number
          ) =>
      `${index + 1}. ${q.question}

      Answer: ${q.answer}`
        ),
    })
  }

  // =====================
  // MCQ REVISION
  // =====================

  if (
    studyKit?.mcq_revision
  ) {

    sections.push({
      title:
        "MCQ Revision Bank",

      items:
        studyKit.mcq_revision.map(
          (
            q: MCQItem,
            index: number
          ) =>
      `${index + 1}. ${q.question}

      Correct Answer: ${q.answer}

      Explanation: ${q.explanation}`
        ),
    })
  }

  // =====================
  // LAST MINUTE REVISION
  // =====================

  if (
    studyKit?.revision_sheet
  ) {

    sections.push({
      title:
        "Last Minute Revision Sheet",

      items:
        studyKit.revision_sheet.map(
          (
            point: string,
            index: number
          ) =>
      `${index + 1}. ${point}`
        )
    })
  }

  return sections
}