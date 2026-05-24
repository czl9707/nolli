import { ThemeProvider } from "@/components/layout/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Map } from "@/components/map"
import { BrowserRouter, Routes, Route, useLocation } from "react-router"
import { ArchContent } from "@/pages/arch"
import { useLayout } from "@/hooks/use-layout"
import { SelectedArchProvider } from "@/contexts/selected-arch"
import { AnimatePresence, motion } from "framer-motion"
import styles from "./vite-app.module.css"


function AppContainer({ children }: { children: React.ReactNode }) {
  useLayout()
  return (
    <div className={styles.appContainer}>
      {children}
    </div>
  )
}


function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0 }}
        className={styles.routePresence}
      >
        <Routes location={location}>
          <Route path="/arch/:slug" element={<ArchContent />} />
          <Route path="/" element={<></>} />
        </Routes>
      </motion.div>
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
