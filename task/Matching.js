import cron from 'node-cron';
import { exec } from 'child_process';
import Users from '../model/Users.js';
import ChatSessions from '../model/ChatSessions.js';

const Matching = () => {
    
    // '0 0 * * *' 은 오전 12시에 작업을 실행하도록 설정하는 cron 표현식
    // 오전 12시에 콜백 함수를 실행하며, 이는 오전 12시에 매칭되지 않은 사람을 매칭
    cron.schedule('0 0 * * *', async () => {
        try {
            // 매칭해야할 유저 documents 를 전부 얻어옴.
            const usersToMatch = await Users.find({ matchState: {$ne: matched} })
            const usersCount = usersToMatch.length;

            if ( usersCount < 2 )
                return;
    
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
                    usersToMatch[arrayForShuffle[i]]._id,
                    usersToMatch[arrayForShuffle[i + 1]]._id
                ];
    
                await ChatSessions.create({ userIds: userIds });
    
                // 매칭되면 matched 로 상태를 바꾸고 업데이트
                usersToMatch[arrayForShuffle][i].matchState = 'choose';
                usersToMatch[arrayForShuffle][i + 1].matchState = 'choose';
                await usersToMatch[arrayForShuffle][i].save();
                await usersToMatch[arrayForShuffle][i + 1].save();
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
};


module.exports = Matching;