CREATE TABLE `work_page_content` (
	`slug` text PRIMARY KEY NOT NULL,
	`content` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
