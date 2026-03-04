/* ─────────────────────────────────────────────────────────
   U2S — MAIN SCRIPT
   1. Theme toggle (runs first, avoids flash)
   2. Content loader (fetches content.json, renders DOM)
   3. Canvas animation, reveal, tabs, counters, waveforms
   ───────────────────────────────────────────────────────── */

// ══ 1. THEME TOGGLE ════════════════════════════════════════
(function initTheme() {
  const root = document.documentElement;
  const STORAGE = 'u2s-theme';
  const btn = document.getElementById('themeToggle');

  const saved = localStorage.getItem(STORAGE) || 'dark';
  root.setAttribute('data-theme', saved);

  if (!btn) return;
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE, next);

    btn.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), border-color 0.3s, color 0.3s';
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => { btn.style.transform = ''; btn.style.transition = ''; }, 450);
  });
})();


// ══ 2. CONTENT LOADER ══════════════════════════════════════
// SVG icons for pipeline steps (keyed by step.icon)
const STEP_ICONS = {
  scanlines: `<svg viewBox="0 0 48 48" fill="none">
    <rect x="6"  y="8"  width="6" height="32" rx="2" fill="currentColor" opacity="0.3"/>
    <rect x="14" y="12" width="6" height="28" rx="2" fill="currentColor" opacity="0.5"/>
    <rect x="22" y="6"  width="6" height="36" rx="2" fill="currentColor" opacity="0.7"/>
    <rect x="30" y="14" width="6" height="26" rx="2" fill="currentColor" opacity="0.5"/>
    <rect x="38" y="10" width="4" height="30" rx="2" fill="currentColor" opacity="0.3"/>
  </svg>`,
  wedge: `<svg viewBox="0 0 48 48" fill="none">
    <path d="M24 42 L6 10 L42 10 Z" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.5"/>
    <path d="M24 36 L10 12 L38 12 Z" fill="currentColor" opacity="0.35"/>
    <path d="M24 28 L16 14 L32 14 Z" fill="currentColor" opacity="0.6"/>
  </svg>`,
  spectrogram: `<svg viewBox="0 0 48 48" fill="none">
    <rect x="4" y="10" width="40" height="28" rx="3" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.05"/>
    <rect x="8" y="14" width="32" height="4" rx="1" fill="currentColor" opacity="0.8"/>
    <rect x="8" y="20" width="24" height="4" rx="1" fill="currentColor" opacity="0.6"/>
    <rect x="8" y="26" width="28" height="4" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="8" y="32" width="18" height="4" rx="1" fill="currentColor" opacity="0.3"/>
  </svg>`,
  speaker: `<svg viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="14" stroke="currentColor" stroke-width="1.5" fill="currentColor" fill-opacity="0.05"/>
    <circle cx="24" cy="24" r="8"  fill="currentColor" opacity="0.2"/>
    <circle cx="24" cy="24" r="4"  fill="currentColor" opacity="0.6"/>
    <path d="M10 24 Q17 16 24 24 Q31 32 38 24" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.6"/>
  </svg>`,
};

const ARROW_SVG = `<svg viewBox="0 0 24 24" fill="none">
  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// ── Render helpers ─────────────────────────────────────────
function renderNav(nav, site) {
  document.getElementById('navLogo').textContent = site.logo;
  const ul = document.getElementById('navLinks');
  ul.innerHTML = nav.links.map(l =>
    `<li><a href="${l.href}">${l.label}</a></li>`
  ).join('');
}

function renderHero(hero) {
  const chips = hero.chips.map(c =>
    `<span class="author-chip${c.highlight ? ' highlight' : ''}">${c.label}</span>`
  );
  // Interleave dividers
  const chipRow = chips.reduce((acc, chip, i) => {
    acc.push(chip);
    if (i < chips.length - 1) {
      acc.push(`<span class="divider">${i === chips.length - 2 ? '→' : '+'}</span>`);
    }
    return acc;
  }, []).join('');

  const buttons = hero.buttons.map(b =>
    `<a href="${b.href}" class="btn btn-${b.style}">${b.label}</a>`
  ).join('');

  document.getElementById('heroContent').innerHTML = `
    <div class="badge">${hero.badge}</div>
    <h1>${hero.title}</h1>
    <p class="subtitle">${hero.subtitle}</p>
    <div class="author-row">${chipRow}</div>
    <div class="hero-links">${buttons}</div>
  `;
}

function renderAbstract(data) {
  const paras = data.paragraphs.map(p => `<p>${p}</p>`).join('');
  const stats = data.stats.map(s => `
    <div class="stat-card" data-delay="${s.delay}">
      <span class="stat-num"${s.animated ? ` data-target="${s.value}"` : ''}>${s.animated ? '0' : s.value}</span>
      <span class="stat-label">${s.label}</span>
    </div>
  `).join('');

  document.getElementById('abstractGrid').innerHTML = `
    <div class="abstract-text">
      <h2 class="section-label">${data.sectionLabel}</h2>
      ${paras}
    </div>
    <div class="abstract-stats">${stats}</div>
  `;
}

function renderPipeline(data) {
  document.getElementById('pipelineTitle').textContent = data.sectionTitle;
  document.getElementById('pipelineDesc').textContent = data.sectionDesc;

  const track = document.getElementById('pipelineTrack');
  const parts = [];
  data.steps.forEach((step, i) => {
    parts.push(`
      <div class="pipeline-step" id="${step.id}">
        <div class="step-icon">${STEP_ICONS[step.icon] || ''}</div>
        <div class="step-body">
          <span class="step-tag">${step.tag}</span>
          <h3>${step.title}</h3>
          <p>${step.body}</p>
        </div>
      </div>
    `);
    if (step.arrowLabel) {
      parts.push(`
        <div class="pipeline-arrow">
          ${ARROW_SVG}
          <span class="arrow-label${step.arrowGpu ? ' gpu-badge' : ''}">${step.arrowLabel}</span>
        </div>
      `);
    }
  });
  track.innerHTML = parts.join('');
}

function renderModelCard(m) {
  const blocks = m.archBlocks.map(b =>
    b === '→' ? `<div class="arch-arrow">→</div>` : `<div class="arch-block">${b}</div>`
  ).join('');

  const details = m.details.map(d => {
    const val = d.type === 'code' ? `<code>${d.value}</code>` : `<em>${d.value}</em>`;
    return `<li><span>${d.label}</span>${val}</li>`;
  }).join('');

  return `
    <div class="model-card reveal${m.highlight ? ' card-highlight' : ''}" data-delay="${m.delay}">
      <div class="model-tag ${m.tagClass}">${m.tag}</div>
      <h3 class="model-name">${m.name}</h3>
      <p class="model-code">${m.code}</p>
      ${m.conference || m.arxivLink ? `
      <div class="model-meta">
        ${m.conference ? `<span class="conf-badge">${m.conference}</span>` : ''}
        ${m.arxivLink ? `<a class="arxiv-link" href="${m.arxivLink}" target="_blank" rel="noopener">Paper ↗</a>` : ''}
      </div>` : ''}
      <div class="model-arch">
        <div class="arch-row${m.archCompact ? ' compact' : ''}">${blocks}</div>
      </div>
      <ul class="model-details">${details}</ul>
    </div>
  `;
}

function renderModels(data) {
  document.getElementById('modelsTitle').textContent = data.sectionTitle;
  document.getElementById('modelsDesc').textContent = data.sectionDesc;

  // Hide the old tabs bar — we no longer use it
  const tabsEl = document.getElementById('archTabs');
  if (tabsEl) tabsEl.style.display = 'none';

  // Sort variants: proposed (highlight) first, others after
  const variants = [...data.variants].sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0));
  const baselines = data.baselines;

  // Reassign delays so reveal animations are staggered per-section
  const assignDelays = (arr, step = 80) => arr.forEach((m, i) => { m = Object.assign({}, m); m.delay = i * step; return m; });

  // Build stacked section HTML
  const variantCards = variants.map((m, i) => renderModelCard({ ...m, delay: i * 80 })).join('');
  const baselineCards = baselines.map((m, i) => renderModelCard({ ...m, delay: i * 80 })).join('');

  document.getElementById('modelPanels').innerHTML = `
    <div class="model-section">
      <h3 class="model-section-heading">Our Model &amp; Variants</h3>
      <div class="model-grid model-grid-4">${variantCards}</div>
    </div>
    <div class="model-section">
      <h3 class="model-section-heading">External Baselines</h3>
      <div class="model-grid">${baselineCards}</div>
    </div>
  `;
}

function buildResultRow(r, showTemporal) {
  const modelCell = r.best
    ? `<span class="mono best-name">${r.model}</span> <span class="star">★</span>`
    : `<span class="mono">${r.model}</span>`;
  const bar = `<div class="bar-cell">
    <div class="bar${r.barTop ? ' bar-top' : ''}" style="--pct:${r.barPct}"></div>
    <span>${r.werLabel}</span>
  </div>`;
  const temporalCell = showTemporal ? `<td>${r.temporal || ''}</td>` : '';
  return `
    <tr class="${r.rowClass}">
      <td>${modelCell}</td>
      <td><span class="badge-type ${r.typeClass}">${r.type}</span></td>
      ${temporalCell}
      <td class="col-metric">${bar}</td>
      <td class="col-mse">${r.mseLabel || '—'}</td>
    </tr>`;
}

function buildResultTable(rows, note, showTemporal = true) {
  const temporalHeader = showTemporal ? '<th>Temporal Modelling</th>' : '';
  return `
    <div class="results-table-wrap">
      <table class="results-table">
        <thead>
          <tr>
            <th>Model</th>
            <th>Type</th>
            ${temporalHeader}
            <th class="col-metric">WER ↓</th>
            <th class="col-mse">MSE ↓</th>
          </tr>
        </thead>
        <tbody>${rows.map(r => buildResultRow(r, showTemporal)).join('')}</tbody>
      </table>
      <p class="table-note">${note}</p>
    </div>`;
}

function renderResults(data) {
  document.getElementById('resultsTitle').textContent = data.sectionTitle;
  document.getElementById('resultsDesc').textContent = data.sectionDesc;

  const ss = data.singleSpeaker;
  const ms = data.multiSpeaker;

  document.getElementById('resultsTable').innerHTML = `
    <div class="results-section">
      <h3 class="results-section-heading">${ss.title}</h3>
      <p class="results-section-desc">${ss.desc}</p>
      ${buildResultTable(ss.rows, ss.tableNote, true)}
    </div>

    <div class="results-section">
      <h3 class="results-section-heading">${ms.title}</h3>
      <p class="results-section-desc">${ms.desc}</p>

      <h4 class="results-sub-heading">${ms.generalized.label}</h4>
      ${buildResultTable(ms.generalized.rows, ms.generalized.tableNote, true)}

      <h4 class="results-sub-heading">${ms.personalization.label}</h4>
      ${buildResultTable(ms.personalization.rows, ms.personalization.tableNote, false)}
    </div>
  `;
}

function renderSamples(data) {
  document.getElementById('samplesTitle').textContent = data.sectionTitle;
  document.getElementById('samplesDesc').innerHTML = data.sectionDesc;

  const cards = data.items.map((s, i) => `
    <div class="sample-card" id="${s.id}">
      <div class="sample-header">
        <span class="sample-label">${s.label}</span>
        <span class="sample-model">${s.model}</span>
      </div>

      <div class="sample-media">
        <video class="sample-video" id="vid${i + 1}"
          src="${s.video}" muted playsinline preload="metadata"
          aria-label="Ultrasound video for ${s.label}">
        </video>
        <div class="video-overlay" id="overlay${i + 1}">
          <svg class="play-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" stroke="currentColor" stroke-width="1.2" fill="currentColor" fill-opacity="0.15"/>
            <path d="M10 8.5l6 3.5-6 3.5V8.5z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      <audio controls class="audio-player" id="audio${i + 1}">
        <source src="${s.audio}" type="audio/wav"/>
        Your browser does not support audio.
      </audio>

      <div class="sample-transcript">${s.transcript}</div>
    </div>
  `).join('');

  document.getElementById('samplesGrid').innerHTML = cards;

  // Wire up sync for each pair
  data.items.forEach((_, i) => initSampleSync(i + 1));
}

function initSampleSync(n) {
  const audio = document.getElementById(`audio${n}`);
  const video = document.getElementById(`vid${n}`);
  const overlay = document.getElementById(`overlay${n}`);
  if (!audio || !video) return;

  // Show/hide play icon overlay based on playback state
  function updateOverlay() {
    overlay.classList.toggle('hidden', !audio.paused);
  }

  // Audio is master — video follows
  audio.addEventListener('play', () => {
    video.currentTime = audio.currentTime;
    video.play().catch(() => { });
    updateOverlay();
  });

  audio.addEventListener('pause', () => {
    video.pause();
    updateOverlay();
  });

  audio.addEventListener('seeked', () => {
    video.currentTime = audio.currentTime;
  });

  // Drift correction: resync if gap exceeds 80 ms
  audio.addEventListener('timeupdate', () => {
    if (!audio.paused && Math.abs(video.currentTime - audio.currentTime) > 0.08) {
      video.currentTime = audio.currentTime;
    }
  });

  audio.addEventListener('ended', () => {
    video.pause();
    updateOverlay();
  });

  // Clicking the overlay play button triggers audio (which pulls video)
  overlay.addEventListener('click', () => {
    if (audio.paused) audio.play();
    else audio.pause();
  });

  // Initial overlay state
  updateOverlay();
}

function renderFooter(data) {
  document.getElementById('footerInner').innerHTML = `
    <div class="footer-left">
      <span class="footer-logo">${data.logo}</span>
      <span class="footer-desc">${data.description}</span>
    </div>
    <div class="footer-right"><span>${data.tagline}</span></div>
  `;
}

function updateMeta(site) {
  document.title = site.title;
  document.querySelector('meta[name="description"]').setAttribute('content', site.description);
}

// ── Main loader ────────────────────────────────────────────
async function loadContent() {
  let data;
  try {
    const res = await fetch('content.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('Failed to load content.json:', err);
    return;
  }

  updateMeta(data.site);
  renderNav(data.nav, data.site);
  renderHero(data.hero);
  renderAbstract(data.abstract);
  renderPipeline(data.pipeline);
  renderModels(data.models);
  renderResults(data.results);
  renderSamples(data.samples);
  renderFooter(data.footer);

  // Kick off all post-render behaviours
  initReveal();
  initTabs();
  initCounters();
  initWaveforms();
  initActiveNav();
}

loadContent();


// ══ 3. HERO CANVAS ═════════════════════════════════════════
(function initCanvas() {
  const canvas = document.getElementById('waveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, lines = [];
  const NUM_LINES = 64;
  const LINE_COUNT = 14;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    initLines();
  }

  function initLines() {
    lines = [];
    for (let i = 0; i < LINE_COUNT; i++) lines.push(makeLine());
  }

  function makeLine() {
    return {
      x: Math.random() * W,
      speed: 0.2 + Math.random() * 0.4,
      alpha: 0.04 + Math.random() * 0.08,
      points: Array.from({ length: NUM_LINES }, () => Math.random()),
      phase: Math.random() * Math.PI * 2,
      freq: 0.4 + Math.random() * 1.2,
    };
  }

  let t = 0;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7);
    grd.addColorStop(0, 'rgba(108,99,255,0.04)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    lines.forEach(ln => {
      ctx.beginPath();
      ctx.moveTo(ln.x, 0);
      const segH = H / NUM_LINES;
      for (let s = 0; s < NUM_LINES; s++) {
        const wave = Math.sin(t * ln.freq + ln.phase + s * 0.3) * 12;
        ctx.lineTo(ln.x + wave * ln.points[s], s * segH);
      }
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.2, `rgba(108,99,255,${ln.alpha})`);
      grad.addColorStop(0.8, `rgba(145,136,255,${ln.alpha * 0.5})`);
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();

      ln.x += ln.speed;
      if (ln.x > W + 20) { ln.x = -20; ln.phase = Math.random() * Math.PI * 2; }
    });

    t += 0.006;
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  animate();
})();


// ══ 4. POST-RENDER BEHAVIOURS ══════════════════════════════
// (called after content is injected into the DOM)

function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.dataset.delay || 0, 10);
        setTimeout(() => e.target.classList.add('visible'), delay);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  elements.forEach(el => obs.observe(el));
}

// Navbar shadow on scroll
(function initNav() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 40 ? '0 4px 32px rgba(0,0,0,0.4)' : 'none';
  }, { passive: true });
})();

function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      buttons.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(`tab-${target}`);
      if (panel) {
        panel.classList.add('active');
        panel.querySelectorAll('.reveal').forEach((el, i) => {
          el.style.transition = 'none';
          el.classList.remove('visible');
          void el.offsetWidth;
          el.style.transition = '';
          setTimeout(() => el.classList.add('visible'), i * 60);
        });
      }
    });
  });
}

function initCounters() {
  const cards = document.querySelectorAll('.stat-card');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target.querySelector('.stat-num');
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;

      const dur = 900;
      const step = (ts) => {
        if (!step.startTime) step.startTime = ts;
        const progress = Math.min((ts - step.startTime) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - progress, 3)) * target);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.5 });
  cards.forEach(c => obs.observe(c));
}

function initWaveforms() {
  // Only run on cards without a real video element
  const containers = document.querySelectorAll('.waveform-placeholder');
  containers.forEach(container => {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width = container.offsetWidth;
      H = canvas.height = container.offsetHeight;
    }

    const bars = Array.from({ length: 48 }, () => ({
      h: 0.15 + Math.random() * 0.7,
      speed: 0.015 + Math.random() * 0.03,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    function draw() {
      if (!W || !H) resize();
      ctx.clearRect(0, 0, W, H);
      const barW = W / bars.length;
      bars.forEach((bar, i) => {
        const h = bar.h * H * (0.4 + 0.6 * Math.abs(Math.sin(t * bar.speed + bar.phase)));
        const x = i * barW;
        const y = (H - h) / 2;
        const grd = ctx.createLinearGradient(0, y, 0, y + h);
        grd.addColorStop(0, 'rgba(108,99,255,0.4)');
        grd.addColorStop(1, 'rgba(145,136,255,0.15)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, barW - 2, h, 2);
        ctx.fill();
      });
      t++;
      requestAnimationFrame(draw);
    }

    new ResizeObserver(resize).observe(container);
    resize();
    draw();
  });
}

function initActiveNav() {
  const sections = document.querySelectorAll('section[id], header[id]');
  const links = document.querySelectorAll('.nav-links a');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--accent-2)' : '';
        });
      }
    });
  }, { threshold: 0.45 });
  sections.forEach(s => obs.observe(s));
}
