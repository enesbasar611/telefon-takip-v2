"use client"

import { Check, X, Info, AlertTriangle, Loader2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Renkli kare ikon — resimde görünen tasarım
function ToastIcon({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl shrink-0"
      style={{
        width: 42,
        height: 42,
        backgroundColor: color,
        boxShadow: `0 8px 16px ${color}33`,
      }}
    >
      {children}
    </div>
  )
}

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      gap={10}
      icons={{
        success: (
          <ToastIcon color="#16a34a">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </ToastIcon>
        ),
        error: (
          <ToastIcon color="#dc2626">
            <X className="h-4 w-4 text-white" strokeWidth={3} />
          </ToastIcon>
        ),
        warning: (
          <ToastIcon color="#d97706">
            <AlertTriangle className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </ToastIcon>
        ),
        info: (
          <ToastIcon color="#2563eb">
            <Info className="h-4 w-4 text-white" strokeWidth={2.5} />
          </ToastIcon>
        ),
        loading: (
          <ToastIcon color="#475569">
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          </ToastIcon>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast !flex !flex-row !border !border-white/[0.06] !shadow-2xl !shadow-black/40 !rounded-2xl !p-4 !gap-4 !items-center !w-full sm:!w-[380px] relative",
          success: "!bg-emerald-950/90 !border-emerald-500/20",
          error: "!bg-rose-950/90 !border-rose-500/20",
          warning: "!bg-amber-950/90 !border-amber-500/20",
          info: "!bg-[#0f172a] !border-blue-500/20",
          default: "!bg-[#0f172a]",
          content: "!ml-[74px] !flex-1 !min-w-0 flex flex-col justify-center",
          title:
            "!text-white !font-medium !text-[13px] !leading-snug !break-words",
          description:
            "!text-muted-foreground !font-normal !text-[11px] !leading-relaxed !break-words !mt-0.5",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!bg-white/5 !border-border !text-muted-foreground/80 hover:!text-white hover:!bg-white/10 !rounded-lg",
          icon: "!absolute !left-4 !top-1/2 !-translate-y-1/2 !m-0 !w-[42px] !h-[42px] !flex-none flex items-center justify-center",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }



