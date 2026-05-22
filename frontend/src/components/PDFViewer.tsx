import React, {
  useEffect,
} from 'react'

import {
  Worker,
  Viewer,
  SpecialZoomLevel,
} from '@react-pdf-viewer/core'

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
  // =============================
  // PLUGINS
  // =============================

  const defaultLayoutPluginInstance =
    defaultLayoutPlugin({
      sidebarTabs: (defaultTabs) => [],
    })

  const pageNavigationPluginInstance =
    pageNavigationPlugin()

  const { jumpToPage } =
    pageNavigationPluginInstance

  // =============================
  // PAGE NAVIGATION
  // =============================

  useEffect(() => {
    if (currentPage >= 0) {
      jumpToPage(currentPage)
    }
  }, [currentPage])

  // =============================
  // EMPTY STATE
  // =============================

  if (!fileUrl) {
    return (
      <div
        className="
          h-full
          flex
          items-center
          justify-center
          bg-[#020817]
          text-slate-500
        "
      >
        No PDF selected
      </div>
    )
  }

  // =============================
  // VIEWER
  // =============================

  return (
    <div
      className="
        absolute
        inset-0
        bg-[#020817]
      "
    >
      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
        <div style={{ height: '100%' }}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[
              defaultLayoutPluginInstance,
              pageNavigationPluginInstance,
            ]}
            theme="dark"
            defaultScale={SpecialZoomLevel.PageWidth}
          />
        </div>
      </Worker>
    </div>
  )
}
