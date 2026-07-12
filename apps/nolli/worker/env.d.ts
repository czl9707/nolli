interface Env {
  ASSETS: Fetcher
  DATABASE_URL: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  OAUTH_REDIRECT_URI: string
  IMAGES: R2Bucket
  IMAGE_STAGING: R2Bucket
  R2_PUBLIC_IMAGES_URL: string
  R2_PUBLIC_STAGING_URL: string
}
