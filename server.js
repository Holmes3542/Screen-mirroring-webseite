const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/viewer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Screen Streamer is running',
    timestamp: new Date().toISOString()
  });
});

// Socket.io signaling
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-as-streamer', (roomId) => {
    socket.join(roomId);
    rooms.set(roomId, { 
      streamer: socket.id, 
      viewers: [],
      createdAt: new Date().toISOString()
    });
    console.log(`Streamer ${socket.id} created room ${roomId}`);
    socket.emit('room-created', roomId);
  });

  socket.on('join-as-viewer', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      socket.join(roomId);
      room.viewers.push(socket.id);
      socket.to(room.streamer).emit('viewer-joined', socket.id);
      console.log(`Viewer ${socket.id} joined room ${roomId}`);
      socket.emit('room-joined', roomId);
    } else {
      socket.emit('room-not-found', { roomId });
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
        console.log(`Room ${roomId} deleted (streamer disconnected)`);
      } else {
        const viewerIndex = room.viewers.indexOf(socket.id);
        if (viewerIndex > -1) {
          room.viewers.splice(viewerIndex, 1);
          socket.to(room.streamer).emit('viewer-left', socket.id);
          console.log(`Viewer ${socket.id} left room ${roomId}`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📺 Open http://localhost:${PORT} to start streaming`);
  console.log(`👁️  Open http://localhost:${PORT}/viewer to watch stream`);
});
