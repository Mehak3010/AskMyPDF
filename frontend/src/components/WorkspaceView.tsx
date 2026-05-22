import { useState } from "react"

import { PDFViewer } from "./PDFViewer"

import { ChatView } from "./ChatView"

import { ConversationSidebar } from "./ConversationSidebar"

import {
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

interface Props {
  fileData: {
    name: string
    url: string
  }

  activeCollection: string | null

  onBack: () => void
}

export function WorkspaceView({
  fileData,
  activeCollection,
  onBack,
}: Props) {
  // =========================
  // PAGE NAVIGATION
  // =========================

  const [selectedPage, setSelectedPage] =
    useState(0)

  // =========================
  // SIDEBAR
  // =========================

  const [showSidebar, setShowSidebar] =
    useState(false)

  return (
    <div className="flex h-full relative">

      {/* OVERLAY */}

      {showSidebar && (

        <div
          onClick={() =>
            setShowSidebar(false)
          }
          className="
            absolute
            inset-0
            bg-black/50
            backdrop-blur-sm
            z-40
          "
        />

      )}

      {/* FLOATING SIDEBAR */}

      <div
        className={`
          absolute
          top-0
          left-0
          h-full
          z-50
          transition-all
          duration-300

          ${
            showSidebar
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        <ConversationSidebar
          sessions={[]}
          activeSessionId=""
          onSelect={() => {}}
          onNewChat={() => {}}
          onDelete={() => {}}
        />
      </div>

      {/* SIDEBAR TOGGLE */}

      <button
        onClick={() =>
          setShowSidebar(
            !showSidebar
          )
        }
        className="
          absolute
          top-4
          left-4
          z-[60]

          bg-zinc-900/90
          backdrop-blur

          border
          border-zinc-800

          p-2
          rounded-xl

          hover:bg-zinc-800
          transition
        "
      >
        {showSidebar ? (
          <PanelLeftClose
            size={18}
            className="text-white"
          />
        ) : (
          <PanelLeftOpen
            size={18}
            className="text-white"
          />
        )}
      </button>

      {/* BACK BUTTON */}

      <button
        onClick={onBack}
        className="
          absolute
          top-4
          right-4
          z-50

          bg-zinc-900/90
          backdrop-blur

          border
          border-zinc-800

          px-4
          py-2

          rounded-xl
          text-sm

          hover:bg-zinc-800
          transition
        "
      >
        Upload More
      </button>

      {/* PDF PANEL */}

      <div
        className="
          w-1/2
          h-full

          border-r
          border-zinc-800

          bg-[#020817]

          flex
          flex-col
        "
      >
        {/* PDF TOOLBAR */}

        <div
          className="
            h-14
            border-b
            border-zinc-800

            flex
            items-center
            justify-between

            px-4

            bg-[#071022]

            flex-shrink-0
          "
        >
          {/* LEFT */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <button
              className="
                px-3
                py-1.5

                rounded-lg

                bg-zinc-900
                border
                border-zinc-800

                text-sm

                hover:bg-zinc-800
                transition
              "
            >
              −
            </button>

            <button
              className="
                px-3
                py-1.5

                rounded-lg

                bg-zinc-900
                border
                border-zinc-800

                text-sm

                hover:bg-zinc-800
                transition
              "
            >
              +
            </button>

            <div
              className="
                text-sm
                text-slate-400
                ml-2
              "
            >
              Page {selectedPage + 1}
            </div>
          </div>

          {/* RIGHT */}

          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <button
              className="
                px-3
                py-1.5

                rounded-lg

                bg-zinc-900
                border
                border-zinc-800

                text-sm

                hover:bg-zinc-800
                transition
              "
            >
              Download
            </button>

            <button
              className="
                px-3
                py-1.5

                rounded-lg

                bg-zinc-900
                border
                border-zinc-800

                text-sm

                hover:bg-zinc-800
                transition
              "
            >
              Fullscreen
            </button>
          </div>
        </div>

        {/* PDF VIEWER */}

        <div
          className="
            flex-1
            w-full
            overflow-hidden
            relative
          "
        >
          <PDFViewer
            fileUrl={fileData.url}
            currentPage={selectedPage}
          />
        </div>
      </div>
      {/* CHAT PANEL */}

      <div
        className="
          w-1/2
          h-full
          bg-[#0b1120]
        "
      >
        <ChatView
          filename={fileData.name}
          activeCollection={
            activeCollection
          }
          onNavigatePage={
            setSelectedPage
          }
          onOpenPdf={() => {}}
        />
      </div>
    </div>
  )
}
