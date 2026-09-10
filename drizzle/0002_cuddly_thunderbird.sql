CREATE TABLE `casino_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_id` text NOT NULL,
	`affiliate_id` text NOT NULL,
	`affiliate_name` text DEFAULT '' NOT NULL,
	`first_deposit_count` integer DEFAULT 0 NOT NULL,
	`first_deposit_amount` real DEFAULT 0 NOT NULL,
	`imported_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `casino_players_player_id_unique` ON `casino_players` (`player_id`);