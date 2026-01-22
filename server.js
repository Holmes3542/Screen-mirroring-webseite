const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Socket.io for signaling
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-as-streamer', (roomId) => {
    socket.join(roomId);
    rooms.set(roomId, { streamer: socket.id, viewers: [] });
    console.log(`Streamer ${socket.id} created room ${roomId}`);
  });

  socket.on('join-as-viewer', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.join(roomId);
      room.viewers.push(socket.id);
      socket.to(room.streamer).emit('viewer-joined', socket.id);
      console.log(`Viewer ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('room-not-found');
    }
  });

  socket.on('offer', (data) => {
    socket.to(data.target).emit('offer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.target).emit('answer', {
      sdp: data.sdp,
      sender: socket.id
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      sender: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Clean up rooms
    for (const [roomId, room] of rooms.entries()) {
      if (room.streamer === socket.id) {
        io.to(roomId).emit('streamer-disconnected');
        rooms.delete(roomId);
      } else {
        room.viewers = room.viewers.filter(viewerId => viewerId !== socket.id);
        if (room.viewers.length === 0) {
          // Optional: Keep room alive for streamer
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
