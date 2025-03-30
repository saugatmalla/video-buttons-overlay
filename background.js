chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Video Controls extension installed');
});

// Track injection attempts to prevent excessive retries
const injectionAttempts = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
    if (!injectionAttempts.has(tabId) || injectionAttempts.get(tabId).url !== tab.url) {
      injectionAttempts.set(tabId, { 
        url: tab.url,
        attempts: 0,
        lastAttempt: Date.now()
      });
    }
    
    const tabData = injectionAttempts.get(tabId);
    
    if (tabData.attempts >= 3) {
      console.warn(`Exceeded max injection attempts for tabId: ${tabId}`);
      return;
    }
    
    if (tabData.attempts > 0 && (Date.now() - tabData.lastAttempt) < 5000) {
      return;
    }
    
    tabData.attempts++;
    tabData.lastAttempt = Date.now();
    
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }).then(() => {
      console.log(`Successfully injected content script into YouTube tab: ${tabId}`);
    }).catch(error => {
      console.error(`Failed to inject content script for tab ${tabId}:`, error.message);
    });
  }
});

// Cleanup injection tracking when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (injectionAttempts.has(tabId)) {
    injectionAttempts.delete(tabId);
  }
});