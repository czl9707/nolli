import { ThemeProvider } from "@/components/layout/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Map } from "@/components/map"
import { BrowserRouter, Routes, Route } from "react-router"
import { ArchContent } from "@/pages/arch"
import { cn } from "./lib/utils"
import { useLayout } from "./hooks/use-layout"

function AppContainer({ children }: { children: React.ReactNode }) {
  const mode = useLayout()

  return (
    <div className={cn(
      "flex-1 overflow-x-scroll width-full transition-[width,padding] duration-500 ease-in-out",
      mode === "portfolio" && "inline-flex pl-32",
      mode === "home" && "flex px-8",
    )}>
      {children}
    </div>
  )
}


export function ViteApp() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Header />
          <AppContainer>
            <Map />
            <Routes>
              <Route path="/arch/:slug" element={<ArchContent />} />
              <Route path="/" element={<></>} />
            </Routes>
          </AppContainer>
        <Footer />
      </ThemeProvider>
    </BrowserRouter>
  )
}
