import { lazy, Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter, Route, Routes } from "react-router"
import { HelmetProvider } from "react-helmet-async"
import { ArchSync } from "@/components/layout/arch-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { NavSidebar } from "@/components/layout/nav"
import { Toaster } from "@nolli/ui"
import styles from "./vite-app.module.css"

// Pages are lazy-loaded so each route ships as its own chunk. MapPage pulls in
// the map renderer (the heaviest dep), and without this it blocks first paint
// of every other route.
const AboutPage = lazy(() =>
  import("@/pages/about/about").then((m) => ({ default: m.AboutPage })),
)
const PrivacyPage = lazy(() =>
  import("@/pages/privacy/privacy").then((m) => ({ default: m.PrivacyPage })),
)
const TermsPage = lazy(() =>
  import("@/pages/terms/terms").then((m) => ({ default: m.TermsPage })),
)
const MapPage = lazy(() => import("@/pages/map/map").then((m) => ({ default: m.MapPage })))
const ModeratePage = lazy(() =>
  import("@/pages/moderate/moderate").then((m) => ({ default: m.ModeratePage })),
)
const SubmissionsPage = lazy(() =>
  import("@/pages/submissions/submissions").then((m) => ({ default: m.SubmissionsPage })),
)

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
          <Suspense>
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
          </Suspense>
        </div>
        <Footer />
      </BrowserRouter>
    </HelmetProvider>
  )
}
