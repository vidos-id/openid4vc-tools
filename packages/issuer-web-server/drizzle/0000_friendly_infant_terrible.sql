CREATE TABLE `access_token` (
	`id` text PRIMARY KEY NOT NULL,
	`issuance_id` text NOT NULL,
	`access_token` text NOT NULL,
	`credential_configuration_id` text NOT NULL,
	`claims_json` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`issuance_id`) REFERENCES `issuance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_token_access_token_unique` ON `access_token` (`access_token`);--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_account_user_id` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `credential_template` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`credential_configuration_id` text NOT NULL,
	`vct` text NOT NULL,
	`default_claims_json` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credential_template_credential_configuration_id_unique` ON `credential_template` (`credential_configuration_id`);--> statement-breakpoint
CREATE INDEX `idx_template_owner` ON `credential_template` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `issuance` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`template_id` text NOT NULL,
	`credential_configuration_id` text NOT NULL,
	`vct` text NOT NULL,
	`claims_json` text NOT NULL,
	`state` text NOT NULL,
	`status_value` integer NOT NULL,
	`offer_uri` text NOT NULL,
	`pre_authorized_code` text NOT NULL,
	`access_token` text,
	`credential` text,
	`status_list_id` text NOT NULL,
	`status_list_index` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `credential_template`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`status_list_id`) REFERENCES `status_list`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `issuance_pre_authorized_code_unique` ON `issuance` (`pre_authorized_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `issuance_access_token_unique` ON `issuance` (`access_token`);--> statement-breakpoint
CREATE INDEX `idx_issuance_owner` ON `issuance` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `idx_issuance_template` ON `issuance` (`template_id`);--> statement-breakpoint
CREATE TABLE `issuer_config` (
	`id` text PRIMARY KEY NOT NULL,
	`issuer_url` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `issuer_signing_key` (
	`id` text PRIMARY KEY NOT NULL,
	`alg` text NOT NULL,
	`private_jwk_json` text NOT NULL,
	`public_jwk_json` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `nonce` (
	`id` text PRIMARY KEY NOT NULL,
	`issuance_id` text NOT NULL,
	`c_nonce` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`issuance_id`) REFERENCES `issuance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nonce_c_nonce_unique` ON `nonce` (`c_nonce`);--> statement-breakpoint
CREATE TABLE `pre_authorized_grant` (
	`id` text PRIMARY KEY NOT NULL,
	`issuance_id` text NOT NULL,
	`pre_authorized_code` text NOT NULL,
	`credential_configuration_id` text NOT NULL,
	`claims_json` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`issuance_id`) REFERENCES `issuance`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pre_authorized_grant_pre_authorized_code_unique` ON `pre_authorized_grant` (`pre_authorized_code`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `idx_session_user_id` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `status_list` (
	`id` text PRIMARY KEY NOT NULL,
	`uri` text NOT NULL,
	`bits` integer NOT NULL,
	`statuses_json` text NOT NULL,
	`ttl` integer,
	`expires_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `status_list_uri_unique` ON `status_list` (`uri`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`username` text,
	`display_username` text,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_verification_identifier` ON `verification` (`identifier`);