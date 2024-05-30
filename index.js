// 회원 가입 시 매칭도 구현해야함

/* 서버를 위한 라이브러리
cors
클라이언트가 서버로 요청을 보내기 이전에, 사전 요청을 보냄.
사전 요청은 CORS Preflight Reqeust 라고 하며, OPTIONS 메서드로 사전 요청을 보내고,
이 요청은 서버가 특정 HTTP 메서드(POST, UPDATE 등)를 허용하는지 확인함
이 요청에 적절히 응답해야 클라이언트가 실제 요청을 보내기 때문에,
CORS 미들웨어를 추가하여 반드시 이 요청을 처리해줘야함.

bcryptjs
비밀번호를 안전하게 해시하고 검증하는 기능을 제공하는 라이브러리

node-cron
크론 작업은 유닉스 계열 운영체제에서 일정한 시간 간격으로 명령어나 스크립트를 실행하도록 설정하는 작업.
node-cron 은 Node.js 환경에서 정기적인 크론 작업 스케줄링을 쉽게 설정할 수 있는 라이브러리
매일 12시에 매칭되지 않은 유저들을 매칭시켜주는 작업을 시행하기 위해 사용
*/
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cron from 'node-cron';



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
import ChatSessions from './model/ChatSessions.js';
import ChatLogs from './model/ChatLogs.js';
import { exec } from 'child_process';



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
            // 아이디가 DB에 존재하지 않음
            return res.status(401).send();
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
            // 비밀번호가 일치하지 않음
            return res.status(401).send();
        }

        return res.status(200).json({ userId: user._id, userName: user.name });
    } catch (err) {
        return res.status(500).send();
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



// 매칭 처리 및 매칭 확인
// '0 0 * * *' 은 오전 12시에 작업을 실행하도록 설정하는 cron 표현식
// 오전 12시에 콜백 함수를 실행하며, 이는 오전 12시에 매칭되지 않은 사람을 매칭
cron.schedule('0 0 * * *', async () => {
    try {
        // 매칭해야할 유저 documents 를 전부 얻어옴.
        const usersToMatch = await Users.find({ matchState: {$ne: matched} })
        const usersCount = usersToMatch.length;

        // 유저의 개수 크기의 배열 생성
        let arrayForShuffle = new Array(usersCount);
        // 배열의 인덱스에 각 인덱스 넘버를 할당
        for (let i = 0; i < usersCount; ++i) {
            arrayForShuffle[i] = i;
        }
        // 배열을 랜덤하게 섞음 (Fisher-Yates Shuffle 알고리즘이라고 함..)
        for (let i = usersCount - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arrayForShuffle[i], arrayForShuffle[j]] = [arrayForShuffle[j], arrayForShuffle[i]];
        }
        // 두개씩 짝지어서 차례대로 채팅 세션을 생성하고 matchState 를 choose 로 변경
        for (let i = 0; i < usersCount; i += 2) {
            // usersCount 가 홀수라면 1명은 매칭이 그날 보류됨.
            const userIds = [
                usersToMatch[arrayForShuffle[i]],
                usersToMatch[arrayForShuffle[i + 1]]
            ];

            await ChatSessions.create({ userIds: userIds });

            // 매칭되면 matched 로 상태를 바꾸고 업데이트
            userToMatch[arrayForShuffle][i].matchState = 'choose';
            userToMatch[arrayForShuffle][i + 1].matchState = 'choose';
            await userToMatch[arrayForShuffle][i].save();
            await userToMatch[arrayForShuffle][i + 1].save();
        }

        // 서버 재시작
        // 클라이언트는 서버 재시작 시 소켓 재연결 요청을 알아서 보내기 때문에 따로 알리지 않아도 될듯.
        exec('node index.js', (error, stdout ,stderr) => {
            if (error) {
                console.error('Error restarting server: ${error}');
                return;
            }
            console.log('stdout: ${stdout}');
            console.error('stderr: ${stderr}');
        });

        process.exit(0);

    } catch (error) {
        console.error("매칭 중 에러 발생", error);
    }
});

app.post('/api/checkmatch', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await Users.findOne({ _id: userId });
        console.log("matchState: ", user.matchState);
        res.status(200).json({ matchState: user.matchState });

    } catch (error) {
        console.error('checkmatch POST 처리 도중 에러 발생', error);
        res.status(500).send();
    }
});

app.put('/api/choosematch', async (req, res) => {
    const { userId, matchState } = req.body;

    try {
        const user = await Users.findOne({ _id: userId });
        user.matchState = matchState;
        await user.save();

        // 매칭된 유저 조회
        const chatSession = await ChatSessions.findOne({ userIds: userId });
        const matchUserId = chatSession.userIds.find(id => id.toString() !== userId.toString());
        const matchUser = await Users.findOne({ _id: matchUserId });

        // 수락하여 pending 상태가 됐으면 상대 유저의 상태도 체크
        if (matchState === "pending") {
            // 매칭된 상태도 pending 이면 둘이 매칭됨
            if (matchUser.matchState === "pending") {
                user.matchState = "matched";
                matchUser.matchState = "matched";
                await user.save();
                await matchUser.save();

                console.log("양쪽 매칭됨");
                res.json({ matchState: "matched" });
                return;
            }

            console.log("한쪽 pending");
            res.json({ matchState: "pending" });
            return;
        }

        console.log("매칭 거절됨");
        user.matchState = "notMatched";
        matchUser.matchState = "notMatched";
        await user.save();
        await matchUser.save();
        res.json({ matchState: "notMatched"});
    } catch (error) {
        res.status(500).send('모종의 이유로 오류가 발생하여 매칭 실패');
    }
});


// 채팅 처리
const clients = {};

// 한 명은 오프라인일 때 리스너
const offlineListener = (socket, chatSession, clients) => {
    socket.removeAllListeners();

    socket.on('sendMessage', async (message) => {
        try {
            // 전송하는 메시지 DB에만 업데이트
            await ChatLogs.create({
                chatSessionId: chatSession._id,
                sender: message.sender,
                message: message.message,
            })
        } catch (error) {
            console.error('Single sendMessage error', error);
        }
    })

    socket.on('disconnect', async () => {
        try {
            // 온라인 상태 제거
            chatSession.userOnline -= 1;
            await chatSession.save();

            // 연결된 클라이언트 목록에서 제거
            for (let userId in clients) {
                if (clients[userId] === socket) {
                    delete clients[userId];
                    break;
                }
            }

        } catch (error) {
            console.error('Disconnect error', error);
        }
    });
}

// 둘 다 온라인일 때 리스너
const onlineListener = (socket, matchSocket, chatSession, clients) => {
    matchSocket.removeAllListeners();
    
    socket.on('sendMessage', async (message) => {
        try {
            await ChatLogs.create({
                chatSessionId: chatSession._id,
                sender: message.sender,
                message: message.message,
            });
        

            matchSocket.emit('receiveMessage', message);
        } catch (error) {
            console.error('sendMessage 도중 에러 발생', error);
        }
    });

    matchSocket.on('sendMessage', async (message) => {
        try {
            await ChatLogs.create({
                chatSessionId: chatSession._id,
                sender: message.sender,
                message: message.message,
            });

            socket.emit('receiveMessage', message);
        } catch (error) {
            console.error('sendMessage 도중 에러 발생', error);
        }
    });

    socket.on('disconnect', async () => {
        try {
            // 온라인 상태 제거
            chatSession.userOnline -= 1;
            await chatSession.save();

            // 연결된 클라이언트 목록에서 제거
            for (let userId in clients) {
                if (clients[userId] === socket) {
                    delete clients[userId];
                    break;
                }
            }

            // 소켓이 연결 해제되면 matchSocket 은 offlineListener 를 실행하도록 설정
            offlineListener(matchSocket, matchSender, chatSession, clients);
        } catch (error) {
            console.error('Disconnect error', error);
        }
    });

    matchSocket.on('disconnect', async () => {
        try {
            // 온라인 상태 제거
            chatSession.userOnline -= 1;
            await chatSession.save();

            // 연결된 클라이언트 목록에서 제거
            for (let matchUserId in clients) {
                if (clients[matchUserId] === matchSocket) {
                    delete clients[matchUserId];
                    break;
                }
            }

            // matchSocket이 연결 해제되면 소켓은 offlineListener 를 실행하도록 설정
            offlineListener(socket, sender, chatSession, clients);
        } catch (error) {
            console.error('Disconnect error', error);
        }
    });
}

io.on('connection', socket => {
   try {
        socket.on('register', async (data) => {
            const { userId } = data;

            // { 사용자id : 사용자 socket } 연결된 클라이언트 목록에 소켓 등록
            clients[userId] = socket;
            console.log("clients[userId]: ", clients[userId]);

            // userId 로 자신의 채팅 세션 검색
            const chatSession = await ChatSessions.findOne({ userIds: {$in : [userId]}});
            console.log("chatSession: ", chatSession);
            // 유저의 온라인을 업데이트
            chatSession.userOnline += 1;
            await chatSession.save();
            console.log("chatSession.userOnline: ", chatSession.userOnline);

            // 채팅 로그 불러오기
            const chatLogs = await ChatLogs.find({ chatSessionId: chatSession._id }, { _id: 0, sender: 1, message: 1});
            console.log("chatLogs: ", chatLogs);
            socket.emit('loadMessages', chatLogs);

            // 한 명이 오프라인이면 DB에만 저장
            if (chatSession.userOnline !== 2) {
                console.log("offline listener 호출됨.");
                offlineListener(socket, chatSession, clients);
                return;
            }

            // 앞선 조건 검사에서 온라인이 2명이 아닌 상태를 검사했으므로,
            // 이 코드를 타게되면 무조건 둘 다 온라인인 상태
            // matchSocket 불러오기
            const matchUser = await ChatSessions.findOne({ userIds: {$ne: userId }});
            console.log("matchUser: ", matchUser);
            const matchSocket = clients[matchUser.userIds[0]];
            console.log("clients[matchUser.userIds[0]]: ", clients[matchUser.userIdsp[0]]);
            console.log("matchSocket: ", matchSocket);

            console.log("online listener 호출됨.");
            onlineListener(socket, matchSocket, chatSession, clients);
        });
    } catch (error) {
        console.error('연결 중 에러 발생:', error);
    }
});