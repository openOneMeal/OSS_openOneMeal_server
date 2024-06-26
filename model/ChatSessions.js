import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const chatSessionsSchema = new Schema({
    userIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    }],
    userOnline: {
        type: Number,
        min: 0,
        max: 2,
        default : 0,
        required: true,
    },
    creadtedAt: {
        type: Date,
        default: () => Date.now(),
        immutable: true,
    },
});

chatSessionsSchema.pre('save', function (next) {
    if (this.userIds.length > 2) {
        return next(new Error('유저가 2명 초과 매칭됨.'));
    }
    next();
});

const ChatSessions = model('ChatSessions', chatSessionsSchema);
export default ChatSessions;