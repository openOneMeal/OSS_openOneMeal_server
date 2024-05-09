# 유튜브 강의: 2시간만에 웹서버 쉽게 개발하기 (Node.js + MongoDB) - 코딩애플

---

### 서버에 대하여

- **서버 구현 이전에 필요한 선행 지식**
    - HTML/CSS 기초
    - JavaScript 기초
- **서버란?**
    - 말 그대로 서비스를 제공(Serve)하는 프로그램
    - 요청을 하면 요청한 내용을 보내주는 프로그램
- **웹 서버는 HTTP 요청을 처리함, 요청의 종류는 4가지**
    - **읽기(GET):** 뭔가 읽고 싶을 때
    - **쓰기(POST):** 뭔가 생성할 때
    - **수정(PUT):** 뭔가 수정할 때
    - **삭제(DELETE):** 뭔가 삭제할 때
- **그럼 어떤 코드를 짜는 걸까?**
    - 어떤 사람이 comic.naver.com으로 접속하면,
        
        네이버 웹툰 메인 html 파일을 전송
        
    - 어떤 사람이 /list 라는 페이지를 GET 요청하면,
        
        거기 해당하는 list.html 파일을 전송
        

### Node.js에 대하여

- 태초에 JavaScript라는 언어가 있었음
    
    html 페이지에 종속된 언어임. HTML을 위해 만들어진 언어
    
- **HTML 언어는 웹페이지를 만들기 위한 언어**
    
    **정적인 페이지를 만들 수 있었음.** 안 움직이고, 글 넣고 그림 넣는 게 끝
    
- **JavaScript는 웹페이지를 다이나믹하게 바꾸기 위해 만들어짐**
    
    **즉, html을 조작하기 위해 만들어진 것**
    
- JavaScript의 해석은 누가 하는가: 브라우저가 함
    
    브라우저마다 JavaScript를 해석하는 엔진(인터프리터)들이 서로 다름
    
    - 크롬: V8
    - 익스플로러: Chakra
    - 파이어폭스: SpiderMonkey
- 크롬의 V8 엔진은 JS 해석을 너무 잘해서 빠르고 뛰어났음
    
    **이 해석 엔진을 똑 떼서 출시한 게 Node.js**
    
    Node.js는 브라우저 말고 다른 환경에서도 JS를 실행하기 위한 실행 환경임
    
    (= 런타임)
    
- Node.js 덕분에 JS를 콘솔 등 다양한 환경에서 사용 가능해졌고,
    
    프로그래밍 언어처럼 사용하기 시작함
    
    서버 만들기가 쉽고 Non-blocking I/O 때문에 서버 만들 때 주로 사용함
    
- Non-blocking I/O 란?
    - 막히지 않는 처리
    - 일반 프로그래밍 언어로 서버를 구성하면, 순차적으로 요청을 처리하여 무거운 요청 뒤의 요청은 속도가 같이 느려짐
    - Node.js 로 구성한 서버는, 요청을 일단 전부 한번에 받아들이고, 작업이 쉬운 요청부터 처리하여 요청 대기 시간이 별로 없음
    - 일반 서버도 서버 스케일링 혹은 멀티 스레딩으로 응답을 받아들이는 입구를 여러 개 만들고 병렬적으로 처리하여 응답 속도를 높일 수 있음. 그런데 Node.js 도 똑같이 이게 가능함.
- Node.js 는 웹서비스에 최적화됨. 웹서비스가 아니라면 좀..

### 서버 구현

- Node.js 다운 후 express 라이브러리 설치하여 서버를 구현할 것임
    - 먼저 VS code 터미널에서 **`npm init`** (powershell일 경우 **`npm.cmd init`**)을 통해 npm을 설치함. npm은 라이브러리인데, 다른 라이브러리 설치를 도와주는 라이브러리.
    - npm을 통해 설치한 라이브러리는 package.json 에 기록됨
    - **`npm init`** 을 하면 몇 가지 기본 정보를 입력하고 package.json 에 저장함. **`-y`** 옵션을 추가하면 모든 질문에 기본값을 자동으로 사용
        1. **package name**:
            - 프로젝트의 이름을 입력합니다. 기본적으로 현재 디렉토리의 이름이 제안됩니다. npm 패키지 이름은 소문자만을 사용하고, 공백은 허용되지 않으며, URL로도 사용가능해야 합니다.
        2. **version**:
            - 프로젝트의 초기 버전을 입력합니다. 기본값은 **`1.0.0`**입니다. 버전 번호는 [SemVer](http://semver.org/) (Semantic Versioning, 의미론적 버전 관리) 규칙을 따릅니다.
        3. **description**:
            - 프로젝트의 간단한 설명을 입력합니다. 이 설명은 npm 웹사이트나 검색 결과에서 프로젝트를 이해하는 데 도움을 줍니다.
        4. **entry point**:
            - 프로젝트의 시작점 파일(주 진입점)을 지정합니다. 기본값은 **`index.js`**입니다. 이 파일은 애플리케이션을 시작할 때 Node.js에 의해 가장 먼저 실행됩니다.
        5. **test command**:
            - 프로젝트의 테스트 스크립트를 실행하는 데 사용할 명령을 입력합니다. 예를 들어, **`mocha`**, **`jest`** 등의 테스트 프레임워크를 사용할 경우 여기에 해당 명령어를 입력합니다.
        6. **git repository**:
            - 프로젝트의 소스 코드를 관리하기 위한 Git 리포지토리 URL을 입력합니다. 이는 다른 개발자들이 소스 코드를 쉽게 찾을 수 있게 해주며, 버전 관리에도 도움을 줍니다.
        7. **keywords**:
            - 프로젝트와 관련된 키워드를 쉼표로 구분하여 입력합니다. 이 키워드는 npm에서 프로젝트를 검색할 때 유용하게 사용됩니다.
        8. **author**:
            - 프로젝트의 주요 작성자의 이름을 입력합니다. 선택적으로 이메일 주소와 웹사이트 URL도 포함할 수 있습니다.
        9. **license**:
            - 프로젝트에 적용할 라이선스를 입력합니다. 기본값은 **`ISC`**입니다. 이는 프로젝트가 어떻게 사용될 수 있는지에 대한 법적 조건을 명시합니다.
    - entry point 란 Node.js 런타임이 처음으로 실행할 자바스크립트 파일을 지정하는 것. 이 파일은 애플리케이션의 주 진입점으로 작동함. 일반적으로 ‘index.js’, ‘app.js’, ‘server.js’ 등을 사용함
    - entry point의 역할은
        - 애플리케이션 실행: 애플리케이션 로직을 시작하고, 모듈을 로드하며, 서버를 구동할 수 있는 코드를 포함함
        - 모듈 호출: 이 파일에서 다른 자바스크립트 파일이나 모듈을 ‘require’ 또는 ‘import’를 통해 불러와 애플리케이션의 나머지 부분이 실행됨
        - 구성 설정: 애플리케이션의 기본 설정, 환경 변수 설정, 중요한 라이브러리 설정을 포함할 수 있음
        
        즉, entry point는 다른 개발자나 프로그램이 프로젝트를 사용할 때 어느 파일을 먼저 참조해야 하는지 알려줌
        
    - 이후 **`npm install express`** 를 통해 express 라이브러리를 설치함. 라이브러리를 설치하면 package.json 에 라이브러리가 추가되고, node_modules 라는 폴더가 생기며 node 에서 사용할 수 있는 라이브러리 목록을 볼 수 있음.
        
        (node_modules: 라이브러리에 필요한 자료들 담는 공간)
        
- 서버 기초 셋팅하기
    - index.js 파일을 생성하고, 다음과 같이 코드를 작성.
        
        ```jsx
        // Node.js 상에서 Express로 서버를 만들기 위한 기본 셋팅
        // express 객체에 설치한 express 라이브러리를 첨부
        const express = require('express');
        
        // express 라이브러리를 사용할 객체를 생성
        const app = express();
        
        // express 객체로 서버를 여는 listen();
        // 인자로 서버를 띄울 포트 번호, 띄운 후 실행할 코드
        app.listen(8080, function(){
        	console.log('listening on 8080')
        });
        ```
        
    - **`node index.js`** 로 서버를 실행
    - URL에 [localhost:8080](http://localhost:8080) 를 입력하면 서버에 접속할 수 있음
- GET 요청 받기
    - 브라우저에서 URL 을 입력하는 자체가 서버에 GET 요청을 하는 것임
    - 다음과 같이 코드를 작성하면 [localhost:8080/pet](http://localhost:8080/pet) 의 접속 요청을 받으면, 출력 메시지를 띄워줌.
        
        ```jsx
        // 누군가가 /pet 으로 방문을 하면
        // pet 과 관련된 안내문을 띄워줌
        // 인자로 요청할 경로, 응답할 때 실행할 함수
        app.get('/pet', function(req, res){
            res.send('펫 용품 쇼핑할 수 있는 페이지입니다.')
        });
        ```
        
- 서버 재실행 자동화하기
    - nodemon 이란 라이브러리를 설치해주면 코드를 수정하고 저장할 때 마다 일일히 Ctrl+C 후 서버를 실행해 줄 필요 없이 알아서 재실행해줌
    - **`npm install -g nodemon`** 로 nodemon 설치
    - -g 옵션은 모든 파일 시스템에서 이용할 수 있도록 글로벌하게 설치
    - **`nodemon index.js`** 와 같이 서버를 실행
- GET 요청에 html 파일 보내기
    - send 대신 sendFile 함수를 이용
        
        ```jsx
        // GET 요청을 받는 코드: html 파일 보내기
        // '/' 는 홈임 (localhost:8080)
        // 누군가가 홈에 방문하면 html 파일을 보내서 띄워줌
        // sendFile() 함수를 이용
        // 인자는 파일 경로
        // (__dirname 은 현재 index.js 가 위치한 절대 경로를 반환)
        app.get('/test', function(req, res){
            res.sendFile(__dirname + '/server.htm')
        });
        ```
        
- Bootstrap 라이브러리로 쉽게 쉽게 HTML/CSS 꾸며보기
    - Bootstrap 은 프론트엔드 컴포넌트 라이브러리임
    - 최신 버전(4버전 이상)으로 다운
    - Bootstrap docs의 html 코드를 갖다 붙여넣으면서 페이지 구성할 수 있음

### **참고 영상 목록**

- [https://youtu.be/-zOfTS1HQTc?si=GYv_6F5xKcs7Eh4c](https://youtu.be/-zOfTS1HQTc?si=GYv_6F5xKcs7Eh4c)
- [https://youtu.be/NoLV5iP5FNY?si=Nk3eea2CbzFRwj9X](https://youtu.be/NoLV5iP5FNY?si=Nk3eea2CbzFRwj9X)
- [https://youtu.be/pTm5E3jcOeY?si=hfqTDqFYDP_YxQDh](https://youtu.be/pTm5E3jcOeY?si=hfqTDqFYDP_YxQDh)
- [https://youtu.be/k2GWnDb5zoQ?si=pwFeLWA98Vrs2Fby](https://youtu.be/k2GWnDb5zoQ?si=pwFeLWA98Vrs2Fby)
- [https://youtu.be/n-Ae22bpNWU?si=cNUpkW7E4G4KdT4Q](https://youtu.be/n-Ae22bpNWU?si=cNUpkW7E4G4KdT4Q)
- [https://youtu.be/HeOh-go-fYY?si=Zc77ZMfZucvG717k](https://youtu.be/HeOh-go-fYY?si=Zc77ZMfZucvG717k)
- [https://youtu.be/Yn4fUo1i1-s?si=D3ne2LCQGXxJvcwG](https://youtu.be/Yn4fUo1i1-s?si=D3ne2LCQGXxJvcwG)
- [https://youtu.be/rVNsEXZPEF8?si=odIVIcJfufPWChEc](https://youtu.be/rVNsEXZPEF8?si=odIVIcJfufPWChEc)