// =====================================================================
//  성진 직편심 플랜지 — 3D 모델 (three.js r147)
//  사용: const viewer = OffsetFlange3D(element, { onExplode, ... })
// =====================================================================
window.OffsetFlange3D = function (box, opt) {
  opt = opt || {};
  // 홈페이지 보여주기용 근사 형상입니다. 실제 제품 도면 치수와 다릅니다.
  const M = {"P":{"FLANGE_OD":180.0,"RING_H":15.5,"LIP_H":3.5,"LIP_OD":129.0,"TOTAL_LEN":68.5,"PIPE_OD":109.5,"OFFSET":32.5,"GROOVE_W":4.5,"PIPE_ID":101.5,"GROOVE_DEPTH":2.5,"GROOVE1_Z":38.0,"GROOVE2_Z":52.5,"TIP_CHAMFER_LEN":6.0,"TIP_OD":106.0,"BORE_D":101.0,"CBORE_D":116.0,"CBORE_DEPTH":6.5,"PLATE_T":3.5,"BOSS_R":76.0,"BOSS_OD":10.0,"BOSS_ANGLES":[31.5,121.5,211.5,301.5]},"D":{"Z_RING_TOP":15.5,"Z_TOP":19.0,"Z_END":-49.5,"Z_FLOOR_TOP":0.0,"Z_PLATE_TOP":-3.0,"Z_PLATE_BOT":-6.5},"ring":[[58.5,0.0],[89.0,0.0],[90.0,1.0],[90.0,14.5],[89.0,15.5],[86.0,15.5],[86.0,2.5],[67.0,2.5],[67.0,15.5],[64.5,15.5],[64.5,2.5],[60.5,2.5]],"insert":[[50.5,-3.0],[56.0,-3.0],[60.0,2.5],[57.0,2.5],[57.0,6.5],[64.2,6.5],[64.2,18.5],[63.7,19.0],[58.0,19.0],[58.0,13.0],[52.5,13.0],[50.5,15.5]],"oring":[[52.6,13.05],[57.9,13.05],[57.9,16.5],[52.6,16.5]],"pipe":[[50.5,-4.0],[54.5,-4.0],[54.5,-19.0],[52.0,-19.0],[52.0,-23.5],[54.5,-23.5],[54.5,-33.5],[52.0,-33.5],[52.0,-37.5],[54.5,-37.5],[54.5,-43.5],[53.0,-49.5],[50.5,-49.5]],"ribs":[24.0,39.0,51.0,62.0,114.0,129.0,141.0,152.0,204.0,219.0,231.0,242.0,294.0,309.0,321.0,332.0],"ribT":2.0,"ribR":[67.0,86.0],"bosses":[[31.5,3.0],[121.5,4.5],[211.5,3.0],[301.5,4.5]],"slots":[[0,70.5,4.5,20.0],[0,80.0,5.5,20.0],[90,70.5,4.5,20.0],[90,80.0,5.5,20.0],[180,70.5,4.5,20.0],[180,80.0,5.5,20.0],[270,70.5,4.5,20.0],[270,80.0,5.5,20.0]],"floorR":51.5,"wall":[64.5,67.0],"hole":62.0,"cb":4.0};
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
  // opt.colors 로 색을 바꿀 수 있음 (정심 플랜지는 전체 흑색)
  const COL = Object.assign({ ring: 0x6c7480, insert: 0xd6cfbf, oring: 0x1e1e1e }, opt.colors);
  const mRing = mat(COL.ring, { roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.18 });
  const mIns = mat(COL.insert, { roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.16 });
  const mOr = mat(COL.oring, { roughness: 0.82, envMapIntensity: 0.1 });
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
  // opt.offset = 0 이면 정심 플랜지 (배관이 링 중심에 있음)
  const r1 = P.BORE_D / 2, r2 = P.PIPE_ID / 2, dd = opt.offset != null ? opt.offset : P.OFFSET;
  const xi = dd ? (dd * dd + r1 * r1 - r2 * r2) / (2 * dd) : 0, yi = Math.sqrt(Math.max(0, r1 * r1 - xi * xi));
  const f1 = Math.atan2(yi, xi), f2 = Math.atan2(yi, dd - xi);
  function lens() { const p = new THREE.Path(); p.absarc(0, 0, r1, -f1, f1, false); p.absarc(dd, 0, r2, Math.PI - f2, Math.PI + f2, false); return p; }

  // ---- 링 하우징 ----
  const ring = new THREE.Group();
  const R = P.FLANGE_OD / 2, H = P.RING_H, rp = M.ring;
  lathe(ring, [[R - 4, 0], [R - 1, 0], [R, 1], [R, H - 1], [R - 1, H], [R - 4, H]], mRing);
  lathe(ring, [[M.wall[0], 2.4], [M.wall[1], 2.4], [M.wall[1], H], [M.wall[0], H]], mRing);
  lathe(ring, [rp[0], [M.hole, 0], [M.hole, 2.4], rp[rp.length - 1]], mRing);
  const plate = circ(new THREE.Shape(), 0, 0, R - 4, false);
  plate.holes.push(circ(new THREE.Path(), 0, 0, M.hole, true));
  function slotPoly([a0, rc, w, hs], n = 36, nc = 10) {
    const pts = [], t1 = rad(a0 - hs), t2 = rad(a0 + hs), ro = rc + w / 2, ri = rc - w / 2;
    for (let i = 0; i <= n; i++) { const t = t1 + (t2 - t1) * i / n; pts.push([ro * Math.cos(t), ro * Math.sin(t)]); }
    let cx = rc * Math.cos(t2), cy = rc * Math.sin(t2);
    for (let i = 1; i < nc; i++) { const t = t2 + Math.PI * i / nc; pts.push([cx + w / 2 * Math.cos(t), cy + w / 2 * Math.sin(t)]); }
    for (let i = 0; i <= n; i++) { const t = t2 - (t2 - t1) * i / n; pts.push([ri * Math.cos(t), ri * Math.sin(t)]); }
    cx = rc * Math.cos(t1); cy = rc * Math.sin(t1);
    for (let i = 1; i < nc; i++) { const t = t1 + Math.PI + Math.PI * i / nc; pts.push([cx + w / 2 * Math.cos(t), cy + w / 2 * Math.sin(t)]); }
    return pts;
  }
  M.slots.map((s) => slotPoly(s)).forEach((pts) => { const h = new THREE.Path(); h.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((q) => h.lineTo(q[0], q[1])); h.closePath(); plate.holes.push(h); });
  M.bosses.forEach(([a, hd]) => plate.holes.push(circ(new THREE.Path(), P.BOSS_R * Math.cos(rad(a)), P.BOSS_R * Math.sin(rad(a)), hd / 2, true)));
  slab(ring, plate, 0, 2.4, mRing);
  const [q1, q2] = M.ribR, rh = H - 2;
  M.ribs.forEach((a) => {
    const g = new THREE.BoxGeometry(q2 - q1, rh, M.ribT);
    const rc = (q1 + q2) / 2;
    g.rotateY(rad(a)); g.translate(rc * Math.cos(rad(a)), 2 + rh / 2, -rc * Math.sin(rad(a)));
    add(ring, g, mRing);
  });
  M.bosses.forEach(([a, hd]) => {
    const x = P.BOSS_R * Math.cos(rad(a)), y = P.BOSS_R * Math.sin(rad(a)), ro = P.BOSS_OD / 2;
    lathe(ring, [[hd / 2, 2], [ro, 2], [ro, H - 1], [M.cb, H - 1], [M.cb, H - 3], [hd / 2, H - 3]], mRing, x, -y);
  });

  // ---- 편심 인서트 ----
  // opt.oneBody: 정심 플랜지처럼 링과 배관이 한 몸인 제품 (인서트 없음, O-링만 끼움)
  const ins = new THREE.Group();
  const pipeOr = new THREE.Group();
  const pipeOring = [];
  for (let i = 0; i < 32; i++) { const t = Math.PI * 2 * i / 32; pipeOring.push([54.0 + 2.0 * Math.cos(t), -35.5 + 2.0 * Math.sin(t)]); }
  if (opt.oneBody) {
    // 링 안쪽 벽부터 배관 위쪽까지 채우는 몸통 단면 [r, z]
    lathe(ring, [[r1, 15.5], [52.5, 13], [58, 13], [58, 19], [63.7, 19], [64.5, 18.2], [64.5, 2.4], [60.5, 2.4], [58.5, 0], [54.5, 0], [54.5, -4], [r1, -4]], mRing);
    lathe(ring, M.pipe, mRing);
    lathe(pipeOr, pipeOring, mOr); // 배관 아래쪽 홈의 O-링 — 따로 끼우는 부품
  } else {
    lathe(ins, M.insert, mIns);
    const floor = circ(new THREE.Shape(), 0, 0, M.floorR, false); floor.holes.push(lens());
    slab(ins, floor, D.Z_PLATE_TOP, D.Z_FLOOR_TOP - D.Z_PLATE_TOP, mIns);
    const ceil = circ(new THREE.Shape(), dd, 0, P.PIPE_OD / 2, false); ceil.holes.push(lens());
    slab(ins, ceil, D.Z_PLATE_BOT, D.Z_PLATE_TOP - D.Z_PLATE_BOT, mIns);
    lathe(ins, M.pipe, mIns, dd, 0);
    // 배관 아래쪽 홈에 끼운 O-링 (단면이 둥근 고무링, 인서트와 함께 움직임)
    lathe(ins, pipeOring, mOr, dd, 0);
  }

  // ---- O-링 ----
  const orr = new THREE.Group();
  lathe(orr, opt.packing || M.oring, mOr); // opt.packing: 윗면 패킹 단면 [[r, z], ...]

  const all = new THREE.Group(); all.add(ring, ins, orr, pipeOr);
  // opt.tilt: 제품을 앞으로 기울여 아래쪽 배관(홈 2개)을 보여줌 (정심 일체형).
  //           값은 조립 뒤 자동으로 기울여 보여줄 각도. 기울기 중심은 제품 높이 가운데.
  const pivot = new THREE.Group(); pivot.add(all); scene.add(pivot);
  if (opt.tilt) { pivot.position.y = -15; all.position.y = 15; }
  // 돌리기 대상: 직편심은 인서트(세로축), 정심은 제품 전체(가로축으로 기울이기)
  const turn = opt.tilt ? pivot : opt.oneBody ? all : ins;
  function applyTurn(deg) { if (opt.tilt) turn.rotation.x = -rad(deg); else turn.rotation.y = rad(deg); }

  // 바닥 그림자 (바닥면은 보이지 않고 그림자만 맺힘)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1600, 1600), new THREE.ShadowMaterial({ opacity: 0.17 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = D.Z_END - 0.6;
  ground.receiveShadow = true;
  // scene.add(ground); // 바닥 그림자 끔
  const PARTS = opt.oneBody ? [ring, orr, pipeOr] : [ring, ins, orr];
  ring.userData = { lift: 0, off: new THREE.Vector3(), k: 0 };
  // O-링은 인서트 윗부분 홈(카운터보어)에 들어감 → 인서트보다 위에서 내려옴
  ins.userData = { lift: 55, off: new THREE.Vector3(), k: 0, introDelay: 0 };
  orr.userData = { lift: opt.oneBody ? 55 : 82, off: new THREE.Vector3(), k: 0, introDelay: opt.oneBody ? 450 : 700 };
  // 일체형: 배관 O-링은 아래에서 올라와 홈에 끼워짐. base = 어느 홈에 끼울지 (0: 아래쪽 홈, 14.25: 위쪽 홈)
  const GROOVE_SHIFT = { lower: 0, upper: 14.25 };
  pipeOr.userData = { lift: -45, off: new THREE.Vector3(), k: 0, introDelay: 0, base: GROOVE_SHIFT[opt.oringGroove] || 0, baseTo: GROOVE_SHIFT[opt.oringGroove] || 0 };
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
    if (opt.tilt) setInsert(0); // 기울인 채로 조립되지 않게 바로 세움
    view('iso');
    intro = { t0: performance.now(), userCam: false };
    PARTS.forEach((g) => { g.userData.k = g === ring ? 0 : INTRO.amp; });
    stepIntro(intro.t0);
  }
  function stopIntro() {
    if (!intro) return;
    intro = null;
    PARTS.forEach((g) => { g.userData.k = 0; });
    applyTurn(insDeg);
  }
  ctl.addEventListener('start', () => { if (intro) intro.userCam = true; });
  function stepIntro(now) {
    const t = now - intro.t0;
    let done = true;
    PARTS.filter((g) => g !== ring).forEach((g) => {
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
    applyTurn(deg);
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
  // 정심(opt.tilt): 앞으로 기울여 아래 배관 홈을 보여주고, 잠시 멈췄다가 다시 세움
  const TILT = { dur: 5200, up: 0.3, down: 0.7 };
  function stepSpin(now) {
    const p = clamp01((now - spin.t0) / (opt.tilt ? TILT.dur : SPIN.dur));
    if (p <= 0) return;
    if (opt.tilt) {
      const k = p < TILT.up ? easeInOut(p / TILT.up) : p < TILT.down ? 1 : 1 - easeInOut((p - TILT.down) / (1 - TILT.down));
      setInsert(spin.from + (opt.tilt - spin.from) * k);
    } else {
      setInsert(spin.from + 360 * easeInOut(p));
    }
    if (p >= 1) { const from = spin.from; spin = null; setInsert(from); }
  }
  if (opt.intro) playIntro();

  function frame() {
    if (intro) stepIntro(performance.now());
    if (spin) stepSpin(performance.now());
    explode += (explodeTo - explode) * 0.12;
    // base: O-링 홈 바꾸기 — 배관을 따라 굴러가듯 부드럽게 이동
    pipeOr.userData.base += (pipeOr.userData.baseTo - pipeOr.userData.base) * (reduce ? 1 : 0.1);
    PARTS.forEach((g) => { g.position.set(g.userData.off.x, (g.userData.base || 0) + g.userData.lift * (explode + g.userData.k) + g.userData.off.y, g.userData.off.z); });
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
    rotateInsert(deg) { spin = null; insDeg = deg; if (!intro) applyTurn(deg); },
    // 일체형: O-링을 끼울 홈 선택 ('upper' 위쪽 홈 / 'lower' 아래쪽 홈)
    oringGroove(which) { pipeOr.userData.baseTo = GROOVE_SHIFT[which] || 0; },
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
