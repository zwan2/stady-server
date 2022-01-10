### 요약

STADY는 통계, 그룹스터디에 특화된 수험생용 스톱워치 애플리케이션입니다.

🗓️ **작업기간** : 2018.08~2019.01

👨‍💻 **투입인원** : 2명

📒 **주요업무** 

앱 백엔드 구성, RDBMS 구성, AWS 구성, 웹 프론트엔드(랜딩 페이지, 공지, contact 기능) 개발

🌱 **스킬 및 사용툴**

`Express.js` `MySQL` `AWS` 

🏅 **성과**

`2019 성균관대학교 캠퍼스타운 창업경진대회 장려상` 


### 🗺 ERD

---

![Untitled](https://raw.githubusercontent.com/zwan2/stady-server/master/public/images/3.png)
### 🖌️UI

---

<div>
<img src="https://raw.githubusercontent.com/zwan2/stady-server/master/public/images/4.png" width="250px"/>
<img src="https://raw.githubusercontent.com/zwan2/stady-server/master/public/images/5.png" width="250px"/>
<img src="https://raw.githubusercontent.com/zwan2/stady-server/master/public/images/6.png" width="250px"/>
</div>


### 📜개발 내용

---

- Express.js 를 이용하여 기본적인 CRUD를 제공하는 API 서버를 설계하고 구현함
    
    [https://docs.google.com/document/d/14eKIQXrHvfX6H9okSB2Cpxtl8kBUnCeCXaIbAu8lt1w/edit?usp=sharing](https://docs.google.com/document/d/14eKIQXrHvfX6H9okSB2Cpxtl8kBUnCeCXaIbAu8lt1w/edit?usp=sharing)
    
- 회원관리 기능 구현을 위하여 Passport.js를 활용하여 로그인, 회원가입 기능을 개발함
- 복잡한 통계 조회 기능 구현을 위하여 서브쿼리, JOIN, HAVING 등 MySQL의 중급 문법을 이용함
- 서비스의 속도 향상을 위해 캐싱, 네트워크 등의 개념을 고민하였고, 가능한 DB 접근을 줄이기 위해 하나의 쿼리를 통해 처리하려고 하였음
- 데이터베이스 잡 스케쥴 기능 구현을 위해 cron을 이용함
- 세션을 MySQL DB에 저장하는 방식으로 세션 로그인을 구현함
- ejs를 이용하여 간단한 관리자용 웹 페이지를 구현함


### 🏃‍♂️아쉬운 점, 발전하기 위한 노력

---

- ES6+ 문법을 모르고 개발하여 활용하지 못함.
    
    이후 React를 이용하여 프로젝트를 진행하고, ES6+ 기반의 서비스 유지보수에 참여하면서 프론트엔드에서 ES6+를 활용한 간결한 문법을 자유롭게 사용할 수 있게 됨
    
- 비동기 방식에 대해 완전히 이해하고 개발하지 못함.
    
    개발 도중 점진적으로 Promise를 도입하였고, 프로젝트 이후에는 async, await에 대해 학습하고 자유롭게 사용할 수 있게 됨
    
- 쿼리 재사용성에 대한 개념이 없어서 없는 한 방 쿼리, 날쿼리를 남발함
    
    이후 JPA를 학습한 뒤에는 ORM을 활용하여 확장성 있는 개발을 할 수 있게 됨.
    
- 계층을 분리하지 못하고 router에 과도하게 책임을 부여함.
    
    이후 CodeIgniter, Spring 등의 프레임워크를 학습한 뒤에는 Layered Architecture에 대한 개념을 정립하고 계층화할 수 있게 됨.
