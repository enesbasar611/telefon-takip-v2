"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.1)] dark:group-[.toaster]:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-2xl group-[.toaster]:px-5 group-[.toaster]:py-4 font-sans",
          title: "font-black text-[13px] tracking-tight uppercase",
          description: "group-[.toast]:text-muted-foreground text-[12px] font-medium leading-relaxed font-sans",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-black text-xs rounded-xl",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-black text-xs rounded-xl",
          success: "group-[.toast]:bg-emerald-500/10 group-[.toast]:text-emerald-600 dark:group-[.toast]:text-emerald-400 group-[.toast]:border-emerald-500/20",
          error: "group-[.toast]:bg-rose-500/10 group-[.toast]:text-rose-600 dark:group-[.toast]:text-rose-400 group-[.toast]:border-rose-500/20",
          warning: "group-[.toast]:bg-amber-500/10 group-[.toast]:text-amber-600 dark:group-[.toast]:text-amber-400 group-[.toast]:border-amber-500/20",
          info: "group-[.toast]:bg-blue-500/10 group-[.toast]:text-blue-600 dark:group-[.toast]:text-blue-400 group-[.toast]:border-blue-500/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }



