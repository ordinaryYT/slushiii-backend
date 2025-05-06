const axios = require('axios');
require('dotenv').config();

// Function to fetch Live Chat ID from YouTube
async function fetchLiveChatId(apiKey) {
  try {
    // Step 1: Fetch active live broadcasts
    const broadcasts = await axios.get('https://www.googleapis.com/youtube/v3/liveBroadcasts', {
      params: {
        part: 'snippet',
        broadcastStatus: 'active',
        key: apiKey,
      },
    });

    // Step 2: Get the Broadcast ID of the active stream
    const broadcastId = broadcasts.data.items[0]?.id;
    if (!broadcastId) {
      console.log('❌ No active broadcast found.');
      return null;
    }

    // Step 3: Fetch live chat ID from the video
    const videoDetails = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'liveStreamingDetails',
        id: broadcastId,
        key: apiKey,
      },
    });

    // Step 4: Extract liveChatId from the response
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

// Global variable to store the active liveChatId
let liveChatId = null;

// Function to fetch liveChatId every 5 minutes
setInterval(async () => {
  const apiKey = process.env.YOUTUBE_API_KEY; // Get API key from .env file
  liveChatId = await fetchLiveChatId(apiKey);

  if (liveChatId) {
    console.log('Active YouTube Live Chat ID:', liveChatId);
    // You can store the liveChatId in a database or memory if needed
    // Example: saveToDatabase(liveChatId); // Or pass it to your frontend via an API endpoint
  }
}, 300000); // 5 minutes (in milliseconds)

// Example Express server to serve the liveChatId to your frontend
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// API endpoint to send liveChatId to frontend
app.get('/api/live-chat-id', (req, res) => {
  if (liveChatId) {
    res.json({ liveChatId });
  } else {
    res.status(404).json({ message: 'No active live chat found.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
