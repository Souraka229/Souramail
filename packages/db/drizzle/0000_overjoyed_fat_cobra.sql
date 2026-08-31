CREATE TYPE "public"."action_level" AS ENUM('safe', 'sensitive', 'dangerous');--> statement-breakpoint
CREATE TYPE "public"."delivery_event_type" AS ENUM('delivered', 'bounced', 'complaint', 'opened', 'clicked', 'failed');--> statement-breakpoint
CREATE TYPE "public"."dns_record_state" AS ENUM('missing', 'pending', 'verified');--> statement-breakpoint
CREATE TYPE "public"."dns_record_type" AS ENUM('MX', 'TXT', 'CNAME', 'A', 'AAAA');--> statement-breakpoint
CREATE TYPE "public"."domain_status" AS ENUM('pending', 'verifying', 'active', 'error');--> statement-breakpoint
CREATE TYPE "public"."mailbox_type" AS ENUM('mailbox', 'alias');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."message_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."outbound_status" AS ENUM('queued', 'sending', 'sent', 'delivered', 'bounced', 'failed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('free', 'pro', 'business');--> statement-breakpoint
CREATE TYPE "public"."suppression_reason" AS ENUM('bounce', 'complaint', 'manual');--> statement-breakpoint
CREATE TYPE "public"."usage_metric" AS ENUM('emails_sent', 'ai_actions', 'storage_bytes', 'api_calls');--> statement-breakpoint
CREATE TABLE "ai_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"nl_source" text NOT NULL,
	"compiled_graph" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"max_action_level" "action_level" DEFAULT 'safe' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"hash" text NOT NULL,
	"prefix" text NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" uuid NOT NULL,
	"filename" text,
	"content_type" text,
	"size_bytes" bigint DEFAULT 0 NOT NULL,
	"storage_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"resource" text,
	"approved_by" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automation_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rule_id" uuid,
	"message_id" uuid,
	"steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"outbound_job_id" uuid,
	"type" "delivery_event_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dns_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"type" "dns_record_type" NOT NULL,
	"name" text NOT NULL,
	"expected_value" text NOT NULL,
	"observed_value" text,
	"state" "dns_record_state" DEFAULT 'missing' NOT NULL,
	"auto_fixable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "domain_status" DEFAULT 'pending' NOT NULL,
	"dns_provider" text,
	"health_score" integer DEFAULT 0 NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"address" text NOT NULL,
	"type" "mailbox_type" DEFAULT 'mailbox' NOT NULL,
	"target_mailbox_id" uuid,
	"quota_bytes" bigint DEFAULT 1073741824 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"client_id" text NOT NULL,
	"granted_scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"thread_id" uuid,
	"direction" "message_direction" NOT NULL,
	"rfc_message_id" text,
	"folder" text DEFAULT 'inbox' NOT NULL,
	"from_addr" text NOT NULL,
	"to_addrs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"subject" text,
	"snippet" text,
	"mime_key" text NOT NULL,
	"size_bytes" bigint DEFAULT 0 NOT NULL,
	"spam_score" integer,
	"flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbound_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"message_id" uuid,
	"status" "outbound_status" DEFAULT 'queued' NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"idempotency_key" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"stripe_id" text,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_stripe_id_unique" UNIQUE("stripe_id")
);
--> statement-breakpoint
CREATE TABLE "suppression" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"address" text NOT NULL,
	"reason" "suppression_reason" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"subject" text,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_counter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"metric" "usage_metric" NOT NULL,
	"window" text NOT NULL,
	"value" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoint" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"url" text NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"secret" text NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" "plan" DEFAULT 'free' NOT NULL,
	"risk_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_rule" ADD CONSTRAINT "ai_rule_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_run" ADD CONSTRAINT "automation_run_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_run" ADD CONSTRAINT "automation_run_rule_id_ai_rule_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."ai_rule"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_run" ADD CONSTRAINT "automation_run_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_event" ADD CONSTRAINT "delivery_event_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_event" ADD CONSTRAINT "delivery_event_outbound_job_id_outbound_job_id_fk" FOREIGN KEY ("outbound_job_id") REFERENCES "public"."outbound_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dns_record" ADD CONSTRAINT "dns_record_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dns_record" ADD CONSTRAINT "dns_record_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailbox" ADD CONSTRAINT "mailbox_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mailbox" ADD CONSTRAINT "mailbox_domain_id_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_connection" ADD CONSTRAINT "mcp_connection_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_mailbox_id_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_job" ADD CONSTRAINT "outbound_job_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbound_job" ADD CONSTRAINT "outbound_job_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppression" ADD CONSTRAINT "suppression_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_mailbox_id_mailbox_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailbox"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counter" ADD CONSTRAINT "usage_counter_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoint" ADD CONSTRAINT "webhook_endpoint_tenant_id_workspace_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_event_name_at_idx" ON "analytics_event" USING btree ("name","at");--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_hash_uq" ON "api_key" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "api_key_prefix_idx" ON "api_key" USING btree ("prefix");--> statement-breakpoint
CREATE INDEX "audit_log_tenant_at_idx" ON "audit_log" USING btree ("tenant_id","at");--> statement-breakpoint
CREATE INDEX "automation_run_rule_idx" ON "automation_run" USING btree ("rule_id");--> statement-breakpoint
CREATE INDEX "delivery_event_job_idx" ON "delivery_event" USING btree ("outbound_job_id");--> statement-breakpoint
CREATE INDEX "dns_record_domain_idx" ON "dns_record" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "domain_name_uq" ON "domain" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "mailbox_address_uq" ON "mailbox" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_tenant_user_uq" ON "membership" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "message_mailbox_folder_idx" ON "message" USING btree ("mailbox_id","folder","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "message_rfcid_mailbox_uq" ON "message" USING btree ("rfc_message_id","mailbox_id");--> statement-breakpoint
CREATE INDEX "outbound_job_status_idx" ON "outbound_job" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "outbound_job_idem_uq" ON "outbound_job" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "suppression_tenant_addr_uq" ON "suppression" USING btree ("tenant_id","address");--> statement-breakpoint
CREATE INDEX "thread_mailbox_last_idx" ON "thread" USING btree ("mailbox_id","last_at");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_counter_uq" ON "usage_counter" USING btree ("tenant_id","metric","window");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");