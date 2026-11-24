(() => {
  const WA = '5548984385463';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* WhatsApp links with a ready message */
  const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = waLink(a.dataset.wa);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- Signature: ganache drips grow with scroll ---------- */
  const hero = document.querySelector('.hero');
  const dropsBox = document.querySelector('.drip__drops');
  // x (%), width (px), max length (px), rate
  const spec = [
    [4, 20, 120, .8], [11, 30, 210, 1], [19, 16, 90, .6], [27, 24, 160, .9],
    [36, 34, 210, 1], [45, 18, 110, .7], [53, 26, 190, 1], [61, 16, 80, .5],
    [69, 30, 200, 1], [77, 20, 130, .75], [85, 28, 200, .95], [93, 18, 120, .7],
  ];
  const drops = spec.map(([x, w, len, rate], i) => {
    const d = document.createElement('div');
    d.className = 'drop';
    d.style.setProperty('--x', x + '%');
    d.style.setProperty('--w', w + 'px');
    d.style.setProperty('--len', len + 'px');
    if (i % 2 === 1) d.classList.add('drop--alt');
    d.innerHTML = '<div class="drop__stem"></div><div class="drop__bead"></div>';
    dropsBox.appendChild(d);
    return { el: d, x: x / 100, rate, s: .18, v: 0 };
  });

  let target = 0, p = 0, pv = 0, mx = -1, intro = reduce ? 1 : 0;
  const t0 = performance.now();
  const heroH = () => hero.offsetHeight;

  const readScroll = () => {
    target = Math.min(1, Math.max(0, scrollY / (heroH() * .9)));
  };

  if (!reduce) {
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX / innerWidth;
    });
    hero.addEventListener('pointerleave', () => { mx = -1; });
  }

  let raf = 0;
  const tick = () => {
    raf = 0;
    // intro pour (first ~1.2s)
    if (intro < 1) intro = Math.min(1, (performance.now() - t0) / 1200);
    // spring for scroll progress
    pv = pv * .78 + (target - p) * .12;
    p += pv;
    root.style.setProperty('--p', p.toFixed(4));

    let moving = Math.abs(target - p) > .0005 || Math.abs(pv) > .0005 || intro < 1;
    const ease = 1 - Math.pow(1 - intro, 3);
    for (const d of drops) {
      const heat = mx < 0 ? 0 : Math.exp(-Math.pow((mx - d.x) / .06, 2)) * .22;
      const goal = (.34 + p * .66 * d.rate + heat) * ease;
      d.v = d.v * .8 + (goal - d.s) * .1;
      d.s += d.v;
      if (Math.abs(goal - d.s) > .001 || Math.abs(d.v) > .001) moving = true;
      d.el.style.setProperty('--s', Math.max(0, d.s).toFixed(4));
    }
    if (moving || mx >= 0) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  if (reduce) {
    drops.forEach((d) => d.el.style.setProperty('--s', (.5 * d.rate).toFixed(3)));
  } else {
    readScroll();
    addEventListener('scroll', () => { readScroll(); kick(); }, { passive: true });
    addEventListener('resize', () => { readScroll(); kick(); });
    hero.addEventListener('pointermove', kick);
    kick();
  }

  /* ---------- Vitrine: filters + arrows ---------- */
  const track = document.getElementById('shelf');
  const items = [...track.children];
  const chips = document.querySelectorAll('.chip');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    const f = chip.dataset.filter;
    items.forEach((it) => {
      const show = f === 'todos' || it.dataset.cat === f;
      it.hidden = !show;
      it.classList.remove('is-in');
      if (show && !reduce) { void it.offsetWidth; it.classList.add('is-in'); }
    });
    track.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
    updateArrows();
  }));

  const arrows = document.querySelectorAll('.round');
  const updateArrows = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    arrows[0].disabled = track.scrollLeft <= 2;
    arrows[1].disabled = track.scrollLeft >= max;
  };
  arrows.forEach((b) => b.addEventListener('click', () => {
    const step = (items.find((i) => !i.hidden)?.offsetWidth || 280) + 24;
    track.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduce ? 'auto' : 'smooth' });
  }));
  track.addEventListener('scroll', updateArrows, { passive: true });
  addEventListener('resize', updateArrows);
  updateArrows();

  /* ---------- Order ticket → WhatsApp ---------- */
  const form = document.getElementById('pedido');
  const err = document.getElementById('pedido-err');
  const date = document.getElementById('data');
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  date.min = today.toISOString().slice(0, 10);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const itens = fd.getAll('item');
    if (!itens.length) { err.hidden = false; form.querySelector('[name=item]').focus(); return; }
    err.hidden = true;
    const lines = [`Olá! Vim pela página da Doces Izabel e quero fazer uma encomenda.`,
      `Ocasião: ${fd.get('ocasiao')}`, `Quero: ${itens.join(', ')}`];
    const d = fd.get('data');
    if (d) { const [y, m, dd] = d.split('-'); lines.push(`Para: ${dd}/${m}/${y}`); }
    if (fd.get('pessoas')) lines.push(`Pessoas: ${fd.get('pessoas')}`);
    if (String(fd.get('obs')).trim()) lines.push(`Detalhes: ${String(fd.get('obs')).trim()}`);
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });
  form.addEventListener('change', () => { if (form.querySelector('[name=item]:checked')) err.hidden = true; });

  /* ---------- Mobile bar: hide in hero and over contact ---------- */
  const bar = document.getElementById('bar');
  const visite = document.getElementById('visite');
  const state = { hero: true, visite: false };
  const sync = () => bar.classList.toggle('is-hidden', state.hero || state.visite);
  new IntersectionObserver(([e]) => { state.hero = e.isIntersecting; sync(); }, { rootMargin: '0px 0px -40% 0px' })
    .observe(document.querySelector('.hero__actions'));
  new IntersectionObserver(([e]) => { state.visite = e.isIntersecting; sync(); }, { threshold: 0.05 })
    .observe(visite);
  sync();
})();
