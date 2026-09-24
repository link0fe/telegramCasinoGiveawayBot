CREATE TABLE `vouchers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`is_used` integer DEFAULT false NOT NULL,
	`winner_id` integer,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`winner_id`) REFERENCES `winners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vouchers_code_unique` ON `vouchers` (`code`);