import sharp from "sharp"
import { NextResponse } from "next/server"
import { type Theme, THEMES } from "./_constant"
import { waterPattern } from "./_water"

export const dynamic = 'force-static';

const patterns: Record<string, (theme: Theme) => string> = { 
  water: waterPattern
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
    .webp({quality: 100})
    .toBuffer()
  // const resizeBuffer = await sharp(buffer)
  //   .resize(256, 256, { fit: "cover" })
  //   .toBuffer()

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/webp",
      // "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
