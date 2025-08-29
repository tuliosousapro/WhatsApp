# WhatsApp Buddy

**WhatsApp Buddy** is a lightweight and user-friendly Chrome extension that makes it easy to send WhatsApp messages directly from your browser. Select any phone number on a webpage to quickly open a chat with your preferred settings.

---

## Features

* **Context Menu Integration:** Right-click on any selected phone number to instantly open a WhatsApp chat.
* **All-in-One Popup:**
    * Manually enter a phone number or use the one currently selected on the page.
    * Choose to open chats with the **Desktop/Mobile App** (`api.whatsapp.com`) or with **WhatsApp Web** (`web.whatsapp.com`).
    * Save your preferred country code and "Open with" choice as defaults with a single click.
* **Smart Country Code Detection:** Automatically recognizes phone numbers from the US (10 digits) and Brazil (11 digits) and sets the correct country code.
* **Recent Numbers:** Automatically saves your last 5 used numbers for quick access.
* **Simple & Secure:** The extension is built with a focus on privacy and requires minimal permissions. It does not store any personal data besides your recent numbers and default settings.

---

## Installation Guide

Since this extension is not yet on the Chrome Web Store, you can install it manually in developer mode:

1.  **Download:** Download all the extension files into a single folder on your computer.
2.  **Open Chrome Extensions:** Open Google Chrome and navigate to `chrome://extensions`.
3.  **Enable Developer Mode:** Turn on the "Developer mode" toggle in the top-right corner.
4.  **Load Unpacked:** Click the "Load unpacked" button and select the folder where you saved the extension files.
5.  The extension icon will now appear in your browser's toolbar.

---

## Usage Instructions

### Sending a Message

1.  **Select a number** on any webpage or click the extension icon to type one manually.
2.  The popup will automatically detect the country code if it's a US or Brazilian number. Otherwise, you can select it from the dropdown.
3.  Choose whether to open the chat in the **App** or on the **Web**.
4.  Click **"Send Message"**.

### Saving Your Preferences

1.  In the popup, select your desired default country code from the dropdown.
2.  Choose your preferred "Open with" method (App or Web).
3.  Click the **"Save Defaults"** button.
4.  All future sessions and context-menu actions will now use these settings.

---

## License

This project is licensed under the MIT License.