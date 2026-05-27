import React, {
  useCallback,
  useState,
} from 'react'

import { useDropzone } from 'react-dropzone'

import {
  Upload,
  Loader2,
  CheckCircle2,
} from 'lucide-react'

import { cn } from '../lib/utils'

import axios from 'axios'

import {
  motion,
  AnimatePresence,
} from 'framer-motion'

import {
  Card,
  CardContent,
} from './ui/card'

interface UploadViewProps {
  onUploadSuccess: (
    filename: string,
    fileUrl: string,
    sessionId: string
  ) => void
}

export const UploadView: React.FC<
  UploadViewProps
> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] =
    useState(false)

  const [isSuccess, setIsSuccess] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [collection, setCollection] =
    useState('General')

  // =========================
  // UPLOAD
  // =========================

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0)
        return

      setIsUploading(true)
      setError(null)

      try {
        const firstFileUrl =
          URL.createObjectURL(
            acceptedFiles[0]
          )

        let lastSessionId = ""

        // PROCESS FILES
        for (const file of acceptedFiles) {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('collection', collection)

          const response = await axios.post(
            'http://localhost:8001/upload',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          )
          
          lastSessionId = response.data.session_id
        }

        setIsSuccess(true)

        // NOW call with session_id
        onUploadSuccess(
          acceptedFiles.length > 1
            ? `${acceptedFiles.length} files`
            : acceptedFiles[0].name,
          firstFileUrl,
          lastSessionId
        )

      } catch (err: any) {
        setError(
          err.response?.data?.detail ||
            'Failed to upload files.'
        )
      } finally {
        setIsUploading(false)
      }
    },
    [onUploadSuccess, collection]
  )

  // =========================
  // DROPZONE
  // =========================

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop,

    accept: {
      'application/pdf': ['.pdf'],
    },

    multiple: true,

    disabled:
      isUploading || isSuccess,
  })

  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
      "
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        className="
          w-full
          max-w-[720px]
          text-center
          space-y-6
        "
      >
        {/* TITLE */}

        <div className="space-y-2">

          <motion.h1
            className="
              text-5xl
              font-black
              tracking-tight
              text-white
            "
          >
            Multi-PDF{' '}

            <span className="text-primary">
              Intelligence
            </span>
          </motion.h1>

          <motion.p
            className="
              text-base
              text-slate-400
            "
          >
            Upload multiple documents
            and ask cross-PDF
            questions.
          </motion.p>
        </div>

        {/* COLLECTION */}

        <div
          className="
            flex
            items-center
            justify-center
            gap-2
          "
        >
          <span
            className="
              text-sm
              text-slate-400
            "
          >
            Collection:
          </span>

          <select
            value={collection}
            onChange={(e) =>
              setCollection(
                e.target.value
              )
            }
            className="
              bg-slate-800
              border
              border-slate-700
              rounded-lg

              px-3
              py-2

              text-sm
              text-white

              outline-none
            "
          >
            <option value="General">
              General
            </option>

            <option value="Research">
              Research
            </option>

            <option value="Work">
              Work
            </option>

            <option value="Finance">
              Finance
            </option>

            <option value="Personal">
              Personal
            </option>
          </select>
        </div>

        {/* DROPZONE */}

        <Card
          className="
            border
            border-slate-800

            bg-[#020817]

            rounded-[28px]

            overflow-hidden

            shadow-2xl

            ring-1
            ring-white/5
          "
        >
          <CardContent className="p-0">

            <div
              {...getRootProps()}

              className={cn(
                `
                relative
                group
                cursor-pointer

                p-10

                transition-all
                duration-300

                min-h-[320px]

                flex
                items-center
                justify-center
              `,

                isDragActive
                  ? 'bg-primary/5'
                  : 'hover:bg-slate-900/30',

                (isUploading ||
                  isSuccess) &&
                  `
                  opacity-60
                  pointer-events-none
                `
              )}
            >
              <input
                {...getInputProps()}
              />

              <div
                className="
                  flex
                  flex-col
                  items-center
                  space-y-5
                "
              >
                {/* ICON */}

                <motion.div
                  animate={
                    isUploading
                      ? {
                          scale: [
                            1,
                            1.05,
                            1,
                          ],

                          rotate: 360,
                        }
                      : {}
                  }

                  transition={
                    isUploading
                      ? {
                          repeat:
                            Infinity,

                          duration: 2,
                        }
                      : {}
                  }

                  className={cn(
                    `
                    p-5
                    rounded-[24px]

                    transition-all
                    duration-300
                  `,

                    isDragActive
                      ? `
                        bg-primary
                        text-white
                      `
                      : `
                        bg-primary/10
                        text-primary
                      `,

                    isSuccess &&
                      `
                      bg-green-500/10
                      text-green-400
                    `
                  )}
                >
                  {isUploading ? (

                    <Loader2
                      className="
                        h-10
                        w-10
                        animate-spin
                      "
                    />

                  ) : isSuccess ? (

                    <CheckCircle2
                      className="
                        h-10
                        w-10
                      "
                    />

                  ) : (

                    <Upload
                      className="
                        h-10
                        w-10
                      "
                    />

                  )}
                </motion.div>

                {/* TEXT */}

                <div className="space-y-2">

                  <h3
                    className="
                      text-3xl
                      font-bold
                      text-white
                    "
                  >
                    {isUploading
                      ? 'Uploading & Analyzing...'
                      : isSuccess
                      ? 'Success!'
                      : 'Drop multiple PDFs here'}
                  </h3>

                  <p
                    className="
                      text-sm
                      text-slate-400
                      max-w-[300px]
                      mx-auto
                      leading-relaxed
                    "
                  >
                    {isUploading
                      ? 'Building your AI knowledge workspace...'
                      : isSuccess
                      ? 'Preparing intelligent document search...'
                      : 'Drag files here to begin cross-document analysis'}
                  </p>
                </div>
              </div>

              {/* LOADING BAR */}

              {isUploading && (

                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    h-1
                    bg-primary/10
                    w-full
                    overflow-hidden
                  "
                >
                  <motion.div
                    initial={{
                      x: '-100%',
                    }}

                    animate={{
                      x: '100%',
                    }}

                    transition={{
                      repeat:
                        Infinity,

                      duration: 1.5,

                      ease:
                        'linear',
                    }}

                    className="
                      h-full
                      bg-primary
                      w-1/3
                    "
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ERROR */}

        <AnimatePresence>
          {error && (

            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}

              animate={{
                opacity: 1,
                height: 'auto',
              }}

              exit={{
                opacity: 0,
                height: 0,
              }}

              className="
                p-4
                rounded-xl

                bg-red-500/10

                border
                border-red-500/20
              "
            >
              <p
                className="
                  text-sm
                  text-red-400
                "
              >
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

