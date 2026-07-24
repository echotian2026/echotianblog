CREATE TABLE `fitness_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`practiced_on` text NOT NULL,
	`session_number` integer NOT NULL,
	`rounds_completed` integer DEFAULT 0 NOT NULL,
	`duration_seconds` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
