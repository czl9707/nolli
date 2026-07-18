import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter, Route, Routes } from "react-router"
import { HelmetProvider } from "react-helmet-async"
import { ArchSync } from "@/components/layout/arch-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { NavSidebar } from "@/components/layout/nav"
import { Toaster } from "@nolli/ui"
import { AboutPage } from "@/pages/about/about"
import { PrivacyPage } from "@/pages/privacy/privacy"
import { TermsPage } from "@/pages/terms/terms"
import { MapPage } from "@/pages/map/map"
import { ModeratePage } from "@/pages/moderate/moderate"
import { SubmissionsPage } from "@/pages/submissions/submissions"
import styles from "./vite-app.module.css"

export function ViteApp() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" />
        <ThemeSync />
        <AuthSync />
        <ArchSync />
        <Header />
        <div className={styles.appContainer}>
          <NavSidebar />
          <Routes>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/favorite" element={<MapPage />} />
            <Route path="/moderate" element={<ModeratePage />} />
            <Route path="/moderate/:id" element={<ModeratePage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/submissions/new" element={<SubmissionsPage />} />
            <Route path="/submissions/:id" element={<SubmissionsPage />} />
            <Route path="/*" element={<MapPage />} />
          </Routes>
        </div>
        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  )
}
