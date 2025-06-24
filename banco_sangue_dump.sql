-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: banco_sangue
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.24.04.1

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
-- Table structure for table `bolsas`
--

DROP TABLE IF EXISTS `bolsas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bolsas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_sangue` varchar(3) NOT NULL,
  `volume_ml` int NOT NULL,
  `data_coleta` date NOT NULL,
  `validade` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bolsas`
--

LOCK TABLES `bolsas` WRITE;
/*!40000 ALTER TABLE `bolsas` DISABLE KEYS */;
INSERT INTO `bolsas` VALUES (1,'A+',2323,'2025-01-01','2025-09-02');
/*!40000 ALTER TABLE `bolsas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bolsas_sangue`
--

DROP TABLE IF EXISTS `bolsas_sangue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bolsas_sangue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipo_sangue` enum('a+','b+','ab+','o+','a-','b-','ab-','o-') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bolsas_sangue`
--

LOCK TABLES `bolsas_sangue` WRITE;
/*!40000 ALTER TABLE `bolsas_sangue` DISABLE KEYS */;
/*!40000 ALTER TABLE `bolsas_sangue` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doadores`
--

DROP TABLE IF EXISTS `doadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doadores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `documento` enum('rg','cnh','carteira-trabalho','carteira-conselho-prof') COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_sangue` enum('a+','b+','ab+','o+','a-','b-','ab-','o-') COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condicao_1` tinyint(1) NOT NULL,
  `condicao_2` tinyint(1) NOT NULL,
  `condicao_3` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doadores`
--

LOCK TABLES `doadores` WRITE;
/*!40000 ALTER TABLE `doadores` DISABLE KEYS */;
INSERT INTO `doadores` VALUES (1,'Paul Latejano','rg','ab+','92343434','p@gmail.com','abacaxi com pinga',1,1,1,'2024-12-10 12:58:40'),(2,'macaco xico','carteira-trabalho','o-','92343434','macaco@gmail.com','macaco 123',1,1,1,'2024-12-10 12:59:31'),(3,'Bru','cnh','a-','','','',1,1,1,'2024-12-10 13:32:46'),(4,'Shawlin Matador de Porco','rg','a+','929999999','matador@gmail.com','Matador de Porco',1,1,1,'2024-12-10 14:41:09'),(5,'a','cnh','a+','929999999','a@gmail.com','aaaa',1,1,1,'2024-12-10 14:44:29'),(6,'Matador de Viado','rg','a+','929999999','matador123@gmail.com','Inferno ',1,1,1,'2024-12-10 14:48:49'),(7,'Pai de Todos Furador de Bolo','carteira-trabalho','o-','9232321111','esquizo@gmail.com','Problemas',1,1,1,'2024-12-10 20:47:11'),(8,'testeccc','rg','o-','923333333','tec@gmail.com','sssss',1,1,1,'2024-12-10 20:52:15'),(9,'aaaaaaaaaaaaa','rg','a+','9232321111','aaaa@ssss','sssss',1,1,1,'2024-12-10 21:21:13'),(10,'Marcos Careca ','rg','b-','929999999999','m@m','kkkkk',1,1,1,'2024-12-10 22:21:21'),(11,'afaf','rg','a+','2323232323','v@v','dlsflfm',1,1,1,'2024-12-10 22:30:49'),(12,'bala','rg','o-','922123232','x@xxxx','bbbbb',1,1,1,'2024-12-10 22:32:15'),(13,'Cc','carteira-trabalho','a-','00223232','c@cccccc','bbbbbwwwwwww',1,1,1,'2024-12-10 22:43:59'),(14,'zzzzzzzzzzzzzzzzzzzzzzzzzzzz','carteira-conselho-prof','b-','4345345','n@n','dfsdgssgdg',1,1,1,'2024-12-11 00:30:59'),(15,'Seu Raimundo','rg','a+','7898980090','compra@model.com','',1,1,1,'2024-12-11 02:36:01'),(16,'Pablo','cnh','o+','7898980090','compra@model.com','',1,1,1,'2024-12-11 02:57:27'),(17,'Benito de Paula ','rg','a+','9999999999','benito@gmail.com','teste',1,1,1,'2025-06-23 19:45:43');
/*!40000 ALTER TABLE `doadores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name_empresa` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endereco` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cnpj` (`cnpj`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `empresas_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcionarios`
--

DROP TABLE IF EXISTS `funcionarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcionarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cargo` enum('limpeza','balconista','estoque','outro') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(14) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pis` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `empresa_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cpf` (`cpf`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `funcionarios_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcionarios`
--

LOCK TABLES `funcionarios` WRITE;
/*!40000 ALTER TABLE `funcionarios` DISABLE KEYS */;
INSERT INTO `funcionarios` VALUES (1,'Marco','limpeza','23232424','42342','92444444','marco@gmail.com','3333',NULL,'2024-12-10 05:08:14',''),(2,'Pablo','balconista','12122331','Qjejejss','969669988','','',NULL,'2024-12-10 05:15:12',''),(3,'Bru','estoque','123457','','','','',NULL,'2024-12-10 13:32:21',''),(4,'aaaaaaaaaaaaa','estoque','11111111111','11111111111','111111111111','AX@gmail.com','aaaaaaaaaaaaaaaaaaaa',NULL,'2024-12-10 18:21:06',''),(5,'Teste F','limpeza','3242424','2424242','4242424','t@gmail.com','dwsdsdfsf',NULL,'2024-12-10 18:23:40',''),(8,'zzzz','balconista','23232','323232','23234242','z@gmail.com','zzzzz',NULL,'2024-12-10 18:30:08',''),(10,'nnnnnnnnnnnnnnnn','balconista','7777777','777777','7777777777','z@gmail.com','77777',NULL,'2024-12-10 18:32:15',''),(11,'Zeca','limpeza','232433255223','32454657','92433535','zeca@gmail.com','Rua do Medo',NULL,'2024-12-10 18:37:01',''),(12,'Marco Polo','limpeza','762555333','123456','9212345678','polo@gmail.com','Sei lá',NULL,'2024-12-10 20:33:44',''),(13,'z','limpeza','212121212','212121233','2133212121','z@z','124',NULL,'2024-12-10 22:11:10','$2b$10$g/LPXjQqIDuWmulLnY1Xg.NkvaRbmceGJd5yhW3tnc0YW5t6e7km2'),(14,'Cris','limpeza','12345678901','sssssss','','bruno2@gmail.com','',NULL,'2024-12-11 01:51:44','$2b$10$PjpHI1gzfIf371DN9uNW/O51/Qm.KISkT3xBMDhDJL69NIG69LjPK'),(15,'Cara de Lua','limpeza','32242424','23232','3242424','A@A','123456',NULL,'2024-12-11 02:32:03','$2b$10$StZnrGjR5asBnjSjc2UzE.CArNxe/ljmQ103ds2S.9g5CmF3PtBo.'),(16,'Chrisalda','estoque','24','24','7898980090','funcionario@gmail.com','',NULL,'2024-12-11 02:54:10','$2b$10$ZdGR8CT6Ay/IJerhR6s1cOI330CDLPrTWTCZ273rNs9HVG1PwOBcG'),(17,'Ch','balconista','oooo','24','789898','x2@gmail.com','',NULL,'2024-12-11 03:04:17','$2b$10$bmE62VrNqFOxgPA4ZsPTlemaWjxVDx9KL9NIbdOuryi5fWT.M7L3q'),(18,'qqq','limpeza','qqqq','qqqq','qqqq','x3@gmail.com','',NULL,'2024-12-11 03:05:06','$2b$10$JrvVuUCV2LlueFniXYi1COgGgjYb158L3XvMUJDZjMpn9oT6nCK3q'),(19,'Ana ','estoque','8578464546','2222424','929992322','anabanana@gmail.com','12345678',NULL,'2025-06-23 22:16:09','$2b$10$0/NsSdUSote67gRMYxPqUeClxEXakcrM2UGo3WhrUsM74scAaHHeu');
/*!40000 ALTER TABLE `funcionarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insumos`
--

DROP TABLE IF EXISTS `insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insumos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantidade` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insumos`
--

LOCK TABLES `insumos` WRITE;
/*!40000 ALTER TABLE `insumos` DISABLE KEYS */;
INSERT INTO `insumos` VALUES (1,'A+',10,'2024-12-10 13:18:44'),(2,'Seringa',12,'2024-12-10 13:33:34'),(3,'bala 7.62',500,'2024-12-10 20:55:03'),(4,'pão',2,'2024-12-11 00:54:02'),(5,'pão de ontem',20,'2024-12-11 01:00:22'),(6,'Lixo',900,'2024-12-11 01:07:26'),(7,'A-',43,'2024-12-11 01:09:44'),(8,'Café',21,'2024-12-11 01:10:51'),(9,'placa rtx 4090 kkkk',300,'2024-12-11 01:27:52'),(10,'Seringa',20,'2024-12-11 01:57:20'),(11,'Bolsa',34,'2024-12-11 01:58:30'),(12,'fuzil de assaulto',3232,'2024-12-11 02:32:43'),(13,'Camisinha',200,'2024-12-11 02:58:19'),(14,'Fuzil de Rasgar Ladrão',7,'2024-12-11 03:08:14'),(15,'Seringas',30,'2025-06-23 19:44:12');
/*!40000 ALTER TABLE `insumos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `empresa` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cnpj` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endereco` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'teste','teste1','teste2','teste3','teste4@gmail.com','123456'),(2,'teste22','teste33','teste44','teste55','teste66@gmail.com','123'),(3,'teste33','teste44','teste55','teste66','teste77@gmail.com','123456'),(4,'aaaaa','Abacaxi','aaaaaaaaa','Verde','a@gmail.com','$2b$10$fb854GDx2Sy.HCTAEq9L3.0C/YMmHrCQrWTeRV/SWcC15LRxuXTyy'),(6,'c','cc','ccc','cccc','ccccc@gmail.com','$2b$10$9w4w0GgMykmEYLD6eNt7yezn34npX7NoPIgKjBXrJSVqFDen4IJbK'),(7,'x','xx','xxx','xxxx','x@gmail.com','$2b$10$87IpPOZrZwQGp8M3ZfP6Ue1zXzdoKK1Zh3iG2FESDEs3Ct/Xu5m5i'),(8,'Me dá 1 real','Odeio piton','6959595995','Rua do JS','euamoJS@emal.com','$2b$10$EZ5nnJlASis9z7klrGRvFOsPNGk7vKY0xPDZWccefZYCKGFYFcHkS'),(11,'B','B','B','B','b@b','$2b$10$pg4UM.zlMTsx3rUc0hdwSu96jH8PPKCBRABq4AnRukvfBmgYjNbkO'),(12,'x','x','x','x','x@x','$2b$10$1vypwKlwKO7SEb9XP6ziD.EYrMSWS1wro9Dj3BNWEfQnwWi6hAHnW'),(13,'Brunao','Projeto Super','123456','Rua Salvio Correa','bruno@gmail.com','$2b$10$0rBUoBguFzq1QsE496iCZObmn7Pjs9OWXmgrZ1uVnsY9XfXwc6zkm'),(15,'xxxxx','xxxxxxxxx','xxxxxxxxx','xxxxxxxxxxxxxx','x@xxxxx','$2b$10$1XcZLd6w9LvC4wqhzD.Sa.zl9namSCDqE8eSNSfIZzoIT7L2DWE4G'),(19,'xxx','xxx','xxxx','xxx','x2@gmail.com','$2b$10$qQ31wYIg7PFymWLdYYs3KuEBJbUWfdK7LpZmBhEs.WL7HA1qus99.'),(20,'test','','','','teste@gmail.com','$2b$10$Y.9VT9d.al0LSALvZ..inuhjvchToClr3TTB0L7XwtPOtR9rwLc0G');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-23 18:47:04
