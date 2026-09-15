import { lazy, Suspense, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter, Route, Routes } from "react-router"
import { HelmetProvider } from "react-helmet-async"
import { ArchSync } from "@/components/layout/arch-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { NavSidebar } from "@/components/layout/nav"
import { Toaster } from "@nolli/ui"
import { ABOUT_PAGE, PRIVACY_PAGE, TERMS_PAGE } from "@/lib/constants"
import styles from "./vite-app.module.css"

// Pages are lazy-loaded so each route ships as its own chunk. MapPage pulls in
// the map renderer (the heaviest dep), and without this it blocks first paint
// of every other route.
const MapPage = lazy(() => import("@/pages/map/map").then((m) => ({ default: m.MapPage })))
const ModeratePage = lazy(() =>
  import("@/pages/moderate/moderate").then((m) => ({ default: m.ModeratePage })),
)
const SubmissionsPage = lazy(() =>
  import("@/pages/submissions/submissions").then((m) => ({ default: m.SubmissionsPage })),
)

function LandingRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url)
  }, [url])
  return null
}

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
              <Route path="/about" element={<LandingRedirect url={ABOUT_PAGE} />} />
              <Route path="/privacy" element={<LandingRedirect url={PRIVACY_PAGE} />} />
              <Route path="/terms" element={<LandingRedirect url={TERMS_PAGE} />} />
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
