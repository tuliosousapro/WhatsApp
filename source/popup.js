const countryCodes = [
  { name: "USA (+1)", value: "+1" }, { name: "UK (+44)", value: "+44" }, { name: "Brazil (+55)", value: "+55" }, { name: "Australia (+61)", value: "+61" }, { name: "Germany (+49)", value: "+49" }, { name: "India (+91)", value: "+91" }, { name: "France (+33)", value: "+33" }, { name: "Spain (+34)", value: "+34" }, { name: "Mexico (+52)", value: "+52" }, { name: "Portugal (+351)", value: "+351" },
];

const brazilianDDDs = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'
];

document.addEventListener('DOMContentLoaded', () => {
  populateCountryCodes();
  loadTranslations();
  initializeDefaults();
  loadRecentNumbers();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" }, (response) => {
        if (chrome.runtime.lastError) { return; }
        if (response && response.selectedText) {
          const sanitizedNumber = response.selectedText.replace(/[^\d+]/g, '');
          detectAndSetCountryCode(sanitizedNumber);
        }
      });
    }
  });

  document.getElementById('sendMessage').addEventListener('click', sendWhatsAppMessage);
  document.getElementById('saveDefaults').addEventListener('click', saveDefaultSettings);
  document.getElementById('generateLink').addEventListener('click', generateWhatsAppLink);
  document.getElementById('copyLink').addEventListener('click', copyGeneratedLink);
});

function initializeDefaults() {
  chrome.storage.sync.get({
    defaultCountryCode: '+1',
    whatsappService: 'api'
  }, (items) => {
    document.getElementById('countryCode').value = items.defaultCountryCode;
    document.querySelector(`input[name="whatsappService"][value="${items.whatsappService}"]`).checked = true;
  });
}

function saveDefaultSettings() {
  const defaultCountryCode = document.getElementById('countryCode').value;
  const whatsappService = document.querySelector('input[name="whatsappService"]:checked').value;

  chrome.storage.sync.set({
    defaultCountryCode: defaultCountryCode,
    whatsappService: whatsappService
  }, () => {
    const button = document.getElementById('saveDefaults');
    button.textContent = 'Saved!';
    setTimeout(() => {
      button.textContent = 'Save Defaults';
    }, 1500);
  });
}

function populateCountryCodes() {
  const select = document.getElementById('countryCode');
  countryCodes.forEach(country => {
    const option = document.createElement('option');
    option.value = country.value;
    option.textContent = country.name;
    select.appendChild(option);
  });
}

function detectAndSetCountryCode(number) {
  const phoneNumberInput = document.getElementById('phoneNumber');
  const countryCodeSelect = document.getElementById('countryCode');
  const sortedCodes = [...countryCodes].sort((a, b) => b.value.length - a.value.length);
  for (const country of sortedCodes) {
    if (number.startsWith(country.value)) {
      countryCodeSelect.value = country.value;
      phoneNumberInput.value = number.substring(country.value.length).replace(/^0+/, '').trim();
      return;
    }
  }
  if (number.length === 10) {
    countryCodeSelect.value = "+1";
    phoneNumberInput.value = number;
    return;
  }
  const ddd = number.substring(0, 2);
  if (number.length === 11 && brazilianDDDs.includes(ddd)) {
    countryCodeSelect.value = "+55";
    phoneNumberInput.value = number;
    return;
  }
  phoneNumberInput.value = number;
}

function loadTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) elem.textContent = message;
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

function getFullNumber() {
  const numberInput = document.getElementById('phoneNumber');
  const countryCode = document.getElementById('countryCode').value;
  const number = numberInput.value.trim();
  if (!number) {
    showFeedback('Phone number is required', 'error');
    return null;
  }
  return number.startsWith('+') ? number : `${countryCode}${number}`;
}

function sendWhatsAppMessage() {
  const fullNumber = getFullNumber();
  if (!fullNumber) return;
  chrome.runtime.sendMessage({ action: 'openWhatsApp', number: fullNumber }, () => {
    updateRecentNumbers(fullNumber);
    showFeedback('Opening WA...', 'success');
  });
}

function generateWhatsAppLink() {
  const fullNumber = getFullNumber();
  if (!fullNumber) return;
  const prefilledMessage = document.getElementById('prefilledMessage').value;
  const sanitizedNumber = fullNumber.replace(/[^\d]/g, '');
  let link = `https://wa.me/${sanitizedNumber}`;
  if (prefilledMessage) {
    link += `?text=${encodeURIComponent(prefilledMessage)}`;
  }
  const linkContainer = document.getElementById('generatedLinkContainer');
  const linkInput = document.getElementById('generatedLink');
  linkInput.value = link;
  linkContainer.classList.remove('hidden');
}

function copyGeneratedLink() {
  const linkInput = document.getElementById('generatedLink');
  const copyButton = document.getElementById('copyLink');
  navigator.clipboard.writeText(linkInput.value).then(() => {
    copyButton.textContent = 'Copied!';
    setTimeout(() => {
      copyButton.textContent = 'Copy';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    showFeedback('Failed to copy link', 'error');
  });
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = type;
  setTimeout(() => {
    feedback.className = 'hidden';
    feedback.textContent = '';
  }, 3000);
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