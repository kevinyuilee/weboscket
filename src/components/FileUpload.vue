<template>
  <div class="file-upload">
    <h2>檔案上傳</h2>
    <div class="upload-container">
      <input type="file" @change="handleFileSelect" multiple>
      <div class="file-list" v-if="files.length > 0">
        <h3>已選擇的檔案：</h3>
        <ul>
          <li v-for="file in files" :key="file.name">
            {{ file.name }} - {{ formatFileSize(file.size) }}
          </li>
        </ul>
        <button @click="uploadFiles" :disabled="!files.length">上傳檔案</button>
      </div>
    </div>
    <!-- 已上傳檔案列表 -->
    <div class="uploaded-files">
      <h3>已上傳的檔案：</h3>
      <div class="file-grid">
        <div v-for="file in uploadedFiles" :key="file.name" class="file-item">
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
            <span class="file-date">{{ formatDate(file.createdAt) }}</span>
          </div>
          <div class="file-actions">
            <button @click="downloadFile(file.name)" class="download-btn">下載</button>
            <button @click="deleteFile(file.name)" class="delete-btn">刪除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const ws = ref<WebSocket | null>(null)
const files = ref<File[]>([])
const receivedFiles = ref<Array<{ filename: string }>>([])
const uploadedFiles = ref<Array<{ name: string, size: number, createdAt: string }>>([])

// WebSocket 連接
const connectWebSocket = () => {
  ws.value = new WebSocket('ws://localhost:3000')

  ws.value.onopen = () => {
    console.log('Connected to WebSocket server')
  }

  ws.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'file') {
        receivedFiles.value.push({
          filename: data.filename
        })
      }
      if (data.type === 'fileList') {
        uploadedFiles.value = data.files
      }
    } catch (error) {
      console.error('Error parsing message:', error)
    }
  }

  ws.value.onclose = () => {
    console.log('Disconnected from WebSocket server')
    // 嘗試重新連接
    setTimeout(connectWebSocket, 3000)
  }
}

// 選擇檔案
const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    files.value = Array.from(input.files)
  }
}

// 格式化檔案大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 下載檔案
const downloadFile = (filename: string) => {
  window.open(`http://localhost:3000/download/${filename}`, '_blank')
}

// 刪除檔案
const deleteFile = async (filename: string) => {
  if (!confirm(`確定要刪除檔案 "${filename}" 嗎？`)) {
    return
  }

  try {
    const response = await fetch(`http://localhost:3000/files/${filename}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '刪除檔案失敗')
    }

    console.log('檔案已成功刪除')
  } catch (error) {
    console.error('刪除檔案時發生錯誤:', error)
    alert('刪除檔案時發生錯誤')
  }
}

// 上傳檔案
const uploadFiles = async () => {
  if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
    alert('WebSocket 連接未建立')
    return
  }

  for (const file of files.value) {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        ws.value?.send(JSON.stringify({
          type: 'file',
          filename: file.name,
          content: e.target.result
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  // 清空選擇的檔案
  files.value = []
}

// 元件掛載時建立 WebSocket 連接
onMounted(() => {
  connectWebSocket()
})

// 元件卸載時關閉 WebSocket 連接
onUnmounted(() => {
  ws.value?.close()
})
</script>

<style scoped>
.file-upload {
  padding: 20px;
}

.upload-container {
  margin: 20px 0;
  padding: 20px;
  border: 2px dashed #ccc;
  border-radius: 8px;
}

.file-list {
  margin-top: 20px;
}

.file-list ul, .received-files ul {
  list-style: none;
  padding: 0;
}

.file-list li, .received-files li {
  margin: 8px 0;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #000; /* 設定文字顏色為黑色 */
}

button {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.uploaded-files {
  margin-top: 20px;
}

.file-grid {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  color: #000;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: bold;
}

.file-size, .file-date {
  font-size: 0.9em;
  color: #666;
}

.file-actions {
  display: flex;
  gap: 8px;
}

.download-btn {
  margin: 0;
  background-color: #2196F3;
}

.download-btn:hover {
  background-color: #1976D2;
}

.delete-btn {
  margin: 0;
  background-color: #f44336;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.received-files {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
</style>
