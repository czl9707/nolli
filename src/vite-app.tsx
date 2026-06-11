import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter } from "react-router"
import { LayoutSync } from "@/components/layout/layout-sync"
import { ArchSync } from "@/components/layout/arch-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { AuthSync } from "@/components/layout/auth-sync"
import { PinBoard } from "@/components/pin-board"
import { Sidebar } from "@/components/sidebar/sidebar"
import { MobileDrawer } from "@/components/nav/mobile-drawer"
import { BottomSheet } from "@/components/nav/bottom-sheet"
import { Toaster } from "@/components/ui/sonner"
import { NavRail } from "@/components/nav/nav-rail"
import styles from "./vite-app.module.css"

function RouterSync() {
  return (
    <>
      <LayoutSync />
      <ArchSync />
    </>
  )
}

export function ViteApp() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" />
      <ThemeSync />
      <AuthSync />
      <RouterSync />
      <Header />
      <div className={styles.appContainer}>
        <NavRail />
        <Sidebar />
        <PinBoard />
      </div>
      <MobileDrawer />
      <BottomSheet />
      <Footer />
    </BrowserRouter>
  )
}
