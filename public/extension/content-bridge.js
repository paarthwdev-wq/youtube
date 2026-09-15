// VoiceTube Control - Content Bridge Script
// Injected into web application pages to bridge browser extension API with the Web App

(function () {
  console.log('[VoiceTube Bridge] Content script initialized on web app page');

  // Let the web application know the extension is present immediately
  function announceExtension() {
    window.postMessage({ type: 'VOICETUBE_EXTENSION_PONG', installed: true, version: '1.0.0' }, '*');
    window.dispatchEvent(new CustomEvent('voicetube:extension-ready', { detail: { ready: true } }));
  }

  // Ping background to get status
  function pingBackground() {
    try {
      chrome.runtime.sendMessage({ type: 'PING' }, response => {
        if (chrome.runtime.lastError) {
          window.postMessage({
            type: 'VOICETUBE_EXTENSION_STATUS',
            installed: true,
            youtubeConnected: false,
            error: chrome.runtime.lastError.message
          }, '*');
          return;
        }
        if (response) {
          window.postMessage({
            type: 'VOICETUBE_EXTENSION_STATUS',
            installed: true,
            youtubeConnected: response.youtubeConnected,
            youtubeTabCount: response.youtubeTabCount,
            playerState: response.playerState,
            tabTitle: response.activeTabTitle
          }, '*');
        }
      });
    } catch (err) {
      console.warn('[VoiceTube Bridge] Ping error:', err);
    }
  }

  // Listen for messages from web application
  window.addEventListener('message', event => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.type === 'VOICETUBE_EXTENSION_PING') {
      announceExtension();
      pingBackground();
    }

    if (event.data.type === 'VOICETUBE_EXECUTE_COMMAND') {
      const payload = event.data.payload;
      const requestId = event.data.requestId;

      try {
        chrome.runtime.sendMessage({
          type: 'EXECUTE_COMMAND',
          payload: payload
        }, response => {
          const err = chrome.runtime.lastError;
          window.postMessage({
            type: 'VOICETUBE_COMMAND_RESULT',
            requestId: requestId,
            result: err ? { success: false, error: err.message } : response
          }, '*');
        });
      } catch (e) {
        window.postMessage({
          type: 'VOICETUBE_COMMAND_RESULT',
          requestId: requestId,
          result: { success: false, error: e.message }
        }, '*');
      }
    }
  });

  // Listen for state broadcast from background
  chrome.runtime.onMessage.addListener(message => {
    if (message.type === 'VOICETUBE_STATE_BROADCAST') {
      window.postMessage({
        type: 'VOICETUBE_STATE_UPDATE',
        state: message.state
      }, '*');
    }
  });

  // Initial announcement and periodic sync
  announceExtension();
  pingBackground();
  setInterval(pingBackground, 2500);
})();
