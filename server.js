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

// Middleware
app.use(express.static(__dirname));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// WebSocket für Signalisierung
const activeStreams = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Client verbunden:', socket.id);

  // Stream starten
  socket.on('start-stream', (streamId) => {
    activeStreams.set(streamId, {
      broadcasterId: socket.id,
      viewers: new Set(),
      createdAt: Date.now()
    });
    socket.join(streamId);
    socket.emit('stream-started', { streamId });
    console.log(`🎬 Stream gestartet: ${streamId}`);
  });

  // Stream beitreten
  socket.on('join-stream', (streamId) => {
    const stream = activeStreams.get(streamId);
    
    if (stream) {
      socket.join(streamId);
      stream.viewers.add(socket.id);
      
      // Informiere Broadcaster
      socket.to(stream.broadcasterId).emit('viewer-joined', {
        viewerId: socket.id,
        streamId: streamId
      });
      
      socket.emit('stream-joined', { 
        streamId,
        broadcasterId: stream.broadcasterId 
      });
      console.log(`👁️ Viewer ${socket.id} joined ${streamId}`);
    } else {
      socket.emit('error', { message: 'Stream nicht gefunden' });
    }
  });

  // WebRTC Signalisierung
  socket.on('webrtc-signal', (data) => {
    const { to, signal, type } = data;
    socket.to(to).emit('webrtc-signal', {
      from: socket.id,
      signal,
      type
    });
  });

  // Stream stoppen
  socket.on('stop-stream', (streamId) => {
    const stream = activeStreams.get(streamId);
    if (stream && stream.broadcasterId === socket.id) {
      io.to(streamId).emit('stream-ended');
      activeStreams.delete(streamId);
      console.log(`🛑 Stream gestoppt: ${streamId}`);
    }
  });

  // Get active streams
  socket.on('get-streams', () => {
    const streams = Array.from(activeStreams.entries()).map(([id, data]) => ({
      id,
      broadcasterId: data.broadcasterId,
      viewerCount: data.viewers.size,
      age: Date.now() - data.createdAt
    }));
    socket.emit('active-streams', streams);
  });

  // Verbindung getrennt
  socket.on('disconnect', () => {
    // Broadcast-Streams dieses Users beenden
    for (const [streamId, stream] of activeStreams.entries()) {
      if (stream.broadcasterId === socket.id) {
        io.to(streamId).emit('stream-ended');
        activeStreams.delete(streamId);
        console.log(`🗑️ Stream entfernt: ${streamId} (broadcaster disconnected)`);
      } else if (stream.viewers.has(socket.id)) {
        stream.viewers.delete(socket.id);
      }
    }
    console.log('🔌 Client getrennt:', socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
  console.log(`📡 WebSocket verfügbar auf ws://localhost:${PORT}`);
});
