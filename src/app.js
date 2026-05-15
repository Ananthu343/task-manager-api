const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express')
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const approutes = require('../src/routes')
const db = require('./config/db');

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
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

    // Listen for progress updates from external worker services
    socket.on('download_progress', async (data) => {
        // data expects: { reportId, tenantId, progress }
        console.log("getting download progress....", data)
        if (data.tenantId && data.reportId) {
            // Broadcast to the specific tenant's frontend clients
            io.to(`tenant_${data.tenantId}`).emit('download_progress', data);
            
            // Persist the progress in the database
            try {
                const query = `UPDATE report_history SET progress = $1, status = 'processing' WHERE id = $2 AND tenant_id = $3`;
                await db.query(query, [data.progress, data.reportId, data.tenantId]);
            } catch (err) {
                console.error('Failed to update report progress:', err.message);
            }
        }
    });

    // Listen for completion from external worker services
    socket.on('report_completed', async (data) => {
        console.log("download completed....", data)
        // data expects: { reportId, tenantId, link }
        if (data.tenantId && data.reportId) {
            // Broadcast the completion to frontend clients
            io.to(`tenant_${data.tenantId}`).emit('report_completed', data);        
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.set('io', io);

app.use(cors({
    origin: ['https://task-manager.in', 'http://task-manager.in'],
    credentials: true
}));
app.use(express.json())

app.get('/health', (req,res) => {
    res.status(200).json({status: "ok"})
})

app.use('/api/v1', approutes)

app.use(errorMiddleware)

const PORT = process.env.PORT || 5000;

db.connectDB().then(() => {
    server.listen(PORT, '0.0.0.0', () => { // Adding '0.0.0.0' is crucial for Docker/Render
        console.log(`🚀 Server running on port ${PORT}`);
    });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    pool.end();
    console.log('HTTP server closed');
  });
});