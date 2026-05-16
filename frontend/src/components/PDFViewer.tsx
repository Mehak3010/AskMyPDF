import React, { useEffect } from 'react'

import { Worker, Viewer } from '@react-pdf-viewer/core'

import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'

import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'

import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'

interface Props {
  fileUrl: string
  currentPage: number
}

export const PDFViewer: React.FC<Props> = ({
  fileUrl,
  currentPage,
}) => {
  // -----------------------------
  // PLUGINS
  // -----------------------------

  const defaultLayoutPluginInstance =
    defaultLayoutPlugin()

  const pageNavigationPluginInstance =
    pageNavigationPlugin()

  const { jumpToPage } =
    pageNavigationPluginInstance

  // -----------------------------
  // PAGE NAVIGATION
  // -----------------------------

  useEffect(() => {
    if (currentPage >= 0) {
      jumpToPage(currentPage)
    }
  }, [currentPage])

  // -----------------------------
  // EMPTY STATE
  // -----------------------------

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        No PDF selected
      </div>
    )
  }

  // -----------------------------
  // VIEWER
  // -----------------------------

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 overflow-hidden">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer
            fileUrl={fileUrl}
            plugins={[
              defaultLayoutPluginInstance,
              pageNavigationPluginInstance,
            ]}
          />
        </Worker>
      </div>
    </div>
  )
}
