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

// Fetch the liveChatId at runtime when the app starts
(async () => {
  const apiKey = process.env.YOUTUBE_API_KEY; // Load from .env file
  const liveChatId = await fetchLiveChatId(apiKey);

  if (liveChatId) {
    console.log('Active YouTube Live Chat ID:', liveChatId);
    // You can save this liveChatId to a global variable or use it in your app
  } else {
    console.log('Failed to fetch liveChatId.');
  }
})();
