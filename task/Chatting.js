import ChatSessions from './model/ChatSessions.js';
import ChatLogs from './model/ChatLogs.js';

// 연결된 클라이언트 목록을 저장할 객체
const clients = {};

const Chatting = (io) => {
    io.on('connection', socket => {
        try {
             socket.on('register', async (data) => {
                 const { userId } = data;
     
                 // { 사용자id : 사용자 socket } 연결된 클라이언트 목록에 소켓 등록
                 clients[userId] = socket;
                 console.log("clients[userId]: ", clients[userId]);
     
                 // userId 로 자신의 채팅 세션 검색
                 const chatSession = await ChatSessions.findOne({ userIds: userId });
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
                 const matchUserId = chatSession.userIds.find(id => id.toString() !== userId.toString());
                 const matchSocket = clients[matchUserId];
     
                 console.log("online listener 호출됨.");
                 onlineListener(socket, matchSocket, chatSession, clients);
             });
         } catch (error) {
             console.error('연결 중 에러 발생:', error);
         }
     });
}

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

module.exports = Chatting;