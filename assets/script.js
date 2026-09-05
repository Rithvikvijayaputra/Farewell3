/* ==========================================================================
   RITHVIK VIJAYAPUTRA — FOUR YEARS, ONE JOURNEY
   Shared behaviour
   ========================================================================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   Ambient particle fields — lightweight, CSS-driven
   -------------------------------------------------------------------------- */
function spawnParticles(container, count = 14) {
  if (!container || prefersReducedMotion) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    const left = Math.random() * 100;
    const duration = 9 + Math.random() * 10;
    const delay = Math.random() * -duration;
    const driftX = (Math.random() * 60 - 30).toFixed(0) + 'px';
    const size = (1.5 + Math.random() * 2).toFixed(1);
    p.style.left = left + '%';
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.animationDuration = duration + 's';
    p.style.animationDelay = delay + 's';
    p.style.setProperty('--drift-x', driftX);
    frag.appendChild(p);
  }
  container.appendChild(frag);
}

document.querySelectorAll('.particle-field').forEach((field) => {
  spawnParticles(field, Number(field.dataset.count) || 14);
});

/* --------------------------------------------------------------------------
   Cinematic Stage Controller
   Drives the five-shot farewell sequence on index.html
   -------------------------------------------------------------------------- */
class CinematicStage {
  constructor(root) {
    this.root = root;
    this.scenes = Array.from(root.querySelectorAll('.stage__scene'));
    this.tracks = Array.from(root.querySelectorAll('.stage__timeline-track'));
    this.dots = Array.from(root.querySelectorAll('.stage__dot-btn'));
    this.prevBtn = root.querySelector('.stage__nav-arrow--prev');
    this.nextBtn = root.querySelector('.stage__nav-arrow--next');
    this.yearEl = root.querySelector('.stage__year');
    this.titleEl = root.querySelector('.stage__title');
    this.captionEl = root.querySelector('.stage__caption');
    this.frameEl = root.querySelector('[data-frame-counter]');
    this.duration = 7000;
    this.index = 0;
    this.timer = null;
    this.startedAt = 0;
    this.paused = false;

    this.bindControls();
    this.goTo(0, true);
    if (!prefersReducedMotion) this.play();

    root.addEventListener('mouseenter', () => this.pause());
    root.addEventListener('mouseleave', () => { if (!prefersReducedMotion) this.play(); });
    root.addEventListener('focusin', () => this.pause());
    root.addEventListener('focusout', (e) => {
      if (!root.contains(e.relatedTarget) && !prefersReducedMotion) this.play();
    });

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { this.next(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { this.prevScene(); e.preventDefault(); }
    });
  }

  bindControls() {
    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => this.goTo(i));
    });
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prevScene());
  }

  goTo(i, immediate = false) {
    const total = this.scenes.length;
    const nextIndex = (i + total) % total;
    this.scenes.forEach((scene, idx) => {
      scene.classList.toggle('is-active', idx === nextIndex);
      scene.classList.toggle('is-prev', idx === this.index && idx !== nextIndex);
    });
    this.dots.forEach((dot, idx) => dot.setAttribute('aria-current', idx === nextIndex ? 'true' : 'false'));
    this.tracks.forEach((track, idx) => {
      const bar = track.querySelector('i');
      track.classList.remove('is-active');
      if (idx < nextIndex) {
        track.classList.add('is-done');
        if (bar) bar.style.transition = 'none';
      } else if (idx > nextIndex) {
        track.classList.remove('is-done');
        if (bar) { bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; }
      }
    });
    this.index = nextIndex;
    this.updateCaption();
    if (!immediate) this.restartTimer();
    this.animateActiveTrack();
  }

  updateCaption() {
    const scene = this.scenes[this.index];
    if (!scene) return;
    if (this.yearEl) this.yearEl.textContent = scene.dataset.year || '';
    if (this.titleEl) this.titleEl.textContent = scene.dataset.title || '';
    if (this.captionEl) this.captionEl.textContent = scene.dataset.caption || '';
    if (this.frameEl) {
      const num = String(this.index + 1).padStart(2, '0');
      const total = String(this.scenes.length).padStart(2, '0');
      this.frameEl.textContent = `${num} / ${total}`;
    }
  }

  animateActiveTrack() {
    const track = this.tracks[this.index];
    if (!track) return;
    track.classList.remove('is-done');
    track.classList.add('is-active');
    const bar = track.querySelector('i');
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.transform = 'scaleX(0)';
    // force reflow so the transition re-triggers
    // eslint-disable-next-line no-unused-expressions
    bar.offsetHeight;
    if (prefersReducedMotion || this.paused) return;
    bar.style.transition = `transform ${this.duration}ms linear`;
    bar.style.transform = 'scaleX(1)';
  }

  next() { this.goTo(this.index + 1); }
  prevScene() { this.goTo(this.index - 1); }

  play() {
    this.paused = false;
    this.animateActiveTrack();
    clearInterval(this.timer);
    this.timer = setInterval(() => this.next(), this.duration);
  }

  pause() {
    this.paused = true;
    clearInterval(this.timer);
    const track = this.tracks[this.index];
    if (track) {
      const bar = track.querySelector('i');
      if (bar) {
        const computed = getComputedStyle(bar).transform;
        bar.style.transition = 'none';
        bar.style.transform = computed;
      }
    }
  }

  restartTimer() {
    if (this.paused || prefersReducedMotion) return;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.next(), this.duration);
  }
}

const stageEl = document.querySelector('[data-cinematic-stage]');
if (stageEl) new CinematicStage(stageEl);

/* --------------------------------------------------------------------------
   Shoutouts modal
   -------------------------------------------------------------------------- */
function initShoutoutModal() {
  const overlay = document.querySelector('[data-modal-overlay]');
  if (!overlay) return;
  const nameEl = overlay.querySelector('[data-modal-name]');
  const roleEl = overlay.querySelector('[data-modal-role]');
  const avatarEl = overlay.querySelector('[data-modal-avatar]');
  const messageEl = overlay.querySelector('[data-modal-message]');
  const closeBtn = overlay.querySelector('[data-modal-close]');
  let lastFocused = null;

  function openModal(data) {
    nameEl.textContent = data.name;
    roleEl.textContent = data.role;
    avatarEl.textContent = data.name.trim().charAt(0).toUpperCase();
    messageEl.textContent = data.message;
    lastFocused = document.activeElement;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-team-card]').forEach((card) => {
    const open = () => openModal({
      name: card.dataset.name,
      role: card.dataset.role,
      message: card.dataset.message,
    });
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });
}
initShoutoutModal();

/* --------------------------------------------------------------------------
   Copy-to-clipboard (Connect page)
   -------------------------------------------------------------------------- */
function initCopyButtons() {
  const toast = document.querySelector('[data-copy-toast]');
  document.querySelectorAll('[data-copy-value]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copyValue;
      try {
        await navigator.clipboard.writeText(value);
        showToast(toast, 'Copied to clipboard');
      } catch (err) {
        showToast(toast, 'Copy failed — please copy manually');
      }
    });
  });
}

function showToast(toast, message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-shown');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-shown'), 2200);
}
initCopyButtons();
