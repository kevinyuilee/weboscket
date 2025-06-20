# WebSocket 聊天室與檔案分享系統

這是一個基於 WebSocket 技術的即時聊天室和檔案分享系統，使用 Vue.js 作為前端框架，Node.js 和 Express 作為後端服務器。

## 功能特點

- 即時聊天功能
  - 支援多人同時在線聊天
  - 顯示用戶加入/離開聊天室的系統訊息
  - 即時訊息推送

- 檔案管理功能
  - 檔案上傳與下載
  - 檔案列表即時更新
  - 檔案刪除功能
  - 顯示檔案大小和建立時間

## 系統需求

- Node.js 14.0 或更高版本
- npm 或 yarn 套件管理器

## 安裝步驟

1. 克隆專案後，分別安裝前端和後端依賴：

```bash
# 安裝前端依賴
npm install

# 進入後端目錄
cd server
npm install
```

2. 建立 uploads 資料夾（如果不存在）：
伺服器會自動在 server 目錄下建立 uploads 資料夾。

## 啟動應用

1. 啟動後端伺服器：

```bash
cd server
node server.js
```

2. 在另一個終端機視窗中啟動前端開發伺服器：

```bash
npm run dev
```

伺服器預設運行在 http://localhost:3000

## API 端點

### WebSocket 事件

- `connection`: 客戶端連接時觸發
- `message`: 接收訊息，支援以下類型：
  - `register`: 用戶註冊
  - `chat`: 聊天訊息
  - `file`: 檔案上傳

### HTTP API

- `GET /files`: 獲取檔案列表
- `GET /download/:filename`: 下載指定檔案
- `DELETE /files/:filename`: 刪除指定檔案

## 安全性注意事項

- 檔案上傳功能應該限制檔案大小和類型
- 建議在生產環境中加入用戶認證機制
- 建議加入檔案存取權限控制

## 技術堆疊

- 前端：Vue.js、WebSocket
- 後端：Node.js、Express、ws（WebSocket）
- 檔案處理：Node.js fs 模組

## 授權

MIT 授權
