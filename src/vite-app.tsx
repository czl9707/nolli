import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Map } from "@/components/map"
import { BrowserRouter, Routes, Route, useLocation } from "react-router"
import { ArchContent } from "@/pages/arch"
import { cn } from "./lib/utils"

function AppBody() {
  return (
      <AppContainer>
        <MapContainer>
          <Map />
        </MapContainer>
        <Routes>
          <Route path="/arch/:slug" element={<ArchContent />} />
          <Route path="/" element={<></>} />
        </Routes>
      </AppContainer>
  )
}

function AppContainer({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isPortfolio = location.pathname.startsWith("/arch/");

  return (
    <div className={cn(
      "flex-1 overflow-hidden width-full transition-[width,padding] duration-500 ease-in-out",
      isPortfolio ? "flex" : "inline-flex",
      "gap-24 flex-row", 
      isPortfolio ? "pl-8 py-12" : "px-8"
    )}>
      {children}
    </div>
  )
}

function MapContainer({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isPortfolio = location.pathname.startsWith("/arch/");
  
  return (
    <div className={cn(
      isPortfolio ? "w-[min(360px,calc(100vw-4rem))] h-full": "h-full w-full",
      "rounded-sm overflow-auto transition-[width,height] duration-500 ease-in-out"
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
        <AppBody />
        <Footer />
      </ThemeProvider>
    </BrowserRouter>
  )
}
