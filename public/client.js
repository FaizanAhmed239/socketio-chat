const socket = io();

const roomForm = document.getElementById('roomForm');
const roomInput = document.getElementById('roomInput');
const usernameInput = document.getElementById('usernameInput');
const chat = document.getElementById('chat');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');

let room = '';
let username = '';

// Join room
roomForm.addEventListener('submit', (e) => {
    e.preventDefault();
    room = roomInput.value.trim();
    username = usernameInput.value.trim();

    if (room && username) {
        socket.emit('joinRoom', { room, username });
        roomForm.style.display = 'none';
        chat.style.display = 'block';
    }
});

// Receive chat history
socket.on('chatHistory', (history) => {
    messages.innerHTML = '';
    history.forEach(({ username, message, timestamp }) => {
        addMessage(username, message, new Date(timestamp));
    });
});

// Receive new chat messages
socket.on('chatMessage', ({ username, message, timestamp }) => {
    addMessage(username, message, new Date(timestamp));
});

// Handle chat form submission
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chatMessage', { room, username, message });
        messageInput.value = '';
    }
});

// Utility to add messages
function addMessage(username, message, timestamp) {
    const item = document.createElement('li');
    item.textContent = `[${timestamp.toLocaleTimeString()}] ${username}: ${message}`;
    messages.appendChild(item);
}