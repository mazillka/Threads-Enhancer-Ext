// Threads Enhancer Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const toggleOpenTab = document.getElementById('toggle-open-tab');
  const toggleCopyLink = document.getElementById('toggle-copy-link');
  const selectOrder = document.getElementById('select-order');
  const selectTheme = document.getElementById('select-theme');
  const toggleBackToTop = document.getElementById('toggle-back-to-top');

  // Apply theme class to HTML root element
  function applyTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
  }

  // Load current options from storage
  // Default values: showOpenTab=true, showCopyLink=true, showDownloadMedia=true, actionOrder='open-first', theme='system'
  chrome.storage.sync.get({
    showOpenTab: true,
    showCopyLink: true,
    actionOrder: 'open-first',
    theme: 'system',
    showBackToTop: true,
  }, (items) => {
    toggleOpenTab.checked = items.showOpenTab;
    toggleCopyLink.checked = items.showCopyLink;
    selectOrder.value = items.actionOrder;
    selectTheme.value = items.theme;
    toggleBackToTop.checked = items.showBackToTop;
    applyTheme(items.theme);
  });

  // Save changes when toggles are clicked
  toggleOpenTab.addEventListener('change', () => {
    chrome.storage.sync.set({
      showOpenTab: toggleOpenTab.checked
    });
  });

  toggleCopyLink.addEventListener('change', () => {
    chrome.storage.sync.set({
      showCopyLink: toggleCopyLink.checked
    });
  });


  toggleBackToTop.addEventListener('change', () => {
    chrome.storage.sync.set({
      showBackToTop: toggleBackToTop.checked
    });
  });

  // Save order setting changes
  selectOrder.addEventListener('change', () => {
    chrome.storage.sync.set({
      actionOrder: selectOrder.value
    });
  });

  // Save theme changes and apply immediately
  selectTheme.addEventListener('change', () => {
    const theme = selectTheme.value;
    chrome.storage.sync.set({
      theme: theme
    });
    applyTheme(theme);
  });
});
