document.addEventListener('DOMContentLoaded', () => {
  loadTranslations();
  initializeCountryCode();
  loadRecentNumbers();
  
  // Get selected text from the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
      if (response && response.selectedText) {
        document.getElementById('phoneNumber').value = response.selectedText;
      }
    });
  });

  document.getElementById('sendMessage').addEventListener('click', sendWhatsAppMessage);
});

function loadTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    elem.textContent = chrome.i18n.getMessage(key) || elem.textContent;
  });
}

function initializeCountryCode() {
  chrome.storage.sync.get('defaultCountryCode', (data) => {
    if (data.defaultCountryCode) {
      document.getElementById('countryCode').value = data.defaultCountryCode;
    }
  });
}

function loadRecentNumbers() {
  chrome.storage.sync.get('recentNumbers', (data) => {
    const recentNumbers = data.recentNumbers || [];
    const ul = document.getElementById('recentNumbers');
    ul.innerHTML = '';
    recentNumbers.forEach(number => {
      const li = document.createElement('li');
      li.textContent = number;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => {
        document.getElementById('phoneNumber').value = number;
      });
      ul.appendChild(li);
    });
  });
}

function sendWhatsAppMessage() {
  const numberInput = document.getElementById('phoneNumber');
  const countryCode = document.getElementById('countryCode').value;
  const number = numberInput.value.trim();

  if (!number) {
    showFeedback('Phone number is required', 'error');
    return;
  }
  
  if (document.getElementById('setAsDefault').checked) {
    chrome.runtime.sendMessage({ action: 'setDefaultCountryCode', countryCode });
  }

  chrome.runtime.sendMessage({
    action: 'openWhatsApp',
    number: number,
    countryCode: countryCode
  }, () => {
    updateRecentNumbers(number);
    showFeedback('Opening WhatsApp...', 'success');
  });
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = type;
  setTimeout(() => feedback.className = 'hidden', 3000);
}

function updateRecentNumbers(number) {
  chrome.storage.sync.get('recentNumbers', (data) => {
    let recentNumbers = data.recentNumbers || [];
    if (recentNumbers.includes(number)) return; // Avoid duplicates
    recentNumbers.unshift(number);
    recentNumbers = recentNumbers.slice(0, 5); // Max 5 recent numbers
    chrome.storage.sync.set({ recentNumbers }, loadRecentNumbers);
  });
}