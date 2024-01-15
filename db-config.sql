

DROP TABLE IF EXISTS `Commands`;
CREATE TABLE `Commands` (
  `command_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) DEFAULT NULL,
  `command_name` varchar(255) NOT NULL,
  `command_description` varchar(255) DEFAULT NULL,
  `command_response` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`command_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


LOCK TABLES `Commands` WRITE;
INSERT INTO `Commands` VALUES (1,1,'ping','Get the current ping of the bot!','Pong!'),(3,1,'hihi','haha','hihihiha'),(9,3,'Command1','Command 1','Hello From Command 1!'),(10,2,'a','b','c'),(12,4,'a','a','a'),(13,4,'b','b','b'),(14,4,'c','c','c'),(15,4,'d','d','d'),(16,4,'e','e','e'),(17,4,'f','f','f'),(18,4,'g','g','g'),(19,4,'h','h','h'),(20,4,'i','i','i'),(21,4,'j','j','j'),(22,4,'k','k','k'),(23,4,'l','l','l'),(24,4,'m','m','m'),(25,4,'n','n','n'),(26,4,'o','o','o'),(27,4,'p','p','p'),(28,4,'q','q','q'),(29,4,'r','r','r'),(30,4,'s','s','s'),(31,4,'t','t','t'),(32,4,'u','u','u'),(33,4,'v','v','v'),(34,4,'w','w','w'),(35,4,'x','x','x'),(36,4,'y','y','y'),(37,4,'z','z','z'),(41,1,'hahaha','dit is episch command','frikaden');
UNLOCK TABLES;



DROP TABLE IF EXISTS `Projects`;
CREATE TABLE `Projects` (
  `project_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_name` varchar(255) NOT NULL,
  `project_owner` varchar(36) DEFAULT NULL,
  `bot_token` varchar(255) NOT NULL,
  `bot_id` varchar(255) NOT NULL,
  PRIMARY KEY (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;


LOCK TABLES `Projects` WRITE;
INSERT INTO `Projects` VALUES (1,'HerpesDerpesBot','4ad7671e-9f58-11ee-8679-77dce8f924c9','MTEzODM2OTYyMTgzODI3MDQ3NA.GeGOob.4o9KZlD2lQYU3Qd0lToyD-b29DvwhWyUUpQaRI','1138369621838270474'),(2,'TestToCHeckDBFixHIHI','4ad7671e-9f58-11ee-8679-77dce8f924c9','MTEzODM2OTYyMTgzODI3MDQ3NA.GeGOob.4o9KZlD2lQYU3Qd0lToyD-b29DvwhWyUUpQaRI','1138369621838270474'),(3,'TestBot','56c0bc05-9f58-11ee-8679-77dce8f924c9','12345','12345'),(4,'Frikandel','4ad7671e-9f58-11ee-8679-77dce8f924c9','12345','Mayonaise');
UNLOCK TABLES;



DROP TABLE IF EXISTS `Users`;

CREATE TABLE `Users` (
  `user_id` varchar(36) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;



LOCK TABLES `Users` WRITE;
INSERT INTO `Users` VALUES ('4ad7671e-9f58-11ee-8679-77dce8f924c9','valentijn','$2b$10$mica8GYsYCQ71mJzFAtf4uPueL2GMbmwZTkb22uzkeC4AtLyzi1kW'),('56c0bc05-9f58-11ee-8679-77dce8f924c9','user','$2b$10$l4z4m2vpcSvd/VwsLRRZF.6dElWoDevK25GRD1tBGtTy12SX93OiG');
UNLOCK TABLES;
