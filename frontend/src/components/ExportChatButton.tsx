interface Props {
  messages: {
    role: string
    content: string
  }[]
}

export function ExportChatButton({
  messages,
}: Props) {
  function exportChat() {
    const content = messages
      .map(
        (m) =>
          `${m.role.toUpperCase()}\n\n${m.content}`
      )
      .join("\n\n----------------\n\n")

    const blob = new Blob(
      [content],
      {
        type: "text/plain",
      }
    )

    const url =
      URL.createObjectURL(blob)

    const a =
      document.createElement("a")

    a.href = url

    a.download = "chat-notes.txt"

    a.click()

    URL.revokeObjectURL(url)
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
