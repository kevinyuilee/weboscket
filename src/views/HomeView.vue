<script setup lang="ts">
import { ref } from 'vue'
import FileUpload from '../components/FileUpload.vue'
import ChatService from '../components/ChatService.vue'

const userName = ref('')
const inputName = ref('')

const joinChat = () => {
  if (inputName.value.trim()) {
    userName.value = inputName.value.trim()
  }
}
</script>

<template>
  <main>
    <div class="home-container">
      <div class="upload-section">
        <FileUpload />
      </div>

      <div class="chat-section">
        <div v-if="!userName" class="join-chat">
          <h3>加入聊天室您是否要考慮一下呢???????????????????????????我的豆花三十塊</h3>
          <div class="input-group">
            <input
              v-model="inputName"
              @keyup.enter="joinChat"
              placeholder="請輸入您的名稱"
            >
            <button @click="joinChat">加入</button>
          </div>
        </div>

        <ChatService
          v-else
          :userName="userName"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-container {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.upload-section {
  flex: 1;
}

.chat-section {
  flex: 1;
}

.join-chat {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  text-align: center;
}

.join-chat h3 {
  color: #000;
  margin-bottom: 1rem;
}

.input-group {
  display: flex;
  gap: 0.5rem;
}

.input-group input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.input-group button {
  padding: 0.5rem 1rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.input-group button:hover {
  background: #1565c0;
}
</style>
