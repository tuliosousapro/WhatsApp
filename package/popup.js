// A list of common country codes
const countryCodes = [
  { name: "USA (+1)", value: "+1" },
  { name: "UK (+44)", value: "+44" },
  { name: "Brazil (+55)", value: "+55" },
  { name: "Australia (+61)", value: "+61" },
  { name: "Germany (+49)", value: "+49" },
  { name: "India (+91)", value: "+91" },
  { name: "France (+33)", value: "+33" },
  { name: "Spain (+34)", value: "+34" },
  { name: "Mexico (+52)", value: "+52" },
  { name: "Portugal (+351)", value: "+351" },
];

document.addEventListener('DOMContentLoaded', () => {
  populateCountryCodes(); // New function call
  loadTranslations();
  initializeCountryCode();
  loadRecentNumbers();

  // Get selected text from the active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("Could not establish connection. This is expected on some pages.");
          return;
        }

        if (response && response.selectedText) {
          const sanitizedNumber = response.selectedText.replace(/[^\d+]/g, '');
          detectAndSetCountryCode(sanitizedNumber);
        }
      });
    }
  });

  document.getElementById('sendMessage').addEventListener('click', sendWhatsAppMessage);
});

// New function to populate the country code dropdown
function populateCountryCodes() {
  const select = document.getElementById('countryCode');
  select.innerHTML = '';
  countryCodes.forEach(country => {
    const option = document.createElement('option');
    option.value = country.value;
    option.textContent = country.name;
    select.appendChild(option);
  });
}

// New function to detect and set the country code
function detectAndSetCountryCode(number) {
  const phoneNumberInput = document.getElementById('phoneNumber');
  const countryCodeSelect = document.getElementById('countryCode');
  let detectedCode = null;

  // Sort by length descending to match longer codes first (e.g., +351 before +3)
  const sortedCodes = [...countryCodes].sort((a, b) => b.value.length - a.value.length);

  for (const country of sortedCodes) {
    if (number.startsWith(country.value)) {
      detectedCode = country.value;
      // Remove country code and any leading space/zero from the number
      phoneNumberInput.value = number.substring(country.value.length).replace(/^0+/, '').trim();
      break;
    }
  }

  if (detectedCode) {
    countryCodeSelect.value = detectedCode;
  } else {
    phoneNumberInput.value = number;
  }
}

function loadTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      elem.textContent = message;
    }
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
        detectAndSetCountryCode(number);
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
    chrome.storage.sync.set({ defaultCountryCode: countryCode });
    chrome.runtime.sendMessage({ action: 'setDefaultCountryCode', countryCode });
  }

  chrome.runtime.sendMessage({
    action: 'openWhatsApp',
    number: number,
    countryCode: countryCode
  }, () => {
    updateRecentNumbers(`${countryCode}${number}`);
    showFeedback('Opening WhatsApp...', 'success');
  });
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = type;
  setTimeout(() => feedback.className = 'hidden', 3000);
}

function updateRecentNumbers(fullNumber) {
  chrome.storage.sync.get('recentNumbers', (data) => {
    let recentNumbers = data.recentNumbers || [];
    if (recentNumbers.includes(fullNumber)) return;
    recentNumbers.unshift(fullNumber);
    recentNumbers = recentNumbers.slice(0, 5);
    chrome.storage.sync.set({ recentNumbers }, loadRecentNumbers);
  });
}