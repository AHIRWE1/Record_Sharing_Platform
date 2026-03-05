-- MySQL schema for Integrated Patient Record Sharing Platform
-- Tables: users, patients, medical_records, audit_logs

CREATE TABLE IF NOT EXISTS `users` (
	`user_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`username` VARCHAR(150) NOT NULL,
	`password` VARCHAR(255) NOT NULL,
	`role` ENUM('doctor','staff','admin') NOT NULL DEFAULT 'staff',
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`user_id`),
	UNIQUE KEY `ux_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `patients` (
	`patient_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(255) NOT NULL,
	`date_of_birth` DATE,
	`gender` VARCHAR(16),
	`national_id` VARCHAR(100),
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`patient_id`),
	UNIQUE KEY `ux_patients_national_id` (`national_id`),
	KEY `idx_patients_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `medical_records` (
	`record_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`patient_id` INT UNSIGNED NOT NULL,
	`diagnosis` TEXT,
	`treatment_plan` TEXT,
	`clinical_notes` TEXT,
	`created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`record_id`),
	KEY `idx_records_patient` (`patient_id`),
	KEY `idx_records_created_at` (`created_at`),
	CONSTRAINT `fk_records_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
	`log_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`user_id` INT UNSIGNED,
	`action` VARCHAR(255) NOT NULL,
	`details` JSON NULL,
	`timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`log_id`),
	KEY `idx_audit_user` (`user_id`),
	KEY `idx_audit_timestamp` (`timestamp`),
	CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Additional indexes can be added later for reporting/filters
