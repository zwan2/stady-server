CREATE DATABASE IF NOT EXISTS `STADY` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `STADY`;

CREATE TABLE IF NOT EXISTS `bug_report` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reg_date` datetime NOT NULL,
  `comment` text,
  `version` varchar(50) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `exam_cat0` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `title` varchar(40) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `exam_cat1` (
  `id` int(8) NOT NULL,
  `parent_id` int(8) NOT NULL,
  `title` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `exam_cat2` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `parent_id` int(8) DEFAULT NULL,
  `title` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `groups` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `exam_id` int(3) NOT NULL,
  `open_option` tinyint(2) DEFAULT '0',
  `title` varchar(30) NOT NULL,
  `subtitle` varchar(100) DEFAULT NULL,
  `count_users` tinyint(2) DEFAULT '1',
  `master_user_id` int(8) NOT NULL,
  `group_users_ids` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `histories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(8) NOT NULL,
  `exam_address` varchar(50) NOT NULL,
  `subject_id` int(3) NOT NULL,
  `study_id` int(3) NOT NULL,
  `start_point` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_point` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `term` int(8) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=841 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `landing` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apk_link` varchar(255) NOT NULL,
  `version_status` varchar(50) NOT NULL,
  `version_real` varchar(50) NOT NULL,
  `changes` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `notice` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reg_date` datetime NOT NULL,
  `notice` text,
  `content` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `stady` (
  `id` int(11) NOT NULL,
  `cat2` text,
  `cat3` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_address` varchar(13) NOT NULL,
  `user_id` int(8) NOT NULL,
  `subject_id` int(5) NOT NULL,
  `study_id` int(2) NOT NULL,
  `today_total` int(6) DEFAULT '0',
  `base_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`exam_address`,`subject_id`,`study_id`,`base_date`),
  UNIQUE KEY `user_id_2` (`user_id`,`exam_address`,`subject_id`,`study_id`,`base_date`),
  UNIQUE KEY `user_id_3` (`user_id`,`exam_address`,`subject_id`,`study_id`,`base_date`),
  UNIQUE KEY `user_id_4` (`user_id`,`exam_address`,`subject_id`,`study_id`,`base_date`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `exam_address` char(13) NOT NULL,
  `title` varchar(40) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=996 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `user_accounts` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `account_id` varchar(20) NOT NULL,
  `account_pw` char(24) NOT NULL,
  `session_id` varchar(32) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_account_id` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=174 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `user_goals` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `user_id` int(8) NOT NULL,
  `today_goal` int(8) DEFAULT '0',
  `subject_goals` varchar(255) DEFAULT NULL,
  `reg_time` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_2` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_3` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_4` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_5` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_6` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_7` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_8` (`user_id`,`reg_time`),
  UNIQUE KEY `user_id_9` (`user_id`,`reg_time`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `user_id` int(8) NOT NULL,
  `name` varchar(20) NOT NULL,
  `gender` tinyint(1) NOT NULL DEFAULT '0',
  `birth_date` date DEFAULT NULL,
  `exam_address` varchar(13) DEFAULT NULL,
  `subject_ids` varchar(256) DEFAULT NULL,
  `group_ids` varchar(255) DEFAULT NULL,
  `time_offset` int(6) DEFAULT '0',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8;
