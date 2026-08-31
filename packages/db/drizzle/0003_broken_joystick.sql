ALTER TABLE "message" ALTER COLUMN "mime_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "body_text" text;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "body_html" text;