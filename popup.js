document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    const isYoutubeUrl = currentUrl.includes('youtube.com/watch');
    
    if (!isYoutubeUrl) {
      const infoDiv = document.createElement('div');
      infoDiv.style.color = '#e74c3c';
      infoDiv.style.padding = '10px 0';
      infoDiv.textContent = 'This extension only works on YouTube video pages.';
      
      document.body.insertBefore(infoDiv, document.body.firstChild);
    }
    else {
      chrome.tabs.sendMessage(tabs[0].id, {action: "checkOverlay"}, function(response) {
        if (chrome.runtime.lastError || !response || !response.exists) {
          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            files: ['content.js']
          });
        }
      });
    }
  });
});
