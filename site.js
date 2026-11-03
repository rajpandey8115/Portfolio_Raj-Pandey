(() => {
  const origin = 'https://therishithakor.com/';
  const routeFiles = {
    'web-developer': 'Web_development.html',
    'app-developer': 'App_development.html',
    'ui-ux-designer': 'Design.html',
    'graphic-designer': 'Graphic_design.html'
  };
  const externalRoutes = new Set(['photographer', 'legal', 'ability-card']);
  const page = decodeURIComponent(location.pathname.split('/').pop() || 'Home.html');
  const assetFolders = {
    'Web_development.html': 'web-developer/',
    'App_development.html': 'app-developer/',
    'Design.html': 'ui-ux-designer/',
    'Graphic_design.html': 'graphic-designer/'
  };
  const assetRoot = new URL(assetFolders[page] || '', origin);

  function localRoute(value) {
    if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(value)) return value;
    const suffixAt = value.search(/[?#]/);
    const path = suffixAt < 0 ? value : value.slice(0, suffixAt);
    const suffix = suffixAt < 0 ? '' : value.slice(suffixAt);
    const normalized = path.replace(/^(?:\.\.\/|\.\/)+/, '').replace(/^\/+|\/+$/g, '');
    if (/\.html$/i.test(normalized)) return value;
    const slug = normalized.split('/').filter(Boolean).pop();
    if (slug && routeFiles[slug]) return routeFiles[slug] + suffix;
    if (slug && externalRoutes.has(slug)) return new URL(slug + '/' + suffix, origin).href;
    if (!normalized || normalized === '.' || normalized === '..') return 'Home.html' + suffix;
    return value;
  }

  function remoteAsset(value) {
    if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|data:|blob:)/i.test(value)) return value;
    const suffixAt = value.search(/[?#]/);
    const path = suffixAt < 0 ? value : value.slice(0, suffixAt);
    const suffix = suffixAt < 0 ? '' : value.slice(suffixAt);
    const relative = path.replace(/^(?:\.\.\/|\.\/)+/, '').replace(/^\/+/, '');
    if (relative.startsWith('assets/')) return value;
    return relative ? new URL(relative, path.startsWith('/') ? origin : assetRoot).href + suffix : value;
  }

  function processElement(element) {
    if (!(element instanceof Element)) return;
    if (element.matches('a[href], area[href]')) {
      const href = element.getAttribute('href');
      const rewritten = localRoute(href);
      if (rewritten !== href) element.setAttribute('href', rewritten);
    }
    if (element instanceof HTMLIFrameElement && element.hasAttribute('src')) {
      const src = element.getAttribute('src');
      const rewritten = localRoute(src);
      if (rewritten !== src) element.setAttribute('src', rewritten);
    }
    if (element.matches('link[rel~="icon"], link[rel="apple-touch-icon"]')) {
      const href = element.getAttribute('href');
      const rewritten = remoteAsset(href);
      if (rewritten !== href) element.setAttribute('href', rewritten);
    }
    if (element.matches('img[src], video[src], audio[src], source[src], video[poster]')) {
      for (const attribute of ['src', 'poster']) {
        const value = element.getAttribute(attribute);
        const rewritten = remoteAsset(value);
        if (rewritten !== value) element.setAttribute(attribute, rewritten);
      }
    }
    if (element.hasAttribute('style')) {
      const style = element.getAttribute('style');
      const rewritten = style.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (match, quote, value) => {
        const url = remoteAsset(value.trim());
        return url === value.trim() ? match : `url(${quote}${url}${quote})`;
      });
      if (rewritten !== style) element.setAttribute('style', rewritten);
    }
  }

  function processTree(root) {
    if (root instanceof Element) processElement(root);
    if (root.querySelectorAll) {
      root.querySelectorAll('a[href], area[href], iframe[src], img[src], video[src], video[poster], audio[src], source[src], [style]')
        .forEach(processElement);
    }
  }

  processTree(document);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') processElement(record.target);
      for (const node of record.addedNodes) processTree(node);
    }
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['href', 'src', 'poster', 'style'],
    childList: true,
    subtree: true
  });
})();
