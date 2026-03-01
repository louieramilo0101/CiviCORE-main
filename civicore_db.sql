-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for civicore_db
CREATE DATABASE IF NOT EXISTS `civicore_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `civicore_db`;

-- Dumping structure for table civicore_db.barangays
CREATE TABLE IF NOT EXISTS `barangays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `population` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table civicore_db.barangays: ~0 rows (approximately)

-- Dumping structure for table civicore_db.documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `date` varchar(50) NOT NULL,
  `size` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `previewData` text,
  `personName` varchar(255) DEFAULT NULL,
  `barangay` varchar(255) DEFAULT NULL,
  `metadata` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table civicore_db.documents: ~0 rows (approximately)

-- Dumping structure for table civicore_db.issuances
CREATE TABLE IF NOT EXISTS `issuances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `certNumber` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `barangay` varchar(255) NOT NULL,
  `issuanceDate` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table civicore_db.issuances: ~5 rows (approximately)
INSERT INTO `issuances` (`id`, `certNumber`, `type`, `name`, `barangay`, `issuanceDate`, `status`, `created_at`) VALUES
	(1, 'BC-2026-001', 'birth', 'Juan Dela Cruz', 'Bagong Karsada', '2026-01-15', 'Issued', '2026-02-15 17:16:49'),
	(2, 'BC-2026-002', 'birth', 'Maria Santos', 'Balsahan', '2026-01-15', 'Issued', '2026-02-15 17:16:49'),
	(3, 'DC-2026-001', 'death', 'Jose Reyes', 'Halang', '2026-01-15', 'Issued', '2026-02-15 17:16:49'),
	(4, 'ML-2026-001', 'marriage_license', 'Pedro & Rosa', 'Bancaan', '2026-01-15', 'Issued', '2026-02-15 17:16:49'),
	(5, 'BC-2026-003', 'birth', 'Anna Santos', 'Capt. C. Nazareno (Pob.)', '2026-01-15', 'Pending', '2026-02-15 17:16:49');

-- Dumping structure for table civicore_db.templates
CREATE TABLE IF NOT EXISTS `templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table civicore_db.templates: ~5 rows (approximately)
INSERT INTO `templates` (`id`, `type`, `content`, `created_at`, `updated_at`) VALUES
	(1, 'birth', 'Birth Certificate Template - [PLACEHOLDER]\nChild Name: _______________\nDate of Birth: _______________', '2026-02-15 17:16:49', '2026-02-15 17:16:49'),
	(2, 'death', 'Death Certificate Template - [PLACEHOLDER]\nDecedent Name: _______________\nDate of Death: _______________', '2026-02-15 17:16:49', '2026-02-15 17:16:49'),
	(3, 'marriage_license', 'Marriage License Template - [PLACEHOLDER]\nGroom: _______________\nBride: _______________', '2026-02-15 17:16:49', '2026-02-15 17:16:49'),
	(4, 'consentForm', 'Parental Consent Form for Marriage (Ages 18-20)\nI/We, the undersigned, do hereby give consent...', '2026-02-15 17:16:49', '2026-02-15 17:16:49'),
	(5, 'adviceForm', 'Marital Advice Form (Ages 21+)\nAdvice on marriage and family responsibilities...', '2026-02-15 17:16:49', '2026-02-15 17:16:49');

-- Dumping structure for table civicore_db.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('Super Admin','Admin','User') DEFAULT NULL,
  `permissions` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table civicore_db.users: ~3 rows (approximately)
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `permissions`) VALUES
	(1, 'John Admin', 'admin@civicOre.com', 'password123', 'Super Admin', '["View Dashboard", "Upload Documents", "Manage Users", "Edit Permissions", "Mapping Analytics", "View Issuance"]'),
	(2, 'Louie Dave Ramilo', 'louiedaveramilo@gmail.com', '1234', 'Super Admin', '["View Dashboard", "Upload Documents", "Manage Users", "Edit Permissions", "Mapping Analytics"]'),
	(9, 'Louie 1', 'louie1@gmail.com', '1234567', 'Admin', '["View Dashboard", "Upload Documents", "Mapping Analytics", "View Reports"]');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
