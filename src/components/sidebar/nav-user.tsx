import {
  ChevronsUpDown,
  createLucideIcon,
  Loader2,
  LogOut,
  MapPlus,
  Star,
} from "lucide-react"
import { useAuthStore, AUTH_ENABLED } from "@/stores/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Body2, Caption } from "@/components/ui/typography"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import styles from "./nav-user.module.css"
import { Button } from "../ui/button"

const guestUser = {
  name: "Guest",
  email: "Sign in",
}

const GoogleIcon = createLucideIcon("Google", [
  ["path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z", fill: "#4285F4", stroke: "none"}],
  ["path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853", stroke: "none" }],
  ["path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05", stroke: "none" }],
  ["path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335", stroke: "none" }],
])

function GuestNav() {
  const signIn = useAuthStore((s) => s.signIn)
  const loading = useAuthStore((s) => s.loading)

  if (!AUTH_ENABLED) {
    return (
      <Button variant="ghost" size="lg" className={styles.trigger} disabled>
        <Avatar size="sm">
          <AvatarFallback>{guestUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={styles.userInfo}>
          <Body2 asChild>
            <span className={styles.userName}>{guestUser.name}</span>
          </Body2>
          <Caption asChild>
            <span className={styles.userEmail}>Coming soon</span>
          </Caption>
        </div>
        <ChevronsUpDown className={styles.chevron} />
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg" className={styles.trigger}>
          <Avatar size="sm">
            <AvatarFallback>{guestUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className={styles.userInfo}>
            <Body2 asChild>
              <span className={styles.userName}>{guestUser.name}</span>
            </Body2>
            <Caption asChild>
              <span className={styles.userEmail}>{guestUser.email}</span>
            </Caption>
          </div>
          <ChevronsUpDown className={styles.chevron} />
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Log into Nolli</DialogTitle>
        </DialogHeader>
        <Button
          variant="default"
          className={styles.signInButton}
          onClick={signIn}
          disabled={loading}
        >
          {loading ? <Loader2 size={16} /> : <GoogleIcon size={16} />}
          Sign in with Google
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function UserNav() {
  const user = useAuthStore((s) => s.user!)
  const signOut = useAuthStore((s) => s.signOut)
  const initialized = useAuthStore((s) => s.initialized)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="lg" className={styles.trigger}>
          <Avatar size="sm">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className={styles.userInfo}>
            <Body2>{initialized ? user.name : "Loading..."}</Body2>
            <Caption>{initialized ? user.email : "Loading..."}</Caption>
          </div>
          <ChevronsUpDown className={styles.chevron} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" sideOffset={4}>
        <DropdownMenuLabel>
          <div className={styles.dropdownUser}>
            <Avatar size="sm">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className={styles.userInfo}>
              <Body2>{initialized ? user.name : "Loading..."}</Body2>
              <Caption>{initialized ? user.email : "Loading..."}</Caption>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <MapPlus />
            Contribution
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Star />
            Favorites
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NavUser() {
  const user = useAuthStore((s) => s.user)

  return user ? <UserNav /> : <GuestNav />
}


