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
      messageText,
      messages,
      activeCollection || "",
      selectedMode,

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
    <div className="flex h-full w-full overflow-hidden bg-[#0b1120]">

      {/* MAIN CHAT */}

      <div className="flex flex-col flex-1 h-full min-w-0">

        {/* AI MODES */}

        <div className="p-4 border-b border-zinc-800">

          <AIModeSelector
            selectedMode={selectedMode}
            onSelect={setSelectedMode}
          />
        </div>

        {/* MESSAGES */}

        <div className="flex-1 overflow-y-auto p-4 space-y-6 chat-scrollbar">

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-6">

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
                      bg-zinc-900/50
                      hover:bg-zinc-800
                      border
                      border-zinc-800/50
                      rounded-2xl
                      p-4
                      text-left
                      transition-all
                      duration-200
                      hover:scale-[1.02]
                      active:scale-[0.98]
                      group
                    "
                  >
                    <div className="text-white font-medium group-hover:text-blue-400 transition-colors">
                      {prompt}
                    </div>

                    <div className="text-zinc-500 text-sm mt-1">
                      Tap to use this prompt
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CHAT */}

          {messages.map(
            (message, index) => (
              <div key={index} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>

                <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* AVATAR */}
                  <div className={`
                    w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                    ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-blue-400 border border-zinc-700'}
                  `}>
                    {message.role === 'user' ? 'U' : 'AI'}
                  </div>

                  {/* BUBBLE */}
                  <div className="flex flex-col gap-2">
                    
                    {/* USER MESSAGE */}
                    {message.role === "user" && (
                      <div
                        className="
                          bg-blue-600
                          text-white
                          p-4
                          rounded-2xl
                          rounded-tr-none
                          shadow-lg
                          shadow-blue-900/20
                        "
                      >
                        {message.content}
                      </div>
                    )}

                    {/* ASSISTANT MESSAGE */}
                    {message.role === "assistant" && message.content.trim().length > 0 && (
                      <div className="space-y-4">
                        <div
                          className="
                            bg-zinc-900/50
                            backdrop-blur-sm
                            text-white
                            p-4
                            rounded-2xl
                            rounded-tl-none
                            border
                            border-zinc-800
                            prose
                            prose-invert
                            max-w-none
                          "
                        >
                          <div className="relative">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>

                            {/* CURSOR */}
                            {loading && index === messages.length - 1 && (
                              <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse rounded-sm" />
                            )}
                          </div>

                          {/* AI ACTIONS */}
                          {index === messages.length - 1 && !loading && (
                            <div className="mt-4 pt-4 border-t border-zinc-800/50">
                              <AIActionButtons
                                content={message.content}
                                onAction={(prompt: string) => sendMessage(prompt)}
                              />
                            </div>
                          )}
                        </div>

                        {/* SOURCES */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, i) => (
                              <div key={i} className="max-w-xs">
                                <SourceCard
                                  source={source}
                                  onNavigate={onNavigatePage}
                                  onOpenPdf={onOpenPdf}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
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
                Analyzing document...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ACTION BAR */}
        {messages.length > 0 && (
          <div
            className="
              flex
              justify-between
              px-4
              py-3
              border-t
             border-zinc-800
            "
          >

            <ExportChatButton
              messages={messages}
            />

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
        )}
        
        {/* INPUT */}

        <div className="p-4 bg-[#0b1120] border-t border-zinc-800">
          <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 focus-within:border-blue-500/50 transition-all duration-200">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask something..."
              className="
                flex-1
                bg-transparent
                text-white
                px-3
                py-2
                outline-none
                resize-none
                max-h-32
                scrollbar-hide
              "
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`
                p-2.5
                rounded-xl
                transition-all
                duration-200
                ${input.trim() && !loading 
                  ? 'bg-blue-600 text-white hover:bg-blue-500 scale-100' 
                  : 'bg-zinc-800 text-zinc-500 scale-95 opacity-50 cursor-not-allowed'}
              `}
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
          <div className="text-[10px] text-zinc-500 text-center mt-2">
            AskMyPDF can make mistakes. Check important info.
          </div>
        </div>
      </div>
    </div>
  )
}
