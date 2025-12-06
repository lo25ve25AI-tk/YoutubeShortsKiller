(() => {
  const SHORT_LINK_SELECTORS = [
    'a[href^="/shorts/"]',
    'a[href^="https://www.youtube.com/shorts/"]',
    'a[href*="/shorts/"]'
  ];

  const SHORT_BADGE_TEXTS = ['shorts', 'ショート', 'short'];

  const SHORT_CONTAINER_SELECTORS = [
    'ytd-reel-shelf-renderer',
    'ytd-rich-shelf-renderer[is-shorts]',
    'ytd-reel-item-renderer',
    'ytd-reel-video-renderer',
    'ytd-reel-video-renderer-slim',
    // Any grid/list item that embeds a Shorts link should be removed entirely.
    'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
    'ytd-grid-video-renderer:has(a[href*="/shorts/"])',
    'ytd-video-renderer:has(a[href*="/shorts/"])',
    'ytd-compact-video-renderer:has(a[href*="/shorts/"])',
    'ytd-rich-grid-media:has(a[href*="/shorts/"])'
  ];

  function redirectShortsPage() {
    const path = location.pathname;
    if (path.startsWith('/shorts') || path === '/feed/shorts') {
      location.replace('/');
    }
  }

  function injectHidingStyles() {
    // Avoid duplicating the style element if the script runs more than once.
    if (document.getElementById('ysk-shorts-hide-style')) return;

    const style = document.createElement('style');
    style.id = 'ysk-shorts-hide-style';
    style.textContent = `
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-reel-item-renderer,
      ytd-reel-video-renderer,
      ytd-reel-video-renderer-slim,
      ytd-mini-guide-entry-renderer a[href*="/shorts"],
      ytd-guide-entry-renderer a[href*="/shorts"],
      a[href*="/shorts/"] {
        display: none !important;
      }
    `;
    document.documentElement.append(style);
  }

  function removeShortsFromNav(root = document) {
    const navSelectors = [
      'ytd-guide-entry-renderer a[href*="/shorts"], ytd-mini-guide-entry-renderer a[href*="/shorts"]',
      'a#endpoint[title="Shorts"], a[aria-label="Shorts"]'
    ];

    root.querySelectorAll(navSelectors.join(',')).forEach((link) => {
      const navItem = link.closest('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer');
      if (navItem) {
        navItem.remove();
      } else {
        link.remove();
      }
    });
  }

  function removeShortsLinks(root = document) {
    const removableSelector = [
      'ytd-rich-item-renderer',
      'ytd-compact-video-renderer',
      'ytd-video-renderer',
      'ytd-rich-grid-media',
      'ytd-grid-video-renderer',
      'ytd-compact-radio-renderer',
      'ytd-playlist-video-renderer',
      'ytd-compact-autoplay-renderer'
    ].join(',');

    const targets = root.querySelectorAll(SHORT_LINK_SELECTORS.join(','));

    targets.forEach((link) => {
      const removable = link.closest(removableSelector);

      if (removable) {
        removable.remove();
        return;
      }

      if (link.parentElement) {
        link.remove();
      }
    });
  }

  function removeShortsShelves(root = document) {
    root.querySelectorAll(SHORT_CONTAINER_SELECTORS.join(',')).forEach((node) => {
      node.remove();
    });

    root.querySelectorAll('ytd-rich-section-renderer').forEach((section) => {
      if (section.querySelector('ytd-rich-shelf-renderer[is-shorts]')) {
        section.remove();
      }
    });

    // Shorts can also appear inside reel shelves embedded in search or playlists.
    root.querySelectorAll('ytd-horizontal-list-renderer').forEach((list) => {
      if (list.querySelector('ytd-reel-item-renderer, ytd-reel-video-renderer')) {
        list.remove();
      }
    });
  }

  function removeShortsBadges(root = document) {
    root.querySelectorAll('ytd-badge-supported-renderer').forEach((badge) => {
      const text = badge.textContent?.toLowerCase() || '';

      if (SHORT_BADGE_TEXTS.some((token) => text.includes(token))) {
        const card = badge.closest(
          [
            'ytd-rich-item-renderer',
            'ytd-compact-video-renderer',
            'ytd-video-renderer',
            'ytd-rich-grid-media',
            'ytd-grid-video-renderer'
          ].join(',')
        );

        if (card) {
          card.remove();
        } else {
          badge.remove();
        }
      }
    });

    root
      .querySelectorAll('[overlay-style="SHORTS"], yt-img-shadow.ytd-reel-player-overlay-renderer')
      .forEach((overlay) => {
        const card = overlay.closest(
          [
            'ytd-rich-item-renderer',
            'ytd-compact-video-renderer',
            'ytd-video-renderer',
            'ytd-rich-grid-media',
            'ytd-grid-video-renderer',
            'ytd-compact-playlist-video-renderer'
          ].join(',')
        );

        if (card) {
          card.remove();
        }
      });
  }

  function removeShortsChips(root = document) {
    root.querySelectorAll('yt-chip-cloud-chip-renderer').forEach((chip) => {
      const text = chip.textContent?.toLowerCase() || '';

      if (text.includes('shorts') || text.includes('ショート')) {
        chip.remove();
        return;
      }

      const link = chip.querySelector('a[href*="shorts"], a[title="Shorts"]');
      if (link) {
        chip.remove();
      }
    });
  }

  function purgeShorts(root = document) {
    removeShortsFromNav(root);
    removeShortsLinks(root);
    removeShortsShelves(root);
    removeShortsBadges(root);
    removeShortsChips(root);
  }

  function watchMutations() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          purgeShorts(node);
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function run() {
    injectHidingStyles();
    redirectShortsPage();
    purgeShorts();
    watchMutations();

    window.addEventListener('yt-navigate-finish', () => {
      redirectShortsPage();
      purgeShorts();
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    run();
  } else {
    document.addEventListener('DOMContentLoaded', run);
  }
})();
