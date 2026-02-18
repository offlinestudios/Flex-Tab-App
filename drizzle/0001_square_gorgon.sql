ALTER TABLE "set_logs" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "set_logs" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "set_logs" ADD COLUMN "distance" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "set_logs" ADD COLUMN "distanceUnit" varchar(10);--> statement-breakpoint
ALTER TABLE "set_logs" ADD COLUMN "calories" integer;