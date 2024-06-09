import express from 'express';
import bcrypt from 'bcryptjs';
import Users from '../model/Users.js';
import ChatSessions from '../model/ChatSessions.js';

const router = express.Router();

// 아이디 중복 검사
const checkDuplication = async (req, res, next) => {
    const email = req.body.email.toLowerCase();
    const user = await Users.findOne({ email });
    if (user) {
        return res.status(409).json({status:409, message: '중복된 이메일'});
    }

    req.body.email = email;
    next();
};

router.post('/', checkDuplication, async (req, res) => {
    const { name, gender, email, password } = req.body;

    try {
        // bcrypt.hash 를 통해 전달받은 패스워드를 해시화함
        // 두번째 매개인자인 숫자는 해시 레벨이며,
        // 해시 레벨을 높일 수록 처리 속도는 느려지지만 그만큼 복잡한 해시화
        const hashedPassword = await bcrypt.hash(password, 10);

        // 계정 DB에 생성
        const newUser = new User({
            name: name,
            gender: gender,
            email: email,
            password: hashedPassword,
        });
        await newUser.save();
        
        // 매칭이 가능하다면 매칭
        const usersToMatch = await Users.find({ matchState: {$ne: matched} })
        if ( usersToMatch ) {
            const userCount = usersToMatch.length;
            const randomNumber = Math.floor(Math.random() * (userCount + 1));
            const userIds = [
                usersToMatch[randomNumber]._id,
                user._id
            ];

            await ChatSessions.create({ userIds: userIds });

            userToMatch[randomNumber].matchState = 'choose';
            newUser.matchState = 'choose';
            await userToMatch[arrayForShuffle][i].save();
            await userToMatch[arrayForShuffle][i + 1].save();
        }

        res.status(201).send('계정 생성 성공');

    } catch (error) {
        res.status(500).send('계정 생성 중 오류 발생');
    }
});

export default router;