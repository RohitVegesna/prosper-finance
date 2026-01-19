CREATE TABLE "investments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar NOT NULL,
	"type" text NOT NULL,
	"platform" text NOT NULL,
	"country" text DEFAULT 'SWEDEN' NOT NULL,
	"currency" text DEFAULT 'SEK' NOT NULL,
	"initial_amount" numeric NOT NULL,
	"current_value" numeric NOT NULL,
	"shares" numeric,
	"purchase_date" date,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar NOT NULL,
	"provider" text NOT NULL,
	"policy_name" text NOT NULL,
	"policy_number" text,
	"policy_type" text NOT NULL,
	"country" text NOT NULL,
	"start_date" date NOT NULL,
	"maturity_date" date,
	"next_renewal_date" date,
	"last_premium_date" date,
	"premium" numeric,
	"premium_currency" text DEFAULT 'SEK',
	"premium_frequency" text,
	"nominee" text,
	"beneficiary_type" text,
	"paid_to" text,
	"renewal_status" text DEFAULT 'active',
	"notes" text,
	"document_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"domain" text,
	"subdomain" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_domain_unique" UNIQUE("domain"),
	CONSTRAINT "tenants_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"tenant_id" varchar,
	"role" text DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");