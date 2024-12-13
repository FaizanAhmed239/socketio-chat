const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

// File paths for storing data
const ROOMS_FILE = './rooms.json';
const CHATS_FILE = './chats.json';

// Load or initialize data
function loadData(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(filePath));
}

function saveData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Load initial data
const rooms = loadData(ROOMS_FILE); // Room metadata
const chats = loadData(CHATS_FILE); // Chat messages

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve a simple client page for testing
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a room
    socket.on('joinRoom', ({ room, username }) => {
        socket.join(room);

        // Ensure the room exists in the rooms file
        if (!rooms[room]) {
            rooms[room] = { name: room, users: [] };
        }
        if (!rooms[room].users.includes(username)) {
            rooms[room].users.push(username);
            saveData(ROOMS_FILE, rooms);
        }

        console.log(`${username} joined room: ${room}`);

        // Send chat history of the room to the user
        const roomChats = chats[room] || [];
        socket.emit('chatHistory', roomChats);

        // Notify others in the room
        socket.to(room).emit('userJoined', { username, room });
    });

    // Handle chat messages
    socket.on('chatMessage', ({ room, username, message }) => {
        const chatMessage = { username, message, timestamp: new Date().toISOString() };

        // Save the message in the file
        if (!chats[room]) {
            chats[room] = [];
        }
        chats[room].push(chatMessage);
        saveData(CHATS_FILE, chats);

        // Broadcast the message to everyone in the room
        io.to(room).emit('chatMessage', chatMessage);
    });

    // Leave a room
    socket.on('leaveRoom', ({ room, username }) => {
        socket.leave(room);

        // Update room users
        if (rooms[room]) {
            rooms[room].users = rooms[room].users.filter((user) => user !== username);
            saveData(ROOMS_FILE, rooms);
        }

        console.log(`${username} left room: ${room}`);
        socket.to(room).emit('userLeft', { username, room });
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
