// VoiceTube Control - Background Service Worker (Manifest V3)

let activeYouTubeTabId = null;
let lastKnownPlayerState = {
  playbackState: 'paused',
  volume: 100,
  muted: false,
  playbackRate: 1.0,
  currentTime: 0,
  duration: 0,
  videoTitle: 'No video playing',
  timestamp: Date.now()
};

// Find and track open YouTube tabs
async function updateYouTubeTabs() {
  try {
    const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
    if (tabs.length > 0) {
      // Find active tab or first tab with video
      const activeTab = tabs.find(t => t.active) || tabs[0];
      activeYouTubeTabId = activeTab.id;
      return { connected: true, tabCount: tabs.length, activeTabId: activeTab.id, title: activeTab.title };
    }
    activeYouTubeTabId = null;
    return { connected: false, tabCount: 0, activeTabId: null, title: '' };
  } catch (err) {
    console.error('Error finding YouTube tabs:', err);
    return { connected: false, tabCount: 0, activeTabId: null, title: '' };
  }
}

// Forward command to YouTube tab
async function executeCommandOnYouTube(commandPayload) {
  const ytStatus = await updateYouTubeTabs();
  if (!ytStatus.connected || !activeYouTubeTabId) {
    return {
      success: false,
      error: 'No active YouTube tab found. Please open youtube.com and play a video.'
    };
  }

  try {
    const response = await chrome.tabs.sendMessage(activeYouTubeTabId, {
      type: 'EXECUTE_VOICETUBE_COMMAND',
      payload: commandPayload
    });
    if (response && response.state) {
      lastKnownPlayerState = response.state;
    }
    return response || { success: true };
  } catch (err) {
    console.error('Error sending message to YouTube tab:', err);
    // Try injecting content script if not ready
    try {
      await chrome.scripting.executeScript({
        target: { tabId: activeYouTubeTabId },
        files: ['content-youtube.js']
      });
      // Retry once
      const retryResponse = await chrome.tabs.sendMessage(activeYouTubeTabId, {
        type: 'EXECUTE_VOICETUBE_COMMAND',
        payload: commandPayload
      });
      return retryResponse || { success: true };
    } catch (injectErr) {
      return {
        success: false,
        error: 'Could not communicate with YouTube player. Refresh the YouTube tab.'
      };
    }
  }
}

// Listen for messages from content scripts and external web pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    updateYouTubeTabs().then(status => {
      sendResponse({
        extensionReady: true,
        youtubeConnected: status.connected,
        youtubeTabCount: status.tabCount,
        playerState: lastKnownPlayerState,
        activeTabTitle: status.title
      });
    });
    return true; // async response
  }

  if (message.type === 'YOUTUBE_STATE_UPDATE') {
    lastKnownPlayerState = { ...lastKnownPlayerState, ...message.state, timestamp: Date.now() };
    // Broadcast to web app bridge tabs
    chrome.tabs.query({}).then(allTabs => {
      allTabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'VOICETUBE_STATE_BROADCAST',
          state: lastKnownPlayerState
        }).catch(() => {});
      });
    });
    sendResponse({ success: true });
    return false;
  }

  if (message.type === 'EXECUTE_COMMAND') {
    executeCommandOnYouTube(message.payload).then(result => {
      sendResponse(result);
    });
    return true; // async response
  }
});

// Also support externally_connectable for direct web app connection
chrome.runtime.onMessageExternal?.addListener((message, sender, sendResponse) => {
  if (message.type === 'PING') {
    updateYouTubeTabs().then(status => {
      sendResponse({
        extensionReady: true,
        youtubeConnected: status.connected,
        playerState: lastKnownPlayerState,
        tabTitle: status.title
      });
    });
    return true;
  }

  if (message.type === 'EXECUTE_COMMAND') {
    executeCommandOnYouTube(message.payload).then(res => sendResponse(res));
    return true;
  }
});
