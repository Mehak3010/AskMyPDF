import { UploadView } from "./UploadView"

interface Props {
  onUploadSuccess: (
    name: string,
    url: string
  ) => void
}

export function HomeDashboard({
  onUploadSuccess,
}: Props) {
  return (
    <div
      className="
        h-full
        bg-[#020617]

        flex
        items-center
        justify-center

        p-8
      "
    >
      {/* OUTER WORKSPACE CARD */}

      <div
        className="
          w-full
          max-w-4xl
        "
      >
        {/* FLOATING CONTAINER */}

        <div
          className="
            bg-[#071022]

            border
            border-slate-800

            rounded-[36px]

            shadow-2xl

            backdrop-blur-xl

            ring-1
            ring-white/5

            px-8
            py-8

            max-w-[860px]
            mx-auto
          "
        >
          {/* UPLOAD MODULE */}

          <UploadView
            onUploadSuccess={
              onUploadSuccess
            }
          />
        </div>
      </div>
    </div>
  )
}
