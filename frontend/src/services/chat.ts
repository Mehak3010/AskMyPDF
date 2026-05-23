async function handleStreamingResponse(
  response: Response,
  onChunk: (chunk: string) => void,
  onSources?: (sources: any[]) => void
) {
  const reader = response.body?.getReader()
  if (!reader) return

  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const text = decoder.decode(value)
    const lines = text.split("\n").filter(Boolean)

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        if (parsed.type === "sources" && onSources) {
          onSources(parsed.data)
        }
        if (parsed.type === "chunk") {
          onChunk(parsed.data)
        }
      } catch (err) {
        console.error("Streaming parse error:", err)
      }
    }
  }
}

export async function streamChat(
  message: string,
  history: any[],
  collection: string,
  mode: string,
  onChunk: (chunk: string) => void,
  onSources: (sources: any[]) => void
) {
  const response = await fetch("http://localhost:8001/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question: message,
      history,
      collection,
      mode,
    }),
  })

  await handleStreamingResponse(response, onChunk, onSources)
}

export async function streamSummary(
  collection: string,
  onChunk: (chunk: string) => void
) {
  const response = await fetch("http://localhost:8001/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ collection }),
  })

  await handleStreamingResponse(response, onChunk)
}
