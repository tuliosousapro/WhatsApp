// background.js
let defaultCountryCode = "+1"; // Default to US

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("defaultCountryCode", (data) => {
    defaultCountryCode = data.defaultCountryCode || "+1";
    chrome.storage.sync.set({ defaultCountryCode });
  });
  createContextMenu();
});

// Function to create the context menu
function createContextMenu() {
  chrome.contextMenus.create({
    id: "sendWhatsAppMessage",
    title: "Send WhatsApp message to %s",
    contexts: ["selection"]
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendWhatsAppMessage") {
    const selectedText = sanitizePhoneNumber(info.selectionText);
    if (isValidPhoneNumber(selectedText)) {
      openWhatsAppChat(selectedText);
    } else {
      // Notify user of invalid number
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (message) => alert(message),
        args: [chrome.i18n.getMessage("invalidPhoneNumber")]
      });
    }
  }
});

// Handle messages from other scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openWhatsApp") {
    const number = sanitizePhoneNumber(request.number);
    if (isValidPhoneNumber(number)) {
      openWhatsAppChat(number, request.countryCode);
      return true; // Indicates async response
    }
  } else if (request.action === "setDefaultCountryCode") {
    defaultCountryCode = request.countryCode;
    chrome.storage.sync.set({ defaultCountryCode });
  }
  return true;
});

// Utility functions
function sanitizePhoneNumber(number) {
  return String(number).replace(/[^\d+]/g, '');
}

function isValidPhoneNumber(number) {
  const cleanNumber = sanitizePhoneNumber(number);
  // Simple regex for basic validation
  return /^\+?\d{10,15}$/.test(cleanNumber);
}

function openWhatsAppChat(number, countryCode = defaultCountryCode) {
  let fullNumber = number;
  if (!fullNumber.startsWith('+')) {
    fullNumber = `${countryCode}${fullNumber}`;
  }
  const url = `https://wa.me/${sanitizePhoneNumber(fullNumber)}`;
  chrome.tabs.create({ url });
}