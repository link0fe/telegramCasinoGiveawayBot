CREATE TABLE `casino_imports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` text NOT NULL,
	`file_name` text,
	`total_rows` integer DEFAULT 0 NOT NULL,
	`imported_rows` integer DEFAULT 0 NOT NULL,
	`skipped_rows` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	`uploaded_by_user_id` integer,
	`error_message` text,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `casino_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`affiliate_id` text NOT NULL,
	`affiliate_name` text DEFAULT '' NOT NULL,
	`first_deposit_count` integer DEFAULT 0 NOT NULL,
	`first_deposit_amount` real DEFAULT 0 NOT NULL,
	`imported_at` integer NOT NULL,
	`registration_date` text,
	`first_deposit_date` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `casino_players_player_id_unique` ON `casino_players` (`player_id`);--> statement-breakpoint
CREATE TABLE `giveaways` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`partner_id` integer NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`winners_count` integer NOT NULL,
	`prize_amount` real NOT NULL,
	`currency` text DEFAULT 'RUB' NOT NULL,
	`require_affiliate` integer DEFAULT true NOT NULL,
	`require_first_deposit` integer DEFAULT false NOT NULL,
	`min_first_deposit_amount` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`require_channel_subscription` integer DEFAULT false NOT NULL,
	`channel_username` text,
	FOREIGN KEY (`partner_id`) REFERENCES `partners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`giveaway_id` integer NOT NULL,
	`telegram_user_id` text NOT NULL,
	`casino_player_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`giveaway_id`) REFERENCES `giveaways`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participants_giveaway_telegram_unique` ON `participants` (`giveaway_id`,`telegram_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `participants_giveaway_player_unique` ON `participants` (`giveaway_id`,`casino_player_id`);--> statement-breakpoint
CREATE TABLE `partners` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`affiliate_id` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_user_id_unique` ON `partners` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `partners_affiliate_id_unique` ON `partners` (`affiliate_id`);--> statement-breakpoint
CREATE TABLE `player_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`casino_player_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`casino_player_id`) REFERENCES `casino_players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `player_accounts_user_id_unique` ON `player_accounts` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `player_accounts_casino_player_id_unique` ON `player_accounts` (`casino_player_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` text NOT NULL,
	`username` text,
	`first_name` text,
	`role` text DEFAULT 'PLAYER' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);--> statement-breakpoint
CREATE TABLE `vouchers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'RUB' NOT NULL,
	`is_used` integer DEFAULT false NOT NULL,
	`winner_id` integer,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`winner_id`) REFERENCES `winners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vouchers_code_unique` ON `vouchers` (`code`);--> statement-breakpoint
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