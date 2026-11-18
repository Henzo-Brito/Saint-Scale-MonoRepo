-- ============================================================
-- SaintScale — Dump completo do banco de dados
-- Gerado em: 2026-11-17
-- ============================================================
--
-- COMO USAR NO phpMyAdmin:
--   1. Abra o phpMyAdmin (http://localhost/phpmyadmin)
--   2. Clique em "Novo" no menu lateral para criar um banco
--   3. Nome: saintscale_dev  |  Collation: utf8mb4_unicode_ci
--   4. Com o banco selecionado, vá em "Importar"
--   5. Escolha este arquivo e clique em "Executar"
--
-- ADMIN GERADO:
--   Login:  admin          (ou admin@admin.com)
--   Senha:  admin123
-- ============================================================

CREATE DATABASE IF NOT EXISTS `saintscale_dev`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `saintscale_dev`;

-- MySQL dump 10.13  Distrib 8.4.9, for Win64 (x86_64)
--
-- Host: localhost    Database: saintscale_dev
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cargos`
--

DROP TABLE IF EXISTS `cargos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cargos` (
  `id_cargo` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissoes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_cargo`),
  KEY `id_igreja_fk` (`id_igreja_fk`),
  CONSTRAINT `cargos_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargos`
--

LOCK TABLES `cargos` WRITE;
/*!40000 ALTER TABLE `cargos` DISABLE KEYS */;
INSERT INTO `cargos` VALUES (1,'Administrador','equipes,membros,aprovar,locais,musicas,escalas,ministerios,cargos,codigo',NULL,'2026-11-17 21:53:16'),(2,'L├¡der de minist├®rio','equipes,musicas,escalas,aprovar,codigo',1,'2026-11-17 21:53:16'),(3,'Membro',NULL,1,'2026-11-17 21:53:16');
/*!40000 ALTER TABLE `cargos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipes`
--

DROP TABLE IF EXISTS `equipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipes` (
  `id_equipes` int NOT NULL AUTO_INCREMENT,
  `img_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  PRIMARY KEY (`id_equipes`),
  KEY `id_igreja_fk` (`id_igreja_fk`),
  CONSTRAINT `equipes_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipes`
--

LOCK TABLES `equipes` WRITE;
/*!40000 ALTER TABLE `equipes` DISABLE KEYS */;
INSERT INTO `equipes` VALUES (1,'eq_001','Louvor',1),(2,'eq_002','M├¡dia',1);
/*!40000 ALTER TABLE `equipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipes_membros`
--

DROP TABLE IF EXISTS `equipes_membros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipes_membros` (
  `id_equipes_membros` int NOT NULL AUTO_INCREMENT,
  `id_membros_fk` int NOT NULL,
  `id_equipes_fk` int NOT NULL,
  PRIMARY KEY (`id_equipes_membros`),
  KEY `id_membros_fk` (`id_membros_fk`),
  KEY `id_equipes_fk` (`id_equipes_fk`),
  CONSTRAINT `equipes_membros_ibfk_1` FOREIGN KEY (`id_membros_fk`) REFERENCES `membros` (`id_membro`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `equipes_membros_ibfk_2` FOREIGN KEY (`id_equipes_fk`) REFERENCES `equipes` (`id_equipes`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipes_membros`
--

LOCK TABLES `equipes_membros` WRITE;
/*!40000 ALTER TABLE `equipes_membros` DISABLE KEYS */;
INSERT INTO `equipes_membros` VALUES (1,1,1),(2,2,1),(3,3,1),(4,2,2);
/*!40000 ALTER TABLE `equipes_membros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `escalas`
--

DROP TABLE IF EXISTS `escalas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escalas` (
  `id_escala` int NOT NULL AUTO_INCREMENT,
  `nome_escala` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data_hora` datetime NOT NULL,
  `descricao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `local` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  `data_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_escala`),
  KEY `idx_escalas_igreja` (`id_igreja_fk`),
  CONSTRAINT `escalas_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `escalas`
--

LOCK TABLES `escalas` WRITE;
/*!40000 ALTER TABLE `escalas` DISABLE KEYS */;
INSERT INTO `escalas` VALUES (1,'Mavi','2026-11-14 19:00:00','Culto de sexta',NULL,1,'2026-11-17 21:53:16'),(2,'Louvor Domingo','2026-11-16 09:00:00','Culto dominical',NULL,1,'2026-11-17 21:53:16'),(3,'Louvor Sexta','2026-12-05 19:00:00','Culto de sexta - dezembro',NULL,1,'2026-11-17 21:53:16'),(4,'Louvor Domingo','2026-12-07 09:00:00','Culto dominical',NULL,1,'2026-11-17 21:53:16'),(5,'Ensaio Geral Natal','2026-12-13 10:00:00','Ensaio preparat├│rio para o culto de natal',NULL,1,'2026-11-17 21:53:16'),(6,'Louvor Sexta','2026-12-19 19:00:00','├Ültima sexta antes do natal',NULL,1,'2026-11-17 21:53:16'),(7,'Culto de Natal','2026-12-24 19:00:00','Culto especial de natal',NULL,1,'2026-11-17 21:53:16'),(8,'Louvor Domingo','2026-12-28 09:00:00','├Ültimo culto dominical do ano',NULL,1,'2026-11-17 21:53:16');
/*!40000 ALTER TABLE `escalas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcoes`
--

DROP TABLE IF EXISTS `funcoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcoes` (
  `id_funcao` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissoes` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  PRIMARY KEY (`id_funcao`),
  KEY `id_igreja_fk` (`id_igreja_fk`),
  CONSTRAINT `funcoes_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcoes`
--

LOCK TABLES `funcoes` WRITE;
/*!40000 ALTER TABLE `funcoes` DISABLE KEYS */;
INSERT INTO `funcoes` VALUES (1,'guitarrista',NULL,1),(2,'baterista',NULL,1),(3,'baixista',NULL,1),(4,'tecladista',NULL,1),(5,'vocalista',NULL,1);
/*!40000 ALTER TABLE `funcoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `igrejas`
--

DROP TABLE IF EXISTS `igrejas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `igrejas` (
  `id_igreja` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `igrejas`
--

LOCK TABLES `igrejas` WRITE;
/*!40000 ALTER TABLE `igrejas` DISABLE KEYS */;
INSERT INTO `igrejas` VALUES (1,'Igreja Central','2026-11-17 21:53:16');
/*!40000 ALTER TABLE `igrejas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lembrete_funcoes`
--

DROP TABLE IF EXISTS `lembrete_funcoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lembrete_funcoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_lembrete_fk` int NOT NULL,
  `id_funcao_fk` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_lembrete_fk` (`id_lembrete_fk`),
  KEY `id_funcao_fk` (`id_funcao_fk`),
  CONSTRAINT `lembrete_funcoes_ibfk_1` FOREIGN KEY (`id_lembrete_fk`) REFERENCES `lembretes` (`id_lembrete`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `lembrete_funcoes_ibfk_2` FOREIGN KEY (`id_funcao_fk`) REFERENCES `funcoes` (`id_funcao`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lembrete_funcoes`
--

LOCK TABLES `lembrete_funcoes` WRITE;
/*!40000 ALTER TABLE `lembrete_funcoes` DISABLE KEYS */;
INSERT INTO `lembrete_funcoes` VALUES (1,1,1),(2,1,2),(3,2,5),(4,3,1),(5,3,2),(6,3,3),(7,3,4),(8,3,5),(9,4,1),(10,4,2),(11,4,3),(12,4,4),(13,4,5);
/*!40000 ALTER TABLE `lembrete_funcoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lembretes`
--

DROP TABLE IF EXISTS `lembretes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lembretes` (
  `id_lembrete` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` date NOT NULL,
  `tempo` time NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `id_igreja_fk` int DEFAULT NULL,
  `data_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_lembrete`),
  KEY `idx_lembretes_igreja` (`id_igreja_fk`),
  CONSTRAINT `lembretes_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lembretes`
--

LOCK TABLES `lembretes` WRITE;
/*!40000 ALTER TABLE `lembretes` DISABLE KEYS */;
INSERT INTO `lembretes` VALUES (1,'ALERTA Ensaio Geral','2026-12-02','10:20:00','Ensaio antes do culto de natal. Levar instrumentos.',1,'2026-11-17 21:53:16'),(2,'Reuni├úo de L├¡deres','2026-12-10','19:00:00','Pauta: planejamento do pr├│ximo semestre.',1,'2026-11-17 21:53:16'),(3,'Ensaio Extra Natal','2026-12-20','15:00:00','Ensaio extra para o culto de natal. Presen├ºa obrigat├│ria.',1,'2026-11-17 21:53:16'),(4,'Confraterniza├º├úo da Equipe','2026-12-22','18:00:00','Confraterniza├º├úo de fim de ano da equipe de louvor.',1,'2026-11-17 21:53:16');
/*!40000 ALTER TABLE `lembretes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logradouros`
--

DROP TABLE IF EXISTS `logradouros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logradouros` (
  `id_logradouro` int NOT NULL AUTO_INCREMENT,
  `rua` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` int NOT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  PRIMARY KEY (`id_logradouro`),
  UNIQUE KEY `uq_rua_numero` (`rua`(100),`numero`),
  KEY `id_igreja_fk` (`id_igreja_fk`),
  CONSTRAINT `logradouros_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logradouros`
--

LOCK TABLES `logradouros` WRITE;
/*!40000 ALTER TABLE `logradouros` DISABLE KEYS */;
INSERT INTO `logradouros` VALUES (1,'Rua das Flores',100,1),(2,'Avenida Central',200,1),(3,'Travessa da Paz',50,1),(4,'Rua Nova',99,NULL),(5,'Rua do Teste',42,NULL);
/*!40000 ALTER TABLE `logradouros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membros`
--

DROP TABLE IF EXISTS `membros`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membros` (
  `id_membro` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cargo` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'membro',
  `id_cargo_fk` int DEFAULT NULL,
  `data_nascimento` date DEFAULT NULL,
  `telefone` varchar(11) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_logradouro_fk` int DEFAULT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  `status` enum('pendente','aprovado','bloqueado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_membro`),
  UNIQUE KEY `uq_email` (`email`),
  UNIQUE KEY `membros_usuario_unique` (`usuario`),
  KEY `id_logradouro_fk` (`id_logradouro_fk`),
  KEY `idx_membros_igreja` (`id_igreja_fk`),
  KEY `idx_membros_cargo` (`id_cargo_fk`),
  CONSTRAINT `membros_ibfk_1` FOREIGN KEY (`id_logradouro_fk`) REFERENCES `logradouros` (`id_logradouro`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `membros_ibfk_2` FOREIGN KEY (`id_cargo_fk`) REFERENCES `cargos` (`id_cargo`),
  CONSTRAINT `membros_ibfk_3` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membros`
--

LOCK TABLES `membros` WRITE;
/*!40000 ALTER TABLE `membros` DISABLE KEYS */;
INSERT INTO `membros` VALUES (1,'Jo├úo Silva','joao@example.com',NULL,'$argon2id$v=19$m=65536,t=3,p=4$placeholder1','img_001','membro',NULL,NULL,NULL,1,1,'aprovado','2026-11-17 21:53:16'),(2,'Maria Souza','maria@example.com',NULL,'$argon2id$v=19$m=65536,t=3,p=4$placeholder2','img_002','lider',NULL,NULL,NULL,2,1,'aprovado','2026-11-17 21:53:16'),(3,'Carlos Lima','carlos@example.com',NULL,'$argon2id$v=19$m=65536,t=3,p=4$placeholder3','img_003','membro',NULL,NULL,NULL,3,1,'aprovado','2026-11-17 21:53:16'),(4,'Admin Teste','admin@saintscale.dev',NULL,'$argon2id$v=19$m=65536,p=4,t=3$0TyyPbQGkm44HVjmrwF5zQ$uxABVOnW2dczLw64yGKVEz79b/lmY/0oeqaA0Zrn5zc',NULL,'membro',1,'1993-07-15','11666666666',5,1,'aprovado','2026-11-17 21:56:42'),(5,'Admin2','admin2@saintscale.dev',NULL,'$argon2id$v=19$m=65536,p=4,t=3$O+rZLNMBeFwVz9MB4Q6lNQ$LRINzHtf+R9XBp/jhousEAz0MIMZ1BgtlWY1sLU/tYQ',NULL,'membro',NULL,'1990-01-15','11888888888',NULL,1,'pendente','2026-11-17 22:03:35'),(6,'Henzo','henzoca.2020@gmail.com',NULL,'$argon2id$v=19$m=65536,p=4,t=3$GS9m2R5On8R6cwEmmI7zvg$2TbwZ/jotzbzyyzisN8rsmW9bd0uYl/paXiOys92T0g',NULL,'membro',NULL,'2008-11-14','11987051565',NULL,1,'aprovado','2026-11-17 22:14:51'),(7,'Administrador','admin@admin.com','admin','$argon2id$v=19$m=65536,p=4,t=3$JCOll9LLL9125PXL+crufA$ezqi36N55l2Q9Sx6p4h1+ozGUNIfZj7JQb5DEpjMerc',NULL,'membro',1,NULL,NULL,NULL,1,'aprovado','2026-11-17 22:16:36');
/*!40000 ALTER TABLE `membros` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membros_escalas`
--

DROP TABLE IF EXISTS `membros_escalas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membros_escalas` (
  `id_membro_escala` int NOT NULL AUTO_INCREMENT,
  `id_escala_fk` int NOT NULL,
  `id_membro_fk` int NOT NULL,
  `id_funcao_fk` int DEFAULT NULL,
  `disponibilidade` enum('indispon├¡vel','confirmado','pendente') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendente',
  `data_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_membro_escala`),
  KEY `id_escala_fk` (`id_escala_fk`),
  KEY `id_membro_fk` (`id_membro_fk`),
  KEY `id_funcao_fk` (`id_funcao_fk`),
  CONSTRAINT `membros_escalas_ibfk_1` FOREIGN KEY (`id_escala_fk`) REFERENCES `escalas` (`id_escala`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `membros_escalas_ibfk_2` FOREIGN KEY (`id_membro_fk`) REFERENCES `membros` (`id_membro`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `membros_escalas_ibfk_3` FOREIGN KEY (`id_funcao_fk`) REFERENCES `funcoes` (`id_funcao`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membros_escalas`
--

LOCK TABLES `membros_escalas` WRITE;
/*!40000 ALTER TABLE `membros_escalas` DISABLE KEYS */;
INSERT INTO `membros_escalas` VALUES (1,1,1,1,'confirmado','2026-11-17 21:53:16'),(2,1,2,5,'confirmado','2026-11-17 21:53:16'),(3,1,3,2,'pendente','2026-11-17 21:53:16'),(4,2,1,1,'confirmado','2026-11-17 21:53:16'),(5,2,2,5,'pendente','2026-11-17 21:53:16'),(6,3,1,4,'confirmado','2026-11-17 21:53:16'),(7,3,2,5,'confirmado','2026-11-17 21:53:16'),(8,3,3,2,'pendente','2026-11-17 21:53:16'),(9,4,2,5,'confirmado','2026-11-17 21:53:16'),(10,4,1,4,'pendente','2026-11-17 21:53:16'),(11,5,1,4,'confirmado','2026-11-17 21:53:16'),(12,5,2,5,'confirmado','2026-11-17 21:53:16'),(13,5,3,2,'confirmado','2026-11-17 21:53:16'),(14,6,1,1,'confirmado','2026-11-17 21:53:16'),(15,6,2,5,'confirmado','2026-11-17 21:53:16'),(16,7,1,4,'confirmado','2026-11-17 21:53:16'),(17,7,2,5,'confirmado','2026-11-17 21:53:16'),(18,7,3,2,'pendente','2026-11-17 21:53:16'),(19,8,1,1,'confirmado','2026-11-17 21:53:16'),(20,8,2,5,'pendente','2026-11-17 21:53:16'),(21,8,3,3,'pendente','2026-11-17 21:53:16');
/*!40000 ALTER TABLE `membros_escalas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membros_funcoes`
--

DROP TABLE IF EXISTS `membros_funcoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membros_funcoes` (
  `id_membros_funcoes` int NOT NULL AUTO_INCREMENT,
  `id_membros_fk` int NOT NULL,
  `id_funcoes_fk` int NOT NULL,
  PRIMARY KEY (`id_membros_funcoes`),
  KEY `id_membros_fk` (`id_membros_fk`),
  KEY `id_funcoes_fk` (`id_funcoes_fk`),
  CONSTRAINT `membros_funcoes_ibfk_1` FOREIGN KEY (`id_membros_fk`) REFERENCES `membros` (`id_membro`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `membros_funcoes_ibfk_2` FOREIGN KEY (`id_funcoes_fk`) REFERENCES `funcoes` (`id_funcao`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membros_funcoes`
--

LOCK TABLES `membros_funcoes` WRITE;
/*!40000 ALTER TABLE `membros_funcoes` DISABLE KEYS */;
INSERT INTO `membros_funcoes` VALUES (1,1,1),(2,1,4),(3,2,5),(4,3,2),(7,4,1);
/*!40000 ALTER TABLE `membros_funcoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membros_ministerios`
--

DROP TABLE IF EXISTS `membros_ministerios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membros_ministerios` (
  `id_membros_ministerios` int NOT NULL AUTO_INCREMENT,
  `id_membro_fk` int NOT NULL,
  `id_ministerio_fk` int NOT NULL,
  PRIMARY KEY (`id_membros_ministerios`),
  UNIQUE KEY `uq_membro_ministerio` (`id_membro_fk`,`id_ministerio_fk`),
  KEY `idx_membros_ministerios_membro` (`id_membro_fk`),
  KEY `idx_membros_ministerios_ministerio` (`id_ministerio_fk`),
  CONSTRAINT `membros_ministerios_ibfk_1` FOREIGN KEY (`id_membro_fk`) REFERENCES `membros` (`id_membro`) ON DELETE CASCADE,
  CONSTRAINT `membros_ministerios_ibfk_2` FOREIGN KEY (`id_ministerio_fk`) REFERENCES `ministerios` (`id_ministerio`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membros_ministerios`
--

LOCK TABLES `membros_ministerios` WRITE;
/*!40000 ALTER TABLE `membros_ministerios` DISABLE KEYS */;
/*!40000 ALTER TABLE `membros_ministerios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ministerios`
--

DROP TABLE IF EXISTS `ministerios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ministerios` (
  `id_ministerio` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_igreja_fk` int NOT NULL,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_ministerio`),
  UNIQUE KEY `uq_nome_igreja` (`nome`(100),`id_igreja_fk`),
  KEY `idx_ministerios_igreja` (`id_igreja_fk`),
  CONSTRAINT `ministerios_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ministerios`
--

LOCK TABLES `ministerios` WRITE;
/*!40000 ALTER TABLE `ministerios` DISABLE KEYS */;
INSERT INTO `ministerios` VALUES (1,'Louvor',1,'2026-11-17 22:03:44');
/*!40000 ALTER TABLE `ministerios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `musicas`
--

DROP TABLE IF EXISTS `musicas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `musicas` (
  `id_musica` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `autor` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tom` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bpm` smallint DEFAULT NULL,
  `link_spotify` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_youtube` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_cifra` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_letra` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duracao` char(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  PRIMARY KEY (`id_musica`),
  KEY `idx_musicas_igreja` (`id_igreja_fk`),
  CONSTRAINT `musicas_ibfk_1` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `musicas`
--

LOCK TABLES `musicas` WRITE;
/*!40000 ALTER TABLE `musicas` DISABLE KEYS */;
INSERT INTO `musicas` VALUES (1,'Oceans','Hillsong','Re',72,NULL,NULL,NULL,NULL,'05:30:00',NULL,1),(2,'Nada Al├®m','Pregador Luo','La',80,NULL,NULL,NULL,NULL,'04:15:00',NULL,1),(3,'Qu├úo Grande ├® o Meu Deus','Chris Tomlin','Sol',76,NULL,NULL,NULL,NULL,'04:00:00',NULL,1),(4,'Glorioso','Minist├®rio Zoe','Mi',74,NULL,NULL,NULL,NULL,'05:10:00',NULL,1),(5,'Bondade de Deus','Comunidade da Gra├ºa','Re',68,NULL,NULL,NULL,NULL,'04:45:00',NULL,1),(6,'Noite Feliz','Tradicional','Sol',60,NULL,NULL,NULL,NULL,'03:00:00',NULL,1),(7,'Alegria','Diante do Trono','La',88,NULL,NULL,NULL,NULL,'04:30:00',NULL,1),(8,'Nenhum Outro Nome','Hillsong','Re',78,NULL,NULL,NULL,NULL,'05:00:00',NULL,1);
/*!40000 ALTER TABLE `musicas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `musicas_escalas`
--

DROP TABLE IF EXISTS `musicas_escalas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `musicas_escalas` (
  `id_musica_escala` int NOT NULL AUTO_INCREMENT,
  `tom` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ordem` int DEFAULT NULL,
  `id_escala_fk` int NOT NULL,
  `id_musica_fk` int NOT NULL,
  PRIMARY KEY (`id_musica_escala`),
  KEY `id_escala_fk` (`id_escala_fk`),
  KEY `id_musica_fk` (`id_musica_fk`),
  CONSTRAINT `musicas_escalas_ibfk_1` FOREIGN KEY (`id_escala_fk`) REFERENCES `escalas` (`id_escala`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `musicas_escalas_ibfk_2` FOREIGN KEY (`id_musica_fk`) REFERENCES `musicas` (`id_musica`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `musicas_escalas`
--

LOCK TABLES `musicas_escalas` WRITE;
/*!40000 ALTER TABLE `musicas_escalas` DISABLE KEYS */;
INSERT INTO `musicas_escalas` VALUES (1,NULL,1,1,1),(2,NULL,2,1,2),(3,NULL,3,1,3),(4,NULL,1,2,1),(5,NULL,2,2,3),(6,NULL,1,3,4),(7,NULL,2,3,5),(8,NULL,3,3,1),(9,NULL,1,4,2),(10,NULL,2,4,7),(11,NULL,3,4,3),(12,NULL,1,5,6),(13,NULL,2,5,8),(14,NULL,3,5,4),(15,NULL,4,5,5),(16,NULL,1,6,7),(17,NULL,2,6,4),(18,NULL,3,6,1),(19,NULL,1,7,6),(20,NULL,2,7,8),(21,NULL,3,7,3),(22,NULL,4,7,5),(23,NULL,1,8,2),(24,NULL,2,8,4),(25,NULL,3,8,7);
/*!40000 ALTER TABLE `musicas_escalas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacoes`
--

DROP TABLE IF EXISTS `notificacoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacoes` (
  `id_notificacao` int NOT NULL AUTO_INCREMENT,
  `id_membro_fk` int DEFAULT NULL,
  `id_igreja_fk` int DEFAULT NULL,
  `titulo` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conteudo` text COLLATE utf8mb4_unicode_ci,
  `data` date NOT NULL,
  `data_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_notificacao`),
  KEY `id_membro_fk` (`id_membro_fk`),
  KEY `idx_notificacoes_igreja` (`id_igreja_fk`),
  CONSTRAINT `notificacoes_ibfk_1` FOREIGN KEY (`id_membro_fk`) REFERENCES `membros` (`id_membro`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notificacoes_ibfk_2` FOREIGN KEY (`id_igreja_fk`) REFERENCES `igrejas` (`id_igreja`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacoes`
--

LOCK TABLES `notificacoes` WRITE;
/*!40000 ALTER TABLE `notificacoes` DISABLE KEYS */;
INSERT INTO `notificacoes` VALUES (1,1,1,'Confirma├º├úo pendente','Sua presen├ºa na escala de 07/12 ainda est├í pendente. Confirme!','2026-11-28','2026-11-17 21:53:16'),(2,2,1,'Confirma├º├úo pendente','Sua presen├ºa na escala de 16/11 ainda est├í pendente.','2026-11-14','2026-11-17 21:53:16');
/*!40000 ALTER TABLE `notificacoes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_membro_fk` int NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_token` (`token`),
  KEY `idx_password_reset_tokens_membro` (`id_membro_fk`),
  KEY `idx_password_reset_tokens_expires` (`expires_at`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`id_membro_fk`) REFERENCES `membros` (`id_membro`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
INSERT INTO `password_reset_tokens` VALUES (1,4,'09637b4c1270803f2e37ae61bf797dec50e27c66c5159da58ad614a3b9fbb928','$argon2id$v=19$m=65536,p=4,t=3$EAQFcIytzO17YRYefld0ug$IWC9nFZM70pzzu/3sUDg+gTDZMTO0skmApkX3DV6q4Q','2026-11-18 01:13:44',NULL,'2026-11-17 22:03:44'),(2,4,'b2b08eb9762d7ec75c1d57611880d2073941caac1c76968635be5b559d551481','$argon2id$v=19$m=65536,p=4,t=3$xgKKGaVuWhEa0Egi2AtCng$X03+b30vsh6Dr2bw2xV9QY29hh73a95YiaqF+CgXdA8','2026-11-18 01:20:06',NULL,'2026-11-17 22:10:06');
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'saintscale_dev'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-17 22:21:12
