import { ThemeProvider } from "@/components/layout/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Map } from "@/components/map"
import { BrowserRouter, Routes, Route, useLocation } from "react-router"
import { ArchContent } from "@/pages/arch"
import { useLayout, useHorizontalScroll } from "@/hooks/use-layout"
import { SelectedArchProvider } from "@/contexts/selected-arch"
import { AnimatePresence, motion } from "framer-motion"
import { Body2 } from "@/components/ui/typography"
import { MoveLeft } from "lucide-react"
import styles from "./vite-app.module.css"
import { Button } from "./components/ui/button"


function ScrollToStart({ scrollRef }: { scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const mode = useLayout()

  return (
    <AnimatePresence mode="wait">
    {
      mode == "portfolio" &&
        <motion.div
          className={styles.scrollToStart}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.6 }}}
          exit={{ opacity: 0 }}
        >
        <Button
          variant="link"
          onClick={() => {
            scrollRef.current?.scrollTo({ left: 0, behavior: "smooth" })
          }}
        >
          <MoveLeft size={20} stroke-width={1} /> 
          <Body2 className={styles.scrollToStartText}>  Back to start</Body2>
        </Button>
      </motion.div>
    }
  </AnimatePresence>
  )
}

function AppContainer({ children }: { children: React.ReactNode }) {
  useLayout();
  const scrollRef = useHorizontalScroll();
  return (
    <div className={styles.appContainer} ref={scrollRef}>
      {children}
      <ScrollToStart scrollRef={scrollRef} />
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
