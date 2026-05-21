import { useNavigate, useParams } from "react-router"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

const DUMMY_CARDS = [
  {
    title: "The Guggenheim Museum",
    location: "New York, USA",
    year: "1959",
    description: "Designed by Frank Lloyd Wright, the museum's iconic spiral ramp wraps around a grand atrium, creating a continuous flowing gallery experience that revolutionized museum architecture.",
    color: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    title: "Fallingwater",
    location: "Pennsylvania, USA",
    year: "1935",
    description: "Built over a waterfall on Bear Run, this house by Frank Lloyd Wright integrates natural rock formations and flowing water into its cantilevered concrete terraces.",
    color: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  {
    title: "Sagrada Familia",
    location: "Barcelona, Spain",
    year: "1882–present",
    description: "Antoni Gaudí's unfinished basilica combines Gothic and Art Nouveau forms with intricate geometric structures inspired by natural patterns and hyperboloid vaults.",
    color: "bg-rose-100 dark:bg-rose-900/30",
  },
  {
    title: "Villa Savoye",
    location: "Poissy, France",
    year: "1931",
    description: "Le Corbusier's manifesto for modern architecture — pilotis, ribbon windows, free façade, open floor plan, and roof garden distilled into a single white prism hovering above the landscape.",
    color: "bg-sky-100 dark:bg-sky-900/30",
  },
]

export function ArchContent() {
  const { slug } = useParams()
  const navigate = useNavigate()

  return (<>
  
  </>)
}
