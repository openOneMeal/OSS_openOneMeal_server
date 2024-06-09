import express from 'express';
import bcrypt from 'bcryptjs';
import Users from '../model/Users.js'

const router = express.Router();

router.post('/', async (req, res) => {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    try {
        const user = await Users.findOne({ email });
        /*bcrypt.compare() 함수는 입력받은 비밀번호와 DB에 저장된 해시된 비밀번호를 비교
        compare(입력한 평문 패스워드, DB에 저장된 해시된 패스워드), 반환값은 true 또는 false
        다음과 같이 콜백 함수로 반환값을 얻을 수도 있음
        bcrypt.compare(pw, dbpw, function(err, isMatch) {
            if(err) throw err;
            console.log(isMatch);
        });*/
        const pwMatch = await bcrypt.compare(password, user.password);

        if ( user && pwMatch ) {
            req.session.user = user._id;
            return res.status(200).json({ userId: user._id, userName: user.name });
        } else {
            return res.sendStatus(401);
        }

    } catch (err) {
        return res.sendStatus(500);
    }
});


export default router;