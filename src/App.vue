<template>
    <div class="chat-container">
        <div class="chat-header">
            <h2>Chat Room</h2>
        </div>
        <div class="chat-history" ref="chatHistory">
            <div v-for="message in messages" :key="message.id"
                :class="['message', message.sender === 'user' ? 'sent' : 'received']">
                <div class="message-content">
                    <span class="message-sender">{{ message.senderName }}:</span>
                    <p class="message-text">{{ message.text }}</p>
                </div>
                <span class="message-time">{{ message.timestamp }}</span>
            </div>
        </div>
        <div class="chat-input">
            <input type="text" v-model="newMessage" @keyup.enter="sendMessage"
                placeholder="Type your message here..." />
            <button @click="sendMessage">Send</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

interface Message {
    id: number;
    sender: 'user' | 'other';
    senderName: string;
    text: string;
    timestamp: string;
}

const messages = ref<Message[]>([
    { id: 1, sender: 'other', senderName: "Alice", text: 'Hello!', timestamp: '10:00 AM' },
    { id: 2, sender: 'user', senderName: "You", text: 'Hi Alice!', timestamp: '10:01 AM' },
    { id: 3, sender: 'other', senderName: "Bob", text: 'Hey everyone!', timestamp: '10:05 AM' },
    { id: 4, sender: 'user', senderName: "You", text: 'Hello bob', timestamp: '10:06 AM' },
    { id: 5, sender: 'other', senderName: "Alice", text: 'how are you?', timestamp: '10:08 AM' },
    { id: 6, sender: 'user', senderName: "You", text: 'great.', timestamp: '10:09 AM' },
]);

const newMessage = ref('');
const nextMessageId = ref(7);
const chatHistory = ref<HTMLElement | null>(null);

const sendMessage = () => {
    if (newMessage.value.trim() !== '') {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const time = `${hours}:${minutes}`;

        messages.value.push({
            id: nextMessageId.value++,
            sender: 'user',
            senderName: "You",
            text: newMessage.value,
            timestamp: time,
        });
        newMessage.value = '';
        scrollToBottom();
    }
};

const scrollToBottom = async () => {
    await nextTick(); // Wait for the DOM to update
    if (chatHistory.value) {
        chatHistory.value.scrollTop = chatHistory.value.scrollHeight;
    }
};

onMounted(() => {
    scrollToBottom();
});
</script>

<style scoped>
.chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: #f4f4f4;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    /* Important for rounded corners */
}

.chat-header {
    background-color: #3498db;
    color: #fff;
    padding: 10px;
    text-align: center;
}

.chat-history {
    flex-grow: 1;
    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.message {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    padding: 10px;
    margin-bottom: 5px;
    border-radius: 10px;
}

.message.sent {
    align-self: flex-end;
    background-color: #dcf8c6;
}

.message.received {
    align-self: flex-start;
    background-color: #fff;
}

.message-content {
    display: flex;
    gap: 5px;
}

.message-time {
    font-size: 0.75rem;
    color: #777;
    text-align: right;
}

.message-sender {
    font-weight: bold;
}

.chat-input {
    display: flex;
    padding: 10px;
    gap: 10px;
}

.chat-input input {
    flex-grow: 1;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
}

.chat-input button {
    background-color: #3498db;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}
</style>
