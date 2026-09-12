CREATE TYPE "public"."geography_type" AS ENUM('nation', 'state', 'county', 'metro', 'city', 'zip');--> statement-breakpoint
CREATE TYPE "public"."ingest_status" AS ENUM('running', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."page_state" AS ENUM('DRAFT', 'QUALITY_CHECK', 'PUBLISHED', 'MONITORING', 'RETAIN', 'REFRESH', 'MERGE', 'RETIRE');--> statement-breakpoint
CREATE TYPE "public"."validation_status" AS ENUM('pending', 'validated', 'failed');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_artifacts" (
	"dataset_version_id" text NOT NULL,
	"name" text NOT NULL,
	"source_url" text NOT NULL,
	"checksum" text NOT NULL,
	"bytes" bigint NOT NULL,
	CONSTRAINT "dataset_artifacts_dataset_version_id_name_pk" PRIMARY KEY("dataset_version_id","name"),
	CONSTRAINT "dataset_artifacts_checksum_format" CHECK ("dataset_artifacts"."checksum" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "dataset_artifacts_byte_size" CHECK ("dataset_artifacts"."bytes" > 0 AND "dataset_artifacts"."bytes" <= 9007199254740991),
	CONSTRAINT "dataset_artifacts_https_source" CHECK ("dataset_artifacts"."source_url" LIKE 'https://%')
);
--> statement-breakpoint
CREATE TABLE "dataset_ingest_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dataset_key" text NOT NULL,
	"status" "ingest_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"dataset_version_id" text,
	"error_code" text,
	"validation_summary" jsonb,
	CONSTRAINT "dataset_ingest_runs_terminal_time" CHECK (("dataset_ingest_runs"."status" = 'running' AND "dataset_ingest_runs"."finished_at" IS NULL) OR ("dataset_ingest_runs"."status" <> 'running' AND "dataset_ingest_runs"."finished_at" IS NOT NULL AND "dataset_ingest_runs"."finished_at" >= "dataset_ingest_runs"."started_at")),
	CONSTRAINT "dataset_ingest_runs_success_version" CHECK ("dataset_ingest_runs"."status" <> 'succeeded' OR "dataset_ingest_runs"."dataset_version_id" IS NOT NULL),
	CONSTRAINT "dataset_ingest_runs_failed_code" CHECK ("dataset_ingest_runs"."status" <> 'failed' OR "dataset_ingest_runs"."error_code" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "dataset_publications" (
	"dataset_key" text PRIMARY KEY NOT NULL,
	"last_good_version_id" text NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"dataset_key" text NOT NULL,
	"source_name" text NOT NULL,
	"source_url" text NOT NULL,
	"year" integer NOT NULL,
	"survey_year" integer NOT NULL,
	"universe" text NOT NULL,
	"population_label" text NOT NULL,
	"retrieved_at" timestamp with time zone NOT NULL,
	"transformation_version" text NOT NULL,
	"refresh_cadence" text NOT NULL,
	"validation_status" "validation_status" DEFAULT 'pending' NOT NULL,
	"checksum" text NOT NULL,
	"row_count" integer NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "dataset_versions_content_key" UNIQUE("dataset_key","year","transformation_version","checksum"),
	CONSTRAINT "dataset_versions_id_dataset_key" UNIQUE("id","dataset_key"),
	CONSTRAINT "dataset_versions_year_range" CHECK ("dataset_versions"."year" BETWEEN 1900 AND 2100 AND "dataset_versions"."survey_year" BETWEEN 1900 AND 2100),
	CONSTRAINT "dataset_versions_checksum_format" CHECK ("dataset_versions"."checksum" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "dataset_versions_row_count_positive" CHECK ("dataset_versions"."row_count" > 0),
	CONSTRAINT "dataset_versions_https_source" CHECK ("dataset_versions"."source_url" LIKE 'https://%')
);
--> statement-breakpoint
CREATE TABLE "derived_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"entity_key" text NOT NULL,
	"source_dataset_version" text NOT NULL,
	"transformation_version" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"facts" jsonb NOT NULL,
	CONSTRAINT "derived_records_reproducible_key" UNIQUE("kind","entity_key","source_dataset_version","transformation_version")
);
--> statement-breakpoint
CREATE TABLE "geographies" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "geography_type" NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" text,
	CONSTRAINT "geographies_type_code_key" UNIQUE("type","code"),
	CONSTRAINT "geographies_no_self_parent" CHECK ("geographies"."parent_id" IS NULL OR "geographies"."parent_id" <> "geographies"."id"),
	CONSTRAINT "geographies_nonempty" CHECK (length("geographies"."code") > 0 AND length("geographies"."name") > 0 AND length("geographies"."slug") > 0)
);
--> statement-breakpoint
CREATE TABLE "income_brackets" (
	"distribution_id" text NOT NULL,
	"ordinal" integer NOT NULL,
	"lower_bound" bigint,
	"upper_bound" bigint,
	"count" bigint NOT NULL,
	"label" text NOT NULL,
	CONSTRAINT "income_brackets_distribution_id_ordinal_pk" PRIMARY KEY("distribution_id","ordinal"),
	CONSTRAINT "income_brackets_ordinal_nonnegative" CHECK ("income_brackets"."ordinal" >= 0),
	CONSTRAINT "income_brackets_count_nonnegative" CHECK ("income_brackets"."count" >= 0 AND "income_brackets"."count" <= 9007199254740991),
	CONSTRAINT "income_brackets_valid_bounds" CHECK (("income_brackets"."lower_bound" IS NOT NULL OR "income_brackets"."upper_bound" IS NOT NULL) AND ("income_brackets"."lower_bound" IS NULL OR "income_brackets"."upper_bound" IS NULL OR "income_brackets"."lower_bound" < "income_brackets"."upper_bound"))
);
--> statement-breakpoint
CREATE TABLE "income_distributions" (
	"id" text PRIMARY KEY NOT NULL,
	"geography_id" text NOT NULL,
	"source_dataset_version" text NOT NULL,
	"transformation_version" text NOT NULL,
	"generated_at" timestamp with time zone NOT NULL,
	"universe" text NOT NULL,
	"population_label" text NOT NULL,
	"measure" text NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"total" bigint NOT NULL,
	"source_reported_total" bigint NOT NULL,
	"assumptions" jsonb NOT NULL,
	CONSTRAINT "income_distributions_entity_version_key" UNIQUE("geography_id","universe","measure","source_dataset_version"),
	CONSTRAINT "income_distributions_total_positive" CHECK ("income_distributions"."total" > 0 AND "income_distributions"."total" <= 9007199254740991),
	CONSTRAINT "income_distributions_source_reconciliation" CHECK ("income_distributions"."source_reported_total" > 0 AND "income_distributions"."source_reported_total" <= 9007199254740991 AND abs("income_distributions"."total" - "income_distributions"."source_reported_total")::numeric / "income_distributions"."source_reported_total" <= 0.005),
	CONSTRAINT "income_distributions_currency" CHECK ("income_distributions"."currency" = 'USD')
);
--> statement-breakpoint
CREATE TABLE "occupations" (
	"id" text PRIMARY KEY NOT NULL,
	"soc_code" text NOT NULL,
	"soc_version" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "occupations_soc_code_unique" UNIQUE("soc_code"),
	CONSTRAINT "occupations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "occupations_soc_format" CHECK ("occupations"."soc_code" ~ '^[0-9]{2}-[0-9]{4}$')
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"encrypted_payload" text NOT NULL,
	"encryption_key_version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "programmatic_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical_path" text NOT NULL,
	"entity_key" text NOT NULL,
	"template" text NOT NULL,
	"state" "page_state" DEFAULT 'DRAFT' NOT NULL,
	"source_dataset_version" text NOT NULL,
	"transformation_version" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fact_object" jsonb NOT NULL,
	"quality_score" integer,
	"quality_threshold" integer DEFAULT 85 NOT NULL,
	"quality_checked_at" timestamp with time zone,
	"approval_batch_id" uuid,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	CONSTRAINT "programmatic_pages_canonical_path_unique" UNIQUE("canonical_path"),
	CONSTRAINT "programmatic_pages_entity_template_key" UNIQUE("entity_key","template"),
	CONSTRAINT "programmatic_pages_local_path" CHECK ("programmatic_pages"."canonical_path" ~ '^/[^?#]*$' AND "programmatic_pages"."canonical_path" NOT LIKE '//%'),
	CONSTRAINT "programmatic_pages_score_range" CHECK (("programmatic_pages"."quality_score" IS NULL OR "programmatic_pages"."quality_score" BETWEEN 0 AND 100) AND "programmatic_pages"."quality_threshold" BETWEEN 1 AND 100),
	CONSTRAINT "programmatic_pages_publish_approved" CHECK ("programmatic_pages"."state" NOT IN ('PUBLISHED', 'MONITORING', 'RETAIN', 'REFRESH') OR ("programmatic_pages"."approved_by" IS NOT NULL AND length("programmatic_pages"."approved_by") > 0 AND "programmatic_pages"."approved_at" IS NOT NULL AND "programmatic_pages"."approval_batch_id" IS NOT NULL AND "programmatic_pages"."published_at" IS NOT NULL AND "programmatic_pages"."quality_checked_at" IS NOT NULL AND "programmatic_pages"."quality_score" IS NOT NULL AND "programmatic_pages"."quality_score" >= "programmatic_pages"."quality_threshold" AND "programmatic_pages"."approved_at" >= "programmatic_pages"."quality_checked_at" AND "programmatic_pages"."published_at" >= "programmatic_pages"."approved_at"))
);
--> statement-breakpoint
CREATE TABLE "redirect_registry" (
	"source_path" text PRIMARY KEY NOT NULL,
	"status_code" integer NOT NULL,
	"destination_path" text,
	"reason" text NOT NULL,
	"evidence" text NOT NULL,
	"approved_by" text NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	CONSTRAINT "redirect_registry_disposition" CHECK (("redirect_registry"."status_code" = 301 AND "redirect_registry"."destination_path" IS NOT NULL AND "redirect_registry"."destination_path" <> "redirect_registry"."source_path") OR ("redirect_registry"."status_code" = 410 AND "redirect_registry"."destination_path" IS NULL)),
	CONSTRAINT "redirect_registry_local_paths" CHECK ("redirect_registry"."source_path" ~ '^/[^?#]*$' AND "redirect_registry"."source_path" NOT LIKE '//%' AND ("redirect_registry"."destination_path" IS NULL OR ("redirect_registry"."destination_path" ~ '^/[^?#]*$' AND "redirect_registry"."destination_path" NOT LIKE '//%')))
);
--> statement-breakpoint
CREATE TABLE "saved_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"calculator_id" text NOT NULL,
	"encrypted_payload" text NOT NULL,
	"encryption_key_version" text NOT NULL,
	"dataset_versions" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "saved_scenarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_subject_unique" UNIQUE("auth_subject")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dataset_artifacts" ADD CONSTRAINT "dataset_artifacts_dataset_version_id_dataset_versions_id_fk" FOREIGN KEY ("dataset_version_id") REFERENCES "public"."dataset_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_ingest_runs" ADD CONSTRAINT "dataset_ingest_runs_dataset_version_id_dataset_versions_id_fk" FOREIGN KEY ("dataset_version_id") REFERENCES "public"."dataset_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_publications" ADD CONSTRAINT "dataset_publications_version_key_fk" FOREIGN KEY ("last_good_version_id","dataset_key") REFERENCES "public"."dataset_versions"("id","dataset_key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "derived_records" ADD CONSTRAINT "derived_records_source_dataset_version_dataset_versions_id_fk" FOREIGN KEY ("source_dataset_version") REFERENCES "public"."dataset_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geographies" ADD CONSTRAINT "geographies_parent_id_geographies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."geographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_brackets" ADD CONSTRAINT "income_brackets_distribution_id_income_distributions_id_fk" FOREIGN KEY ("distribution_id") REFERENCES "public"."income_distributions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_distributions" ADD CONSTRAINT "income_distributions_geography_id_geographies_id_fk" FOREIGN KEY ("geography_id") REFERENCES "public"."geographies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_distributions" ADD CONSTRAINT "income_distributions_source_dataset_version_dataset_versions_id_fk" FOREIGN KEY ("source_dataset_version") REFERENCES "public"."dataset_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programmatic_pages" ADD CONSTRAINT "programmatic_pages_source_dataset_version_dataset_versions_id_fk" FOREIGN KEY ("source_dataset_version") REFERENCES "public"."dataset_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_scenarios" ADD CONSTRAINT "saved_scenarios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id","occurred_at");--> statement-breakpoint
CREATE INDEX "dataset_ingest_runs_key_started_idx" ON "dataset_ingest_runs" USING btree ("dataset_key","started_at");--> statement-breakpoint
CREATE INDEX "geographies_parent_idx" ON "geographies" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "programmatic_pages_state_idx" ON "programmatic_pages" USING btree ("state");--> statement-breakpoint
CREATE INDEX "saved_scenarios_owner_idx" ON "saved_scenarios" USING btree ("user_id");