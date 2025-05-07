require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

let liveChatId = null;
let cachedMessages = [];

const fetchLiveChatId = async () => {
  try {
    const res = await axios.get(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts`,
      {
        params: {
          part: 'snippet',
          broadcastStatus: 'active',
          broadcastType: 'all',
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );
    const broadcast = res.data.items[0];
    if (broadcast) {
      const videoId = broadcast.id;
      const videoRes = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'liveStreamingDetails',
            id: videoId,
            key: process.env.YOUTUBE_API_KEY
          }
        }
      );
      liveChatId = videoRes.data.items[0]?.liveStreamingDetails?.activeLiveChatId;
    }
  } catch (err) {
    console.error('Failed to fetch liveChatId', err.message);
  }
};

const fetchChatMessages = async () => {
  if (!liveChatId) return;
  try {
    const res = await axios.get(
      `https://www.googleapis.com/youtube/v3/liveChat/messages`,
      {
        params: {
          part: 'snippet,authorDetails',
          liveChatId,
          key: process.env.YOUTUBE_API_KEY
        }
      }
    );
    cachedMessages = res.data.items.map(msg => ({
      author: msg.authorDetails.displayName,
      text: msg.snippet.displayMessage
    }));
  } catch (err) {
    console.error('Failed to fetch chat messages', err.message);
  }
};

// Refresh chat ID & messages every 15 seconds
setInterval(async () => {
  if (!liveChatId) await fetchLiveChatId();
  if (liveChatId) await fetchChatMessages();
}, 15000);

app.get('/chat/youtube', (req, res) => {
  res.json(cachedMessages);
});

app.listen(PORT, () => {
  console.log(`YouTube chat backend running on port ${PORT}`);
});
