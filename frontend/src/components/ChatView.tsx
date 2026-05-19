import {
  useState,
  useEffect,
  useRef,
} from "react"

import ReactMarkdown from "react-markdown"
import { streamChat } from "../services/chat"
import { SourceCard } from "./sourceCard"
import { StudyTools } from "./StydyTools"
import { AIActionButtons } from "./AiActionButtons"
import { ConversationSidebar } from "./ConversationSidebar"
import { AIModeSelector } from "./AiModeSelector"
import { ExportChatButton } from "./ExportChatButton"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: any[]
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
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
  // =============================
  // STATE
  // =============================

  const [sessions, setSessions] =
    useState<ChatSession[]>([
      {
        id: crypto.randomUUID(),
        title: "New Chat",
        messages: [],
        createdAt: Date.now(),
      },
    ])

  const [activeSessionId, setActiveSessionId] =
    useState("")

  const [input, setInput] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [selectedMode, setSelectedMode] =
    useState("Beginner")

  // =============================
  // INITIAL SESSION
  // =============================

  useEffect(() => {
    if (
      sessions.length > 0 &&
      !activeSessionId
    ) {
      setActiveSessionId(
        sessions[0].id
      )
    }
  }, [sessions, activeSessionId])

  // =============================
  // ACTIVE SESSION
  // =============================

  const activeSession =
    sessions.find(
      (session) =>
        session.id === activeSessionId
    ) || sessions[0]

  const messages =
    activeSession?.messages || []

  // =============================
  // UPDATE MESSAGES
  // =============================

  function updateMessages(
    updater:
      | Message[]
      | ((
          prev: Message[]
        ) => Message[])
  ) {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSessionId
          ? {
              ...session,
              messages:
                typeof updater ===
                "function"
                  ? updater(
                      session.messages
                    )
                  : updater,
            }
          : session
      )
    )
  }

  // =============================
  // AUTO SCROLL
  // =============================

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages])

  // =============================
  // SAVE SESSIONS
  // =============================

  useEffect(() => {
    localStorage.setItem(
      `chat-sessions-${filename}`,
      JSON.stringify(sessions)
    )
  }, [sessions, filename])

  // =============================
  // RESTORE SESSIONS
  // =============================

  useEffect(() => {
    const savedSessions =
      localStorage.getItem(
        `chat-sessions-${filename}`
      )

    if (savedSessions) {
      const parsed =
        JSON.parse(savedSessions)

      setSessions(parsed)

      if (parsed.length > 0) {
        setActiveSessionId(
          parsed[0].id
        )
      }
    }
  }, [filename])

  // =============================
  // SEND MESSAGE
  // =============================

  async function sendMessage(
    messageText: string
  ) {
    if (!messageText.trim()) return

    const userMessage: Message = {
      role: "user",
      content: messageText,
    }

    const assistantMessage: Message = {
      role: "assistant",
      content: "",
      sources: [],
    }

    updateMessages((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ])

    setLoading(true)

    setInput("")

    let streamedText = ""

    // =============================
    // AI MODES PROMPT
    // =============================

    const modePrompt = `
You are currently in ${selectedMode} mode.

Behavior Rules:

- Beginner:
Explain simply with easy examples.

- Interview:
Provide concise technical answers.

- Research:
Give detailed academic explanations.

- Exam Prep:
Give revision-focused bullet points.

User Query:
${messageText}
`

    // STREAM CHAT

    await streamChat(
      modePrompt,
      messages,
      activeCollection || "",

      (chunk) => {
        streamedText += chunk

        updateMessages((prev) => {
          const updated = [...prev]

          updated[
            updated.length - 1
          ] = {
            ...updated[
              updated.length - 1
            ],
            content: streamedText,
          }

          return updated
        })
      },

      (sources) => {
        updateMessages((prev) => {
          const updated = [...prev]

          updated[
            updated.length - 1
          ] = {
            ...updated[
              updated.length - 1
            ],
            sources,
          }

          return updated
        })
      }
    )

    // AUTO TITLE

    setSessions((prev) =>
      prev.map((session) =>
        session.id ===
          activeSessionId &&
        session.title === "New Chat"
          ? {
              ...session,
              title:
                messageText.slice(
                  0,
                  30
                ) + "...",
            }
          : session
      )
    )

    setLoading(false)
  }

  async function handleSend() {
    await sendMessage(input)
  }

  // =============================
  // CREATE NEW CHAT
  // =============================

  function createNewChat() {
    const newSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
    }

    setSessions((prev) => [
      newSession,
      ...prev,
    ])

    setActiveSessionId(
      newSession.id
    )
  }

  // =============================
  // DELETE CHAT
  // =============================

  function deleteChat(id: string) {
    const filtered =
      sessions.filter(
        (session) =>
          session.id !== id
      )

    setSessions(filtered)

    if (activeSessionId === id) {
      setActiveSessionId(
        filtered[0]?.id || ""
      )
    }
  }

  return (
    <div className="flex h-full">

      {/* SIDEBAR */}

      <ConversationSidebar
        sessions={sessions}
        activeSessionId={
          activeSessionId
        }
        onSelect={
          setActiveSessionId
        }
        onNewChat={
          createNewChat
        }
        onDelete={deleteChat}
      />

      {/* MAIN CHAT */}

      <div className="flex flex-col flex-1 h-full">

        {/* AI MODES */}

        <div className="p-4 border-b border-zinc-800">

          <AIModeSelector
            selectedMode={selectedMode}
            onSelect={setSelectedMode}
          />
        </div>

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* EMPTY STATE */}

          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">

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

              <p
                className="
                  text-zinc-400
                  max-w-xl
                  mb-10
                "
              >
                AI-powered study assistant
                for PDFs, research papers,
                notes, and interview prep.
              </p>

              {/* STUDY TOOLS */}

              <StudyTools
                onSelect={(
                  prompt: string
                ) =>
                  sendMessage(
                    prompt
                  )
                }
              />

              {/* QUICK PROMPTS */}

              <div className="grid gap-3 w-full max-w-2xl mt-6">

                {[
                  "Summarize this document",
                  "Generate viva questions",
                  "Explain this PDF simply",
                  "Create exam revision notes",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() =>
                      sendMessage(
                        prompt
                      )
                    }
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
                      Click to use this
                      prompt
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CHAT */}

          {messages.map(
            (message, index) => (
              <div key={index}>

                {/* USER */}

                {message.role ===
                  "user" && (
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
                      {
                        message.content
                      }
                    </div>

                  </div>
                )}

                {/* ASSISTANT */}

                {message.role ===
                  "assistant" && (
                  <div className="space-y-4">

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
                          {
                            message.content
                          }
                        </ReactMarkdown>

                        {/* CURSOR */}

                        {loading &&
                          index ===
                            messages.length -
                              1 && (
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

                      {/* AI ACTIONS */}

                      <AIActionButtons
                        content={
                          message.content
                        }
                        onAction={(
                          prompt: string
                        ) => {
                          sendMessage(
                            prompt
                          )
                        }}
                      />
                    </div>

                    {/* SOURCES */}

                    {message.sources &&
                      message.sources
                        .length >
                        0 && (
                        <div className="grid gap-3">

                          {message.sources.map(
                            (
                              source,
                              i
                            ) => (
                              <SourceCard
                                key={i}
                                source={
                                  source
                                }
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
            )
          )}

          {/* LOADING */}

          {loading && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">

              <div className="flex gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
              </div>

              <span>
                AI is thinking...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* CLEAR CHAT */}

        <div className="flex justify-end px-4 pb-2">

          <button
            onClick={() => {
              updateMessages([])
            }}
            className="
              text-xs
              text-zinc-500
              hover:text-red-400
              transition
            "
          >
            Clear Chat
          </button>
        </div>

        {/* INPUT */}

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
              setInput(
                e.target.value
              )
            }

            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSend()
              }
            }}

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
    </div>
  )
}
