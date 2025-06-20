const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 存儲在線用戶
const clients = new Map();

// 啟用 CORS
app.use(cors());

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 獲取檔案列表的 API
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      res.status(500).json({ error: '無法讀取檔案列表' });
      return;
    }

    // 獲取每個檔案的詳細資訊
    const fileDetails = files.map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });

    res.json(fileDetails);
  });
});

// 檔案下載的 API
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  // 檢查檔案是否存在
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '檔案不存在' });
    return;
  }

  res.download(filePath);
});

// 新增刪除檔案的 API
app.delete('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: '檔案不存在' });
    return;
  }

  try {
    fs.unlinkSync(filePath);

    // 廣播給所有 WebSocket 客戶端更新檔案列表
    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'fileList',
          files: files
        }));
      }
    });

    res.json({ message: '檔案已成功刪除' });
  } catch (error) {
    console.error('刪除檔案時發生錯誤:', error);
    res.status(500).json({ error: '刪除檔案時發生錯誤' });
  }
});

// WebSocket 處理
wss.on('connection', (ws) => {
  console.log('Client connected');

  // 為每個連接生成唯一ID
  const clientId = Date.now().toString();

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch(data.type) {
        case 'file':
          // 原有的文件處理邏輯
          const base64Data = data.content.split(';base64,').pop();
          const buffer = Buffer.from(base64Data, 'base64');

          const filePath = path.join(uploadDir, data.filename);
          await fs.promises.writeFile(filePath, buffer);

          console.log(`File saved: ${data.filename}`);

          // 發送確認訊息
          ws.send(JSON.stringify({
            type: 'file',
            filename: data.filename,
            status: 'received'
          }));

          // 更新檔案列表
          broadcastFileList();
          break;

        case 'chat':
          // 處理聊天訊息
          const chatMessage = {
            type: 'chat',
            id: Date.now(),
            userId: data.userId,
            userName: data.userName,
            message: data.message,
            timestamp: data.timestamp
          };

          // 廣播訊息給所有連接的客戶端
          broadcastMessage(chatMessage);
          break;

        case 'register':
          // 註冊新用戶
          clients.set(clientId, {
            ws,
            userId: data.userId,
            userName: data.userName
          });

          // 發送歡迎訊息
          broadcastMessage({
            type: 'system',
            id: Date.now(),
            message: `${data.userName} 加入了聊天室`,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing message'
      }));
    }
  });

  // 當客戶端斷開連接
  ws.on('close', () => {
    console.log('Client disconnected');
    const client = clients.get(clientId);
    if (client) {
      // 發送離開訊息
      broadcastMessage({
        type: 'system',
        id: Date.now(),
        message: `${client.userName} 離開了聊天室`,
        timestamp: new Date().toISOString()
      });
      clients.delete(clientId);
    }
  });

  // 發送當前檔案列表
  const files = fs.readdirSync(uploadDir).map(filename => {
    const filePath = path.join(uploadDir, filename);
    const stats = fs.statSync(filePath);
    return {
      name: filename,
      size: stats.size,
      createdAt: stats.birthtime
    };
  });
  ws.send(JSON.stringify({ type: 'fileList', files }));
});

// 廣播檔案列表給所有客戶端
function broadcastFileList() {
  const files = fs.readdirSync(uploadDir).map(filename => {
    const filePath = path.join(uploadDir, filename);
    const stats = fs.statSync(filePath);
    return {
      name: filename,
      size: stats.size,
      createdAt: stats.birthtime
    };
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'fileList',
        files: files
      }));
    }
  });
}

// 廣播聊天訊息給所有客戶端
function broadcastMessage(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
