document.addEventListener('DOMContentLoaded', () => {
  loadTranslations();
  initializeCountryCode();
  loadRecentNumbers();

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showPopup") {
      const selectedNumber = sanitizePhoneNumber(request.number);
      document.getElementById("selectedNumber").innerText = selectedNumber;
    }
  });

  document.getElementById("sendMessage").addEventListener('click', sendWhatsAppMessage);
});

function loadTranslations() {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = chrome.i18n.getMessage(key) || element.textContent;
  });
}

function initializeCountryCode() {
  chrome.storage.sync.get("defaultCountryCode", (data) => {
    if (data.defaultCountryCode) {
      document.getElementById("countryCode").value = data.defaultCountryCode;
    }
  });
}

function loadRecentNumbers() {
  chrome.storage.sync.get("recentNumbers", (data) => {
    const recentNumbers = data.recentNumbers || [];
    const ul = document.getElementById("recentNumbers");
    ul.innerHTML = '';
    recentNumbers.forEach(number => {
      const li = document.createElement('li');
      li.textContent = number;
      li.addEventListener('click', () => {
        document.getElementById("selectedNumber").innerText = number;
      });
      ul.appendChild(li);
    });
  });
}

function sanitizePhoneNumber(number) {
  return number.replace(/[^\d+]/g, '');
}

function sendWhatsAppMessage() {
  const selectedNumber = document.getElementById("selectedNumber").innerText;
  let numberToSend = sanitizePhoneNumber(selectedNumber);
  const countryCode = document.getElementById("countryCode").value;

  if (!numberToSend.startsWith("+")) {
    numberToSend = countryCode + numberToSend;
  }

  if (document.getElementById("setAsDefault").checked) {
    chrome.storage.sync.set({ defaultCountryCode: countryCode });
  }

  const url = `https://wa.me/${numberToSend}`;
  
  chrome.tabs.create({ url }, (tab) => {
    if (chrome.runtime.lastError) {
      showFeedback('Error: Could not open WhatsApp web', 'error');
    } else {
      showFeedback('WhatsApp web opened successfully', 'success');
      updateRecentNumbers(numberToSend);
    }
  });
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = type;
  feedback.classList.remove('hidden');
  setTimeout(() => feedback.classList.add('hidden'), 3000);
}

function updateRecentNumbers(number) {
  chrome.storage.sync.get("recentNumbers", (data) => {
    let recentNumbers = data.recentNumbers || [];
    recentNumbers.unshift(number);
    recentNumbers = [...new Set(recentNumbers)].slice(0, 5); // Keep unique, max 5
    chrome.storage.sync.set({ recentNumbers }, loadRecentNumbers);
  });
}