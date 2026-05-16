import { useState } from "react"
import ReactMarkdown from "react-markdown"

import { streamChat } from "../services/chat"
import { SourceCard } from "./sourceCard"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: any[]
}

interface Props {
  collection: string
}

export function ChatView({ collection }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
    }

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      sources: [],
    }

    setMessages((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ])

    setLoading(true)

    const currentInput = input
    setInput("")

    let streamedText = ""

    await streamChat(
      currentInput,
      messages,
      collection,

      // STREAM TEXT
      (chunk) => {
        streamedText += chunk

        setMessages((prev) => {
          const updated = [...prev]

          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: streamedText,
          }

          return updated
        })
      },

      // SOURCES
      (sources) => {
        setMessages((prev) => {
          const updated = [...prev]

          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            sources,
          }

          return updated
        })
      }
    )

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div key={index}>
            {/* USER */}

            {message.role === "user" && (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white p-4 rounded-2xl max-w-2xl">
                  {message.content}
                </div>
              </div>
            )}

            {/* ASSISTANT */}

            {message.role === "assistant" && (
              <div className="space-y-4">
                <div className="bg-zinc-900 text-white p-4 rounded-2xl max-w-3xl prose prose-invert">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Sources */}

                {message.sources &&
                  message.sources.length > 0 && (
                    <div className="grid gap-3">
                      {message.sources.map(
                        (source, i) => (
                          <SourceCard
                            key={i}
                            source={source}
                          />
                        )
                      )}
                    </div>
                  )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-zinc-500 text-sm">
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}

      <div className="border-t border-zinc-800 p-4 flex gap-3">
        <input
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder="Ask something..."
          className="
            flex-1
            bg-zinc-900
            border
            border-zinc-700
            rounded-xl
            px-4
            py-3
            text-white
            outline-none
          "
        />

        <button
          onClick={handleSend}
          className="
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-6
            rounded-xl
          "
        >
          Send
        </button>
      </div>
    </div>
  )
}