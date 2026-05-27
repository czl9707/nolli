import express from "express"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, "dist")
const PORT = process.env.PORT ?? 3000

const app = express()

app.use(express.static(DIST))

app.get("/{*splat}", (_req, res) => {
  res.sendFile(join(DIST, "index.html"))
})

app.listen(PORT, () => {
  console.log(`nolli serving on http://localhost:${PORT}`)
})
