-- =====================================================
-- TRAMPAY - Adicionar Tabelas Faltantes
-- Execute este SQL no AlwaysData (phpMyAdmin)
-- Database: trampay_tcc
-- =====================================================
-- IMPORTANTE: Este SQL é SEGURO - apenas ADICIONA tabelas
-- que não existem. NÃO modifica tabelas existentes!
-- =====================================================

USE `trampay_tcc`;

-- 1. TABELA DE AGENDAMENTOS (schedules)
-- Necessária para: SchedulingController
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED DEFAULT NULL,
  `service_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `scheduled_date` datetime NOT NULL,
  `duration_minutes` int DEFAULT 60,
  `price` decimal(13,2) DEFAULT 0.00,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner_user_id`),
  KEY `idx_client` (`client_id`),
  KEY `idx_service` (`service_id`),
  KEY `idx_scheduled_date` (`scheduled_date`),
  CONSTRAINT `fk_schedules_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_schedules_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_schedules_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. TABELA DE CHATS DE IA (ai_chats)
-- Necessária para: AiController
CREATE TABLE IF NOT EXISTS `ai_chats` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) DEFAULT 'Chat IA',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_ai_chats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. TABELA DE MENSAGENS DE IA (ai_messages)
-- Necessária para: AiController
CREATE TABLE IF NOT EXISTS `ai_messages` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `chat_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `role` enum('user','assistant','system') NOT NULL DEFAULT 'user',
  `content` text NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_chat_id` (`chat_id`),
  CONSTRAINT `fk_ai_messages_chat` FOREIGN KEY (`chat_id`) REFERENCES `ai_chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. TABELA DE RESET DE SENHA (password_resets)
-- Necessária para: AuthResetController
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `token` varchar(255) NOT NULL UNIQUE,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. TABELA DE EVENTOS/CALENDÁRIO (events)
-- Para funcionalidade futura de calendário
CREATE TABLE IF NOT EXISTS `events` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `client_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `event_time` time DEFAULT NULL,
  `type` enum('meeting','payment','deadline','appointment','reminder','other') DEFAULT 'other',
  `priority` enum('low','medium','high') DEFAULT 'medium',
  `location` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL,
  `recurring` tinyint(1) DEFAULT 0,
  `frequency` enum('none','daily','weekly','monthly','yearly') DEFAULT 'none',
  `reminder_minutes` int DEFAULT 15,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner_user_id`),
  KEY `idx_client` (`client_id`),
  KEY `idx_event_date` (`event_date`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_events_user` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_events_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- FIM - Tabelas adicionadas com sucesso!
-- =====================================================
-- RESUMO:
-- ✅ schedules - Para agendamentos de serviços
-- ✅ ai_chats - Para conversas com IA (PRO)
-- ✅ ai_messages - Para mensagens da IA (PRO)
-- ✅ password_resets - Para recuperação de senha
-- ✅ events - Para calendário de eventos
-- =====================================================
