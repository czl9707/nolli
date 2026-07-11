import { Hono } from "hono"
import type { AppEnv } from "@worker/lib/app-env"
import { db, resolveUser } from "@worker/middleware"
import { me } from "./me"
import { signOut } from "./sign-out"
import { loginGoogle } from "./login-google"
import { callbackGoogle } from "./callback-google"

export const app = new Hono<AppEnv>()

// Request-scoped DB + user resolution, applied to /auth only.
app.use("*", db, resolveUser)
app.route("/me", me)
app.route("/sign-out", signOut)
app.route("/login/google", loginGoogle)
app.route("/callback/google", callbackGoogle)
