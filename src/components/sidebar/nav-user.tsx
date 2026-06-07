import {
  ChevronsUpDown,
  CreditCard,
  LogOut,
  MapPlus,
  Star,
} from "lucide-react"
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
import styles from "./nav-user.module.css"
import { Button } from "../ui/button"

const guestUser = {
  name: "Guest",
  email: "Sign in",
  avatar: "",
}

export function NavUser() {
  const user = guestUser

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="lg" className={styles.trigger}>
          <Avatar size="sm">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className={styles.userInfo}>
            <Body2 asChild><span className={styles.userName}>{user.name}</span></Body2>
            <Caption asChild><span className={styles.userEmail}>{user.email}</span></Caption>
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
              <Body2 asChild><span className={styles.userName}>{user.name}</span></Body2>
              <Caption asChild><span className={styles.userEmail}>{user.email}</span></Caption>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <MapPlus />
            Contribution (Coming soon)
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <Star />
            Favorites (Coming soon)
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
