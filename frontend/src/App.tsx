import { useState } from 'react'
import { UploadView } from './components/UploadView'
import { ChatView } from './components/ChatView'
import { PDFViewer } from './components/PDFViewer'
import { DocumentLibrary } from './components/DocumentLibrary'
import { FileText, ArrowLeft, Layers } from 'lucide-react'
import { Badge } from './components/ui/badge'

function App() {
  const [fileData, setFileData] = useState<{ name: string; url: string } | null>(null)
  const [activeCollection, setActiveCollection] = useState<string | null>(null)

  const handleUploadSuccess = (name: string, url: string) => {
    setFileData({ name, url })
  }

  const handleReset = () => {
    setFileData(null)
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 flex-shrink-0 bg-white dark:bg-slate-900 z-20">
        <div className="flex items-center space-x-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <FileText className="text-white h-4 w-4" />
          </div>
          <span className="font-bold text-lg tracking-tight">AskMyPDF</span>
          <Badge variant="outline" className="ml-2 text-[10px] uppercase tracking-widest border-primary/20 text-primary">
            Phase 4
          </Badge>
        </div>
        
        <div className="flex items-center space-x-3">
          {fileData && (
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              <Layers size={12} />
              <span>{activeCollection || 'Global Search'}</span>
            </div>
          )}
          <button 
            onClick={handleReset}
            className="flex items-center space-x-1 text-xs font-medium text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} />
            <span>{fileData ? 'Library' : 'Upload More'}</span>
          </button>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <DocumentLibrary 
          onSelectCollection={setActiveCollection} 
          onSelectDocument={handleUploadSuccess}
          activeCollection={activeCollection} 
        />
        
        <main className="flex-1 overflow-hidden relative">
          {!fileData ? (
            <UploadView onUploadSuccess={handleUploadSuccess} />
          ) : (
            <div className="flex h-full">
              {/* PDF Panel - Left (Visible only if one file is selected/uploaded) */}
              <div className="hidden lg:block w-1/2 h-full border-r border-slate-200 dark:border-slate-800 bg-slate-50">
                {fileData.name.includes('files') ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <Layers size={48} className="opacity-20" />
                    <p className="text-sm font-medium">Multiple Documents Active</p>
                    <p className="text-xs">Preview is disabled for batch uploads.</p>
                  </div>
                ) : (
                  <PDFViewer fileUrl={fileData.url} />
                )}
              </div>
              
              {/* Chat Panel - Right */}
              <div className="w-full lg:w-1/2 h-full">
                <ChatView filename={fileData.name} activeCollection={activeCollection} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}


export default App
