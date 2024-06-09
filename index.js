import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "https://openonemeal.github.io",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    }
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use(express.json());
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.options('*', cors());

// 세션 정보를 저장할 DB
const store = new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
    collection: 'sessions'
});

// 세션 미들웨어 설정
app.use(session({
    secret: 'dhvmsgksRl', // 오픈한끼
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1시간
        httpOnly: true,
        secure: true,
    }
}));

// 하드 코딩된 PORT 번호에서 Heroku에서 호스팅할 때 사용하는 PORT 번호로 변경함.
// 이는 Heroku의 환경 변수에 등록되어 있음
server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

import Matching from './task/Matching.js';
import signInApi from './api/SignIn.js';
import signOutApi from './api/SignOut.js'
import signUpApi from './api/SignUp.js';
import matchApi from './api/Match.js';
import Chatting from './task/Chatting.js'

// 매일 오전 12시 매칭 확인 및 처리
Matching();
// 로그인, 로그아웃 처리
app.use('/api/signin', signInApi);
app.use('/api/signout', signOutApi);
// 계정 생성 처리
app.use('/api/signup', signUpApi);
// 매칭 페이지 요청 처리
app.use('/api/match', matchApi);
// 채팅 처리
Chatting(io);