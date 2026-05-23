import { ThemeProvider } from "@/components/layout/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Map } from "@/components/map"
import { BrowserRouter, Routes, Route, useLocation } from "react-router"
import { ArchContent } from "@/pages/arch"
import { useLayout } from "@/hooks/use-layout"
import { AnimatePresence } from "framer-motion"
import styles from "./vite-app.module.css"


function AppContainer({ children }: { children: React.ReactNode }) {
  useLayout();
  return (
    <div className={styles.appContainer}>
      {children}
    </div>
  )
}


function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        <Route path="/arch/:slug" element={<ArchContent />} />
        <Route path="/" element={<></>} />
      </Routes>
    </AnimatePresence>
  )
}

export function ViteApp() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Header />
          <AppContainer>
            <Map />
            <AnimatedRoutes />
          </AppContainer>
        <Footer />
      </ThemeProvider>
    </BrowserRouter>
  )
}
