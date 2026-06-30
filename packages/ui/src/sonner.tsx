import { useThemeStore } from "./theme"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useThemeStore((s) => s)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon size={16} />,
        info: <InfoIcon size={16} />,
        warning: <TriangleAlertIcon size={16} />,
        error: <OctagonXIcon size={16} />,
        loading: <Loader2Icon size={16} />,
      }}
      style={
        {
          "--normal-bg": "rgb(var(--color-secondary-background))",
          "--normal-text": "rgb(var(--color-secondary-foreground))",
          "--normal-border": "rgb(var(--color-secondary-foreground) / .2)",
          "--border-radius": "var(--size-border-radius)",
          fontFamily: "var(--font-playful)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
