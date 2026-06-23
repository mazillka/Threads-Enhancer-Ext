// Threads Enhancer Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const toggleOpenTab = document.getElementById('toggle-open-tab');
  const toggleCopyLink = document.getElementById('toggle-copy-link');
  const togglePinBtn = document.getElementById('toggle-pin-btn');
  const toggleBackToTop = document.getElementById('toggle-back-to-top');
  const sortableList = document.getElementById('sortable-order');
  const selectTheme = document.getElementById('select-theme');
  const pinnedList = document.getElementById('pinned-list');
  const pinnedTabBadge = document.getElementById('pinned-tab-badge');

  // Apply theme class to HTML root element
  function applyTheme(theme) {
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('theme-dark');
    }
  }

  // Render the list of pinned posts
  function renderPinnedPosts(posts = []) {
    pinnedTabBadge.textContent = posts.length;
    pinnedList.innerHTML = '';

    if (posts.length === 0) {
      pinnedList.innerHTML = `
        <div class="pinned-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <g transform="rotate(45 12 12)">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a3 3 0 0 0-6 0v4.26c0 .42-.13.84-.38 1.18l-2.78 3.5a2 2 0 0 0-.44 1.24V17z"></path>
            </g>
          </svg>
          <p>No pinned posts yet.<br>Pin posts from Threads to see them here.</p>
        </div>
      `;
      return;
    }

    posts.forEach((post) => {
      const item = document.createElement('div');
      item.className = 'pinned-item';

      const content = document.createElement('div');
      content.className = 'pinned-content';

      const author = document.createElement('span');
      author.className = 'pinned-author';
      author.textContent = `@${post.author}`;

      const text = document.createElement('span');
      text.className = 'pinned-text';
      text.textContent = post.text;
      text.title = post.text;

      content.appendChild(author);
      content.appendChild(text);

      const actions = document.createElement('div');
      actions.className = 'pinned-actions';

      // Open post link button
      const openBtn = document.createElement('button');
      openBtn.className = 'pinned-action-btn';
      openBtn.type = 'button';
      openBtn.title = 'Open post in new tab';
      openBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      `;
      openBtn.addEventListener('click', () => {
        window.open(post.url, '_blank');
      });

      // Unpin post button
      const unpinBtn = document.createElement('button');
      unpinBtn.className = 'pinned-action-btn unpin';
      unpinBtn.type = 'button';
      unpinBtn.title = 'Unpin post';
      unpinBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      `;
      unpinBtn.addEventListener('click', () => {
        unpinPost(post.url);
      });

      actions.appendChild(openBtn);
      actions.appendChild(unpinBtn);

      item.appendChild(content);
      item.appendChild(actions);

      pinnedList.appendChild(item);
    });
  }

  // Remove a post from pinned posts list in storage
  function unpinPost(url) {
    chrome.storage.sync.get({ pinnedPosts: [] }, (items) => {
      const updated = items.pinnedPosts.filter(p => p.url !== url);
      chrome.storage.sync.set({ pinnedPosts: updated }, () => {
        renderPinnedPosts(updated);
      });
    });
  }

  // Load current options and pinned posts from storage
  chrome.storage.sync.get({
    showOpenTab: true,
    showCopyLink: true,
    showPinBtn: true,
    actionOrder: 'open-copy-pin',
    theme: 'system',
    showBackToTop: true,
    pinnedPosts: []
  }, (items) => {
    toggleOpenTab.checked = items.showOpenTab;
    toggleCopyLink.checked = items.showCopyLink;
    togglePinBtn.checked = items.showPinBtn;
    applySortableOrder(items.actionOrder);
    selectTheme.value = items.theme;
    toggleBackToTop.checked = items.showBackToTop;
    applyTheme(items.theme);
    renderPinnedPosts(items.pinnedPosts);
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

  togglePinBtn.addEventListener('change', () => {
    chrome.storage.sync.set({
      showPinBtn: togglePinBtn.checked
    });
  });

  toggleBackToTop.addEventListener('change', () => {
    chrome.storage.sync.set({
      showBackToTop: toggleBackToTop.checked
    });
  });

  // ========================
  // Drag-and-drop sortable list for Action Order
  // ========================

  // Reorder DOM items to match a stored order string like "copy-pin-open"
  function applySortableOrder(orderStr) {
    const keys = orderStr.split('-');
    keys.forEach(key => {
      const item = sortableList.querySelector(`[data-key="${key}"]`);
      if (item) sortableList.appendChild(item);
    });
  }

  // Read current DOM order and persist to storage
  function saveSortableOrder() {
    const items = sortableList.querySelectorAll('.sortable-item');
    const order = Array.from(items).map(el => el.dataset.key).join('-');
    chrome.storage.sync.set({ actionOrder: order });
  }

  // Wire up HTML5 drag-and-drop on every sortable item
  let draggedItem = null;

  function initSortable() {
    sortableList.querySelectorAll('.sortable-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        sortableList.querySelectorAll('.sortable-item').forEach(el => el.classList.remove('drag-over'));
        draggedItem = null;
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (item !== draggedItem) {
          item.classList.add('drag-over');
        }
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (draggedItem && draggedItem !== item) {
          // Determine whether to insert before or after
          const items = Array.from(sortableList.querySelectorAll('.sortable-item'));
          const draggedIdx = items.indexOf(draggedItem);
          const targetIdx = items.indexOf(item);
          if (draggedIdx < targetIdx) {
            sortableList.insertBefore(draggedItem, item.nextSibling);
          } else {
            sortableList.insertBefore(draggedItem, item);
          }
          saveSortableOrder();
        }
      });
    });
  }

  initSortable();

  // Save theme changes and apply immediately
  selectTheme.addEventListener('change', () => {
    const theme = selectTheme.value;
    chrome.storage.sync.set({
      theme: theme
    });
    applyTheme(theme);
  });

  // Keep pinned list synchronized in real time
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.pinnedPosts !== undefined) {
        renderPinnedPosts(changes.pinnedPosts.newValue);
      }
      if (changes.showPinBtn !== undefined) {
        togglePinBtn.checked = changes.showPinBtn.newValue;
      }
    }
  });

  // Tab Navigation switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Update active classes on buttons
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active classes on content panels
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
});
