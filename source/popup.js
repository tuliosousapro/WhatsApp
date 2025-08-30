const countryCodes = [
  { name: "USA (+1)", value: "+1" }, { name: "UK (+44)", value: "+44" }, { name: "Brazil (+55)", value: "+55" }, { name: "Australia (+61)", value: "+61" }, { name: "Germany (+49)", value: "+49" }, { name: "India (+91)", value: "+91" }, { name: "France (+33)", value: "+33" }, { name: "Spain (+34)", value: "+34" }, { name: "Mexico (+52)", value: "+52" }, { name: "Portugal (+351)", value: "+351" },
];

const brazilianDDDs = [
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'
];

let qrcode = null;

document.addEventListener('DOMContentLoaded', () => {
  loadTranslations();
  populateCountryCodes();
  initializeDefaults();
  loadRecentNumbers();

  if (!navigator.share) {
    document.getElementById('shareQr').classList.add('hidden');
  }

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
  document.getElementById('downloadQr').addEventListener('click', downloadQRCode);
  document.getElementById('shareQr').addEventListener('click', shareQRCode);
});

function loadTranslations() {
  // Translate static text from data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(elem => {
    const key = elem.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      // Use textContent for most elements, but value for buttons
      if (elem.tagName === 'BUTTON' || elem.tagName === 'INPUT') {
        elem.textContent = message;
      } else {
        elem.textContent = message;
      }
    }
  });

  // Translate dynamic attributes like placeholders
  document.getElementById('phoneNumber').placeholder = chrome.i18n.getMessage('phoneNumberPlaceholder');
  document.getElementById('prefilledMessage').placeholder = chrome.i18n.getMessage('prefilledMessagePlaceholder');
}

function populateCountryCodes() {
  const select = document.getElementById('countryCode');
  countryCodes.forEach(country => {
    const option = document.createElement('option');
    option.value = country.value;
    // Get translated country name
    option.textContent = chrome.i18n.getMessage(country.nameKey);
    select.appendChild(option);
  });
}

function saveDefaultSettings() {
  const defaultCountryCode = document.getElementById('countryCode').value;
  const whatsappService = document.querySelector('input[name="whatsappService"]:checked').value;
  chrome.storage.sync.set({
    defaultCountryCode: defaultCountryCode,
    whatsappService: whatsappService
  }, () => {
    showFeedback(chrome.i18n.getMessage('feedbackSaved'), 'success');
  });
}

function getFullNumber() {
  const numberInput = document.getElementById('phoneNumber');
  const number = numberInput.value.trim();
  if (!number) {
    showFeedback(chrome.i18n.getMessage('feedbackRequired'), 'error');
    return null;
  }
  const countryCode = document.getElementById('countryCode').value;
  return number.startsWith('+') ? number : `${countryCode}${number}`;
}

function sendWhatsAppMessage() {
  const fullNumber = getFullNumber();
  if (!fullNumber) return;
  chrome.runtime.sendMessage({ action: 'openWhatsApp', number: fullNumber }, () => {
    updateRecentNumbers(fullNumber);
    showFeedback(chrome.i18n.getMessage('feedbackOpening'), 'success');
  });
}

function generateWhatsAppLink() {
  const fullNumber = getFullNumber();
  if (!fullNumber) return;

  const prefilledMessage = document.getElementById('prefilledMessage').value;
  const sanitizedNumber = fullNumber.replace(/[^\d]/g, '');
  const service = document.querySelector('input[name="whatsappService"]:checked').value;
  
  let baseUrl = (service === 'web') 
    ? `https://web.whatsapp.com/send?phone=` 
    : `https://api.whatsapp.com/send?phone=`;
  let link = `${baseUrl}${sanitizedNumber}`;
  
  if (prefilledMessage) {
    link += `&text=${encodeURIComponent(prefilledMessage)}`;
  }
  
  document.getElementById('generatedLink').value = link;
  document.getElementById('generatedLinkContainer').classList.remove('hidden');

  const qrcodeContainer = document.getElementById('qrcode');
  qrcodeContainer.innerHTML = '';
  qrcode = new QRCode(qrcodeContainer, {
    text: link, width: 150, height: 150,
  });
  qrcodeContainer.classList.remove('hidden');
  document.getElementById('qrActions').classList.remove('hidden');
}

function copyGeneratedLink() {
  const linkInput = document.getElementById('generatedLink');
  navigator.clipboard.writeText(linkInput.value).then(() => {
    showFeedback(chrome.i18n.getMessage('feedbackCopied'), 'success');
  }).catch(err => {
    showFeedback(chrome.i18n.getMessage('feedbackCopyError'), 'error');
  });
}

function downloadQRCode() {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) {
    showFeedback(chrome.i18n.getMessage('feedbackQrError'), 'error');
    return;
  }
  const link = document.createElement('a');
  link.download = 'whatsapp-qr-code.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function shareQRCode() {
  const canvas = document.querySelector('#qrcode canvas');
  if (!canvas) {
    showFeedback(chrome.i18n.getMessage('feedbackQrError'), 'error');
    return;
  }
  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'whatsapp-qr-code.png', { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: 'WhatsApp QR Code' });
    } catch (err) {
      showFeedback(chrome.i18n.getMessage('feedbackShareError'), 'error');
    }
  }, 'image/png');
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

// Functions without text changes remain the same
function initializeDefaults(){/*...*/}
function detectAndSetCountryCode(number){/*...*/}
function loadRecentNumbers(){/*...*/}
function updateRecentNumbers(fullNumber){/*...*/}