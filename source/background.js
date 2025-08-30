chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['defaultCountryCode', 'whatsappService'], (items) => {
    if (!items.defaultCountryCode) {
      chrome.storage.sync.set({ defaultCountryCode: '+1' });
    }
    if (!items.whatsappService) {
      chrome.storage.sync.set({ whatsappService: 'api' });
    }
  });
  
  chrome.contextMenus.create({
    id: "sendWhatsAppMessage",
    title: "Send WA message to %s",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "sendWhatsAppMessage") {
    await openWhatsAppChat(info.selectionText);
  }
});

chrome.runtime.onMessage.addListener(async (request) => {
  if (request.action === "openWhatsApp") {
    await openWhatsAppChat(request.number);
  }
  return true;
});

function sanitizePhoneNumber(number) {
  return String(number).replace(/[^\d+]/g, '');
}

async function openWhatsAppChat(number) {
  const settings = await chrome.storage.sync.get({
    defaultCountryCode: '+1',
    whatsappService: 'api'
  });
  
  let fullNumber = sanitizePhoneNumber(number);

  if (!fullNumber.startsWith('+')) {
    const isTenDigit = /^\d{10}$/.test(fullNumber);
    const isElevenDigitBrazilian = /^\d{11}$/.test(fullNumber);

    if (isTenDigit) {
      fullNumber = `+1${fullNumber}`;
    } else if (isElevenDigitBrazilian) {
      fullNumber = `+55${fullNumber}`;
    } else {
      fullNumber = `${settings.defaultCountryCode}${fullNumber}`;
    }
  }

  const sanitizedForUrl = fullNumber.replace('+', '');
  
  let url;
  if (settings.whatsappService === 'web') {
    url = `https://web.whatsapp.com/send?phone=${sanitizedForUrl}`;
  } else {
    url = `https://api.whatsapp.com/send?phone=${sanitizedForUrl}`;
  }
  
  chrome.tabs.create({ url });
}