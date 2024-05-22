import User from './model/User.js';
const express = require('express');
const mongoose = require('mongoose');
// bcryptjs 는 비밀번호를 안전하게 해시하고 검증하는 기능을 제공하는 라이브러리
const bcrypt = require('bcryptjs');
const app = express();
const dbUri = process.env.MONGODB_URI;

mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

app.use(express.json());

// 테스트 시에는 3000, 4000 등 임시 포트 사용
// 배포 시에는 80(HTTP), 또는 443(HTTPS) 포트 사용
app.listen(8080, () => {
    console.log(`Server running on port 8080`);
});

app.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

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