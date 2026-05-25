import { ThemeProvider } from "@/components/layout/theme-provider"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter } from "react-router"
import { SelectedArchProvider } from "@/contexts/selected-arch"
import { PinBoard } from "@/components/pin-board"
import { useLayout } from "@/hooks/use-layout"
import styles from "./vite-app.module.css"


function AppContainer({ children }: { children: React.ReactNode }) {
  useLayout()
  return (
    <div className={styles.appContainer}>
      {children}
    </div>
  )
}


export function ViteApp() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Header />
        <AppContainer>
          <SelectedArchProvider>
            <PinBoard />
          </SelectedArchProvider>
        </AppContainer>
        <Footer />
      </ThemeProvider>
    </BrowserRouter>
  )
}
