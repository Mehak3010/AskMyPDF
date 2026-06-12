import { useState } from 'react'

import { FileText } from 'lucide-react'

import { Badge } from './components/ui/badge'

import { HomeDashboard } from './components/HomeDashboard'

import { WorkspaceView } from './components/WorkspaceView'

function App() {
  // =========================
  // FILE STATE
  // =========================

  const [fileData, setFileData] =
    useState<{
      name: string
      url: string
      sessionId: string
    }[]>([])

  const [
    activePdfIndex,
    setActivePdfIndex,
  ] = useState(0)

  // =========================
  // ACTIVE COLLECTION
  // =========================

  const [activeCollection, setActiveCollection] =
    useState<string | null>(null)

  // =========================
  // UPLOAD SUCCESS
  // =========================

  const handleUploadSuccess = (
    name: string,
    url: string,
    sessionId: string
  ) => {

    setFileData((prev) => {

      const updated = [

        ...prev,

        {
          name,
          url,
          sessionId,
        },
      ]

      return updated
    })

    setActivePdfIndex(
      fileData.length
    )
  }

  // =========================
  // REMOVE PDF
  // =========================

  const handleRemovePdf = (index: number) => {
    setFileData((prev) => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
    })

    if (activePdfIndex >= index && activePdfIndex > 0) {
      setActivePdfIndex(activePdfIndex - 1)
    } else if (activePdfIndex === index && activePdfIndex === 0) {
      setActivePdfIndex(0)
    }
  }

  // =========================
  // BACK TO HOME
  // =========================

  const handleBackToHome = () => {

    setFileData([])

    setActivePdfIndex(0)

    setActiveCollection(null)
  }
  return (
    <div
      className="
        h-screen
        overflow-hidden
        bg-[#020617]
        text-white
        flex
        flex-col
      "
    >
      {/* HEADER */}

      <header
        className="
          h-14
          border-outline
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

        <div className="flex items-center gap-3">

          <div className="bg-primary p-1.5 rounded-lg">
            <FileText className="text-white h-4 w-4" />
          </div>

          <span className="font-bold text-lg tracking-tight">
            AskMyPDF
          </span>
        </div>

        {/* RIGHT */}

        <div className="text-sm text-slate-400">
          AI Research Workspace
        </div>
      </header>

      {/* MAIN */}

      <main className="flex-1 overflow-hidden">

       {/* HOME SCREEN */}

        {fileData.length === 0 ? (

          <HomeDashboard
            onUploadSuccess={
              handleUploadSuccess
            }
          />

        ) : (

          <WorkspaceView

            fileData={fileData}

            activePdfIndex={
              activePdfIndex
            }

            setActivePdfIndex={
              setActivePdfIndex
            }

            activeCollection={
              activeCollection
            }

            onBack={
              handleBackToHome
            }
            
            onUploadSuccess={
              handleUploadSuccess
            }
            
            onRemovePdf={
              handleRemovePdf
            }
          />
        )}
      </main>
    </div>
  )
}

export default App
