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
    } | null>(null)

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
    url: string
  ) => {
    setFileData({
      name,
      url,
    })
  }

  // =========================
  // BACK TO HOME
  // =========================

  const handleBackToHome = () => {
    setFileData(null)
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

        <div className="flex items-center gap-3">

          <div className="bg-primary p-1.5 rounded-lg">
            <FileText className="text-white h-4 w-4" />
          </div>

          <span className="font-bold text-lg tracking-tight">
            AskMyPDF
          </span>

          <Badge
            variant="outline"
            className="
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

        <div className="text-sm text-slate-400">
          AI Research Workspace
        </div>
      </header>

      {/* MAIN */}

      <main className="flex-1 overflow-hidden">

        {/* HOME SCREEN */}

        {!fileData ? (

          <HomeDashboard
            onUploadSuccess={
              handleUploadSuccess
            }
          />

        ) : (

          /* WORKSPACE */

          <WorkspaceView
            fileData={fileData}
            activeCollection={
              activeCollection
            }
            onBack={
              handleBackToHome
            }
          />
        )}
      </main>
    </div>
  )
}

export default App
