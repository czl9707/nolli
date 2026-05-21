import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { MapPage } from "@/pages/map"

export function ViteApp() {
  return (
    <ThemeProvider>
      <Header />
      <MapPage />
      <Footer />
    </ThemeProvider>
  )
}
