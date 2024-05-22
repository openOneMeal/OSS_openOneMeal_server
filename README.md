# 오픈한끼 프로젝트 Server Repository

> 📅 Update Date: 2024-05-22
> 

## 1. Overview

이 리포지토리는 오픈한끼 프로젝트 서버 구현을 위해 노력한 과정과 코드를 제공합니다.

### 1.1. 서버 구현 준비

- Node.js 설치 후 npm 환경 변수 등록
- MongoDB Atlas 에 Organization, Project, Cluster 생성
- MongoDB Compass 및 mongosh 설치
- 서버 코드를 저장할 폴더를 생성 후 VS Code 터미널 실행
- npm 모듈 설치: express, mongoose, nodemon, axios
    1. `npm init -y`
    2. `npm i express mongoose axios`
    3. `npm i -D nodemon`

## 2. MongoDB

### 2.1. MongoDB 제품 및 라이브러리 설명

- MongoDB Atlas: MongoDB 에서 제공하는 클라우드 데이터베이스 서비스
- MongoDB Compass: 데이터베이스 관리에 GUI 환경을 제공하는 프로그램
- MongoDB Shell (mongosh): 터미널에서 데이터베이스 관리 기능을 제공하는 프로그램
- Mongoose: Node.js 환경에서 아주 쉽게 MongoDB 객체 모델링을 지원하는 라이브러리. 복잡한 데이터 모델이나 관계형 모델을 생각할 필요 없이 JavaScript 파일에 스키마 모델을 추가하고, 서버 코드에서 import 하여 스키마에 따라 Document 를 읽거나 쓸 수 있습니다.

### 2.2. 클러스터명

- Production 환경을 위한 클러스터: ProductionCluster
    
    실제 운영중인 서버에는 ProductionCluster 를 사용합니다.
    
- Development 환경을 위한 클러스터: DevelopmentCluster
    
    개발 중인 서버에는 DevelopmentCluster 를 사용합니다.
    

### 2.3. mongoose 코드

- mongoose 임포트 및 DB 연결
    
    ```jsx
    // 둘 중 하나 선택해서 mongoose 라이브러리 import
    const mongoose = require('mongoose'); // (1)
    import mongoose from 'mongoose'       // (2)
    
    // mongoose 를 이용해 DB 에 연결
    mongoose.connect("MongoDB Atlas의 DB 주소");
    ```
    
- DB 와 통신
    
    ```jsx
    // Document 생성 및 저장
    // 1번 방법: 인스턴스 생성 후 save()
    const user = new User({ email: 'test@test.com' });
    await user.save();
    // 2번 방법: 인스턴스 생성 및 저장을 한꺼번에 수행해주는 create()
    const user = await User.create({ email: 'test@test.com' }) //
    
    // Update (갱신)
    // 방법: . 으로 필드를 직접 참조해서 값 수정 후 save()
    user.email = "test@test.com"
    await user.save();
    
    // Find (조회)
    // 1번 방법: findOne(), findMany()
    const user = await User.findOne({ name: "비르츠" })
    const user = await User.findMany({ name: ["그리말도", "시크"] })
    // 2번 방법: findById()
    const user = await User.findById("ID 번호").exec();
    // 3번 방법: .where().equals().select()
    // where 은 필드를 필터링, select 는 보여줄 필드(projection)를 결정
    const user = await User.where("email").eqauls("test@test.com").select("name");
    
    // Delete (삭제)
    // 방법: deleteOne(), deleteMany()
    const user = await User.deleteMany({ email: ["test@test.com", "test2@test.com"] });
    ```
    

## 3. 서버 구현

### 3.1. 로그인 기능

- 로그인 기능은 클라이언트로부터 email 과 password 를 받아서,
    
    email 을 검사하고, bcryptjs 라이브러리의 compare() 함수를 이용해
    
    password 를 검사하여 성공과 실패를 클라이언트에 응답으로 전달합니다.
    
- 클라이언트의 axios 라이브러리를 이용한 POST 요청
    
    ```jsx
    const handleSubmit =const handleSubmit = async (e) => {
            e.preventDefault();
    
            try {
                const response = await axios.post(
                    "URL/signin",
                    sendData
                );
    
                if (response.data.status === 200) {
                } else if (response.data.status === 401) {
                }
            } catch (error) {
            }
        };
    ```
    
- 서버의 axios 라이브러리를 이용한 POST 응답
    
    ```jsx
    app.post('/signin', async (req, res) => {
        const { email, password } = req.body;
    
        try {
            const user = await User.findOne({ email });
    
            if (!user) {
                return res.status(401).json({status: 401, message: '이메일 혹은 패스워드가 일치하지 않습니다.'});
            }
            const isMatch = await bcrypt.compare(password, user.password);
    
            if (!isMatch) {
                return res.status(401).json({status: 401, message: '이메일 혹은 패스워드가 일치하지 않습니다.'});
            }
    
            return res.status(200).json({ status: 200, message: '로그인 성공' });
        } catch (err) {
            return res.status(500).json({ status: 500, message: 'Server error'});
        }
    });
    ```