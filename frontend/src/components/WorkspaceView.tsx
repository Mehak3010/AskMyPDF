import { useState, useRef } from "react"
import axios from "axios"

import { PDFViewer } from "./PDFViewer"

import { ChatView } from "./ChatView"

import { ConversationSidebar } from "./ConversationSidebar"

import { FileText, Plus, Loader2, X } from "lucide-react"

interface Props {

  fileData: {

    name: string
    url: string
    sessionId: string

  }[]

  activePdfIndex: number

  setActivePdfIndex: (
    index: number
  ) => void

  activeCollection:
    string | null

  onBack: () => void
  
  onUploadSuccess: (
    name: string,
    url: string,
    sessionId: string
  ) => void
  
  onRemovePdf: (index: number) => void
}

export function WorkspaceView({
  fileData,
  activePdfIndex,
  setActivePdfIndex,
  activeCollection,
  onBack,
  onUploadSuccess,
  onRemovePdf,
}: Props) {
  // =========================
  // PAGE NAVIGATION
  // =========================

  const [selectedPage, setSelectedPage] =
    useState(0)
  
  // =========================
  // UPLOAD
  // =========================
  
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File select triggered')
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    console.log('Files selected:', files)
    setIsUploading(true)
    
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('collection', activeCollection || 'General')

        console.log('Uploading file:', file.name)
        const response = await axios.post(
          'http://localhost:8001/upload',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        console.log('Upload response:', response.data)
        const fileUrl = URL.createObjectURL(file)
        onUploadSuccess(file.name, fileUrl, response.data.session_id)
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload file. Check console for details.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex h-full relative">

      {/* CLEAR ALL BUTTON */}

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
        Clear All
      </button>

      {/* HIDDEN FILE INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

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
            gap-2
            bg-[#071022]
            flex-shrink-0
            px-2
          "
        >
          {/* SCROLLABLE TABS SECTION */}
          <div 
            className="flex items-center gap-2 overflow-x-auto flex-1 min-w-0 thin-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#3f3f46 #18181b',
            }}
          >
            <style>{`
              .thin-scrollbar::-webkit-scrollbar {
                height: 4px;
              }
              .thin-scrollbar::-webkit-scrollbar-track {
                background: #18181b;
              }
              .thin-scrollbar::-webkit-scrollbar-thumb {
                background: #3f3f46;
                border-radius: 9999px;
              }
              .thin-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #52525b;
              }
            `}</style>
            {/* TABS */}
            {fileData.map(
              (
                pdf,
                index
              ) => (

                <button
                  key={index}

                  onClick={() =>
                    setActivePdfIndex(index)
                  }

                  className={`
                    px-3
                    py-1.5
                    text-sm
                    whitespace-nowrap
                    flex-shrink-0
                    transition-all
                    flex
                    items-center
                    gap-2
                    relative
                    min-w-0
                    ${
                      activePdfIndex === index
                        ? "bg-zinc-900 text-white border-b-2 border-blue-500"
                        : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-zinc-800"
                    }
                  `}
                >
                  <FileText size={14} />
                  <span className="truncate max-w-[120px">
                    {
                      pdf.name.length > 20
                        ? `${pdf.name
                            .replace(".pdf", "")
                            .slice(0, 17)}...`
                        : pdf.name.replace(".pdf", "")
                    }
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemovePdf(index)
                    }}
                    className="
                      p-0.5
                      rounded-full
                      hover:bg-zinc-700
                      transition
                      flex-shrink-0
                    "
                  >
                    <X size={12} />
                  </button>
                </button>
              )
            )}
          </div>
          
          {/* ADD BUTTON - FIXED POSITION OUTSIDE SCROLL */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="
              px-2.5
              py-1.5
              rounded-lg
              bg-zinc-900
              border
              border-zinc-800
              text-slate-300
              hover:bg-zinc-800
              transition
              flex-shrink-0
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          </button>


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
            fileUrl={
              fileData[
                activePdfIndex
              ]?.url || ""
            }

            currentPage={
              selectedPage
            }
          />
        </div>
      </div>
      <div
        className="
          w-1/2
          h-full
          bg-[#0b1120]
        "
      >
        <ChatView
          filename={
            fileData[
              activePdfIndex
            ]?.name || ""
          }

          sessionId={
            fileData[
              activePdfIndex
            ]?.sessionId || ""
          }
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
