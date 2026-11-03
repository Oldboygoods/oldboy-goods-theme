/* Oldboy Goods theme scripts: mobile menu, cart drawer, AJAX add-to-cart,
   product recommendations, sort select and mobile gallery counter. */
(function () {
  'use strict';

  const routes = (window.theme && window.theme.routes) || {
    cart: '/cart', cartAdd: '/cart/add', cartChange: '/cart/change', root: '/'
  };
  const DRAWER_SECTION = 'cart-drawer';

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Cart drawer ---------- */
  let lastFocus = null;

  function drawerEl() { return document.querySelector('[data-cart-drawer]'); }

  function openDrawer() {
    const drawer = drawerEl();
    if (!drawer) return false;
    lastFocus = document.activeElement;
    document.body.classList.remove('menu-open');
    document.body.classList.add('drawer-open');
    drawer.focus();
    return true;
  }

  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-cart-open]');
    if (opener) {
      if (openDrawer()) e.preventDefault();
      return;
    }
    if (e.target.closest('[data-drawer-close]')) {
      e.preventDefault();
      closeDrawer();
      return;
    }
    const remove = e.target.closest('[data-line-remove]');
    if (remove) {
      e.preventDefault();
      removeLine(remove.getAttribute('data-line-remove'), remove.closest('.line-item'));
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) closeDrawer();
  });

  function replaceDrawer(html) {
    if (!html) return;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const fresh = doc.querySelector('[data-cart-drawer]');
    const current = drawerEl();
    if (fresh && current) current.innerHTML = fresh.innerHTML;
  }

  function updateCount() {
    return fetch(routes.cart + '.js', { headers: { Accept: 'application/json' } })
      .then((r) => r.json())
      .then((cart) => {
        document.querySelectorAll('[data-cart-count]').forEach((el) => {
          el.textContent = cart.item_count > 0 ? cart.item_count : '';
        });
        document.querySelectorAll('[data-cart-open]').forEach((el) => {
          el.setAttribute('aria-label', 'Basket, ' + cart.item_count + ' items');
        });
      })
      .catch(() => {});
  }

  function removeLine(key, lineEl) {
    if (lineEl) lineEl.classList.add('is-loading');
    fetch(routes.cartChange + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0, sections: DRAWER_SECTION })
    })
      .then((r) => r.json())
      .then((data) => {
        replaceDrawer(data.sections && data.sections[DRAWER_SECTION]);
        updateCount();
      })
      .catch(() => { window.location.href = routes.cart; });
  }

  /* ---------- Add to cart ---------- */
  document.querySelectorAll('[data-product-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const button = form.querySelector('[data-add-button]');
      const errorEl = form.querySelector('[data-form-error]');
      if (errorEl) errorEl.textContent = '';
      if (button) { button.setAttribute('aria-disabled', 'true'); button.disabled = true; }

      const body = new FormData(form);
      body.append('sections', DRAWER_SECTION);
      body.append('sections_url', window.location.pathname);

      fetch(routes.cartAdd + '.js', {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body
      })
        .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
        .then(({ ok, data }) => {
          if (!ok) {
            const msg = data && (data.description || data.message);
            if (errorEl) {
              errorEl.textContent = /already|quantity|stock|available/i.test(msg || '')
                ? 'This piece is already in your basket.'
                : (msg || 'Something went wrong — please try again.');
            }
            return;
          }
          replaceDrawer(data.sections && data.sections[DRAWER_SECTION]);
          updateCount();
          openDrawer();
        })
        .catch(() => form.submit())
        .finally(() => {
          if (button) { button.removeAttribute('aria-disabled'); button.disabled = false; }
        });
    });
  });

  /* ---------- Product recommendations ---------- */
  const recs = document.querySelector('[data-recommendations]');
  if (recs && recs.dataset.url) {
    const load = () => {
      fetch(recs.dataset.url)
        .then((r) => r.text())
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const fresh = doc.querySelector('[data-recommendations]');
          if (fresh && fresh.innerHTML.trim().length) recs.innerHTML = fresh.innerHTML;
        })
        .catch(() => {});
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((en) => en.isIntersecting)) { io.disconnect(); load(); }
      }, { rootMargin: '600px 0px' });
      io.observe(recs);
    } else {
      load();
    }
  }

  /* ---------- Collection sort ---------- */
  const sort = document.querySelector('[data-sort]');
  if (sort) {
    sort.addEventListener('change', () => {
      const url = new URL(window.location.href);
      url.searchParams.set('sort_by', sort.value);
      url.searchParams.delete('page');
      window.location.href = url.toString();
    });
  }

  /* ---------- Mobile gallery counter ---------- */
  const track = document.querySelector('[data-gallery-track]');
  const indexEl = document.querySelector('[data-gallery-index]');
  if (track && indexEl) {
    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const i = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)) + 1;
        indexEl.textContent = String(i);
        ticking = false;
      });
    }, { passive: true });
  }
})();
