CREATE TABLE `winners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`giveaway_id` integer NOT NULL,
	`participant_id` integer NOT NULL,
	`place` integer NOT NULL,
	`prize_amount` real NOT NULL,
	`currency` text NOT NULL,
	`voucher_code` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`giveaway_id`) REFERENCES `giveaways`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `winners_voucher_code_unique` ON `winners` (`voucher_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `winners_giveaway_place_unique` ON `winners` (`giveaway_id`,`place`);--> statement-breakpoint
CREATE UNIQUE INDEX `winners_giveaway_participant_unique` ON `winners` (`giveaway_id`,`participant_id`);