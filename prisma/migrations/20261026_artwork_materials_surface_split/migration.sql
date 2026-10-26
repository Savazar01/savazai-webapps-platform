-- Non-destructive Artwork schema evolution: Materials + Surface split & Socials expansion
ALTER TABLE "artworks" ADD COLUMN IF NOT EXISTS "materials" TEXT;
ALTER TABLE "artworks" ADD COLUMN IF NOT EXISTS "surface" TEXT;

-- Safe Backfill: Copy existing medium values into materials where materials is NULL
UPDATE "artworks" SET "materials" = "medium" WHERE "materials" IS NULL AND "medium" IS NOT NULL;

-- Expand SystemSetting social links
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "tiktokUrl" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "customSocialLinks" JSONB;
