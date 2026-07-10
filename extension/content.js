/**
 * Threads Enhancer Chrome Extension
 * Content Script
 */

(function () {
  'use strict';

  // Local settings cache with defaults
  let settings = {
    showOpenTab: true,
    showCopyLink: true,
    showPinBtn: true,
    actionOrder: 'open-copy-pin',
    showBackToTop: true
  };
  let pinnedPosts = [];

  // Load configuration from storage
  chrome.storage.sync.get({
    showOpenTab: true,
    showCopyLink: true,
    showPinBtn: true,
    actionOrder: 'open-copy-pin',
    showBackToTop: true,
    pinnedPosts: []
  }, (items) => {
    settings = {
      showOpenTab: items.showOpenTab,
      showCopyLink: items.showCopyLink,
      showPinBtn: items.showPinBtn,
      actionOrder: items.actionOrder,
      showBackToTop: items.showBackToTop
    };
    pinnedPosts = items.pinnedPosts;
    updateButtonsVisibility();
  });

  // Listen to live configuration updates from the popup settings panel
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
      if (changes.showOpenTab !== undefined) {
        settings.showOpenTab = changes.showOpenTab.newValue;
      }
      if (changes.showCopyLink !== undefined) {
        settings.showCopyLink = changes.showCopyLink.newValue;
      }
      if (changes.showPinBtn !== undefined) {
        settings.showPinBtn = changes.showPinBtn.newValue;
      }
      if (changes.actionOrder !== undefined) {
        settings.actionOrder = changes.actionOrder.newValue;
      }
      if (changes.showBackToTop !== undefined) {
        settings.showBackToTop = changes.showBackToTop.newValue;
      }
      if (changes.pinnedPosts !== undefined) {
        pinnedPosts = changes.pinnedPosts.newValue;
        updatePinButtonsState();
      }
      updateButtonsVisibility();
    }
  });

  // Map order key segments to action-type data attributes
  function getOrderedButtons(group) {
    const map = {
      'open': group.querySelector('[data-action-type="open-tab"]'),
      'copy': group.querySelector('[data-action-type="copy-link"]'),
      'pin': group.querySelector('[data-action-type="pin-post"]')
    };
    const parts = settings.actionOrder.split('-');
    return parts.map(key => map[key]).filter(Boolean);
  }

  // Dynamically update the visibility and order of all injected buttons
  function updateButtonsVisibility() {
    // Update action bar buttons
    document.querySelectorAll('.threads-enhancer-group').forEach(group => {
      const openBtn = group.querySelector('[data-action-type="open-tab"]');
      const copyBtn = group.querySelector('[data-action-type="copy-link"]');
      const pinBtn = group.querySelector('[data-action-type="pin-post"]');

      if (openBtn) {
        openBtn.style.display = settings.showOpenTab ? 'inline-flex' : 'none';
      }
      if (copyBtn) {
        copyBtn.style.display = settings.showCopyLink ? 'inline-flex' : 'none';
      }
      if (pinBtn) {
        pinBtn.style.display = settings.showPinBtn ? 'inline-flex' : 'none';
      }

      const ordered = getOrderedButtons(group);
      ordered.forEach(btn => group.appendChild(btn));
    });

    // Update back-to-top button visibility
    const bttBtn = document.querySelector('.threads-enhancer-back-to-top');
    if (bttBtn) {
      if (!settings.showBackToTop) {
        bttBtn.style.display = 'none';
        bttBtn.classList.remove('visible');
      } else {
        bttBtn.style.display = '';
      }
    }
  }

  // Update pin/unpin buttons visual state
  function updatePinButtonsState() {
    document.querySelectorAll('[data-action-type="pin-post"]').forEach(pinBtn => {
      const postUrl = pinBtn.getAttribute('data-post-url');
      const isPinned = pinnedPosts.some(p => p.url === postUrl);
      pinBtn.classList.toggle('pinned', isPinned);

      if (isPinned) {
        pinBtn.setAttribute('data-tooltip', 'Unpin post');
        pinBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <g transform="rotate(45 12 12)">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a3 3 0 0 0-6 0v4.26c0 .42-.13.84-.38 1.18l-2.78 3.5a2 2 0 0 0-.44 1.24V17z"></path>
            </g>
          </svg>
        `;
      } else {
        pinBtn.setAttribute('data-tooltip', 'Pin post');
        pinBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <g transform="rotate(45 12 12)">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a3 3 0 0 0-6 0v4.26c0 .42-.13.84-.38 1.18l-2.78 3.5a2 2 0 0 0-.44 1.24V17z"></path>
            </g>
          </svg>
        `;
      }
    });
  }


  // Helper to clean URL from extra "/media" segments
  function cleanUrl(urlStr) {
    if (!urlStr) return urlStr;
    try {
      const parsed = new URL(urlStr);
      if (parsed.pathname.includes('/media')) {
        parsed.pathname = parsed.pathname.replace(/\/media(\/.*)?$/, '');
      }
      return parsed.href;
    } catch (e) {
      return urlStr.replace(/\/media(\/.*)?$/, '');
    }
  }

  // Helper to extract post URL starting from action bar and going up
  function getPostUrl(actionBar) {
    let current = actionBar;
    while (current && current !== document.body) {
      const links = current.querySelectorAll('a');
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href) {
          if (/\/post\/[a-zA-Z0-9_-]+/i.test(href) || /\/t\/[a-zA-Z0-9_-]+/i.test(href)) {
            try {
              return cleanUrl(new URL(href, window.location.origin).href);
            } catch (e) {
              return cleanUrl(window.location.origin + href);
            }
          }
        }
      }
      current = current.parentElement;
    }

    if (/\/post\/[a-zA-Z0-9_-]+/i.test(window.location.pathname) || /\/t\/[a-zA-Z0-9_-]+/i.test(window.location.pathname)) {
      return cleanUrl(window.location.href);
    }

    return null;
  }


  // Helper to extract the author's username
  function getPostAuthor(postContainer) {
    if (!postContainer) return 'Threads User';
    
    // 1. Check all links in the container to find a profile link
    const links = postContainer.querySelectorAll('a');
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        // Match /username or /@username
        const match = href.match(/^\/(@?([a-zA-Z0-9_.]+))\/?$/);
        if (match) {
          const username = match[2];
          const blacklist = ['search', 'activity', 'messages', 'write', 'explore', 'terms', 'privacy', 'about', 'login', 'signup', 'media', 'posts'];
          if (!blacklist.includes(username.toLowerCase())) {
            return username;
          }
        }
      }
    }
    
    // 2. Fallback: try parsing post URLs which contain username
    for (const link of links) {
      const href = link.getAttribute('href');
      if (href) {
        const match = href.match(/\/(@?([a-zA-Z0-9_.]+))\/post\//i);
        if (match) {
          return match[2];
        }
      }
    }
    
    return 'Threads User';
  }

  // Helper to extract post details for pinning
  function getPostDetails(actionBar) {
    const postContainer = actionBar.closest('article') || actionBar.closest('[role="article"]') || actionBar.parentElement?.parentElement?.parentElement;
    const url = getPostUrl(actionBar);
    const author = getPostAuthor(postContainer);
    
    let text = '';
    if (postContainer) {
      try {
        const clone = postContainer.cloneNode(true);
        
        // Remove action bar, enhancers, buttons, SVGs, time tags
        clone.querySelectorAll('.threads-enhancer-group, [role="button"], button, svg, time').forEach(el => el.remove());
        
        // Get the text content of the remainder
        text = clone.textContent.replace(/\s+/g, ' ').trim();
        
        // Remove author from the start
        const authorEscaped = author.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        text = text.replace(new RegExp(`^@?${authorEscaped}\\b`, 'i'), '').trim();
        
        // Clean leading dots/timestamps (e.g. "· 2h", "• 1d")
        text = text.replace(/^[^a-zA-Z0-9]+/, '').trim();
        text = text.replace(/^\d+[hdwmy]\b/i, '').trim();
        text = text.replace(/^[^a-zA-Z0-9]+/, '').trim();
        
        if (text.length > 120) {
          text = text.substring(0, 117) + '...';
        }
      } catch (e) {
        console.error('Error parsing post text:', e);
      }
    }
    
    if (!text) {
      text = '';
    }
    
    return { url, author, text };
  }

  // Inject buttons into a specific action bar container
  function injectButtons(actionBar, postUrl) {
    if (actionBar.hasAttribute('data-threads-enhancer-processed')) {
      return;
    }
    actionBar.setAttribute('data-threads-enhancer-processed', 'true');

    const group = document.createElement('div');
    group.className = 'threads-enhancer-group';

    // 1. Open in new tab button
    const openBtn = document.createElement('a');
    openBtn.className = 'threads-enhancer-btn';
    openBtn.href = postUrl;
    openBtn.target = '_blank';
    openBtn.setAttribute('data-tooltip', 'Open in new tab');
    openBtn.setAttribute('data-action-type', 'open-tab');
    openBtn.style.display = settings.showOpenTab ? 'inline-flex' : 'none';
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(postUrl, '_blank');
    });
    openBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    `;

    // 2. Copy Link button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'threads-enhancer-btn';
    copyBtn.type = 'button';
    copyBtn.setAttribute('data-tooltip', 'Copy post link');
    copyBtn.setAttribute('data-action-type', 'copy-link');
    copyBtn.style.display = settings.showCopyLink ? 'inline-flex' : 'none';
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        await navigator.clipboard.writeText(postUrl);
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.classList.remove('copied');
        }, 1500);
      } catch (err) {
        console.error('Failed to copy post link:', err);
      }
    });
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
    `;

    // 3. Pin Post button
    const pinBtn = document.createElement('button');
    pinBtn.className = 'threads-enhancer-btn';
    pinBtn.type = 'button';
    pinBtn.setAttribute('data-action-type', 'pin-post');
    pinBtn.setAttribute('data-post-url', postUrl);
    pinBtn.style.display = settings.showPinBtn ? 'inline-flex' : 'none';

    const isPinned = pinnedPosts.some(p => p.url === postUrl);
    pinBtn.classList.toggle('pinned', isPinned);

    if (isPinned) {
      pinBtn.setAttribute('data-tooltip', 'Unpin post');
      pinBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <g transform="rotate(45 12 12)">
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a3 3 0 0 0-6 0v4.26c0 .42-.13.84-.38 1.18l-2.78 3.5a2 2 0 0 0-.44 1.24V17z"></path>
          </g>
        </svg>
      `;
    } else {
      pinBtn.setAttribute('data-tooltip', 'Pin post');
      pinBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <g transform="rotate(45 12 12)">
            <line x1="12" y1="17" x2="12" y2="22"></line>
            <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.5A2 2 0 0 1 15 9.26V5a3 3 0 0 0-6 0v4.26c0 .42-.13.84-.38 1.18l-2.78 3.5a2 2 0 0 0-.44 1.24V17z"></path>
          </g>
        </svg>
      `;
    }

    pinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      chrome.storage.sync.get({ pinnedPosts: [] }, (items) => {
        let currentPinned = items.pinnedPosts;
        const exists = currentPinned.some(p => p.url === postUrl);
        if (exists) {
          currentPinned = currentPinned.filter(p => p.url !== postUrl);
        } else {
          const details = getPostDetails(actionBar);
          currentPinned.push({
            url: postUrl,
            author: details.author,
            text: details.text,
            pinnedAt: Date.now()
          });
        }
        chrome.storage.sync.set({ pinnedPosts: currentPinned });
      });
    });

    // Append in chosen order
    const btnMap = { 'open': openBtn, 'copy': copyBtn, 'pin': pinBtn };
    const parts = settings.actionOrder.split('-');
    parts.forEach(key => {
      if (btnMap[key]) group.appendChild(btnMap[key]);
    });

    actionBar.appendChild(group);
  }

  // Find posts and action bars, then process them
  function processPage() {
    // 1. Process action bars
    const interactiveElements = document.querySelectorAll(
      'div[role="button"]:not(.threads-enhancer-btn), ' +
      'button:not(.threads-enhancer-btn), ' +
      'a[role="link"]:not(.threads-enhancer-btn)'
    );

    const ancestorCounts = new Map();
    interactiveElements.forEach(el => {
      if (!el.querySelector('svg')) return;
      
      let parent = el.parentElement;
      for (let i = 0; i < 3 && parent; i++) {
        ancestorCounts.set(parent, (ancestorCounts.get(parent) || 0) + 1);
        parent = parent.parentElement;
      }
    });

    const candidates = [];
    for (const [ancestor, count] of ancestorCounts.entries()) {
      if (count >= 3 && count <= 6) {
        if (!ancestor.hasAttribute('data-threads-enhancer-processed') && 
            !ancestor.querySelector('[data-threads-enhancer-processed]')) {
          candidates.push(ancestor);
        }
      }
    }

    const actionBars = candidates.filter(bar => {
      let isReplyComposer = false;
      
      // Method 1: Check SVG labels/titles in this bar
      const svgElements = bar.querySelectorAll('svg');
      for (const svg of svgElements) {
        const label = svg.getAttribute('aria-label') || '';
        const titleEl = svg.querySelector('title');
        const title = titleEl ? titleEl.textContent : '';
        const combined = (label + ' ' + title).toLowerCase();
        if (
          combined.includes('media') || 
          combined.includes('gif') || 
          combined.includes('composer') || 
          combined.includes('poll') || 
          combined.includes('voice') ||
          combined.includes('attach')
        ) {
          isReplyComposer = true;
          break;
        }
      }

      // Method 2: Traverse up up to 5 levels to find text inputs
      if (!isReplyComposer) {
        let p = bar;
        for (let i = 0; i < 5 && p; i++) {
          if (p.querySelector('[contenteditable="true"], textarea, [role="textbox"], [placeholder], [aria-placeholder]')) {
            isReplyComposer = true;
            break;
          }
          p = p.parentElement;
        }
      }

      if (isReplyComposer) return false;

      return !candidates.some(otherBar => otherBar !== bar && bar.contains(otherBar));
    });

    actionBars.forEach((bar) => {
      const postUrl = getPostUrl(bar);
      if (postUrl) {
        injectButtons(bar, postUrl);
      }
    });

    const btt = document.querySelector('.threads-enhancer-back-to-top');
    if (btt) {
      btt.setAttribute('data-theme', isPageDarkMode() ? 'dark' : 'light');
    }
  }

  // ========================
  // Back to Top Floating Button
  // ========================

  function createBackToTopButton() {
    if (document.querySelector('.threads-enhancer-back-to-top')) return;

    const btn = document.createElement('button');
    btn.className = 'threads-enhancer-back-to-top';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    `;

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (!settings.showBackToTop) {
      btn.style.display = 'none';
    }

    btn.setAttribute('data-theme', isPageDarkMode() ? 'dark' : 'light');

    document.body.appendChild(btn);
  }

  // Unified scroll handler — back-to-top visibility
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const btt = document.querySelector('.threads-enhancer-back-to-top');
        if (btt && settings.showBackToTop) {
          const threshold = window.innerHeight * 2;
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          btt.classList.toggle('visible', scrollY > threshold);
          btt.setAttribute('data-theme', isPageDarkMode() ? 'dark' : 'light');
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  function isPageDarkMode() {
    const bg = getComputedStyle(document.body).backgroundColor;
    const m = bg.match(/\d+/g);
    if (!m) return true;
    const [r, g, b] = m.map(Number);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  }

  // Set up mutation observer to handle dynamically loaded content
  // Debounce processPage so bursts of mutations (typical during scroll/
  // infinite-load on Threads) collapse into a single full-document scan
  // instead of one expensive scan per mutation batch.
  let processScheduled = false;
  function scheduleProcessPage() {
    if (processScheduled) return;
    processScheduled = true;
    setTimeout(() => {
      processScheduled = false;
      processPage();
    }, 150);
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        scheduleProcessPage();
        break;
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Run initial scan and periodic backup (observer handles real-time updates,
  // this just catches anything missed, e.g. attribute-only changes)
  setTimeout(processPage, 1000);
  setInterval(processPage, 5000);

  // Initialize back-to-top button
  createBackToTopButton();

  console.log('Threads Enhancer content script loaded successfully.');
})();
