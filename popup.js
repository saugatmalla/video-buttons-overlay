document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let isYoutubeUrl = false;
    
    try {
      const url = new URL(tabs[0].url);
      isYoutubeUrl = (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') && 
                    url.pathname.startsWith('/watch');
    } catch (e) {
      console.error('Invalid URL:', e);
      isYoutubeUrl = false;
    }
    
    if (!isYoutubeUrl) {
      const infoDiv = document.createElement('div');
      infoDiv.style.color = '#e74c3c';
      infoDiv.style.padding = '10px 0';
      infoDiv.textContent = 'This extension only works on YouTube video pages.';
      
      document.body.insertBefore(infoDiv, document.body.firstChild);
    }
    else {
      chrome.tabs.sendMessage(tabs[0].id, {action: "checkOverlay"}, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error checking overlay:', chrome.runtime.lastError.message);
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content.js']
          }).catch(err => console.error('Failed to inject content script:', err));
          return;
        }
        
        if (!response || !response.exists) {
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content.js']
          }).then(() => {
            console.log('Content script injected successfully');
          }).catch(err => {
            console.error('Failed to inject content script:', err);
          });
        }
      });
    }
  });
});
