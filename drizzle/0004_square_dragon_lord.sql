PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_casino_players` (
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
INSERT INTO `__new_casino_players`("id", "player_id", "affiliate_id", "affiliate_name", "first_deposit_count", "first_deposit_amount", "imported_at", "registration_date", "first_deposit_date") SELECT "id", "player_id", "affiliate_id", "affiliate_name", "first_deposit_count", "first_deposit_amount", "imported_at", "registration_date", "first_deposit_date" FROM `casino_players`;--> statement-breakpoint
DROP TABLE `casino_players`;--> statement-breakpoint
ALTER TABLE `__new_casino_players` RENAME TO `casino_players`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `casino_players_player_id_unique` ON `casino_players` (`player_id`);