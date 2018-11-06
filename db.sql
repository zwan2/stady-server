CREATE DATABASE STADY DEFAULT CHARACTER SET UTF8;
USE STADY;

CREATE TABLE user_accounts(
    id INT(8) NOT NULL AUTO_INCREMENT,
    account_id VARCHAR(20) NOT NULL,
	account_pw CHAR(24) NOT NULL,
    session_id CHAR(32) DEFAULT NULL,
	UNIQUE INDEX ux_account_id (account_id),
	PRIMARY KEY (id)
);

CREATE TABLE user_settings(
    id INT(8) NOT NULL AUTO_INCREMENT,
    user_id INT(8) NOT NULL,
    name VARCHAR(20) NOT NULL,
    gender TINYINT(1) DEFAULT 0,
    birth_date DATE DEFAULT NULL,
    exam_address VARCHAR(13) DEFAULT NULL,
    subject_ids VARCHAR(30) DEFAULT NULL,
    group_ids VARCHAR(255) DEFAULT NULL,
	PRIMARY KEY (id)
);


CREATE TABLE user_goals(
    id INT(8) NOT NULL AUTO_INCREMENT,
    user_id INT(8) NOT NULL,
    today_goal INT(8) DEFAULT 0,
    subject_goals VARCHAR(255) DEFAULT NULL,
    reg_time DATE DEFAULT NULL CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
); 
ALTER TABLE user_goals ADD UNIQUE INDEX (user_id, reg_time);


CREATE TABLE groups(
    id INT(8) NOT NULL AUTO_INCREMENT,
    exam_address VARCHAR(13) NOT NULL,
    open_option TINYINT(2) DEFAULT 0,
    title VARCHAR(30) NOT NULL,
    subtitle VARCHAR(100) DEFAULT NULL,
    count_users TINYINT(2) DEFAULT 1,
    master_user_id INT(8) NOT NULL,
    group_users_ids VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id)
);

/* 통계 테이블 */


CREATE TABLE histories(
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(8) NOT NULL,
    exam_address VARCHAR(13) NOT NULL,
    subject_id INT(5) NOT NULL,
    study_id INT(2) NOT NULL,
    start_point TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_point TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    term INT(6) DEFAULT 0,
    PRIMARY KEY (id)
);

CREATE TABLE statistics(
    id INT(11) NOT NULL AUTO_INCREMENT,
    user_id INT(8) NOT NULL,
    exam_address VARCHAR(13) NOT NULL,
    subject_id INT(5) NOT NULL,
    study_id INT(2) NOT NULL,
    today_total INT(6) DEFAULT 0,
    base_date DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);




/*정적 테이블*/
CREATE TABLE exams_cat0(
    id INT(8) NOT NULL AUTO_INCREMENT,
    title VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE exams_cat1(
    id INT(8) NOT NULL AUTO_INCREMENT,
    parent_id INT(8) NOT NULL,
    title VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE exams_cat2(
    id INT(8) NOT NULL AUTO_INCREMENT,
    parent_id INT(8) NOT NULL,
    title VARCHAR(20) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE subjects(
    id INT(8) NOT NULL AUTO_INCREMENT,
    exam_address char(13) NOT NULL,
    title VARCHAR(40) NOT NULL,
    PRIMARY KEY (id)
);





/* landing */

CREATE TABLE landing(
    id INT(11) NOT NULL AUTO_INCREMENT,
    apk_link VARCHAR(255) NOT NULL,
    version_status VARCHAR(50) NOT NULL,
    version_real VARCHAR(50) NOT NULL,
    changes TEXT,
    PRIMARY KEY(id)
);

CREATE TABLE notice(
    id INT(11) NOT NULL AUTO_INCREMENT,
    reg_date DATETIME NOT NULL,    
    notice TEXT,
    PRIMARY KEY(id)    
);

CREATE TABLE bug_report(
    id INT(11) NOT NULL AUTO_INCREMENT,
    reg_date DATETIME NOT NULL,    
    comment TEXT,
    version VARCHAR(50),
    user_id INT(11),
    PRIMARY KEY(id)    
);