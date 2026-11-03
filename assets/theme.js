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

  /* ---------- Newsletter: Klaviyo (if configured) or Shopify customer form ---------- */
  const klaviyo = (window.theme && window.theme.klaviyo) || {};
  const useKlaviyo = !!(klaviyo.publicKey && klaviyo.listId);
  const POPUP_KEY = 'obg-newsletter';
  function remember(state, days) {
    try { localStorage.setItem(POPUP_KEY, JSON.stringify({ state, until: Date.now() + days * 864e5 })); } catch (e) {}
  }
  function remembered() {
    try {
      const v = JSON.parse(localStorage.getItem(POPUP_KEY) || 'null');
      return v && (v.state === 'subscribed' || v.until > Date.now());
    } catch (e) { return false; }
  }

  function subscribeKlaviyo(email, source) {
    return fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(klaviyo.publicKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/vnd.api+json', revision: '2024-10-15' },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            custom_source: source,
            profile: { data: { type: 'profile', attributes: {
              email,
              subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } }
            } } }
          },
          relationships: { list: { data: { type: 'list', id: klaviyo.listId } } }
        }
      })
    }).then((r) => { if (!r.ok) throw new Error('Klaviyo ' + r.status); });
  }

  document.querySelectorAll('#NewsletterPopupForm, #NewsletterStrip, #FooterNewsletter').forEach((form) => {
    if (!useKlaviyo) return; // Shopify's customer form handles it
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const msg = form.querySelector('[data-newsletter-message]');
      const btn = form.querySelector('button[type="submit"]');
      if (!input || !input.value) return;
      if (btn) btn.disabled = true;
      subscribeKlaviyo(input.value.trim(), form.id === 'NewsletterPopupForm' ? 'Website pop-up' : 'Website form')
        .then(() => {
          form.classList.add('is-done');
          if (msg) msg.hidden = false;
          input.value = '';
          remember('subscribed', 3650);
        })
        .catch(() => form.submit()) // fall back to Shopify if Klaviyo is unreachable
        .finally(() => { if (btn) btn.disabled = false; });
    });
  });

  /* ---------- Newsletter pop-up ---------- */
  const popup = document.querySelector('[data-popup]');
  if (popup) {
    const days = parseInt(popup.dataset.days || '30', 10);
    const delay = parseInt(popup.dataset.delay || '8', 10) * 1000;
    const dialog = popup.querySelector('[role="dialog"]');
    let lastPopupFocus = null;
    const posted = /customer_posted=true/.test(location.search) || popup.querySelector('.form-message:not([data-newsletter-message])');

    function openPopup() {
      if (document.body.classList.contains('drawer-open')) return setTimeout(openPopup, 5000);
      lastPopupFocus = document.activeElement;
      popup.hidden = false;
      document.body.classList.add('popup-open');
      if (dialog) dialog.focus();
    }
    function closePopup() {
      popup.hidden = true;
      document.body.classList.remove('popup-open');
      remember('dismissed', days);
      if (lastPopupFocus && lastPopupFocus.focus) lastPopupFocus.focus();
    }
    popup.querySelectorAll('[data-popup-close]').forEach((el) => el.addEventListener('click', closePopup));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !popup.hidden) closePopup(); });
    const inEditor = window.Shopify && window.Shopify.designMode;
    if (posted) { remember('subscribed', 3650); if (popup.querySelector('.form-message:not([data-newsletter-message])')) openPopup(); }
    else if (inEditor) { /* shown via the theme editor's section select below */ }
    else if (!remembered()) setTimeout(openPopup, delay);
    document.addEventListener('shopify:section:select', (e) => { if (e.target.querySelector && e.target.querySelector('[data-popup]')) { popup.hidden = false; } });
    document.addEventListener('shopify:section:deselect', (e) => { if (e.target.querySelector && e.target.querySelector('[data-popup]')) { popup.hidden = true; } });
  }
})();
