const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.sendStatus(500);
        }
        res.clearCookie('connect.sid'); // 세션 쿠키 이름은 설정에 따라 다를 수 있습니다.
        res.sendStatus(200);
    });
});

module.exports = router;