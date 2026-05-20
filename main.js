// Hero slider + mobile nav + dynamic event renderer + inline RSVP/payment

(function () {
  // ----- Hero slider -----
  const slides = document.querySelectorAll('.hero-slide');
  const dotsWrap = document.querySelector('.hero-dots');
  let idx = 0;
  let timer = null;

  if (slides.length > 1 && dotsWrap) {
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', () => go(i));
      dotsWrap.appendChild(b);
    });

    function go(next) {
      slides[idx].classList.remove('active');
      const dots = dotsWrap.querySelectorAll('button');
      dots[idx].classList.remove('active');
      idx = next;
      slides[idx].classList.add('active');
      dots[idx].classList.add('active');
    }

    function tick() { go((idx + 1) % slides.length); }
    timer = setInterval(tick, 6000);

    const hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mouseenter', () => clearInterval(timer));
      hero.addEventListener('mouseleave', () => { timer = setInterval(tick, 6000); });
    }
  }

  // ----- Mobile nav -----
  const menuBtn = document.querySelector('.menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // ----- Dynamic events renderer -----
  // Any element with id="events-mount" will be filled from events.json.
  // data-limit on the mount limits to first N events (used on home page).
  const mounts = document.querySelectorAll('[id="events-mount"]');
  if (mounts.length === 0) return;

  fetch('events.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      const events = (data.events || []).slice().sort((a, b) => a.isoDate.localeCompare(b.isoDate));
      mounts.forEach(mount => {
        const limit = parseInt(mount.getAttribute('data-limit') || '0', 10);
        const list = limit > 0 ? events.slice(0, limit) : events;
        mount.innerHTML = renderEventsList(list);
        wireExpand(mount);
        wireForms(mount);
      });
    })
    .catch(err => {
      console.error('Failed to load events.json', err);
      mounts.forEach(m => {
        m.innerHTML = '<p style="padding:24px;color:#6b6b6b;text-align:center;">Events are loading. If this stays here, please refresh.</p>';
      });
    });

  function renderEventsList(events) {
    if (!events.length) {
      return '<p style="padding:24px;color:#6b6b6b;text-align:center;">No upcoming events on the calendar. Check back soon.</p>';
    }
    return events.map(renderEvent).join('');
  }

  function renderEvent(ev) {
    const thumb = ev.isComingSoon || !ev.thumbnail
      ? `<div class="event-thumb event-thumb-soon"><span>Coming<br/>Soon</span></div>`
      : `<div class="event-thumb"><img src="${ev.thumbnail}" alt="${escapeHtml(ev.title)}" loading="lazy" /></div>`;

    const meta = [
      `<span class="pill">${escapeHtml(ev.category)}</span>`,
      ev.startTime ? `<span>${escapeHtml(ev.startTime)}${ev.endTime ? ' to ' + escapeHtml(ev.endTime) : ''}</span>` : '',
      ev.location ? `<span>${escapeHtml(ev.location)}</span>` : '',
      ev.paymentRequired ? `<span class="pill pill-paid">$${ev.pricePerPerson} per person</span>` : '',
      ev.rsvpRequired && !ev.isComingSoon ? `<span class="pill pill-rsvp">RSVP required</span>` : ''
    ].filter(Boolean).join('');

    return `
      <article class="event event-expandable" data-event-id="${ev.id}">
        <button class="event-toggle" aria-expanded="false" aria-controls="event-detail-${ev.id}">
          <div class="event-date">
            <span class="mo">${escapeHtml(ev.month)}</span>
            <span class="day">${escapeHtml(ev.day)}</span>
          </div>
          <div class="event-body">
            <h3>${escapeHtml(ev.title)}</h3>
            <div class="event-meta">${meta}</div>
          </div>
          ${thumb}
          <span class="event-chevron" aria-hidden="true"></span>
        </button>
        <div class="event-detail" id="event-detail-${ev.id}" hidden>
          <div class="event-detail-inner">
            <p class="event-desc">${escapeHtml(ev.description || '')}</p>
            ${renderEventActions(ev)}
            ${ev.rsvpRequired || !ev.isComingSoon ? renderRsvpForm(ev) : ''}
          </div>
        </div>
      </article>
    `;
  }

  function renderEventActions(ev) {
    if (ev.isComingSoon) {
      return `<div class="event-actions"><span class="event-action-note">Details and RSVP open soon. Sign up for SMS to be notified.</span></div>`;
    }
    if (ev.paymentRequired && ev.paymentLink) {
      return `
        <div class="event-actions">
          <a class="btn" href="${escapeAttr(ev.paymentLink)}" target="_blank" rel="noopener">Pay $${ev.pricePerPerson} and Reserve Seat</a>
          <span class="event-action-note">Secure payment opens in a new tab.</span>
        </div>
      `;
    }
    return '';
  }

  function renderRsvpForm(ev) {
    // Form posts to Formspree (or any form backend). Replace REPLACE_WITH_FORMSPREE_ID
    // with the real endpoint once you create one at formspree.io.
    return `
      <form class="event-rsvp" action="https://formspree.io/f/REPLACE_WITH_FORMSPREE_ID" method="POST" data-event-id="${ev.id}">
        <h4 class="event-rsvp-title">RSVP for ${escapeHtml(ev.title)}</h4>
        <input type="hidden" name="event_id" value="${escapeAttr(ev.id)}" />
        <input type="hidden" name="event_title" value="${escapeAttr(ev.title)}" />
        <input type="hidden" name="event_date" value="${escapeAttr(ev.isoDate)}" />
        <div class="rsvp-row">
          <label>Name<input type="text" name="name" required autocomplete="name" /></label>
          <label>Email<input type="email" name="email" required autocomplete="email" /></label>
        </div>
        <div class="rsvp-row">
          <label>Phone (for text reminder)<input type="tel" name="phone" autocomplete="tel" /></label>
          <label>How many attending<input type="number" name="guests" value="1" min="1" max="20" required /></label>
        </div>
        <label>Anything we should know<textarea name="notes" rows="2" placeholder="Optional"></textarea></label>
        <div class="rsvp-actions">
          <button type="submit" class="btn">Submit RSVP</button>
          <span class="rsvp-status" aria-live="polite"></span>
        </div>
      </form>
    `;
  }

  function wireExpand(root) {
    root.querySelectorAll('.event-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const article = btn.closest('.event-expandable');
        const detail = article.querySelector('.event-detail');
        const open = article.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) detail.removeAttribute('hidden'); else detail.setAttribute('hidden', '');
      });
    });
  }

  function wireForms(root) {
    root.querySelectorAll('.event-rsvp').forEach(form => {
      form.addEventListener('submit', async (e) => {
        const status = form.querySelector('.rsvp-status');
        const action = form.getAttribute('action') || '';
        if (action.includes('REPLACE_WITH_FORMSPREE_ID')) {
          // Placeholder mode. Show a friendly success without actually posting.
          e.preventDefault();
          status.textContent = 'Demo mode. Wire this up to Formspree, Netlify Forms, or Resend before launch.';
          status.style.color = '#9b5a14';
          form.querySelectorAll('input, textarea, button').forEach(el => el.setAttribute('disabled', ''));
          return;
        }
        // If a real endpoint is set, let the browser submit normally
        status.textContent = 'Sending...';
        status.style.color = '#3a3a3a';
      });
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }
})();
