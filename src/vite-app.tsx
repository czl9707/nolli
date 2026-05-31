import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { BrowserRouter } from "react-router"
import { LayoutSync } from "@/components/layout/layout-sync"
import { ArchSync } from "@/components/layout/arch-sync"
import { ThemeSync } from "@/components/layout/theme-sync"
import { PinBoard } from "@/components/pin-board"
import { Sidebar } from "@/components/sidebar/sidebar"
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
      <ThemeSync />
      <RouterSync />
      <Header />
      <div className={styles.appContainer}>
        <Sidebar />
        <PinBoard />
      </div>
      <Footer />
    </BrowserRouter>
  )
}
