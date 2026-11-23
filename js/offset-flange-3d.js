// =====================================================================
//  성진 직편심 플랜지 — 3D 모델 (three.js r147)
//  사용: const viewer = OffsetFlange3D(element, { onExplode, ... })
// =====================================================================
window.OffsetFlange3D = function (box, opt) {
  opt = opt || {};
  // 홈페이지 보여주기용 근사 형상입니다. 실제 제품 도면 치수와 다르며, 세부 구조는 생략했습니다.
  const M = {"P":{"FLANGE_OD":180,"RING_H":16,"OFFSET":32.5,"PIPE_OD":110,"PIPE_ID":102,"BORE_D":100},"D":{"Z_END":-50,"Z_FLOOR_TOP":0,"Z_PLATE_TOP":-3,"Z_PLATE_BOT":-6},"wall":[64,66.5],"lip":[57,61],"insert":[[50,-3],[55,-3],[57.5,4],[63.5,4],[63.5,19],[57.5,19],[57.5,13],[51.5,13],[50,15]],"oring":[[51.6,13.05],[57.4,13.05],[57.4,16.5],[51.6,16.5]],"pipe":[[51,-4],[55,-4],[55,-45],[53.5,-50],[51,-50]],"ribs":[15,45,75,105,135,165,195,225,255,285,315,345],"ribT":2,"ribR":[67,85.7],"floorR":51};
  const P = M.P, D = M.D;
  const rad = (a) => a * Math.PI / 180;

  // ---- 장면 ----
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: !!opt.capture });
  renderer.setPixelRatio(opt.pixelRatio || Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  // 실사 느낌: 색 공간, 필름 톤, 부드러운 그림자
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = false; // 그림자 끔
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  box.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 1, 4000);
  const ctl = new THREE.OrbitControls(cam, renderer.domElement);
  ctl.enableDamping = true;
  ctl.enablePan = false;
  ctl.minDistance = 180;
  ctl.maxDistance = 900;

  // 스튜디오 반사광 (실내 조명 환경) — 플라스틱 표면에 은은한 반사가 생김
  const hasEnv = !!THREE.RoomEnvironment;
  if (hasEnv) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
  }
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f98, hasEnv ? 0.1 : 0.6));
  // 주광: 위 앞쪽에서, 바닥에 부드러운 그림자를 드리움
  const sun = new THREE.DirectionalLight(0xffffff, hasEnv ? 1.25 : 0.9);
  sun.position.set(160, 420, 220);
  sun.castShadow = false;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -170, right: 170, top: 170, bottom: -170, near: 50, far: 1200 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  sun.shadow.radius = 6;
  scene.add(sun);
  // 윤곽광: 뒤에서 가장자리를 살짝 밝힘
  const rim = new THREE.DirectionalLight(0xdfe8ff, hasEnv ? 0.35 : 0.3); rim.position.set(-300, 160, -260); scene.add(rim);

  // ---- 재질 (단면 보기 때 잘린 면은 빨간색) ----
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
  function mat(color, opts) {
    const c = new THREE.Color(color).convertSRGBToLinear();
    return {
      front: new THREE.MeshPhysicalMaterial(Object.assign({ color: c, metalness: 0, side: THREE.FrontSide, clipShadows: true }, opts)),
      back: new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd8432f).convertSRGBToLinear(), side: THREE.BackSide, clipShadows: true }),
    };
  }
  // 링 하우징: 사출 PP 회색, 약간 광택 / 인서트: 아이보리 ABS / O-링: 무광 고무
  const mRing = mat(0x6c7480, { roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.18 });
  const mIns = mat(0xd6cfbf, { roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.16 });
  const mOr = mat(0x1e1e1e, { roughness: 0.82, envMapIntensity: 0.1 });
  const MATS = [mRing, mIns, mOr];
  const backs = [];
  function add(group, geo, m) {
    const f = new THREE.Mesh(geo, m.front);
    f.castShadow = true; f.receiveShadow = true;
    group.add(f);
    const b = new THREE.Mesh(geo, m.back); b.visible = false; backs.push(b); group.add(b);
  }
  const area = (p) => p.reduce((a, q, i) => { const n = p[(i + 1) % p.length]; return a + q[0] * n[1] - n[0] * q[1]; }, 0) / 2;
  function lathe(group, prof, m, ox = 0, oz = 0) {
    const p = area(prof) < 0 ? prof.slice().reverse() : prof;
    p.forEach((a, i) => {
      const b = p[(i + 1) % p.length];
      const g = new THREE.LatheGeometry([new THREE.Vector2(a[0], a[1]), new THREE.Vector2(b[0], b[1])], 160);
      g.translate(ox, 0, oz);
      add(group, g, m);
    });
  }
  const circ = (S, x, y, r, cw) => { S.absarc(x, y, r, 0, Math.PI * 2, cw); return S; };
  function slab(group, shape, z0, h, m) {
    const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 120 });
    g.rotateX(-Math.PI / 2); g.translate(0, z0, 0);
    add(group, g, m);
  }
  const r1 = P.BORE_D / 2, r2 = P.PIPE_ID / 2, dd = P.OFFSET;
  const xi = (dd * dd + r1 * r1 - r2 * r2) / (2 * dd), yi = Math.sqrt(r1 * r1 - xi * xi);
  const f1 = Math.atan2(yi, xi), f2 = Math.atan2(yi, dd - xi);
  function lens() { const p = new THREE.Path(); p.absarc(0, 0, r1, -f1, f1, false); p.absarc(dd, 0, r2, Math.PI - f2, Math.PI + f2, false); return p; }

  // ---- 링 하우징 ----
  const ring = new THREE.Group();
  const R = P.FLANGE_OD / 2, H = P.RING_H, [w1, w2] = M.wall, [l1, l2] = M.lip;
  lathe(ring, [[R - 4, 0], [R - 1, 0], [R, 1], [R, H - 1], [R - 1, H], [R - 4, H]], mRing);
  lathe(ring, [[w1, 2.4], [w2, 2.4], [w2, H], [w1, H]], mRing);
  lathe(ring, [[l1, 0], [l2, 0], [l2, 2.4], [l1, 2.4]], mRing);
  const plate = circ(new THREE.Shape(), 0, 0, R - 4, false);
  plate.holes.push(circ(new THREE.Path(), 0, 0, l2, true));
  slab(ring, plate, 0, 2.4, mRing);
  const [q1, q2] = M.ribR, rh = H - 2;
  M.ribs.forEach((a) => {
    const g = new THREE.BoxGeometry(q2 - q1, rh, M.ribT);
    const rc = (q1 + q2) / 2;
    g.rotateY(rad(a)); g.translate(rc * Math.cos(rad(a)), 2 + rh / 2, -rc * Math.sin(rad(a)));
    add(ring, g, mRing);
  });

  // ---- 편심 인서트 ----
  const ins = new THREE.Group();
  lathe(ins, M.insert, mIns);
  const floor = circ(new THREE.Shape(), 0, 0, M.floorR, false); floor.holes.push(lens());
  slab(ins, floor, D.Z_PLATE_TOP, D.Z_FLOOR_TOP - D.Z_PLATE_TOP, mIns);
  const ceil = circ(new THREE.Shape(), dd, 0, P.PIPE_OD / 2, false); ceil.holes.push(lens());
  slab(ins, ceil, D.Z_PLATE_BOT, D.Z_PLATE_TOP - D.Z_PLATE_BOT, mIns);
  lathe(ins, M.pipe, mIns, dd, 0);

  // ---- O-링 ----
  const orr = new THREE.Group();
  lathe(orr, M.oring, mOr);

  const all = new THREE.Group(); all.add(ring, ins, orr); scene.add(all);

  // 바닥 그림자 (바닥면은 보이지 않고 그림자만 맺힘)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.ShadowMaterial({ opacity: 0.17 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = D.Z_END - 0.6;
  ground.receiveShadow = true;
  // scene.add(ground); // 바닥 그림자 끔
  const PARTS = [ring, ins, orr];
  ring.userData = { lift: 0, off: new THREE.Vector3(), k: 0 };
  // O-링은 인서트 윗부분 홈(카운터보어)에 들어감 → 인서트보다 위에서 내려옴
  ins.userData = { lift: 55, off: new THREE.Vector3(), k: 0, introDelay: 0 };
  orr.userData = { lift: 82, off: new THREE.Vector3(), k: 0, introDelay: 700 };
  let clipOn = false;

  // ---- 시점 ----
  const V = {
    iso: [[325, 250, 375], [0, -12, 0]], top: [[0, 430, 1], [0, 0, 0]],
    bottom: [[0, -430, 1], [0, 0, 0]], front: [[0, -10, 430], [0, -12, 0]],
  };
  function view(k) { const [p, t] = V[k]; cam.position.set(...p); ctl.target.set(...t); ctl.update(); }
  view('iso');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let explode = 0, explodeTo = 0;
  function resetOffsets() { PARTS.forEach((g) => g.userData.off.set(0, 0, 0)); }

  // ---- 분해 상태에서 부품 끌어 옮기기 ----
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), dragPlane = new THREE.Plane(), hitPt = new THREE.Vector3(), lastPt = new THREE.Vector3();
  let dragging = null;
  const cv = renderer.domElement;
  function setPtr(e) {
    const r = cv.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  function partAt(e) {
    setPtr(e);
    ray.setFromCamera(ptr, cam);
    const hits = ray.intersectObjects(PARTS, true).filter((h) => h.object.visible && (!clipOn || clip.distanceToPoint(h.point) >= 0));
    if (!hits.length) return null;
    let o = hits[0].object; while (o && !PARTS.includes(o)) o = o.parent;
    return o ? { part: o, point: hits[0].point } : null;
  }
  cv.addEventListener('pointerdown', (e) => {
    if (!explodeTo || e.button > 0) return;
    const h = partAt(e); if (!h) return;
    e.stopImmediatePropagation(); e.preventDefault();
    dragging = h.part; ctl.enabled = false; cv.setPointerCapture(e.pointerId);
    dragPlane.setFromNormalAndCoplanarPoint(cam.getWorldDirection(new THREE.Vector3()).negate(), h.point);
    lastPt.copy(h.point);
    dragging.traverse((m) => { if (m.material && m.material.emissive) m.material.emissive.setHex(0x1a2a66); });
  }, true);
  cv.addEventListener('pointermove', (e) => {
    if (dragging) {
      setPtr(e); ray.setFromCamera(ptr, cam);
      if (ray.ray.intersectPlane(dragPlane, hitPt)) { dragging.userData.off.add(hitPt.clone().sub(lastPt)); lastPt.copy(hitPt); }
      return;
    }
    box.classList.toggle('drag', !!(explodeTo && partAt(e)));
  });
  function endDrag() {
    if (!dragging) return;
    dragging.traverse((m) => { if (m.material && m.material.emissive) m.material.emissive.setHex(0x000000); });
    dragging = null; ctl.enabled = true;
  }
  cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);

  // ---- 크기 맞춤 ----
  function size() {
    const w = box.clientWidth, h = box.clientHeight;
    renderer.setSize(w, h, false); cam.aspect = w / h;
    cam.fov = w < 520 ? 40 : 30; cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(box); size();

  // ---- 조립 인트로: 분해된 상태에서 O-링 → 인서트 순서로 내려와 끼워짐 ----
  const INTRO = { hold: 700, dur: 1900, amp: 1.3, spin: rad(-80), camTurn: rad(-38), camZoom: 0.22 };
  const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOut = (p) => 1 - Math.pow(1 - p, 3);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  // 이동 곡선: 튀지 않고 부드럽게 내려와 멈춤
  function dropCurve(p) {
    if (p <= 0) return 1;
    if (p >= 1) return 0;
    return 1 - easeInOut(p);
  }
  let intro = null;
  let insDeg = 0;
  const isoPos = new THREE.Vector3(...V.iso[0]), isoTgt = new THREE.Vector3(...V.iso[1]);
  function playIntro() {
    if (reduce) return;
    spin = null;
    explodeTo = 0; explode = 0; resetOffsets();
    view('iso');
    intro = { t0: performance.now(), userCam: false };
    PARTS.forEach((g) => { g.userData.k = g === ring ? 0 : INTRO.amp; });
    stepIntro(intro.t0);
  }
  function stopIntro() {
    if (!intro) return;
    intro = null;
    PARTS.forEach((g) => { g.userData.k = 0; });
    ins.rotation.y = rad(insDeg);
  }
  ctl.addEventListener('start', () => { if (intro) intro.userCam = true; });
  function stepIntro(now) {
    const t = now - intro.t0;
    let done = true;
    [orr, ins].forEach((g) => {
      const p = clamp01((t - INTRO.hold - g.userData.introDelay) / INTRO.dur);
      if (p < 1) done = false;
      g.userData.k = INTRO.amp * dropCurve(p);
      if (g === ins) ins.rotation.y = rad(insDeg) + INTRO.spin * (1 - easeOut(p));
    });
    if (!intro.userCam) {
      const total = INTRO.hold + INTRO.dur + Math.max(ins.userData.introDelay, orr.userData.introDelay);
      const e = easeInOut(clamp01(t / total));
      const off = isoPos.clone().sub(isoTgt).applyAxisAngle(new THREE.Vector3(0, 1, 0), INTRO.camTurn * (1 - e)).multiplyScalar(1 + INTRO.camZoom * (1 - e));
      cam.position.copy(isoTgt).add(off);
      ctl.target.copy(isoTgt);
    }
    if (done) { stopIntro(); startSpin(); }
  }

  // ---- 조립 후 인서트 한 바퀴 돌리기 (편심 조정 시연) ----
  const SPIN = { delay: 350, dur: 3200 };
  let spin = null;
  function setInsert(deg) {
    insDeg = deg;
    ins.rotation.y = rad(deg);
    if (opt.onInsertRotate) opt.onInsertRotate(((Math.round(deg) % 360) + 360) % 360);
  }
  function startSpin() {
    if (reduce || opt.spinAfterIntro === false) return;
    spin = { t0: performance.now() + SPIN.delay, from: insDeg };
  }
  function stopSpin() {
    if (!spin) return;
    spin = null;
    setInsert(((Math.round(insDeg) % 360) + 360) % 360);
  }
  function stepSpin(now) {
    const p = clamp01((now - spin.t0) / SPIN.dur);
    if (p <= 0) return;
    setInsert(spin.from + 360 * easeInOut(p));
    if (p >= 1) { const from = spin.from; spin = null; setInsert(from); }
  }
  if (opt.intro) playIntro();

  function frame() {
    if (intro) stepIntro(performance.now());
    if (spin) stepSpin(performance.now());
    explode += (explodeTo - explode) * 0.12;
    PARTS.forEach((g) => { g.position.set(g.userData.off.x, g.userData.lift * (explode + g.userData.k) + g.userData.off.y, g.userData.off.z); });
    ctl.update(); renderer.render(scene, cam);
  }
  if (!opt.still) (function tick() { frame(); requestAnimationFrame(tick); })();

  // ---- 밖에서 쓰는 기능 ----
  return {
    view(k) { if (intro) intro.userCam = true; view(k); },
    explode(on) { stopIntro(); stopSpin(); explodeTo = on ? 1 : 0; if (!on) resetOffsets(); if (reduce) explode = explodeTo; },
    playIntro,
    section(on) {
      MATS.forEach((m) => { m.front.clippingPlanes = on ? [clip] : []; m.back.clippingPlanes = on ? [clip] : []; m.front.needsUpdate = m.back.needsUpdate = true; });
      backs.forEach((b) => { b.visible = on; }); clipOn = on;
      if (on) { if (intro) intro.userCam = true; view('front'); }
    },
    rotateInsert(deg) { spin = null; insDeg = deg; if (!intro) ins.rotation.y = rad(deg); },
    reset: resetOffsets,
    render: frame,
    canvas: cv,
    renderer,
    scene,
    parts: { ring: mRing.front, insert: mIns.front, oring: mOr.front },
    camera: cam,
    controls: ctl,
  };
};
