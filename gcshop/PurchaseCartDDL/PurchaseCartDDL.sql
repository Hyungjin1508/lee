CREATE TABLE `purchase` (
  `purchase_id` int NOT NULL AUTO_INCREMENT,
  `loginid` varchar(10) NOT NULL,
  `prod_id` int DEFAULT NULL,
  `date` varchar(30) NOT NULL,
  `price` int DEFAULT NULL,
  `point` int DEFAULT NULL,
  `qty` int DEFAULT NULL,
  `total` int DEFAULT NULL,
  `payYN` varchar(1) NOT NULL DEFAULT 'N',
  `cancel` varchar(1) NOT NULL DEFAULT 'N',
  PRIMARY KEY (`purchase_id`)
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cart` (
  `cart_id` int NOT NULL AUTO_INCREMENT,
  `loginid` varchar(10) NOT NULL,
  `prod_id` int DEFAULT NULL,
  `date` varchar(30) NOT NULL,
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci