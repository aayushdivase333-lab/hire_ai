// LinkedIn Job Application Content Script
// Extracts job application data from LinkedIn pages

(function() {
  'use strict';

  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // Extract applications from the current page
  function extractApplications() {
    const applications = [];

    // Check if we're on the jobs page
    const isJobsPage = window.location.href.includes('linkedin.com/jobs') ||
                       window.location.href.includes('linkedin.com/my-items/saved-jobs');

    if (!isJobsPage) {
      console.log('Not on LinkedIn jobs page');
      return applications;
    }

    // Try to find application cards (LinkedIn structure may vary)
    const selectors = [
      '.jobs-search-results__list-item',
      '.scaffold-layout__list-item',
      '.job-card-container',
      '[data-job-id]'
    ];

    let jobCards = [];
    for (const selector of selectors) {
      jobCards = document.querySelectorAll(selector);
      if (jobCards.length > 0) break;
    }

    console.log(`Found ${jobCards.length} job cards`);

    jobCards.forEach((card, index) => {
      try {
        const application = extractApplicationData(card);
        if (application) {
          applications.push(application);
        }
      } catch (error) {
        console.error(`Error extracting application ${index}:`, error);
      }
    });

    return applications;
  }

  // Extract data from a single job card
  function extractApplicationData(card) {
    const data = {
      job_title: '',
      company_name: '',
      location: '',
      application_date: new Date().toISOString().split('T')[0],
      application_id: '',
      job_link: '',
      job_description: '',
      recruiter_name: '',
      recruiter_email: '',
      linkedin_application_id: '',
      raw_data: {}
    };

    // Extract job title
    const titleElement = card.querySelector('.job-card-list__title, .job-card-container__link, h3.t-16');
    if (titleElement) {
      data.job_title = titleElement.textContent.trim();
    }

    // Extract company name
    const companyElement = card.querySelector('.job-card-container__company-name, .artdeco-entity-lockup__subtitle, .job-card-container__primary-description');
    if (companyElement) {
      data.company_name = companyElement.textContent.trim();
    }

    // Extract location
    const locationElement = card.querySelector('.job-card-container__metadata-item, .artdeco-entity-lockup__caption');
    if (locationElement) {
      data.location = locationElement.textContent.trim();
    }

    // Extract job link
    const linkElement = card.querySelector('a[href*="/jobs/view/"]');
    if (linkElement) {
      data.job_link = linkElement.href;
      const jobIdMatch = data.job_link.match(/\/jobs\/view\/(\d+)/);
      if (jobIdMatch) {
        data.linkedin_application_id = `linkedin_${jobIdMatch[1]}`;
        data.application_id = jobIdMatch[1];
      }
    }

    // Extract application date if available
    const dateElement = card.querySelector('[data-test-job-posting-date], .job-card-container__listed-time');
    if (dateElement) {
      const dateText = dateElement.textContent.trim();
      const parsedDate = parseDateText(dateText);
      if (parsedDate) {
        data.application_date = parsedDate;
      }
    }

    // Only return if we have minimum required data
    if (data.job_title && data.company_name && data.linkedin_application_id) {
      data.raw_data = {
        extracted_at: new Date().toISOString(),
        page_url: window.location.href
      };
      return data;
    }

    return null;
  }

  // Parse date text like "2 days ago", "1 week ago" into ISO date
  function parseDateText(text) {
    const now = new Date();
    const lowerText = text.toLowerCase();

    if (lowerText.includes('today')) {
      return now.toISOString().split('T')[0];
    }

    if (lowerText.includes('yesterday')) {
      now.setDate(now.getDate() - 1);
      return now.toISOString().split('T')[0];
    }

    const daysMatch = lowerText.match(/(\d+)\s+day/);
    if (daysMatch) {
      now.setDate(now.getDate() - parseInt(daysMatch[1]));
      return now.toISOString().split('T')[0];
    }

    const weeksMatch = lowerText.match(/(\d+)\s+week/);
    if (weeksMatch) {
      now.setDate(now.getDate() - (parseInt(weeksMatch[1]) * 7));
      return now.toISOString().split('T')[0];
    }

    const monthsMatch = lowerText.match(/(\d+)\s+month/);
    if (monthsMatch) {
      now.setMonth(now.getMonth() - parseInt(monthsMatch[1]));
      return now.toISOString().split('T')[0];
    }

    return null;
  }

  // Extract recruiter info from job details page
  function extractRecruiterInfo() {
    const recruiterInfo = {
      recruiter_name: '',
      recruiter_email: ''
    };

    // Look for hiring manager or recruiter name in job posting
    const selectors = [
      '.hiring-team__member-name',
      '.jobs-poster__name',
      '[data-test-hiring-team-member-name]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        recruiterInfo.recruiter_name = element.textContent.trim();
        break;
      }
    }

    // Try to find contact email in job description
    const descriptionElement = document.querySelector('.jobs-description, .jobs-box__html-content');
    if (descriptionElement) {
      const emailMatch = descriptionElement.textContent.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) {
        recruiterInfo.recruiter_email = emailMatch[0];
      }
    }

    return recruiterInfo;
  }

  // Send applications to backend API
  async function syncApplications(applications) {
    try {
      const { apiToken } = await chrome.storage.sync.get(['apiToken']);

      if (!apiToken) {
        throw new Error('API token not configured. Please set up the extension.');
      }

      const response = await fetch(`${API_BASE_URL}/applications/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Token': apiToken
        },
        body: JSON.stringify({ applications })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Sync result:', result);
      return result;
    } catch (error) {
      console.error('Failed to sync applications:', error);
      throw error;
    }
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'extractApplications') {
      const applications = extractApplications();
      console.log(`Extracted ${applications.length} applications`);

      if (applications.length > 0) {
        syncApplications(applications)
          .then(result => {
            sendResponse({ success: true, result });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: false, error: 'No applications found on this page' });
      }

      return true; // Keep message channel open for async response
    }

    if (message.action === 'extractRecruiter') {
      const recruiterInfo = extractRecruiterInfo();
      sendResponse({ success: true, recruiterInfo });
      return true;
    }
  });

  // Auto-detect and notify when on jobs page
  if (window.location.href.includes('linkedin.com/jobs') ||
      window.location.href.includes('linkedin.com/my-items/saved-jobs')) {
    chrome.runtime.sendMessage({
      action: 'onJobsPage',
      url: window.location.href
    });
  }

  console.log('LinkedIn Job Follow-up content script loaded');
})();
