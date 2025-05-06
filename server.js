const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

// Function to fetch live chat ID from YouTube
async function fetchLiveChatId(apiKey) {
  try {
    const broadcasts = await axios.get('https://www.googleapis.com/youtube/v3/liveBroadcasts', {
      params: {
        part: 'snippet',
        broadcastStatus: 'active',
        key: apiKey,
      },
    });

    const broadcastId = broadcasts.data.items[0]?.id;
    if (!broadcastId) {
      console.log('❌ No active broadcast found.');
      return null;
    }

    const videoDetails = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'liveStreamingDetails',
        id: broadcastId,
        key: apiKey,
      },
    });

    const liveChatId = videoDetails.data.items[0]?.liveStreamingDetails?.activeLiveChatId;
    if (liveChatId) {
      console.log('✅ Found liveChatId:', liveChatId);
      return liveChatId;
    } else {
      console.log('❌ No live chat ID found for the active broadcast.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching liveChatId:', error);
    return null;
  }
}

// Endpoint to return liveChatId to the frontend
app.get('/api/live-chat-id', async (req, res) => {
  const apiKey = process.env.YOUTUBE_API_KEY; // Get from .env file
  const liveChatId = await fetchLiveChatId(apiKey);

  if (liveChatId) {
    res.json({ liveChatId });
  } else {
    res.status(404).json({ message: 'No active live chat found.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
