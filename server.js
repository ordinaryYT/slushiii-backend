const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const tmi = require('tmi.js');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let clients = [];

// WebSocket connection
wss.on('connection', ws => {
  clients.push(ws);
  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

// Twitch setup
const twitchClient = new tmi.Client({
  channels: [process.env.TWITCH_CHANNEL],
});

twitchClient.connect();

twitchClient.on('message', (channel, tags, message, self) => {
  const chatMsg = {
    platform: 'twitch',
    username: tags['display-name'],
    message,
  };
  broadcast(chatMsg);
});

// YouTube polling
let nextPageToken = '';

async function pollYouTubeChat() {
  try {
    const res = await axios.get('https://www.googleapis.com/youtube/v3/liveChat/messages', {
      params: {
        liveChatId: process.env.YOUTUBE_CHAT_ID,
        part: 'snippet,authorDetails',
        key: process.env.YOUTUBE_API_KEY,
        pageToken: nextPageToken,
      },
    });

    nextPageToken = res.data.nextPageToken;

    for (const item of res.data.items) {
      const chatMsg = {
        platform: 'youtube',
        username: item.authorDetails.displayName,
        message: item.snippet.displayMessage,
      };
      broadcast(chatMsg);
    }
  } catch (e) {
    console.error('YouTube Poll Error:', e.message);
  }

  setTimeout(pollYouTubeChat, 3000);
}

pollYouTubeChat();

function broadcast(msg) {
  const data = JSON.stringify(msg);
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

server.listen(process.env.PORT || 8080, () => {
  console.log('Server started on port', process.env.PORT || 8080);
});
