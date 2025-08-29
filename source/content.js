// content.js

// We will not inject buttons automatically to avoid performance issues.
// The user can select a number and use the context menu or the popup.

// Listen for a message from the popup to get the selected text
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ selectedText: selectedText });
  }
  return true;
});