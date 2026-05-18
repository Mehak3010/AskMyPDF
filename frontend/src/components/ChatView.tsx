import {
  useState,
  useEffect,
  useRef,
} from "react"

import ReactMarkdown from "react-markdown"

import { streamChat } from "../services/chat"

import { SourceCard } from "./sourceCard"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: any[]
}

interface Props {
  filename: string
  activeCollection: string | null
  onNavigatePage: (page: number) => void
  onOpenPdf: (url: string) => void
}

export function ChatView({
  filename,
  activeCollection,
  onNavigatePage,
  onOpenPdf,
}: Props) {
  // -----------------------------
  // STATE
  // -----------------------------

  const [messages, setMessages] = useState<Message[]>([])

  const [input, setInput] = useState("")

  const [loading, setLoading] = useState(false)

  // -----------------------------
  // AUTO SCROLL
  // -----------------------------

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages])

  // -----------------------------
  // SEND MESSAGE
  // -----------------------------

  async function handleSend() {
    if (!input.trim()) return

    // USER MESSAGE

    const userMessage: Message = {
      role: "user",
      content: input,
    }

    // EMPTY ASSISTANT MESSAGE

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      sources: [],
    }

    // UPDATE UI

    setMessages((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ])

    setLoading(true)

    const currentInput = input

    setInput("")

    let streamedText = ""

    // STREAM CHAT

    await streamChat(
      currentInput,
      messages,
      activeCollection || "",

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
      
      {/* ============================= */}
      {/* MESSAGES */}
      {/* ============================= */}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* EMPTY STATE */}

        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">

            {/* ICON */}

            <div
              className="
                w-20
                h-20
                rounded-3xl
                bg-blue-600/10
                flex
                items-center
                justify-center
                mb-6
              "
            >
              <span className="text-4xl">
                📘
              </span>
            </div>

            {/* TITLE */}

            <h1
              className="
                text-3xl
                font-bold
                text-white
                mb-3
              "
            >
              Welcome to AskMyPDF
            </h1>

            {/* DESCRIPTION */}

            <p
              className="
                text-zinc-400
                max-w-xl
                mb-10
              "
            >
              Chat intelligently with your PDFs,
              explore insights, generate summaries,
              and navigate documents using AI.
            </p>

            {/* QUICK PROMPTS */}

            <div className="grid gap-3 w-full max-w-2xl">

              {[
                "Summarize this document",
                "What are the key insights?",
                "Generate viva questions",
                "Explain this PDF simply",
              ].map((prompt) => (
                
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="
                    bg-zinc-900
                    hover:bg-zinc-800
                    border
                    border-zinc-800
                    rounded-2xl
                    p-4
                    text-left
                    transition
                  "
                >
                  <div className="text-white font-medium">
                    {prompt}
                  </div>

                  <div className="text-zinc-500 text-sm mt-1">
                    Click to use this prompt
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CHAT MESSAGES */}

        {messages.map((message, index) => (
          <div key={index}>

            {/* USER */}

            {message.role === "user" && (
              <div className="flex justify-end">

                <div
                  className="
                    bg-blue-600
                    text-white
                    p-4
                    rounded-2xl
                    max-w-2xl
                  "
                >
                  {message.content}
                </div>

              </div>
            )}

            {/* ASSISTANT */}

            {message.role === "assistant" && (
              <div className="space-y-4">

                {/* RESPONSE */}

                <div
                  className="
                    bg-zinc-900
                    text-white
                    p-4
                    rounded-2xl
                    max-w-3xl
                    prose
                    prose-invert
                  "
                >
                  <div className="relative">

                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>

                    {/* STREAMING CURSOR */}

                    {loading &&
                      index === messages.length - 1 && (
                        <span
                          className="
                            inline-block
                            w-2
                            h-5
                            bg-blue-500
                            ml-1
                            animate-pulse
                            rounded-sm
                          "
                        />
                      )}

                  </div>
                </div>

                {/* SOURCES */}

                {message.sources &&
                  message.sources.length > 0 && (
                    <div className="grid gap-3">

                      {message.sources.map(
                        (source, i) => (
                          <SourceCard
                            key={i}
                            source={source}
                            onNavigate={
                              onNavigatePage
                            }
                            onOpenPdf={
                              onOpenPdf
                            }
                          />
                        )
                      )}

                    </div>
                  )}
              </div>
            )}
          </div>
        ))}

        {/* LOADING */}

        {loading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">

            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
            </div>

            <span>AI is thinking...</span>
          </div>
        )}

        {/* AUTO SCROLL TARGET */}

        <div ref={messagesEndRef} />
      </div>

      {/* ============================= */}
      {/* INPUT */}
      {/* ============================= */}

      <div
        className="
          border-t
          border-zinc-800
          p-4
          flex
          gap-3
        "
      >
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
            transition
          "
        >
          Send
        </button>
      </div>
    </div>
  )
}
