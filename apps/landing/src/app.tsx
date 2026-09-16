import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router"
import { BootProvider } from "@/lib/boot"

const SpineApp = lazy(() => import("@/spine-app").then((m) => ({ default: m.SpineApp })))
const AboutPage = lazy(() => import("@/pages/about"))
const PrivacyPage = lazy(() => import("@/pages/privacy"))
const TermsPage = lazy(() => import("@/pages/terms"))

/** Static pages render outside the boot flow — no map, no scroll lock;
 * lazy chunks keep MapLibre/Lenis out of the legal pages' payload. */
export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <BootProvider>
            <Suspense fallback={null}>
              <SpineApp />
            </Suspense>
          </BootProvider>
        }
      />
      <Route
        path="/about"
        element={
          <Suspense fallback={null}>
            <AboutPage />
          </Suspense>
        }
      />
      <Route
        path="/privacy"
        element={
          <Suspense fallback={null}>
            <PrivacyPage />
          </Suspense>
        }
      />
      <Route
        path="/terms"
        element={
          <Suspense fallback={null}>
            <TermsPage />
          </Suspense>
        }
      />
    </Routes>
  )
}
