import { saveAs } from "file-saver"

import {
  Document,
  Packer,
  Paragraph,

  TextRun,
} from "docx"

import {
  buildStudyKit,
} from "../utils/buildStudyKit"

interface Props {
  sessionId: string

  messages: {
    role: string
    content: string
  }[]
}

export function ExportChatButton({
  sessionId,
}: Props) {
  async function exportChat() {

    const children: Paragraph[] = []

console.log(
  "EXPORT CLICKE
)

const response =
  await fetch(
    "http://localhost:8001/generate-study-kit",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        session_id: sessionId,
      }),
    }
  )

console.log(
  "STATUS:",
  response.status
)

const studyKit =
  await response.json()

console.log(
  "STUDY KIT:",
  studyKit
)

console.log(
  "LONG Q ANSWER:",
  studyKit.long_questions?.[0]?.answer
)

console.log(
  "IS ARRAY?",
  Array.isArray(
    studyKit.long_questions?.[0]?.answer
  )
)

console.log(
  "IMPORTANT Q ANSWER:",
  studyKit.important_questions?.[0]?.answer
)

console.log(
  "IMPORTANT IS ARRAY?",
  Array.isArray(
    studyKit.important_questions?.[0]?.answer
  )
)

        const sections =
          buildStudyKit(
            studyKit
          )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "ASKMYPDF STUDY KIT",
            bold: true,
            size: 56,
          }),
        ],
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated on ${new Date().toLocaleDateString()}`,
            size: 24,
          }),
        ],
      })
    )

    sections.forEach(
      (section, index) => {

        children.push(
          new Paragraph({

            pageBreakBefore:
              index > 0,

            spacing: {
              before: 300,
              after: 200,
            },

            children: [

              new TextRun({

                text: section.title,

                bold: true,

                size: 34,
              }),
            ],
          })
        )

        section.items.forEach(
          (item) => {

            item
              .split("\n")
              .forEach(
                (line) => {

                  children.push(
                    new Paragraph({

                      spacing: {

                        after:
                          line.trim() === ""
                            ? 120
                            : 60,
                      },

                      children: [

                        new TextRun({

                          text: line,

                          size: 24,

                          bold:

                            line.startsWith(
                              "Answer:"
                            ) ||

                            line.startsWith(
                              "Correct Answer:"
                            ) ||

                            line.startsWith(
                              "Explanation:"
                            ),
                        }),
                      ],
                    })
                  )
                }
              )

            if (

              section.title ===
                "Expected Long Questions" ||

              section.title ===
                "Expected Short Questions" ||

              section.title ===
                "Most Important Questions" ||

              section.title ===
                "Viva Corner" ||

              section.title ===
                "MCQ Revision Bank"

            ) {

              children.push(
                new Paragraph({

                  children: [

                    new TextRun({

                      text:
                        "────────────────────────",

                      size: 20,
                    }),
                  ],

                  spacing: {

                    after: 200,
                  },
                })
              )
            }
          }
        )
      }
    )

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    })

    const blob =
      await Packer.toBlob(doc)

    saveAs(
      blob,
      "AskMyPDF_Study_Kit.docx"
    )
  }

  return (
    <button
      onClick={exportChat}
      className="
        text-xs
        text-zinc-500
        hover:text-blue-400
        transition
      "
    >
      Export Notes
    </button>
  )
}
