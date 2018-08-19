CREATE DATABASE STADY DEFAULT CHARACTER SET UTF8;
USE STADY;

CREATE TABLE users(
    id INT(8) NOT NULL AUTO_INCREMENT,
    account_id CHAR(20) NOT NULL,
	account_pw CHAR(20) NOT NULL,
    name CHAR(10) NOT NULL,
    group_ids VARCHAR(255) DEFAULT NULL,
	PRIMARY KEY (id),
	UNIQUE INDEX ux_account_id (account_id)
);


CREATE TABLE users_info(
    id INT(8) NOT NULL AUTO_INCREMENT,
    user_id INT(8) NOT NULL,
    goal_setting TEXT,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

CREATE TABLE exams_structure(
    id INT(3) NOT NULL AUTO_INCREMENT,
    main_exam_id INT(8) NOT NULL,
    sub_exam_id INT(8) NOT NULL,
    detail_subject_ids VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE exams(
   id INT(3) NOT NULL AUTO_INCREMENT,
   title VARCHAR(20) NOT NULL,
   PRIMARY KEY (id)
);

CREATE TABLE subjects(
    id INT(3) NOT NULL AUTO_INCREMENT,
    exam_id INT(3) NOT NULL, 
    title VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE studies(
    id INT(3) NOT NULL AUTO_INCREMENT,
    title VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)  
);

CREATE TABLE data(
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(8) NOT NULL,
    exam_id INT(3) NOT NULL,
    subject_id INT(3) NOT NULL,
    study_id INT(3) NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    term INT(8) DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE groups(
    id INT(8) NOT NULL AUTO_INCREMENT,
    exam_id INT(3) NOT NULL,
    open_option TINYINT(2) DEFAULT 0,
    title VARCHAR(30) NOT NULL,
    subtitle VARCHAR(100) DEFAULT NULL,
    count_users TINYINT(2) DEFAULT 1,
    master_user_id INT(8) NOT NULL,
    group_users_ids VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id)
);


/*
CREATE TABLE users_data(
    id INT(8) NOT NULL AUTO_INCREMENT,
    user_id INT(8) NOT NULL,
    data_table_code TINYINT(2) NOT NULL,
    daily_data VARCHAR(255) DEFAULT NULL,
    study_date DATE NOT NULL,
    PRIMARY KEY (id)
);
*/