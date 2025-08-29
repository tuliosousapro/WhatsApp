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

// List of Brazilian Area Codes (DDDs) to help with automatic detection
const brazilianDDDs = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', 
  '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', 
  '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', 
  '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', 
  '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', 
  '93', '94', '95', '96', '97', '98', '99'
];

document.addEventListener('DOMContentLoaded', () => {
  populateCountryCodes();
  loadTranslations();
  initializeCountryCode();
  loadRecentNumbers();

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

// Updated function to detect country code with heuristics for Brazil and the US
function detectAndSetCountryCode(number) {
  const phoneNumberInput = document.getElementById('phoneNumber');
  const countryCodeSelect = document.getElementById('countryCode');
  let detectedCode = null;

  // 1. Check for explicit country code (e.g., +1 or +55)
  const sortedCodes = [...countryCodes].sort((a, b) => b.value.length - a.value.length);
  for (const country of sortedCodes) {
    if (number.startsWith(country.value)) {
      detectedCode = country.value;
      phoneNumberInput.value = number.substring(country.value.length).replace(/^0+/, '').trim();
      countryCodeSelect.value = detectedCode;
      return;
    }
  }

  // 2. Heuristic for US numbers (10 digits)
  if (number.length === 10) {
    detectedCode = "+1"; // Set to USA
    countryCodeSelect.value = detectedCode;
    phoneNumberInput.value = number;
    return;
  }

  // 3. Heuristic for Brazilian numbers (11 digits with valid DDD)
  const ddd = number.substring(0, 2);
  if (number.length === 11 && brazilianDDDs.includes(ddd)) {
    detectedCode = "+55"; // Set to Brazil
    countryCodeSelect.value = detectedCode;
    phoneNumberInput.value = number;
    return;
  }

  // 4. If no detection, just set the number
  phoneNumberInput.value = number;
}

function loadTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) elem.textContent = message;
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

  const fullNumber = number.startsWith('+') ? number : `${countryCode}${number}`;

  chrome.runtime.sendMessage({
    action: 'openWhatsApp',
    number: fullNumber,
    countryCode: ''
  }, () => {
    updateRecentNumbers(fullNumber);
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