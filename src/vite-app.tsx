import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter } from "react-router"
import { HelmetProvider } from "react-helmet-async"
import { LayoutSync } from "@/components/layout/layout-sync"
import { ArchSync } from "@/components/layout/arch-sync"
import { SeoSync } from "@/components/layout/seo-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { PinBoard } from "@/components/pin-board"
import { NavSidebar } from "@/components/nav/nav-sidebar"
import { ContentPanel } from "@/components/sidebar/content-panel"
import { PanelContent } from "@/components/sidebar/panel-content"
import { Toaster } from "@/components/ui/sonner"
import styles from "./vite-app.module.css"

function RouterSync() {
  return (
    <>
      <LayoutSync />
      <ArchSync />
      <SeoSync />
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
          <ContentPanel>
            <PanelContent />
          </ContentPanel>
          <PinBoard />
        </div>
        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  )
}
