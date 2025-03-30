// Track initialization state to avoid duplicate listeners
let isInitialized = false;
let eventListeners = [];

function init() {
  if (isInitialized) {
    cleanup();
  }
  
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
    gap: 100px;
    pointer-events: none;
  `;

  function createButton(iconPath, onClick) {
    const button = document.createElement('button');
    button.style.cssText = `
      background: transparent;
      color: white;
      border: none;
      border-radius: 50%;
      width: 150px;
      height: 150px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.2s;
      pointer-events: auto;
    `;
    
    fetch(chrome.runtime.getURL(iconPath))
      .then(response => response.text())
      .then(svgText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (svgElement) {
          svgElement.style.width = '40px';
          svgElement.style.height = '40px';
          svgElement.style.fill = '#000';
          
          button.textContent = ''; 
          button.appendChild(svgElement);
        } else {
          console.error('Invalid SVG content from:', iconPath);
        }
      })
      .catch(err => console.error('Error loading SVG:', err));
    
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

  const rewindButton = createButton('icons/material-symbols--replay-10.svg', () => {
    console.log('Rewind 10s clicked');
    videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
  });

  let playIcon = 'icons/material-symbols--play-arrow.svg';
  let pauseIcon = 'icons/material-symbols--pause-rounded.svg';
  
  const playPauseButton = createButton(videoElement.paused ? playIcon : pauseIcon, () => {
    console.log('Play/Pause clicked');
    if (videoElement.paused) {
      videoElement.play();
      updatePlayPauseButtonIcon(false);
    } else {
      videoElement.pause();
      updatePlayPauseButtonIcon(true);
    }
  });

  function updatePlayPauseButtonIcon(isPaused) {
    fetch(chrome.runtime.getURL(isPaused ? playIcon : pauseIcon))
      .then(response => response.text())
      .then(svgText => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');
        
        if (svgElement) {
          while (playPauseButton.firstChild) {
            playPauseButton.removeChild(playPauseButton.firstChild);
          }
          
          svgElement.style.width = '40px';
          svgElement.style.height = '40px';
          svgElement.style.fill = '#000';
          
          playPauseButton.appendChild(svgElement);
        } else {
          console.error('Invalid SVG content');
        }
      })
      .catch(err => console.error('Error updating play/pause icon:', err));
  }

  videoElement.addEventListener('play', () => {
    updatePlayPauseButtonIcon(false);
  });
  
  videoElement.addEventListener('pause', () => {
    updatePlayPauseButtonIcon(true);
  });

  const forwardButton = createButton('icons/material-symbols--forward-10.svg', () => {
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
    
    const mouseEnterHandler = () => {
      overlay.style.opacity = '1';
    };
    
    const mouseLeaveHandler = () => {
      overlay.style.opacity = '0';
    };
    
    videoContainer.addEventListener('mouseenter', mouseEnterHandler);
    videoContainer.addEventListener('mouseleave', mouseLeaveHandler);
    
    eventListeners.push({
      element: videoContainer,
      type: 'mouseenter',
      handler: mouseEnterHandler
    });
    
    eventListeners.push({
      element: videoContainer,
      type: 'mouseleave',
      handler: mouseLeaveHandler
    });
  }
  
  const playHandler = () => {
    updatePlayPauseButtonIcon(false);
  };
  
  const pauseHandler = () => {
    updatePlayPauseButtonIcon(true);
  };
  
  videoElement.addEventListener('play', playHandler);
  videoElement.addEventListener('pause', pauseHandler);
  
  eventListeners.push({
    element: videoElement,
    type: 'play',
    handler: playHandler
  });
  
  eventListeners.push({
    element: videoElement,
    type: 'pause',
    handler: pauseHandler
  });
  
  isInitialized = true;
}

function cleanup() {
  eventListeners.forEach(({ element, type, handler }) => {
    if (element) {
      element.removeEventListener(type, handler);
    }
  });
  eventListeners = [];
  
  const existingOverlay = document.querySelector('#youtube-control-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  isInitialized = false;
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && document.location.href.includes('youtube.com/watch')) {
    init();
  }
});

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

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (url.includes('youtube.com/watch')) {
      setTimeout(init, 1000);
    } else {
      cleanup();
    }
  }
}).observe(document, {subtree: true, childList: true});

if (document.readyState === 'loading') {
  window.addEventListener('load', init);
} else {
  setTimeout(init, 1500);
}
