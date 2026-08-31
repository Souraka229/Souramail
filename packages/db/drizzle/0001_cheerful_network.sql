-- Better Auth >=1.7: account identity is scoped by issuer.
-- Add nullable, backfill existing rows from provider_id, then enforce NOT NULL,
-- so this is safe whether or not the account table already has rows.
ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
UPDATE "account" SET "issuer" = "provider_id" WHERE "issuer" IS NULL;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uq" ON "account" USING btree ("issuer","account_id");
