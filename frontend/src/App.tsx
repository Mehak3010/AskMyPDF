import { useState } from 'react'

import { UploadView } from './components/UploadView'
import { ChatView } from './components/ChatView'
import { PDFViewer } from './components/PDFViewer'
import { DocumentLibrary } from './components/DocumentLibrary'

import {
  FileText,
  ArrowLeft,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

import { Badge } from './components/ui/badge'

function App() {
  // -----------------------------
  // PDF STATE
  // -----------------------------

  const [fileData, setFileData] = useState<{
    name: string
    url: string
  } | null>(null)

  // -----------------------------
  // COLLECTION STATE
  // -----------------------------

  const [activeCollection, setActiveCollection] =
    useState<string | null>(null)

  // -----------------------------
  // PAGE NAVIGATION STATE
  // -----------------------------

  const [selectedPage, setSelectedPage] =
    useState<number>(0)

  // -----------------------------
  // SIDEBAR TOGGLE
  // -----------------------------

  const [showLibrary, setShowLibrary] =
    useState(true)

  // -----------------------------
  // UPLOAD SUCCESS
  // -----------------------------

  const handleUploadSuccess = (
    name: string,
    url: string
  ) => {
    setFileData({ name, url })
  }

  // -----------------------------
  // RESET
  // -----------------------------

  const handleReset = () => {
    setFileData(null)
    setSelectedPage(0)
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#020617] text-slate-100 overflow-hidden">

      {/* HEADER */}

      <header
        className="
          h-14
          border-b
          border-slate-800
          flex
          items-center
          justify-between
          px-4
          flex-shrink-0
          bg-[#020617]
          z-20
        "
      >
        {/* LEFT */}

        <div className="flex items-center space-x-2">

          <div className="bg-primary p-1.5 rounded-lg">
            <FileText className="text-white h-4 w-4" />
          </div>

          <span className="font-bold text-lg tracking-tight">
            AskMyPDF
          </span>

          <Badge
            variant="outline"
            className="
              ml-2
              text-[10px]
              uppercase
              tracking-widest
              border-primary/20
              text-primary
            "
          >
            Phase 6
          </Badge>
        </div>

        {/* RIGHT */}

        <div className="flex items-center space-x-3">

          {fileData && (
            <div
              className="
                hidden
                md:flex
                items-center
                space-x-2
                text-xs
                text-slate-400
                bg-slate-900
                px-3
                py-1
                rounded-full
              "
            >
              <Layers size={12} />

              <span>
                {activeCollection || 'Global Search'}
              </span>
            </div>
          )}

          <button
            onClick={handleReset}
            className="
              flex
              items-center
              space-x-1
              text-xs
              font-medium
              text-slate-400
              hover:text-primary
              transition-colors
            "
          >
            <ArrowLeft size={14} />

            <span>
              {fileData
                ? 'Library'
                : 'Upload More'}
            </span>
          </button>
        </div>
      </header>

      {/* MAIN */}

      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR */}

        {showLibrary && (
          <div
            className="
              w-[280px]
              flex-shrink-0
              border-r
              border-slate-800
              bg-[#020617]
            "
          >
            <DocumentLibrary
              onSelectCollection={
                setActiveCollection
              }

              onSelectDocument={
                handleUploadSuccess
              }

              activeCollection={
                activeCollection
              }
            />
          </div>
        )}

        {/* CONTENT */}

        <main className="flex-1 overflow-hidden relative">

          {/* SIDEBAR TOGGLE */}

          <button
            onClick={() =>
              setShowLibrary(
                !showLibrary
              )
            }
            className="
              absolute
              top-4
              left-4
              z-50
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
            {showLibrary ? (
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

          {/* UPLOAD SCREEN */}

          {!fileData ? (

            <UploadView
              onUploadSuccess={
                handleUploadSuccess
              }
            />

          ) : (

            <div className="flex h-full">

              {/* PDF PANEL */}

              <div
                className="
                  hidden
                  lg:flex
                  lg:w-1/2
                  h-full
                  border-r
                  border-slate-800
                  bg-slate-950
                "
              >

                {fileData.name.includes(
                  'files'
                ) ? (

                  <div
                    className="
                      flex
                      flex-col
                      items-center
                      justify-center
                      h-full
                      text-slate-400
                      space-y-4
                      w-full
                    "
                  >
                    <Layers
                      size={48}
                      className="opacity-20"
                    />

                    <p className="text-sm font-medium">
                      Multiple Documents Active
                    </p>

                    <p className="text-xs">
                      Preview disabled for
                      batch uploads.
                    </p>
                  </div>

                ) : (

                  <PDFViewer
                    fileUrl={fileData.url}
                    currentPage={selectedPage}
                  />

                )}
              </div>

              {/* CHAT PANEL */}

              <div
                className="
                  w-full
                  lg:w-1/2
                  h-full
                  bg-[#0b1120]
                "
              >
                <ChatView
                  filename={fileData.name}
                  activeCollection={
                    activeCollection
                  }

                  // PAGE JUMP

                  onNavigatePage={
                    setSelectedPage
                  }

                  // OPEN NEW PDF

                  onOpenPdf={(
                    url: string,
                    sourceName?: string
                  ) => {
                    setFileData({
                      name:
                        sourceName ||
                        'Document',

                      url,
                    })
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App