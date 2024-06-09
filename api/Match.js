import express from 'express'
const router = express.Router();
import Users from '../model/Users.js';
import ChatSessions from '../model/ChatSessions.js';

router.post('/check', async (req, res) => {
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

router.put('/choose', async (req, res) => {
    const { userId, matchState } = req.body;

    try {
        // 매칭된 유저 상대 유저 먼저 조회
        const chatSession = await ChatSessions.findOne({ userIds: userId });
        const matchUserId = chatSession.userIds.find(id => id.toString() !== userId.toString());
        const matchUser = await Users.findOne({ _id: matchUserId });

        // 만약 서로 동시에 매칭 페이지에 있을 때, 한명이 매칭을 거절하면,
        // 다른 한 명이 나중에 수락해봤자 여기서 notMatched 로 설정됨.
        if (matchUser.matchState === "notMatched") {
            user.matchState = "notMatched";
            await user.save();
            res.json({ matchState: "notMatched" });
            return;
        }

        const user = await Users.findOne({ _id: userId });
        user.matchState = matchState;
        await user.save();

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

export default router;