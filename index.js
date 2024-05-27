import express from 'express';
// 클라이언트가 서버로 요청을 보내기 이전에, 사전 요청을 보냄.
// 사전 요청은 CORS Preflight Reqeust 라고 하며, OPTIONS 메서드로 사전 요청을 보내고,
// 이 요청은 서버가 특정 HTTP 메서드(POST, UPDATE 등)를 허용하는지 확인함
// 이 요청에 적절히 응답해야 클라이언트가 실제 요청을 보내기 때문에,
// CORS 미들웨어를 추가하여 반드시 이 요청을 처리해줘야함.
import cors from 'cors';
import mongoose from 'mongoose';
// bcryptjs 는 비밀번호를 안전하게 해시하고 검증하는 기능을 제공하는 라이브러리
import bcrypt from 'bcryptjs';
const app = express();
const dbUri = process.env.MONGODB_URI;
import Users from './model/Users.js';

mongoose.connect(dbUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// express.json() 미들웨어를 통해 JSON 형식의 요청 본문이 알아서 파싱됨
app.use(express.json());
// 이렇게 사용하면 CORS의 어떤 Header, 어떤 Method, 어떤 Origin 에 대해서도 접근을 허용한다.
app.use(cors());
// 모든 경로에 대하여 위와 같은 옵션을 적용한다.
app.options('*', cors());

// 하드 코딩된 PORT 번호에서 Heroku에서 호스팅할 때 사용하는 PORT 번호로 변경함.
// 이는 Heroku의 환경 변수에 등록되어 있음
app.listen(process.env.PORT, () => {
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
        })
        
        res.status(201).send('계정 생성 성공');
    } catch (error) {
        res.status(500).send('계정 생성 중 오류 발생');
    }
});