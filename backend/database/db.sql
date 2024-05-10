-- phpMyAdmin SQL Dump
-- version 4.6.6deb5ubuntu0.5
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 10, 2024 at 16:20 PM
-- Server version: 5.7.42-0ubuntu0.18.04.1
-- PHP Version: 7.2.24-0ubuntu0.18.04.17
SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

SET
  time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;

/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;

/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hospital_booking`
--
-- --------------------------------------------------------
--
-- Table structure for table `admins`
--
CREATE TABLE
  `admins` (
    `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `phone` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `password_hash` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
    `password_recover_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` double NOT NULL,
    `updated_at` double NOT NULL DEFAULT '0',
    `profile_photo` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

--
-- Indexes for table `admins`
--
ALTER TABLE `admins` 
ADD UNIQUE KEY `id` (`id`),
ADD UNIQUE KEY `email` (`email`),
ADD KEY `created_at` (`created_at`) USING BTREE,
ADD KEY `updated_at` (`updated_at`) USING BTREE;

-- --------------------------------------------------------
--
-- Table structure for table 'doctors'
--
CREATE TABLE
  `doctors` (
    `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `phone` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `password_hash` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `signup_request_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `password_recover_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `certificate_file` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `identity_file` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` double NOT NULL,
    `updated_at` double NOT NULL DEFAULT '0',
    `profile_photo` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `registration_status` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors` 
ADD UNIQUE KEY `id` (`id`),
ADD UNIQUE KEY `email` (`email`),
ADD KEY `created_at` (`created_at`) USING BTREE,
ADD KEY `updated_at` (`updated_at`) USING BTREE;

-- --------------------------------------------------------
--
-- Table structure for table `departments`
--
CREATE TABLE
  `departments` (
    `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT '',
    `leader_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` double NOT NULL,
    `updated_at` double NOT NULL DEFAULT '0',
    `profile_photo` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

--
-- Indexes for table `departments`
--
ALTER TABLE `departments` 
ADD UNIQUE KEY `id` (`id`),
ADD KEY `type` (`type`) USING BTREE,
ADD KEY `leader_id` (`leader_id`) USING BTREE,
ADD KEY `created_at` (`created_at`) USING BTREE,
ADD KEY `updated_at` (`updated_at`) USING BTREE;

-- --------------------------------------------------------
--
-- Table structure for table 'patients'
--
CREATE TABLE
  `patients` (
    `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `phone` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `password_hash` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `password_recover_token` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `created_at` double NOT NULL,
    `updated_at` double NOT NULL DEFAULT '0',
    `profile_photo` mediumtext COLLATE utf8mb4_unicode_ci DEFAULT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

--
-- Indexes for table `patients`
--
ALTER TABLE `patients` 
ADD UNIQUE KEY `id` (`id`),
ADD UNIQUE KEY `email` (`email`),
ADD KEY `created_at` (`created_at`) USING BTREE,
ADD KEY `updated_at` (`updated_at`) USING BTREE;

-- --------------------------------------------------------
--
-- Table structure for table `appointments`
--
CREATE TABLE
  `appointments` (
    `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
    `department_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `doctor_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
    `patient_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` double NOT NULL,
    `updated_at` double NOT NULL DEFAULT '0',
    `appointed_at` double NOT NULL,
    `status` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
ADD KEY `id` (`id`),
ADD KEY `department_id` (`department_id`),
ADD KEY `doctor_id` (`doctor_id`),
ADD KEY `patient_id` (`patient_id`),
ADD KEY `created_at` (`created_at`) USING BTREE,
ADD KEY `updated_at` (`updated_at`) USING BTREE,
ADD KEY `appointed_at` (`appointed_at`) USING BTREE,
ADD KEY `status` (`status`);

-- --------------------------------------------------------
--
-- Table structure for table `department_doctors`
--
CREATE TABLE
  `department_doctors` (
    `department_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `doctor_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
    `created_at` double NOT NULL
  ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

--
-- Indexes for table `department_doctors`
--
ALTER TABLE `department_doctors`
ADD KEY `department_id` (`department_id`),
ADD KEY `doctor_id` (`doctor_id`),
ADD KEY `created_at` (`created_at`) USING BTREE;

-- --------------------------------------------------------
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;