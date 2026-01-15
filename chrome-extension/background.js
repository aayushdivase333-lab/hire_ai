// Background service worker for LinkedIn Job Follow-up extension

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Job Follow-up extension installed');

  // Set default storage values
  chrome.storage.sync.get(['apiToken'], (result) => {
    if (!result.apiToken) {
      console.log('No API token found, user needs to configure extension');
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'onJobsPage') {
    console.log('User is on LinkedIn jobs page:', message.url);

    // Update badge to indicate we can sync
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  }

  if (message.action === 'syncNow') {
    handleSync(sender.tab)
      .then(result => sendResponse({ success: true, result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'clearBadge') {
    chrome.action.setBadgeText({ text: '' });
    sendResponse({ success: true });
  }
});

// Handle sync operation
async function handleSync(tab) {
  if (!tab || !tab.id) {
    throw new Error('Invalid tab');
  }

  // Send message to content script to extract applications
  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'extractApplications'
  });

  if (!response.success) {
    throw new Error(response.error);
  }

  // Update last sync time
  chrome.storage.sync.set({
    lastSyncTime: new Date().toISOString()
  });

  // Clear badge
  chrome.action.setBadgeText({ text: '' });

  return response.result;
}

// Listen for tab updates to detect LinkedIn jobs page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('linkedin.com/jobs') ||
        tab.url.includes('linkedin.com/my-items/saved-jobs')) {
      chrome.action.setBadgeText({ text: '!', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#3b82f6', tabId });
    }
  }
});

console.log('LinkedIn Job Follow-up background script loaded');
