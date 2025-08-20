// background.js
let defaultCountryCode = "+1"; // Default to US

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get("defaultCountryCode", (data) => {
    if (data.defaultCountryCode) {
      defaultCountryCode = data.defaultCountryCode;
    } else {
      chrome.storage.sync.set({ defaultCountryCode: defaultCountryCode });
    }
  });

  createContextMenu();
});

function createContextMenu() {
  chrome.contextMenus.create({
    id: "sendWhatsAppMessage",
    title: chrome.i18n.getMessage("contextMenuTitle"),
    contexts: ["selection"]
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendWhatsAppMessage") {
    let selectedText = sanitizePhoneNumber(info.selectionText);

    if (isValidPhoneNumber(selectedText)) {
      openWhatsAppChat(selectedText);
    } else {
      chrome.tabs.sendMessage(tab.id, { action: "showError", message: chrome.i18n.getMessage("invalidPhoneNumber") });
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.action) {
    case "updateIcon":
      chrome.action.setIcon({ path: request.iconPath, tabId: sender.tab.id });
      break;
    case "setDefaultCountryCode":
      defaultCountryCode = request.countryCode;
      chrome.storage.sync.set({ defaultCountryCode: defaultCountryCode });
      break;
    case "createContextMenu":
      createContextMenu();
      break;
    case "getDefaultCountryCode":
      sendResponse({ countryCode: defaultCountryCode });
      break;
  }
});

function sanitizePhoneNumber(number) {
  return number.replace(/[^\d+]/g, '');
}

function isValidPhoneNumber(number) {
  const cleanNumber = sanitizePhoneNumber(number);
  return /^\+?\d{10,14}$/.test(cleanNumber);
}

function openWhatsAppChat(number) {
  if (!number.startsWith('+')) {
    number = defaultCountryCode + number;
  }
  const url = `https://wa.me/${number}`;
  chrome.tabs.create({ url });
}