import { ThemeProvider } from "@/components/layout/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Map } from "@/components/map"
import { BrowserRouter, Routes, Route, useLocation } from "react-router"
import { ArchContent } from "@/pages/arch"
import { useLayout, useHorizontalScroll } from "@/hooks/use-layout"
import { SelectedArchProvider } from "@/contexts/selected-arch"
import { AnimatePresence } from "framer-motion"
import styles from "./vite-app.module.css"


function AppContainer({ children }: { children: React.ReactNode }) {
  useLayout();
  const scrollRef = useHorizontalScroll();
  return (
    <div className={styles.appContainer} ref={scrollRef}>
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
            <SelectedArchProvider>
              <Map />
              <AnimatedRoutes />
            </SelectedArchProvider>
          </AppContainer>
        <Footer />
      </ThemeProvider>
    </BrowserRouter>
  )
}
