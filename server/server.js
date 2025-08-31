const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/messages'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Socket.io connection handling
const Message = require('./models/Message');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to chat room
  socket.on('join', (userData) => {
    socket.username = userData.username;
    socket.join('global-chat');
  });

  // Handle new messages
  socket.on('sendMessage', async (messageData) => {
    try {
      const message = new Message({
        content: messageData.content,
        sender: messageData.sender,
        timestamp: new Date()
      });
      
      await message.save();
      
      // Broadcast message to all connected clients
      io.to('global-chat').emit('newMessage', {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        timestamp: message.timestamp
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});