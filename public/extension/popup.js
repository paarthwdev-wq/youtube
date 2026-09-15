document.addEventListener('DOMContentLoaded', () => {
  const ytBadge = document.getElementById('ytBadge');
  const tabStatus = document.getElementById('tabStatus');
  const playerState = document.getElementById('playerState');
  const playerSpeed = document.getElementById('playerSpeed');
  const openAppBtn = document.getElementById('openAppBtn');

  function refresh() {
    chrome.runtime.sendMessage({ type: 'PING' }, response => {
      if (response && response.youtubeConnected) {
        ytBadge.className = 'badge badge-online';
        ytBadge.textContent = 'Active';
        tabStatus.textContent = response.activeTabTitle ? response.activeTabTitle.slice(0, 20) + '...' : 'Connected';
        if (response.playerState) {
          playerState.textContent = response.playerState.playbackState === 'playing' ? '▶ Playing' : '⏸ Paused';
          playerSpeed.textContent = (response.playerState.playbackRate || 1.0) + 'x';
        }
      } else {
        ytBadge.className = 'badge badge-offline';
        ytBadge.textContent = 'Offline';
        tabStatus.textContent = 'No YouTube tab found';
        playerState.textContent = 'Idle';
      }
    });
  }

  refresh();
  setInterval(refresh, 1500);

  openAppBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://ais-dev-faw3nonpmaijk4nlol66e3-337912247287.asia-east1.run.app' });
  });
});
