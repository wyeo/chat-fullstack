const io = require('socket.io-client');

const CURRENT_ROOM_ID = '6838594c83c74cc8eb6d77d0';
const CURRENT_USER_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNTczNDdhNC0zMzc2LTQzYzctYWY5NS01MDZhMDVmZGMyMzYiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3NDg1MzAxMDcsImV4cCI6MTc0ODUzMzcwN30.mZD3O1DCFYSz6jLqkTtqdD3v4Ct6ye0EugvWWGQQ3kY';

const socket = io('http://localhost:3333/chat', {
  auth: { token: CURRENT_USER_TOKEN },
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket');

  socket.emit('joinRoom', { roomId: CURRENT_ROOM_ID });
});

socket.on('newMessage', (data) => {
  console.log('📨 New message:', data);
});

socket.on('userTyping', (data) => {
  console.log('⌨️ User typing:', data);
});

socket.on('error', (error) => {
  console.error('❌ Error:', error);
});

setTimeout(() => {
  socket.emit('sendMessage', {
    content: 'Hello from WebSocket!',
    roomId: CURRENT_ROOM_ID,
  });
}, 2000);
