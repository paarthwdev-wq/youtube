// VoiceTube Control - YouTube Content Script
(function () {
  console.log('[VoiceTube] YouTube content script loaded');

  function getVideoElement() {
    return document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  function getPlayerState() {
    const video = getVideoElement();
    if (!video) {
      return {
        detected: false,
        playbackState: 'none',
        volume: 100,
        muted: false,
        playbackRate: 1.0,
        currentTime: 0,
        duration: 0,
        videoTitle: document.title.replace(' - YouTube', '').trim()
      };
    }

    return {
      detected: true,
      playbackState: video.paused ? 'paused' : 'playing',
      volume: Math.round(video.volume * 100),
      muted: video.muted,
      playbackRate: video.playbackRate,
      currentTime: Math.round(video.currentTime),
      duration: Math.round(video.duration || 0),
      videoTitle: document.title.replace(' - YouTube', '').trim()
    };
  }

  function notifyStateUpdate() {
    try {
      chrome.runtime.sendMessage({
        type: 'YOUTUBE_STATE_UPDATE',
        state: getPlayerState()
      }).catch(() => {});
    } catch (e) {
      // ignore
    }
  }

  // Hook event listeners to video element
  function attachVideoListeners() {
    const video = getVideoElement();
    if (!video) return;

    video.removeEventListener('play', notifyStateUpdate);
    video.removeEventListener('pause', notifyStateUpdate);
    video.removeEventListener('volumechange', notifyStateUpdate);
    video.removeEventListener('ratechange', notifyStateUpdate);

    video.addEventListener('play', notifyStateUpdate);
    video.addEventListener('pause', notifyStateUpdate);
    video.addEventListener('volumechange', notifyStateUpdate);
    video.addEventListener('ratechange', notifyStateUpdate);
  }

  // Attach periodically or upon DOM mutation
  attachVideoListeners();
  setInterval(attachVideoListeners, 3000);
  setInterval(notifyStateUpdate, 2000);

  // Execute Commands
  function executeCommand(payload) {
    const video = getVideoElement();
    if (!video) {
      return {
        success: false,
        error: 'YouTube video player not found on active tab.'
      };
    }

    const { intent, value, amount } = payload;
    let actionDescription = '';

    switch (intent) {
      case 'PLAY':
        video.play().catch(e => {
          console.warn('[VoiceTube] Play error:', e);
          // Try simulating keypress 'k'
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', keyCode: 75, bubbles: true }));
        });
        actionDescription = 'YouTube playing';
        break;

      case 'PAUSE':
        video.pause();
        actionDescription = 'YouTube paused';
        break;

      case 'MUTE':
        video.muted = true;
        actionDescription = 'YouTube muted';
        break;

      case 'UNMUTE':
        video.muted = false;
        if (video.volume === 0) video.volume = 0.5;
        actionDescription = 'YouTube unmuted';
        break;

      case 'VOLUME_UP': {
        const step = (amount !== undefined ? amount : 10) / 100;
        const newVol = Math.min(1.0, Math.max(0, video.volume + step));
        video.volume = Number(newVol.toFixed(2));
        if (video.muted) video.muted = false;
        actionDescription = `Volume increased to ${Math.round(video.volume * 100)}%`;
        break;
      }

      case 'VOLUME_DOWN': {
        const step = (amount !== undefined ? amount : 10) / 100;
        const newVol = Math.max(0, video.volume - step);
        video.volume = Number(newVol.toFixed(2));
        actionDescription = `Volume decreased to ${Math.round(video.volume * 100)}%`;
        break;
      }

      case 'SET_VOLUME': {
        const target = Math.min(100, Math.max(0, Number(value)));
        video.volume = target / 100;
        if (video.muted && target > 0) video.muted = false;
        actionDescription = `Volume set to ${target}%`;
        break;
      }

      case 'SPEED_UP': {
        const step = (amount !== undefined ? amount : 0.25);
        const currentSpeed = video.playbackRate || 1.0;
        const newSpeed = Number((currentSpeed + step).toFixed(2));
        if (newSpeed > 4.0) {
          return {
            success: false,
            error: 'Maximum playback speed reached (4.0x)',
            state: getPlayerState()
          };
        }
        video.playbackRate = newSpeed;
        actionDescription = `Speed increased to ${newSpeed}x`;
        break;
      }

      case 'SPEED_DOWN': {
        const step = (amount !== undefined ? amount : 0.25);
        const currentSpeed = video.playbackRate || 1.0;
        const newSpeed = Number(Math.max(0.25, currentSpeed - step).toFixed(2));
        video.playbackRate = newSpeed;
        actionDescription = `Speed decreased to ${newSpeed}x`;
        break;
      }

      case 'SET_SPEED': {
        const targetSpeed = Number(value);
        if (isNaN(targetSpeed) || targetSpeed <= 0) {
          return {
            success: false,
            error: `Invalid speed: ${value}`,
            state: getPlayerState()
          };
        }
        // Validate if speed is within reasonable player bounds (0.1x to 4.0x)
        if (targetSpeed < 0.1 || targetSpeed > 4.0) {
          return {
            success: false,
            error: `${targetSpeed}x is not supported by this player.`,
            state: getPlayerState()
          };
        }
        video.playbackRate = targetSpeed;
        actionDescription = `Playback speed set to ${targetSpeed}x`;
        break;
      }

      default:
        return {
          success: false,
          error: `Unknown intent: ${intent}`,
          state: getPlayerState()
        };
    }

    notifyStateUpdate();

    return {
      success: true,
      action: actionDescription,
      state: getPlayerState()
    };
  }

  // Listen for commands from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_VOICETUBE_COMMAND') {
      const result = executeCommand(message.payload);
      sendResponse(result);
    } else if (message.type === 'GET_YOUTUBE_STATE') {
      sendResponse({ state: getPlayerState() });
    }
  });
})();
