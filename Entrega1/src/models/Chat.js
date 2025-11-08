const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true  
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
   
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  lastMessage: {
    type: String,
    default: ''
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


chatSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Chat', chatSchema);