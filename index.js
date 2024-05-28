/* 서버를 위한 라이브러리
cors
클라이언트가 서버로 요청을 보내기 이전에, 사전 요청을 보냄.
사전 요청은 CORS Preflight Reqeust 라고 하며, OPTIONS 메서드로 사전 요청을 보내고,
이 요청은 서버가 특정 HTTP 메서드(POST, UPDATE 등)를 허용하는지 확인함
이 요청에 적절히 응답해야 클라이언트가 실제 요청을 보내기 때문에,
CORS 미들웨어를 추가하여 반드시 이 요청을 처리해줘야함.

bcryptjs
비밀번호를 안전하게 해시하고 검증하는 기능을 제공하는 라이브러리
*/
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


/* 채팅을 위한 라이브러리
http
웹소켓 통신을 할땐 초기에 클라이언트가 서버에 HTTP 연결 요청을 보내고(핸드셰이크)
이를 통해 둘이 연결되면 이후 소켓을 통해 통신함.
따라서 http 는 핸드셰이크 한 번을 위해 필요한 라이브러리

socket.io
서버를 위한 소켓 라이브러리
*/
import http from 'http';
import { Server } from 'socket.io';


/* DB 컬렉션에 접근할 때 사용할 스키마 */
import Users from './model/Users.js';
import Chat from './model/Chat.js';


/* 사용할 객체
app
익스프레스 객체

server
HTTP 서버 객체
http.createServer() 는 새로운 HTTP 서버 객체를 생성하며,
익스프레스 객체를 넘겨주면 익스프레스가 라우터와 미들웨어로 설정되어 HTTP 객체로 넘겨받은 값을 처리함

io
socket.io 서버 인스턴스
웹소켓 연결을 관리하고 이벤트를 처리함
*/
const app = express();
const dbUri = process.env.MONGODB_URI;
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://openonemeal.github.io",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    }
});


mongoose.connect(dbUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// express.json() 미들웨어를 통해 JSON 형식의 요청 본문이 알아서 파싱됨
app.use(express.json());
// 이렇게 사용하면 CORS의 어떤 Header, 어떤 Method, 어떤 Origin 에 대해서도 접근을 허용한다.
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
// 모든 경로에 대하여 위와 같은 옵션을 적용한다.
app.options('*', cors());


// 하드 코딩된 PORT 번호에서 Heroku에서 호스팅할 때 사용하는 PORT 번호로 변경함.
// 이는 Heroku의 환경 변수에 등록되어 있음
server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});


// 로그인 처리
app.post('/api/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(401).json({status: 401, message: '이메일 혹은 패스워드가 일치하지 않습니다.'});
        }

        // bcrypt.compare() 함수는 입력받은 비밀번호와 DB에 저장된 해시된 비밀번호를 비교
        // compare(입력한 평문 패스워드, DB에 저장된 해시된 패스워드)
        // 현재는 프로미스 객체로 값을 받았으며, 반환값은 true 또는 false
        // 다음과 같이 콜백 함수로 반환값을 얻을 수도 있음
        /* bcrypt.compare(pw, dbpw, function(err, isMatch) {
            if(err) throw err;
            console.log(isMatch);
        });*/
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({status: 401, message: '이메일 혹은 패스워드가 일치하지 않습니다.'});
        }

        return res.status(200).json({ status: 200, message: '로그인 성공' });
    } catch (err) {
        return res.status(500).json({ status: 500, message: 'Server error'});
    }
});


// 계정 생성 처리
app.post('/api/signup', async (req, res) => {
    const { name, gender, email, password } = req.body;

    try {
        
        const user = await Users.findOne({ email });
        if (user) {
            return res.status(409).json({status:409, message: '중복된 이메일'});
        }

        // bcrypt.hash 를 통해 전달받은 패스워드를 해시화함
        // 두번째 매개인자인 숫자는 해시 레벨이며,
        // 해시 레벨을 높일 수록 처리 속도는 느려지지만 그만큼 복잡한 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        await Users.create({
            name: name,
            gender: gender,
            email: email,
            password: hashedPassword,
        });
        
        res.status(201).send('계정 생성 성공');
    } catch (error) {
        res.status(500).send('계정 생성 중 오류 발생');
    }
});

// 간단하게 매칭 처리
app.put('/api/match', async (req, res) => {
    const { email } = req.body;

    try {
        // 요청을 보낸 유저 조회
        const user = await Users.findOne({ email: email });

        if (user._matchId) {
            res.status(204).send('이미 매칭됨');
            return;
        }

        // 유저 개수 얻어오기
        const userCount = await Users.countDocuments();
        if (userCount <= 1) {
            console.log("usercount 계산 중 에러");
        }
        
        let randomIndex;
        let randomUser;
        do {
            // 개수 범위 내에서 랜덤한 인덱스 생성
            randomIndex = Math.floor(Math.random() * userCount);
            // 랜덤한 인덱스에 해당하는 문서 조회
            randomUser = await Users.findOne().skip(randomIndex);
        } while (randomUser?._matchId || (userCount % 2 === 0))

        user._matchId = randomUser._id;
        randomUser._matchId = user._id;
        await user.save();
        await randomUser.save();

        res.status(200).send('매칭 완료');
    } catch (error) {
        res.status(500).send('모종의 이유로 오류가 발생하여 매칭 실패');
    }
});


// 채팅 처리
const clients = {};

io.on('connection', socket => {
   try {
        socket.on('register', async (email) => {
            // email 로 사용자 검색
            const user = await Users.findOne({ email : email });
            // { 사용자id : 사용자 socket } 객체를 저장
            clients[user._id] = socket;

            // 연결된 사용자도 소켓이 연결되어 있는 경우
            if (clients[user?._matchId]) {
                const matchSocket = clients[user._matchId];

                socket.emit('matchConnected', "상대방이 접속하였습니다. 채팅을 입력하세요.");
                matchSocket.emit('matchConnected', "상대방이 접속하였습니다. 채팅을 입력하세요.");

                // sendMessage 이벤트를 받으면 Chat 에 저장하고 상대 소켓에 전송
                socket.on('sendMessage', async (message) => {
                    await Chat.create({
                        message: message,
                        sender: user._id,
                    });

                    matchSocket.emit('receiveMessage', message);
                });

                matchSocket.on('sendMessage', async (message) => {
                    await Chat.create({
                        message: message,
                        sender: user._matchId,
                    });

                    socket.emit('receiveMessage', message);
                });

            } else {
                socket.emit('waitingForMatch', "상대방이 접속하면 채팅이 시작됩니다.");
            }
        }); 

        socket.on('disconnect', () => {
            for (let userId in clients)
                if (clients[userId] === socket) {
                    delete clients[user._id];
                    break;
                }
        });
   } catch (error) {
        console.error('연결 중 에러 발생:', error);
   }
});