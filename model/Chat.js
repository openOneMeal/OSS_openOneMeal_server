import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const chatSchema = new Schema({
    message: {
        type: String,
    },
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
    },
}, { timestamps: true });

const Chat = model('Chat', chatSchema);
export default Chat;