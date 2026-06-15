import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter, Route, Routes } from "react-router"
import { HelmetProvider } from "react-helmet-async"
import { ArchSync } from "@/components/layout/arch-sync"
import { SeoSync } from "@/components/layout/seo-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { PinBoard } from "@/components/pin-board"
import { NavSidebar } from "@/components/nav/nav-sidebar"
import { ContentPanel } from "@/components/sidebar/content-panel"
import { PanelContent } from "@/components/sidebar/panel-content"
import { Toaster } from "@/components/ui/sonner"
import { AboutPage } from "@/components/pages/about/about"
import { PrivacyPage } from "@/components/pages/privacy/privacy"
import styles from "./vite-app.module.css"

function RouterSync() {
  return (
    <>
      <ArchSync />
      <SeoSync />
    </>
  )
}

/** The map layout center: side panel + pin-board. Only mounted for map routes. */
function MapCenter() {
  return (
    <>
      <ContentPanel>
        <PanelContent />
      </ContentPanel>
      <PinBoard />
    </>
  )
}

export function ViteApp() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" />
        <ThemeSync />
        <AuthSync />
        <RouterSync />
        <Header />
        <div className={styles.appContainer}>
          <NavSidebar />
          <Routes>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/*" element={<MapCenter />} />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  )
}
