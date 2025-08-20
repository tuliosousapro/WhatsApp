// content.js
(() => {
  const WHATSAPP_ICON_URL = chrome.runtime.getURL("images/whatsapp_icon.png");
  
  function createWhatsAppButton(phoneNumber) {
    const button = document.createElement('img');
    button.src = WHATSAPP_ICON_URL;
    button.alt = 'Send WhatsApp';
    button.title = 'Send WhatsApp message';
    button.style.cssText = 'cursor:pointer;margin-left:5px;vertical-align:middle;';
    button.width = 20;
    button.height = 20;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      chrome.runtime.sendMessage({
        action: "showPopup",
        number: phoneNumber
      });
    });
    return button;
  }

  function addWhatsAppButtonsToPage() {
    const phoneRegex = /(\+?[\d\s()-]{10,20})/g;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const matches = node.nodeValue.match(phoneRegex);
      
      if (matches) {
        const span = document.createElement('span');
        let lastIndex = 0;
        
        matches.forEach(match => {
          const index = node.nodeValue.indexOf(match, lastIndex);
          span.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex, index)));
          
          const phoneSpan = document.createElement('span');
          phoneSpan.textContent = match;
          phoneSpan.appendChild(createWhatsAppButton(match));
          span.appendChild(phoneSpan);
          
          lastIndex = index + match.length;
        });
        
        span.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex)));
        node.parentNode.replaceChild(span, node);
      }
    }
  }

  // Run on page load
  addWhatsAppButtonsToPage();

  // Set up a MutationObserver to handle dynamically added content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        addWhatsAppButtonsToPage();
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();