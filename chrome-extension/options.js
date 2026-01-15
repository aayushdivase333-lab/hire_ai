// Options page script for LinkedIn Job Follow-up extension

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settingsForm');
  const apiTokenInput = document.getElementById('apiToken');
  const apiUrlInput = document.getElementById('apiUrl');
  const saveButton = document.getElementById('saveButton');
  const testButton = document.getElementById('testButton');
  const messageDiv = document.getElementById('message');

  // Load saved settings
  const { apiToken, apiUrl } = await chrome.storage.sync.get(['apiToken', 'apiUrl']);

  if (apiToken) {
    apiTokenInput.value = apiToken;
  }

  if (apiUrl) {
    apiUrlInput.value = apiUrl;
  }

  // Save settings
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = apiTokenInput.value.trim();
    const url = apiUrlInput.value.trim();

    if (!token) {
      showMessage('API token is required', 'error');
      return;
    }

    try {
      await chrome.storage.sync.set({
        apiToken: token,
        apiUrl: url || 'http://localhost:3000/api/v1'
      });

      showMessage('Settings saved successfully!', 'success');
      saveButton.textContent = 'Saved!';
      setTimeout(() => {
        saveButton.textContent = 'Save Settings';
      }, 2000);
    } catch (error) {
      showMessage('Failed to save settings', 'error');
    }
  });

  // Test connection
  testButton.addEventListener('click', async () => {
    const token = apiTokenInput.value.trim();
    const url = apiUrlInput.value.trim() || 'http://localhost:3000/api/v1';

    if (!token) {
      showMessage('Please enter an API token first', 'error');
      return;
    }

    testButton.disabled = true;
    testButton.textContent = 'Testing...';

    try {
      const response = await fetch(`${url}/auth/me`, {
        method: 'GET',
        headers: {
          'X-API-Token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        showMessage(`Connection successful! Authenticated as ${data.user.full_name}`, 'success');
      } else if (response.status === 401) {
        showMessage('Invalid API token', 'error');
      } else {
        showMessage('Connection failed. Check your API URL and token.', 'error');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      showMessage('Failed to connect to API. Make sure the server is running.', 'error');
    } finally {
      testButton.disabled = false;
      testButton.textContent = 'Test Connection';
    }
  });
});

function showMessage(text, type) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = text;
  messageDiv.className = `message message-${type}`;
  messageDiv.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 5000);
  }
}
