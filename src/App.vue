<template>
    <div class="chat-container">
        <div class="chat-header">
            <h2>Ollama Gemma3</h2>
        </div>
        <div class="chat-history" ref="chatHistory">
            <div v-for="message in messages" :key="message.id" :class="['message', message.type === 'hr' ? 'hr' :
                message.sender === 'user' ? 'sent' : 'received']">
                <template v-if="message.type === 'hr'">
                    <hr class="message-divider">
                </template>
                <template v-else>
                    <div class="message-content">
                        <span class="message-sender">{{ message.senderName }}:</span>
                        <p class="message-text" v-html="renderMarkdown(message.text)"></p>
                    </div>
                    <span class="message-time">{{ message.timestamp }}</span>
                </template>
            </div>
            <div :class="['message', 'received']" v-if="newAgegntMessage && newAgegntMessage.text">
                <div class="message-content">
                    <span class="message-sender">{{ newAgegntMessage.senderName }}:</span>
                    <p class="message-text" v-html="renderMarkdown(newAgegntMessage.text)"></p>
                </div>
                <span class="message-time">{{ newAgegntMessage.timestamp }}</span>
            </div>
            <div v-if="loading" class="thinking-animation">
                <div class="dots">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        </div>
        <div class="chat-input">
            <input type="text" :disabled="running" v-model="newMessage" @keyup.enter="sendMessage"
                placeholder="Type your message here..." />
            <button :disabled="running" @click="sendMessage" :class="{ 'disabled-button': running }">Send</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import convert from "telegramify-markdown";
import { ref, onMounted, nextTick } from 'vue';
import MarkdownIt from 'markdown-it';
import { AIAgent } from './QAgent'
import { pageDown, send2Telegram } from "./ElectronWindow.ts"
interface Message {
    id: number;
    sender: 'user' | 'other';
    senderName: string;
    text: string;
    timestamp: string;
    type?: string;
}

const agent = new AIAgent()
const messages = ref<Message[]>([
]);
const newMessage = ref('');
const newAgegntMessage = ref<Message>(null);
const nextMessageId = ref(7);
const loading = ref(false)
const running = ref(false)
const chatHistory = ref<HTMLElement | null>(null);
const md = new MarkdownIt();
const renderMarkdown = (text) => {
    return md.render(text);
};

window.myAPI.on("tg-text", async (event, text) => {
    if (running.value) {
        if (text.trim() == "cancel") {
            await agent.cancel()
            send2Telegram({
                path: "/sendMessage",
                body: {
                    text: convert("canceling, please be patient", "escape"),
                    parse_mode: "MarkdownV2",
                }
            })
        } else {
            send2Telegram({
                path: "/sendMessage",
                body: {
                    text: convert("busy, send 'cancel' to cancel", "escape"),
                    parse_mode: "MarkdownV2",
                }
            })
        }
        return;
    }
    running.value = true
    try {
        await agent.task(text, (type, msg = "", role = "agent", done = false) => {
            running.value = type !== 'done'
            if (type == 'thinking') {
                send2Telegram({
                    path: "/sendChatAction",
                    body: {
                        action: "typing"
                    }
                })
            } else if (done) {
                send2Telegram({
                    path: "/sendMessage",
                    body: {
                        text: convert(msg, "escape"),
                        parse_mode: "MarkdownV2",
                    }
                })
            }
        })
    } catch (err) {
        send2Telegram({
            path: "/sendMessage",
            body: {
                text: convert(`Error:${err.message}`, "escape"),
                parse_mode: "MarkdownV2",
            }
        })
    }
})

const sendMessage = () => {
    if (newMessage.value.trim() !== '') {
        running.value = true
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
        scrollToBottom();
        agent.task(newMessage.value, (type, msg = "", role = "agent", done = false) => {
            loading.value = type == 'thinking'
            //running 代表整个请求的结束
            running.value = type !== 'done'
            if (!running.value) {
                messages.value.push({
                    id: nextMessageId.value++,
                    type: "hr",
                    text: ""
                })
            }
            console.log("loading set to", loading.value, type)
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const time = `${hours}:${minutes}`;
            newAgegntMessage.value = {
                id: -1,
                sender: 'other',
                senderName: "Agent",
                text: msg,
                timestamp: time,
            }
            //done参数代表单轮运行的结束
            if (done) {
                messages.value.push({
                    id: nextMessageId.value++,
                    sender: role === 'user' ? 'user' : 'other',
                    senderName: "Agent",
                    text: msg,
                    timestamp: time,
                })
                newAgegntMessage.value = null;
            }
            scrollToBottom();
        });
        newMessage.value = '';
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

.hr {
    max-width: 100%;
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

.chat-input button.disabled-button {
    background-color: #cccccc;
    /* Grey background */
    color: #666666;
    /* Dark grey text */
    cursor: default;
    /* Change cursor to default */
}

/* Animation styles */
.thinking-animation {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.dots {
    display: flex;
    gap: 0.2rem;
}

.dot {
    width: 0.5rem;
    height: 0.5rem;
    background-color: #777;
    border-radius: 50%;
    animation: bounce 1s ease-in-out infinite;
}

.dot:nth-child(2) {
    animation-delay: 0.2s;
}

.dot:nth-child(3) {
    animation-delay: 0.4s;
}

.thinking-text {
    color: #777;
    font-size: 0.9rem;
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-0.5rem);
    }
}

/* divider styles */
.message-divider {
    width: 99%;
    margin: 10px auto;
    border: none;
    border-top: 1px solid #ddd;
}

.message-text {
    word-break: break-all;
}
</style>
