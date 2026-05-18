const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const http = require('http');
const { io: SocketIOClient } = require('socket.io-client');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const approutes = require('../src/routes');
const db = require('./config/db');

const app = express();
const server = http.createServer(app);

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:4000';

const socketClient = SocketIOClient(SOCKET_SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    transports: ['websocket']
});

socketClient.on('connect', () => {
    console.log(`✅ Connected to socket server at ${SOCKET_SERVER_URL} [id: ${socketClient.id}]`);
});

socketClient.on('disconnect', (reason) => {
    console.warn('⚠️  Disconnected from socket server:', reason);
});

socketClient.on('connect_error', (err) => {
    console.error('❌ Socket server connection error:', err.message);
});

app.set('io', socketClient);

app.use(cors({
    origin: ['https://task-manager.in', 'http://task-manager.in'],
    credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use('/api/v1', approutes);
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

db.connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        socketClient.disconnect();
        console.log('HTTP server closed');
    });
});