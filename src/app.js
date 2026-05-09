const express = require('express')
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { errorMiddleware } = require('./middleware/errorMiddleware');
require('dotenv').config()
const approutes = require('../src/routes')

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Adjust this based on your frontend URL in production
    }
});

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    
    // Clients will join a room named after their tenant_id
    socket.on('join_tenant', (tenant_id) => {
        const roomName = `tenant_${tenant_id}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.set('io', io);

app.use(cors());
app.use(express.json())

app.get('/health', (req,res) => {
    res.status(200).json({status: "ok"})
})

app.use('/api/v1', approutes)

app.use(errorMiddleware)

server.listen(process.env.PORT, () => {
    console.log("Server is running on", process.env.PORT)
})