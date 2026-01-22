// test.js - Minimal test
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World! Screen Streamer is working!');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
});
