ALTER TABLE `giveaways` ADD `require_channel_subscription` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `giveaways` ADD `channel_username` text;