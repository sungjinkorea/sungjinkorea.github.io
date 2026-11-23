// ===== 모바일 메뉴 =====
const menuBtn = document.querySelector('.menu-btn');
const setMenu = (open) => {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
};
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.querySelectorAll('.mobile-menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

// ===== 메인 슬라이드 (첫 페이지) =====
const slides = [...document.querySelectorAll('.slide')];
let slideIndex = 0;
let slideTimer;
const navItems = [...document.querySelectorAll('.hn-item')];
function show(next) {
  slides[slideIndex].classList.remove('is-active');
  slideIndex = (next + slides.length) % slides.length;
  slides[slideIndex].classList.add('is-active');
  // 장면 제목 탭: 지금 장면 표시 + 선 채우기 다시 시작
  navItems.forEach((b, i) => {
    b.classList.remove('is-on');
    b.setAttribute('aria-selected', i === slideIndex);
  });
  if (navItems[slideIndex]) {
    void navItems[slideIndex].offsetWidth;
    navItems[slideIndex].classList.add('is-on');
  }
  clearTimeout(slideTimer);
  slideTimer = setTimeout(() => show(slideIndex + 1), 6000);
}
if (slides.length) {
  navItems.forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.go))));
  show(0);
}

// ===== 입장 효과 (첫 방문) =====
const root = document.documentElement;
if (root.classList.contains('intro') && slides.length) {
  // 첫 제목을 글자 단위로 나눠 하나씩 떠오르게
  const h1 = slides[0].querySelector('h1');
  if (h1) {
    const text = h1.textContent.trim();
    h1.setAttribute('aria-label', text);
    h1.innerHTML = [...text].map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
  }
  clearTimeout(slideTimer); // 입장 효과가 끝날 때까지 첫 장면 유지
  let started = false;
  const start = () => {
    if (started) return;
    if (!root.classList.contains('intro')) { started = true; show(0); return; }
    started = true;
    root.classList.add('intro-play');
    try { sessionStorage.setItem('sj-intro', '1'); } catch (e) {}
    setTimeout(() => {
      root.classList.remove('intro', 'intro-play');
      show(0); // 진행바와 자동 넘김을 지금부터 다시 시작
    }, 3600);
  };
  // 첫 사진이 준비되면 시작 (늦어도 1.5초 뒤 시작)
  const m = /url\(['"]?([^'")]+)['"]?\)/.exec(slides[0].style.getPropertyValue('--bg'));
  if (m) { const img = new Image(); img.onload = start; img.onerror = start; img.src = m[1]; }
  setTimeout(start, 1500);
}

// ===== 제품 목록 (제품소개 페이지) =====
const catalog = document.getElementById('catalog');
if (catalog && typeof PRODUCTS !== 'undefined') {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const mail = (name) => 'mailto:sungjin4941@naver.com?subject=' + encodeURIComponent('[제품 문의] ' + name);

  const itemHTML = (c, it) => {
    const img = it.img
      ? `<img src="${esc(it.img)}" alt="${esc(it.name)}" loading="lazy"${it.fit ? ` class="${esc(it.fit)}"` : /\.png$/i.test(it.img) ? ' class="contain"' : ''}>`
      : icon(c.icon, 'item-ph');
    const body = `
      <div class="item-img">${img}${it.is3d ? '<span class="item-3d">3D</span>' : ''}</div>
      <div class="item-body">
        <span class="item-cat">${esc(c.name)}</span>
        <h3>${esc(it.name)}</h3>
        <ul class="item-spec">${(it.spec || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
    return it.link
      ? `<a class="item" href="${esc(it.link)}">${body}
          <span class="item-btn">${it.is3d ? '3D로 자세히 보기' : '자세히 보기'} <span aria-hidden="true">→</span></span>
        </div></a>`
      : `<article class="item">${body}
          <a class="item-btn" href="${mail(it.name)}">견적 문의 <span aria-hidden="true">→</span></a>
        </div></article>`;
  };

  catalog.innerHTML = PRODUCTS.map((c) => `
    <section class="cat reveal" data-cat="${c.id}">
      <div class="cat-head">
        <div class="cat-icon">${icon(c.icon)}</div>
        <div>
          <p class="eyebrow">${esc(c.en)}</p>
          <h2>${esc(c.name)}</h2>
          <p class="cat-desc">${esc(c.desc)}</p>
        </div>
      </div>
      <div class="items">${c.items.map((it) => itemHTML(c, it)).join('')}</div>
    </section>`).join('');

  const tabs = document.getElementById('cat-tabs');
  const total = PRODUCTS.reduce((n, c) => n + c.items.length, 0);
  tabs.innerHTML = `<button role="tab" data-cat="all">전체 <b>${total}</b></button>` +
    PRODUCTS.map((c) => `<button role="tab" data-cat="${c.id}">${icon(c.icon)}${esc(c.name)} <b>${c.items.length}</b></button>`).join('');

  const select = (cat, scroll) => {
    if (cat !== 'all' && !PRODUCTS.some((c) => c.id === cat)) cat = 'all';
    tabs.querySelectorAll('button').forEach((b) => {
      const on = b.dataset.cat === cat;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on);
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
    catalog.querySelectorAll('.cat').forEach((s) => { s.hidden = cat !== 'all' && s.dataset.cat !== cat; });
    history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat);
    if (scroll) {
      const top = catalog.getBoundingClientRect().top + window.scrollY - 220;
      if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
    }
  };
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) select(b.dataset.cat, true);
  });
  window.addEventListener('hashchange', () => select(location.hash.slice(1) || 'all', true));
  select(location.hash.slice(1) || 'all', false);
  window.scrollTo(0, 0);
}

// ===== 스크롤 등장 효과 =====
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((el) => revealObs.observe(el));

// ===== 오른쪽 점 네비게이션 (첫 페이지) =====
const dots = document.querySelector('.side-dots');
if (dots) {
  const dotLinks = [...dots.querySelectorAll('a')];
  const secObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      dotLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
      dots.classList.toggle('on-dark', id === 'home');
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  dotLinks.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) secObs.observe(sec);
  });
}

// ===== 네이버 지도 (오시는 길) =====
// 네이버 클라우드 플랫폼 > Maps 에서 발급받은 Client ID 를 아래 따옴표 안에 넣으면 네이버 지도로 바뀝니다.
const NAVER_MAP_KEY = 'utpazewzh3';
const mapBox = document.getElementById('map');
if (mapBox && NAVER_MAP_KEY) {
  const fallback = mapBox.innerHTML;
  window.navermap_authFailure = () => { mapBox.innerHTML = fallback; }; // 키 오류 시 Google 지도로 되돌림
  const s = document.createElement('script');
  s.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=' + encodeURIComponent(NAVER_MAP_KEY) + '&submodules=geocoder';
  s.onerror = () => { mapBox.innerHTML = fallback; };
  s.onload = () => {
    const nm = window.naver && window.naver.maps;
    if (!nm) return;
    const pos = new nm.LatLng(+mapBox.dataset.lat, +mapBox.dataset.lng);
    mapBox.innerHTML = '';
    const map = new nm.Map(mapBox, {
      center: pos, zoom: 17, scrollWheel: false,
      zoomControl: true, zoomControlOptions: { position: nm.Position.TOP_RIGHT },
    });
    const marker = new nm.Marker({ position: pos, map });
    const info = new nm.InfoWindow({
      content: `
        <div class="map-info">
          <img src="images/company.webp" alt="성진산업 사옥 외관" width="88" height="88">
          <div class="mi-text">
            <span class="mi-cat">욕실 설비 부속</span>
            <strong>성진산업</strong>
            <p>${mapBox.dataset.address}</p>
            <a href="tel:032-469-4941">032-469-4941</a>
          </div>
        </div>`,
      borderColor: '#1677ff', borderWidth: 2, anchorColor: '#fff', anchorSize: new nm.Size(14, 10),
    });
    // 말풍선이 지도 위쪽에서 잘리지 않도록 마커를 조금 아래로 내려서 보여줌
    const showInfo = () => { info.open(map, marker); map.panBy(new nm.Point(0, -70)); };
    showInfo();
    nm.Event.addListener(marker, 'click', () => (info.getMap() ? info.close() : showInfo()));
    // 주소로 정확한 위치 찾기 (Geocoding 사용 설정 시)
    if (nm.Service && nm.Service.geocode) {
      nm.Service.geocode({ query: mapBox.dataset.address }, (status, res) => {
        const a = status === nm.Service.Status.OK && res.v2 && res.v2.addresses[0];
        if (!a) return;
        const p = new nm.LatLng(+a.y, +a.x);
        map.setCenter(p); marker.setPosition(p); showInfo();
      });
    }
  };
  document.head.appendChild(s);
}

// ===== 문의 팝업: 이메일 링크 → 이메일 주소 띄우기 / 전화 링크 → 휴대폰은 바로 전화, PC는 번호 띄우기 =====
(() => {
  const isPhone = window.matchMedia('(pointer: coarse)').matches && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const box = document.createElement('div');
  box.className = 'cmodal';
  box.hidden = true;
  box.innerHTML = `
    <div class="cmodal-card" role="dialog" aria-modal="true" aria-labelledby="cm-title">
      <button type="button" class="cmodal-x" aria-label="닫기">×</button>
      <span class="cmodal-icon" aria-hidden="true"></span>
      <p class="cmodal-title" id="cm-title"></p>
      <p class="cmodal-desc"></p>
      <p class="cmodal-value"></p>
      <div class="cmodal-actions">
        <button type="button" class="cm-copy">복사하기</button>
        <a class="cm-go"></a>
      </div>
      <p class="cmodal-done" hidden>복사되었습니다</p>
    </div>`;
  document.body.appendChild(box);
  const $ = (s) => box.querySelector(s);
  const ICON = {
    mail: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>',
    tel: '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></svg>',
  };
  let lastFocus = null;
  const close = () => { box.hidden = true; document.body.classList.remove('cmodal-open'); if (lastFocus) lastFocus.focus(); };
  function open(kind, value, href) {
    lastFocus = document.activeElement;
    $('.cmodal-icon').innerHTML = ICON[kind];
    $('.cmodal-title').textContent = kind === 'mail' ? '견적 · 제품 문의' : 'A/S · 전화 문의';
    $('.cmodal-desc').textContent = kind === 'mail' ? '아래 이메일로 문의 내용을 보내주세요.' : '평일 09:00 – 18:00 (토·일요일 및 공휴일 휴무)';
    $('.cmodal-value').textContent = value;
    const go = $('.cm-go');
    go.href = href;
    go.textContent = kind === 'mail' ? '메일 보내기' : '전화 걸기';
    $('.cmodal-done').hidden = true;
    box.hidden = false;
    document.body.classList.add('cmodal-open');
    $('.cmodal-x').focus();
  }
  $('.cm-copy').addEventListener('click', async () => {
    const text = $('.cmodal-value').textContent;
    try { await navigator.clipboard.writeText(text); }
    catch (e) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
    $('.cmodal-done').hidden = false;
  });
  $('.cmodal-x').addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) close(); });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="mailto:"], a[href^="tel:"]');
    if (!a || box.contains(a)) return;
    const href = a.getAttribute('href');
    if (href.startsWith('tel:')) {
      if (isPhone) return; // 휴대폰: 바로 전화 걸기
      e.preventDefault();
      open('tel', href.slice(4), href);
    } else {
      e.preventDefault();
      open('mail', href.slice(7).split('?')[0], href);
    }
  });
})();

// ===== 맨 위로 버튼 =====
const toTop = document.querySelector('.to-top');
toTop.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
const onScroll = () => toTop.classList.toggle('show', window.scrollY > window.innerHeight * 0.6);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// 저작권 연도 자동 갱신
document.getElementById('year').textContent = new Date().getFullYear();

// ===== 본사 정보 누르면 복사 =====
(() => {
  const btns = document.querySelectorAll('.copy[data-copy]');
  if (!btns.length) return;
  const toast = document.createElement('div');
  toast.className = 'copy-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  let hideTimer;
  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    t.remove(); return ok;
  };
  btns.forEach((b) => b.addEventListener('click', async () => {
    const ok = await copyText(b.dataset.copy);
    toast.textContent = ok ? `${b.dataset.label}를 복사했어요` : '복사하지 못했어요. 길게 눌러 직접 복사해 주세요';
    toast.classList.add('show');
    b.classList.add('copied');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => { toast.classList.remove('show'); b.classList.remove('copied'); }, 1800);
  }));
})();
