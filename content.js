function init() {
  const videoElement = document.querySelector('video');
  if (!videoElement) {
    setTimeout(init, 1000);
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'youtube-control-overlay';
  overlay.className = 'youtube-control-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    z-index: 2000;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  `;

  const controlsContainer = document.createElement('div');
  controlsContainer.style.cssText = `
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    pointer-events: auto;
  `;

  function createButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      background-color: rgba(255, 255, 255, 0.9);
      color: black;
      border: none;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.2s;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      pointer-events: auto;
    `;
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    
    button.addEventListener('mouseover', () => {
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.transform = 'scale(1)';
    });
    
    return button;
  }

  const rewindButton = createButton('←10s', () => {
    console.log('Rewind 10s clicked');
    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
  });

  const playPauseButton = createButton('▶/❚❚', () => {
    console.log('Play/Pause clicked');
    if (videoElement.paused) {
      videoElement.play();
      playPauseButton.textContent = '❚❚';
    } else {
      videoElement.pause();
      playPauseButton.textContent = '▶';
    }
  });

  videoElement.addEventListener('play', () => {
    playPauseButton.textContent = '❚❚';
  });
  
  videoElement.addEventListener('pause', () => {
    playPauseButton.textContent = '▶';
  });
  
  playPauseButton.textContent = videoElement.paused ? '▶' : '❚❚';

  const forwardButton = createButton('10s→', () => {
    console.log('Forward 10s clicked');
    videoElement.currentTime += 10;
  });

  controlsContainer.appendChild(rewindButton);
  controlsContainer.appendChild(playPauseButton);
  controlsContainer.appendChild(forwardButton);
  overlay.appendChild(controlsContainer);

  const videoContainer = document.querySelector('#movie_player');
  if (videoContainer) {
    const existingOverlay = videoContainer.querySelector('#youtube-control-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    videoContainer.appendChild(overlay);
    
    videoContainer.addEventListener('mouseenter', () => {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    });
    
    videoContainer.addEventListener('mouseleave', () => {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkOverlay") {
    const overlayExists = !!document.querySelector('#youtube-control-overlay');
    sendResponse({exists: overlayExists});
    
    if (!overlayExists) {
      init();
    }
  }
  return true;
});

window.addEventListener('load', init);
setTimeout(init, 1500);
