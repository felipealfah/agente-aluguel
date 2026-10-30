CREATE TABLE `agent_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer,
	`status` text DEFAULT 'running' NOT NULL,
	`filters` text,
	`listings_found` integer DEFAULT 0 NOT NULL,
	`listings_new` integer DEFAULT 0 NOT NULL,
	`error` text,
	`started_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`finished_at` text,
	FOREIGN KEY (`profile_id`) REFERENCES `search_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`profile_id` integer,
	`agent_run_id` integer,
	`source` text NOT NULL,
	`external_id` text,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text,
	`subtype` text,
	`address` text,
	`region` text,
	`city` text,
	`state` text,
	`latitude` real,
	`longitude` real,
	`rent` real NOT NULL,
	`condo_fee` real,
	`iptu` real,
	`total_cost` real,
	`bedrooms` integer,
	`bathrooms` integer,
	`parking` integer,
	`area` real,
	`images` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'novo' NOT NULL,
	`score` real,
	`agent_notes` text,
	`found_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `search_profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agent_run_id`) REFERENCES `agent_runs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_url_unique` ON `listings` (`url`);--> statement-breakpoint
CREATE INDEX `listings_profile_idx` ON `listings` (`profile_id`);--> statement-breakpoint
CREATE INDEX `listings_status_idx` ON `listings` (`status`);--> statement-breakpoint
CREATE INDEX `listings_total_cost_idx` ON `listings` (`total_cost`);--> statement-breakpoint
CREATE TABLE `search_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`state` text NOT NULL,
	`city` text NOT NULL,
	`regions` text DEFAULT '[]' NOT NULL,
	`categories` text DEFAULT '[]' NOT NULL,
	`subtypes` text DEFAULT '[]' NOT NULL,
	`price_min` real,
	`price_max` real,
	`include_condo_fee` integer DEFAULT false NOT NULL,
	`iptu_min` real,
	`iptu_max` real,
	`monthly_income` real,
	`bedrooms` text DEFAULT '[]' NOT NULL,
	`bathrooms` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
