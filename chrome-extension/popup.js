// Popup script for LinkedIn Job Follow-up extension

const DASHBOARD_URL = 'http://localhost:3001/dashboard';

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const connectionStatus = document.getElementById('connectionStatus');
  const lastSync = document.getElementById('lastSync');
  const syncButton = document.getElementById('syncButton');
  const openDashboard = document.getElementById('openDashboard');
  const messageDiv = document.getElementById('message');

  // Load saved data
  const { apiToken, lastSyncTime } = await chrome.storage.sync.get(['apiToken', 'lastSyncTime']);

  loading.style.display = 'none';
  content.style.display = 'block';

  // Update connection status
  if (apiToken) {
    connectionStatus.textContent = 'Connected';
    connectionStatus.className = 'status-value connected';
  } else {
    connectionStatus.textContent = 'Not Connected';
    connectionStatus.className = 'status-value not-connected';
    syncButton.disabled = true;
    showMessage('Please configure your API token in extension settings', 'info');
  }

  // Update last sync time
  if (lastSyncTime) {
    const date = new Date(lastSyncTime);
    lastSync.textContent = formatDate(date);
  }

  // Sync button click handler
  syncButton.addEventListener('click', async () => {
    syncButton.disabled = true;
    syncButton.textContent = 'Syncing...';
    hideMessage();

    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('linkedin.com')) {
        throw new Error('Please navigate to LinkedIn jobs page first');
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'extractApplications'
      });

      if (response.success) {
        showMessage(
          `Successfully synced ${response.result.applications_found} applications (${response.result.applications_new} new)`,
          'success'
        );

        // Update last sync time
        const now = new Date().toISOString();
        await chrome.storage.sync.set({ lastSyncTime: now });
        lastSync.textContent = 'Just now';

        // Clear badge
        chrome.runtime.sendMessage({ action: 'clearBadge' });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      showMessage(error.message || 'Failed to sync applications', 'error');
    } finally {
      syncButton.disabled = false;
      syncButton.textContent = 'Sync LinkedIn Applications';
    }
  });

  // Open dashboard button
  openDashboard.addEventListener('click', () => {
    chrome.tabs.create({ url: DASHBOARD_URL });
  });
});

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message message-${type}`;
  messageDiv.style.display = 'block';
}

function hideMessage() {
  const messageDiv = document.getElementById('message');
  messageDiv.style.display = 'none';
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
}
