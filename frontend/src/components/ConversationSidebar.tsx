interface ChatSession {
  id: string
  title: string
  createdAt: number
}

interface Props {
  sessions: ChatSession[]

  activeSessionId: string

  onSelect: (id: string) => void

  onNewChat: () => void

  onDelete: (id: string) => void
}

export function ConversationSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNewChat,
  onDelete,
}: Props) {
  return (
    <div
      className="
        w-72
        border-r
        border-zinc-800
        bg-zinc-950
        flex
        flex-col
      "
    >
      {/* HEADER */}

      <div className="p-4 border-b border-zinc-800">

        <button
          onClick={onNewChat}
          className="
            w-full
            bg-blue-600
            hover:bg-blue-700
            text-white
            rounded-xl
            py-3
            font-medium
            transition
          "
        >
          + New Chat
        </button>
      </div>

      {/* CHAT LIST */}

      <div className="flex-1 overflow-y-auto p-2 space-y-2">

        {sessions.map((session) => (
          <div
            key={session.id}
            className={`
              group
              rounded-xl
              transition

              ${
                activeSessionId === session.id
                  ? "bg-zinc-800"
                  : "hover:bg-zinc-900"
              }
            `}
          >
            <div className="flex items-center">

              <button
                onClick={() =>
                  onSelect(session.id)
                }
                className="
                  flex-1
                  text-left
                  p-3
                "
              >
                <div className="truncate text-white">
                  {session.title}
                </div>

                <div className="text-xs text-zinc-500 mt-1">
                  {new Date(
                    session.createdAt
                  ).toLocaleDateString()}
                </div>
              </button>

              {/* DELETE */}

              <button
                onClick={() =>
                  onDelete(session.id)
                }
                className="
                  opacity-0
                  group-hover:opacity-100
                  transition
                  px-3
                  text-zinc-500
                  hover:text-red-400
                "
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
