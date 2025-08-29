// content_script.js
(() => {
  let selectedText = '';

  function sanitizePhoneNumber(number) {
    return (number || '').replace(/[^\d+]/g, '');
  }

  function isValidPhoneNumber(number) {
    if (!number) return false;
    const cleanNumber = sanitizePhoneNumber(number);
    return /^\+?\d{10,14}$/.test(cleanNumber);
  }

  function handleSelection() {
    const selection = window.getSelection();
    selectedText = selection ? selection.toString().trim() : '';

    chrome.runtime.sendMessage({
      action: "updateIcon",
      iconPath: isValidPhoneNumber(selectedText) ? "images/icon_active.png" : "images/icon_inactive.png"
    });
  }

  document.addEventListener('selectionchange', handleSelection);

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSelectedNumber") {
      if (isValidPhoneNumber(selectedText)) {
        sendResponse({ number: sanitizePhoneNumber(selectedText) });
      } else {
        sendResponse({ error: "Invalid phone number selected" });
      }
    } else if (request.action === "showError") {
      console.error(request.message);
      // You might want to show this error to the user in some way
    }
  });

  // Context menu creation
  chrome.runtime.sendMessage({ action: "createContextMenu" });
})();