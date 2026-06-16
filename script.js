const sectionColors = {
  home:           '#D1CFCA',
  audiovisuales:  '#1C1C3C',
  ux:             '#97C1D9',
  editorial:      '#E5DBB3',
  archivo:        '#3E2D25'
};

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.documentElement.style.setProperty('--sb-color', sectionColors[id]);
  document.body.className = 'section-' + id;
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById(id).scrollTop = 0;
  const menu = document.querySelector(`#${id} .project-menu`);
  if (menu) {
    menu.dataset.state = 'expanded';
    menu.querySelectorAll('.project-row').forEach(r => r.classList.remove('selected'));
  }
  if (typeof markFooterCurrentLink === 'function') markFooterCurrentLink();
}

function goHome() { showSection('home'); }

function toggleMobileMenu() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
}

function selectProject(row) {
  const menu = row.closest('.project-menu');
  menu.querySelectorAll('.project-row').forEach(r => r.classList.remove('selected'));
  row.classList.add('selected');
  menu.dataset.state = 'collapsed';
  const projectId = 'proj-' + row.dataset.project;
  const target = document.getElementById(projectId);
  if (target) {
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450);
  }
}

function setProtoMode(btn, mode) {
  const block = btn.closest('.project-block');
  if (!block) return;
  block.querySelectorAll('.proto-toggle-btn').forEach(b => {
    b.classList.toggle('is-active', b.dataset.mode === mode);
  });
  block.querySelectorAll('.proto-stage').forEach(s => {
    s.classList.toggle('is-visible', s.dataset.mode === mode);
    s.classList.remove('is-activated');
  });
}

function activateProto(btn) {
  const stage = btn.closest('.proto-stage');
  if (stage) stage.classList.add('is-activated');
}

function initHojasProceso() {
  const flipSound = new Audio('assets/sound/paper-flip.mp3');
  flipSound.volume = 0.3;
  flipSound.preload = 'auto';

  document.querySelectorAll('.proj-hojas').forEach(container => {
    const hojas = [...container.querySelectorAll('.hoja')];
    if (hojas.length === 0) return;

    hojas.forEach((h, i) => h.style.setProperty('--idx', i));

    let frontIdx = 0;
    let intervalId = null;
    const CYCLE_MS = 2800;
    const SLIDE_MS = 700;

    function setStackPositions() {
      hojas.forEach((h, i) => {
        const rel = (i - frontIdx + hojas.length) % hojas.length;
        h.style.setProperty('--stack-idx', rel);
      });
    }

    function cycleNext() {
      const front = hojas[frontIdx];
      front.classList.add('is-sliding');
      setTimeout(() => {
        frontIdx = (frontIdx + 1) % hojas.length;
        setStackPositions();
        front.classList.remove('is-sliding');
      }, SLIDE_MS);
    }

    function startCycle() {
      stopCycle();
      intervalId = setInterval(cycleNext, CYCLE_MS);
    }
    function stopCycle() {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    }

    function playFlipSound() {
      try {
        const s = flipSound.cloneNode();
        s.volume = 0.3;
        s.play().catch(() => {});
      } catch (e) {}
    }

    const isMobile = () => window.matchMedia('(max-width: 800px)').matches;

    setStackPositions();
    if (isMobile()) {
      container.dataset.state = 'fanned';
    } else {
      container.dataset.state = 'stacked';
      startCycle();
    }
    container.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      stopCycle();
      container.dataset.state = 'fanned';
      playFlipSound();
    });
    container.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      container.dataset.state = 'stacked';
      startCycle();
    });
    hojas.forEach(hoja => {
      hoja.addEventListener('click', e => {
        e.stopPropagation();
        openHojaModal(hoja);
      });
    });
  });
}

function openHojaModal(elementOrImg) {
  const img = elementOrImg.tagName === 'IMG'
    ? elementOrImg
    : elementOrImg.querySelector('img');
  if (!img) return;
  const src = img.src;
  const alt = img.alt || '';

  let modal = document.querySelector('.hoja-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'hoja-modal';
    modal.innerHTML = `
      <button class="hoja-modal-close" onclick="closeHojaModal()" aria-label="cerrar">−</button>
      <img alt="" />
    `;
    modal.addEventListener('click', e => {
      if (e.target === modal) closeHojaModal();
    });
    document.body.appendChild(modal);
  }
  modal.querySelector('img').src = src;
  modal.querySelector('img').alt = alt;
  modal.classList.add('is-open');
}

function closeHojaModal() {
  const modal = document.querySelector('.hoja-modal');
  if (modal) modal.classList.remove('is-open');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeHojaModal();
});

function initBookCarousels() {
  document.querySelectorAll('.libro-carousel').forEach(carousel => {
    const viewport = carousel.querySelector('.carousel-viewport');
    const track    = carousel.querySelector('.carousel-track');
    const items    = [...carousel.querySelectorAll('.carousel-item')];
    const label    = carousel.querySelector('.js-pieza-label');
    if (!viewport || !track || items.length === 0) return;

    let centerIdx = 0;

    function update() {
      items.forEach((item, i) => item.classList.toggle('is-center', i === centerIdx));
      const item = items[centerIdx];
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const offset = (viewport.offsetWidth / 2) - itemCenter;
      track.style.transform = `translateX(${offset}px)`;
      if (label) label.textContent = item.dataset.pieza || '';
    }

    function next() { centerIdx = (centerIdx + 1) % items.length; update(); }
    function prev() { centerIdx = (centerIdx - 1 + items.length) % items.length; update(); }

    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');
    prevBtn && prevBtn.addEventListener('click', prev);
    nextBtn && nextBtn.addEventListener('click', next);

    items.forEach((item, i) => {
      item.addEventListener('click', () => {
        if (i === centerIdx) {
          openHojaModal(item);
        } else {
          centerIdx = i;
          update();
        }
      });
    });
    const AUTO_MS = 2200;
    let autoId = null;
    const startAuto = () => { stopAuto(); autoId = setInterval(next, AUTO_MS); };
    const stopAuto = () => { if (autoId) { clearInterval(autoId); autoId = null; } };
    items.forEach(item => {
      item.addEventListener('mouseenter', () => {
        if (item.classList.contains('is-center')) stopAuto();
      });
      item.addEventListener('mouseleave', () => {
        if (item.classList.contains('is-center')) startAuto();
      });
    });
    startAuto();
    const imgs = carousel.querySelectorAll('img');
    let loaded = 0;
    const onImgLoad = () => { if (++loaded === imgs.length) update(); };
    imgs.forEach(img => img.complete ? onImgLoad() : img.addEventListener('load', onImgLoad));
    setTimeout(update, 400);
    window.addEventListener('resize', () => requestAnimationFrame(update));
  });
}

function initLibroTapas() {
  document.querySelectorAll('.libro-tapa-img').forEach(img => {
    img.addEventListener('click', () => openHojaModal(img));
  });
}

function initQueHago() {
  const stackCards = document.querySelectorAll('.qh-card');
  const rowCards   = document.querySelectorAll('.qh-row-card');
  if (rowCards.length === 0 || stackCards.length === 0) return;

  let modal = document.querySelector('.qh-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'qh-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="qh-modal-content">
        <button class="qh-modal-close" onclick="closeQhModal()" aria-label="cerrar">−</button>
        <div class="qh-modal-inner"></div>
      </div>
    `;
    modal.addEventListener('click', e => {
      if (e.target === modal) closeQhModal();
    });
    document.body.appendChild(modal);
  }

  rowCards.forEach(rc => {
    rc.addEventListener('click', () => {
      const idx = parseInt(rc.dataset.cardIdx, 10);
      const stackCard = stackCards[idx];
      if (!stackCard) return;

      const modalContent = modal.querySelector('.qh-modal-content');
      const inner = modal.querySelector('.qh-modal-inner');
      inner.innerHTML = stackCard.innerHTML;
      modalContent.dataset.color = stackCard.dataset.color;

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    });
  });
}

function closeQhModal() {
  const modal = document.querySelector('.qh-modal');
  if (modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeQhModal();
});

function footerHTML() {
  return `
    <footer class="site-footer" aria-label="contacto y navegación">
      <div class="foot-bio">
        <p class="foot-name foot-anim">Catalina Stadler</p>
        <p class="foot-main-text foot-anim">Este archivo reúne procesos, ideas y experiencias. Todavía quedan páginas por completar.</p>
        <p class="foot-creamos foot-anim">¿Creamos la próxima?</p>
        <div class="foot-anim">
          <div class="foot-form-label">CONTAME</div>
          <div class="foot-form-help">De qué trata el proyecto, en qué etapa está, qué necesitás…</div>
          <input class="foot-form-input" type="text" placeholder="" aria-label="contame de tu proyecto" />
          <div class="foot-sent">¡enviado! gracias, te respondo pronto.</div>
        </div>
      </div>
      <nav class="foot-nav">
        <a href="#" data-go="home"          onclick="goHome(); return false;">Home</a>
        <a href="#" data-go="audiovisuales" onclick="showSection('audiovisuales'); return false;">Audiovisuales</a>
        <a href="#" data-go="ux"            onclick="showSection('ux'); return false;">Diseño UX/UI</a>
        <a href="#" data-go="editorial"     onclick="showSection('editorial'); return false;">Diseño Editorial</a>
        <a href="#" data-go="archivo"       onclick="showSection('archivo'); return false;">Archivo experimental</a>
      </nav>
      <div class="foot-social">
        <a href="assets/cv-cata-stadler.pdf" download="cv-cata-stadler.pdf" class="foot-cv">DESCARGAR CV ↓</a>
        <a href="mailto:cstadler@uade.edu.ar">MAIL</a>
        <a href="https://instagram.com/" target="_blank" rel="noopener">INSTAGRAM</a>
        <a href="https://linkedin.com/" target="_blank" rel="noopener">LINKEDIN</a>
      </div>
    </footer>
  `;
}

function injectFooters() {
  document.querySelectorAll('main > .section').forEach(section => {
    if (section.querySelector('.site-footer')) return;
    section.insertAdjacentHTML('beforeend', footerHTML());
  });
}

function markFooterCurrentLink() {
  const activeSection = document.querySelector('main > .section.active');
  if (!activeSection) return;
  const activeId = activeSection.id;
  document.querySelectorAll('.site-footer .foot-nav a').forEach(a => {
    a.classList.toggle('is-current', a.dataset.go === activeId);
  });
}

function observeFooters() {
  document.querySelectorAll('main > .section').forEach(section => {
    const footer = section.querySelector('.site-footer');
    if (!footer) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          footer.classList.add('is-visible');
          io.disconnect();
        }
      });
    }, { threshold: 0.15, root: section });
    io.observe(footer);
  });
}

function wireFooterForms() {
  document.querySelectorAll('.site-footer').forEach(footer => {
    const input = footer.querySelector('.foot-form-input');
    const sent  = footer.querySelector('.foot-sent');
    if (!input) return;
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (!input.value.trim()) return;
      input.value = '';
      input.blur();
      if (sent) {
        sent.classList.add('is-shown');
        setTimeout(() => sent.classList.remove('is-shown'), 2400);
      }
    });
  });
}

function wireContactLink() {
  const contactLink = document.getElementById('contact-link');
  if (!contactLink) return;
  contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    const active = document.querySelector('main > .section.active');
    if (!active) return;
    const footer = active.querySelector('.site-footer');
    if (footer) footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
function goToContact() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('mobile-open');
  const active = document.querySelector('main > .section.active');
  if (!active) return;
  const footer = active.querySelector('.site-footer');
  if (footer) footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initMiProceso() {
  const cards = [...document.querySelectorAll('.proc-card')];
  if (cards.length === 0) return;
  const home = document.getElementById('home');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = cards.indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('is-visible'), Math.max(0, idx) * 120);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2, root: home });

  cards.forEach(card => {
    io.observe(card);
    card.addEventListener('click', () => card.classList.toggle('is-flipped'));
  });
}

function playProjectVideo(btn) {
  const wrap = btn.closest('.proj-video');
  const videoId = wrap && wrap.dataset.video;
  if (!videoId) return;

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  iframe.title = 'video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');

  const placeholder = wrap.querySelector('.video-placeholder');
  if (placeholder) placeholder.replaceWith(iframe);
}

const procesoSpreads = {
  videoclip: [
    { izq: 'assets/img/proceso-videoclip/izquierda1.png', der: 'assets/img/proceso-videoclip/derecha1.png' },
    { izq: 'assets/img/proceso-videoclip/izquierda2.png', der: 'assets/img/proceso-videoclip/derecha2.png' },
  ],
};

function openProceso(projectId) {
  const procDiv = document.getElementById('proceso-' + projectId);
  if (!procDiv) return;
  const spreads = procesoSpreads[projectId] || [];
  if (spreads.length === 0) return;
  const slots = procDiv.querySelectorAll('.proc-spread');
  const slot0Imgs = slots[0].querySelectorAll('img');
  if (slot0Imgs[0]) slot0Imgs[0].src = spreads[0].izq;
  if (slot0Imgs[1]) slot0Imgs[1].src = spreads[0].der;
  slots[1].querySelectorAll('img').forEach(im => im.src = '');
  slots[0].classList.add('is-current');
  slots[0].classList.remove('is-leaving');
  slots[1].classList.remove('is-current', 'is-leaving');

  procDiv.dataset.index = '0';
  procDiv.dataset.currentSlot = '0';
  procDiv.dataset.animating = 'false';

  updateProcInline(procDiv);

  procDiv.classList.add('open');
  procDiv.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    const section = procDiv.closest('.section');
    if (section) {
      const targetY = procDiv.offsetTop - 200;
      section.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }, 300);
}

function closeProcesoInline(btn) {
  const procDiv = btn.closest('.proj-proceso');
  if (!procDiv) return;
  procDiv.classList.remove('open');
  procDiv.setAttribute('aria-hidden', 'true');
}

function procNext(btn) {
  const procDiv = btn.closest('.proj-proceso');
  if (!procDiv) return;
  showSpread(procDiv, parseInt(procDiv.dataset.index, 10) + 1);
}

function procPrev(btn) {
  const procDiv = btn.closest('.proj-proceso');
  if (!procDiv) return;
  showSpread(procDiv, parseInt(procDiv.dataset.index, 10) - 1);
}

function showSpread(procDiv, newIndex) {
  const projectId = procDiv.dataset.project;
  const spreads = procesoSpreads[projectId] || [];
  if (newIndex < 0 || newIndex >= spreads.length) return;

  const currentIndex = parseInt(procDiv.dataset.index, 10);
  if (procDiv.dataset.animating === 'true' || newIndex === currentIndex) return;

  procDiv.dataset.animating = 'true';

  const slots = procDiv.querySelectorAll('.proc-spread');
  const currentSlotIdx = parseInt(procDiv.dataset.currentSlot, 10);
  const currentSlot = slots[currentSlotIdx];
  const nextSlot    = slots[1 - currentSlotIdx];
  const nextImgs = nextSlot.querySelectorAll('img');
  if (nextImgs[0]) nextImgs[0].src = spreads[newIndex].izq;
  if (nextImgs[1]) nextImgs[1].src = spreads[newIndex].der;
  currentSlot.classList.remove('is-current');
  currentSlot.classList.add('is-leaving');
  nextSlot.classList.remove('is-leaving');
  nextSlot.classList.add('is-current');

  setTimeout(() => {
    currentSlot.classList.remove('is-leaving');
    procDiv.dataset.animating = 'false';
  }, 720);

  procDiv.dataset.currentSlot = String(1 - currentSlotIdx);
  procDiv.dataset.index = String(newIndex);
  updateProcInline(procDiv);
}

function openPageLightbox(imgEl) {
  const src = imgEl.getAttribute('data-src') || imgEl.querySelector('img')?.src || imgEl.src;
  if (!src) return;
  const lb = document.getElementById('page-lightbox');
  if (!lb) return;
  const big = lb.querySelector('.page-lightbox-img');
  big.src = src;
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lb-locked');
}
function closePageLightbox() {
  const lb = document.getElementById('page-lightbox');
  if (!lb) return;
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('lb-locked');
  setTimeout(() => {
    const big = lb.querySelector('.page-lightbox-img');
    if (big && !lb.classList.contains('is-open')) big.src = '';
  }, 400);
}

function playArchiveVideo(btn) {
  const card = btn.closest('.arch-card');
  const videoId = card?.dataset?.video;
  if (!videoId) return;
  const mediaWrap = card.querySelector('.arch-media');
  if (!mediaWrap) return;

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  iframe.title = 'video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.setAttribute('frameborder', '0');

  mediaWrap.innerHTML = '';
  mediaWrap.appendChild(iframe);
}

function toggleArchExpand(btn) {
  const grid = btn.closest('.arch-block').querySelector('.arch-grid--photo');
  if (!grid) return;
  const expanded = grid.dataset.expanded === 'true';
  grid.dataset.expanded = expanded ? 'false' : 'true';
  btn.textContent = expanded ? '+' : '−';
  btn.setAttribute('aria-label', expanded ? 'ver más fotos' : 'ver menos fotos');
}

function openFolder(btn) {
  const folder = btn.closest('.proj-folder');
  if (!folder) return;
  folder.dataset.folderState = 'opened';
  setTimeout(() => {
    const section = folder.closest('.section');
    if (section) {
      const targetY = folder.offsetTop - 200;
      section.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }, 280);
}
function closeFolder(btn) {
  const folder = btn.closest('.proj-folder');
  if (!folder) return;
  folder.dataset.folderState = 'cover';
}

function updateProcInline(procDiv) {
  const spreads = procesoSpreads[procDiv.dataset.project] || [];
  const idx = parseInt(procDiv.dataset.index, 10);
  const counter = procDiv.querySelector('.proc-counter');
  if (counter) counter.textContent = `${idx + 1} / ${spreads.length}`;
  const prev = procDiv.querySelector('.proc-prev');
  const next = procDiv.querySelector('.proc-next');
  if (prev) prev.disabled = idx === 0;
  if (next) next.disabled = idx === spreads.length - 1;
}

function splitTitleLetters() {
  document.querySelectorAll('.sec-title').forEach(title => {
    if (title.dataset.split === 'true') return;
    const decos = Array.from(title.querySelectorAll('.sec-deco'));
    decos.forEach(d => d.remove());

    const text = title.textContent;
    title.textContent = '';

    text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'letter';
      span.style.setProperty('--i', i);
      span.textContent = char === ' ' ? ' ' : char;
      title.appendChild(span);
    });
    decos.forEach(d => title.appendChild(d));
    title.dataset.split = 'true';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.proj-proceso.open').forEach(procDiv => updateProcInline(procDiv));
  splitTitleLetters();
  if (window.matchMedia('(max-width: 800px)').matches) {
    document.querySelectorAll('.proto-toggle').forEach(toggle => {
      const mobileBtn = toggle.querySelector('.proto-toggle-btn[data-mode="mobile"]');
      if (mobileBtn) setProtoMode(mobileBtn, 'mobile');
    });
  }
  initHojasProceso();
  initBookCarousels();
  initLibroTapas();
  initQueHago();
  initMiProceso();
  injectFooters();
  markFooterCurrentLink();
  observeFooters();
  wireContactLink();
  wireFooterForms();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const lb = document.getElementById('page-lightbox');
  if (lb && lb.classList.contains('is-open')) {
    closePageLightbox();
    return;
  }
  const folderOpened = document.querySelector('.proj-folder[data-folder-state="opened"]');
  if (folderOpened) {
    folderOpened.dataset.folderState = 'cover';
    return;
  }
  document.querySelectorAll('.proj-proceso.open').forEach(p => {
    p.classList.remove('open');
    p.setAttribute('aria-hidden', 'true');
  });
});

function expandProjectMenu(plusBtn) {
  const menu = plusBtn.closest('.project-menu');
  menu.dataset.state = 'expanded';
  menu.querySelectorAll('.project-row').forEach(r => r.classList.remove('selected'));
  const section = plusBtn.closest('.section');
  if (section) section.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupSectionScroll(section) {
  const menu     = section.querySelector('.project-menu');
  const intro    = section.querySelector('.section-intro');
  const projects = [...section.querySelectorAll('.project-block')];
  if (!menu || projects.length === 0) return;

  let ticking = false;
  const STICKY_OFFSET = 220;

  function update() {
    const scrollTop = section.scrollTop;
    const introBottom = intro ? intro.offsetTop + intro.offsetHeight : 0;

    if (scrollTop < introBottom - 150) {
      if (menu.dataset.state !== 'expanded') {
        menu.dataset.state = 'expanded';
        menu.querySelectorAll('.project-row').forEach(r => r.classList.remove('selected'));
      }
    } else {
      let active = projects[0];
      for (const p of projects) {
        if (p.offsetTop - STICKY_OFFSET <= scrollTop) active = p;
      }
      const projectId = active.id.replace('proj-', '');
      const row = menu.querySelector(`.project-row[data-project="${projectId}"]`);
      if (row && !row.classList.contains('selected')) {
        menu.querySelectorAll('.project-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
      }
      if (menu.dataset.state !== 'collapsed') {
        menu.dataset.state = 'collapsed';
      }
    }
    ticking = false;
  }

  section.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.project-menu .project-row').forEach(row => {
    row.addEventListener('click', () => selectProject(row));
  });
  document.querySelectorAll('.section').forEach(setupSectionScroll);
});