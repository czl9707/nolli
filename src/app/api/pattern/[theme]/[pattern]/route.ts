import sharp from "sharp"
import { NextResponse } from "next/server"
import { type Theme, THEMES } from "@/lib/map-texture/constant"
import { waterPattern } from "@/lib/map-texture/water"
import { grassPattern } from "@/lib/map-texture/grass"
import { forestPattern } from "@/lib/map-texture/forest"
import { buildingPattern } from "@/lib/map-texture/building"

export const dynamic = 'force-static';

const patterns: Record<string, (theme: Theme) => string> = { 
  water: waterPattern,
  grass: grassPattern,
  forest: forestPattern,
  building: buildingPattern,
}

export async function generateStaticParams() {
  return Object.keys(patterns).flatMap((pattern) =>
    THEMES.map((theme) => ({ theme, pattern })),
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ theme: Theme; pattern: string }> },
) {
  const { theme, pattern } = await params

  const svg = patterns[pattern](theme)
  const buffer = await sharp(Buffer.from(svg))
    .webp({ quality: 100 })
    .toBuffer()

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/webp",
    },
  })
}
