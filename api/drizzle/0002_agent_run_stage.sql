ALTER TABLE `agent_runs` ADD `stage` text;--> statement-breakpoint
ALTER TABLE `agent_runs` ADD `log` text DEFAULT '[]' NOT NULL;