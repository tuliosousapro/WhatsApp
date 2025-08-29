// This list should be kept in sync with the one in popup.js
const countryCodes = [
  { name: "USA (+1)", value: "+1" },
  { name: "UK (+44)", value: "+44" },
  { name: "Brazil (+55)", value: "+55" },
  { name: "Australia (+61)", value: "+61" },
  { name: "Germany (+49)", value: "+49" },
  { name: "India (+91)", value: "+91" },
  { name: "France (+33)", value: "+33" },
  { name: "Spain (+34)", value: "+34" },
  { name: "Mexico (+52)", value: "+52" },
  { name: "Portugal (+351)", value: "+351" },
];

// Saves options to chrome.storage
function saveOptions() {
  const defaultCountryCode = document.getElementById('defaultCountryCode').value;
  const whatsappService = document.querySelector('input[name="whatsappService"]:checked').value;

  chrome.storage.sync.set({
    defaultCountryCode: defaultCountryCode,
    whatsappService: whatsappService
  }, () => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  });
}

// Restores select box and radio button state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get({
    defaultCountryCode: '+1',
    whatsappService: 'api'
  }, (items) => {
    document.getElementById('defaultCountryCode').value = items.defaultCountryCode;
    document.querySelector(`input[name="whatsappService"][value="${items.whatsappService}"]`).checked = true;
  });
}

function populateCountryCodes() {
  const select = document.getElementById('defaultCountryCode');
  select.innerHTML = '';
  countryCodes.forEach(country => {
    const option = document.createElement('option');
    option.value = country.value;
    option.textContent = country.name;
    select.appendChild(option);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  populateCountryCodes();
  restoreOptions();
  document.getElementById('save').addEventListener('click', saveOptions);
});