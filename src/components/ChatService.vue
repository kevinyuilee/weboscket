<template>
  <div class="chat-container">
    <div class="chat-header">
      <h3>即時聊天室</h3>
      <div class="user-info" v-if="currentUser">
        目前使用者: {{ currentUser.userName }}
      </div>
    </div>

    <div class="chat-messages" ref="messageContainer">
      <div v-for="message in messages" :key="message.id" 
           :class="['message', message.type, message.userId === currentUser?.userId ? 'mine' : '']">
        <div class="message-header">
          <span class="username">{{ message.userName }}</span>
          <span class="time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-content">{{ message.message }}</div>
      </div>
    </div>

    <div class="chat-input">
      <input 
        v-model="newMessage" 
        @keyup.enter="sendMessage"
        placeholder="請輸入訊息..."
        :disabled="!isConnected"
      >
      <button @click="sendMessage" :disabled="!isConnected">發送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  userName: {
    type: String,
    required: true
  }
})

const ws = ref(null)
const isConnected = ref(false)
const messages = ref([])
const newMessage = ref('')
const currentUser = ref({
  userId: Date.now().toString(),
  userName: props.userName
})
const messageContainer = ref(null)

const connectWebSocket = () => {
  ws.value = new WebSocket('ws://localhost:3000')

  ws.value.onopen = () => {
    isConnected.value = true
    // 註冊用戶
    ws.value.send(JSON.stringify({
      type: 'register',
      userId: currentUser.value.userId,
      userName: props.userName
    }))
  }

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    if (data.type === 'chat' || data.type === 'system') {
      messages.value.push(data)
      scrollToBottom()
    }
  }

  ws.value.onclose = () => {
    isConnected.value = false
    setTimeout(connectWebSocket, 3000) // 斷線重連
  }
}

const sendMessage = () => {
  if (!newMessage.value.trim() || !isConnected.value) return

  const message = {
    type: 'chat',
    userId: currentUser.value.userId,
    userName: currentUser.value.userName,
    message: newMessage.value.trim(),
    timestamp: new Date().toISOString()
  }

  try {
    ws.value.send(JSON.stringify(message))
    newMessage.value = ''
  } catch (error) {
    console.error('發送訊息失敗:', error)
  }
}

const scrollToBottom = () => {
  setTimeout(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  }, 100)
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws.value) {
    ws.value.close()
  }
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
}

.chat-header {
  padding: 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #000;
}

.chat-header h3 {
  margin: 0;
  color: #000;
}

.user-info {
  color: #000;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  max-width: 70%;
  padding: 0.5rem;
  border-radius: 8px;
  background: #f0f0f0;
  color: #000;
}

.message.mine {
  align-self: flex-end;
  background: #e3f2fd;
}

.message.system {
  align-self: center;
  background: #fff3e0;
  font-style: italic;
}

.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-bottom: 0.3rem;
  color: #333;
}

.message-content {
  word-break: break-word;
  color: #000;
}

.chat-input {
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.chat-input button {
  padding: 0.5rem 1rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
