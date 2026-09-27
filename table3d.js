import * as THREE from 'three';
import { gsap } from 'gsap';
import { buildDishModel, makeCloche } from './dishes3d.js';

function findDishGroup(obj) {
  while (obj) {
    if (obj.userData?.id && obj.children?.some((child) => child.userData?.cloche === true)) {
      return obj;
    }
    obj = obj.parent;
  }
  return null;
}

function loadTexture(url) {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
}

function makeSuzaniTexture() {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const cx = 512;
  const cy = 512;
  const wine = ctx.createRadialGradient(cx, cy, 20, cx, cy, 520);
  wine.addColorStop(0, '#8b2218');
  wine.addColorStop(0.45, '#6a1410');
  wine.addColorStop(1, '#2c0908');
  ctx.fillStyle = wine;
  ctx.fillRect(0, 0, size, size);

  function shamsi(x, y, r, petals, fill, stroke) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < petals * 2; i++) {
      const a = (i / (petals * 2)) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? r * 0.55 : r;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function anorgul(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#c42820';
    ctx.beginPath();
    ctx.ellipse(0, 6, s * 0.92, s * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8c56a';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#7a1a12';
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.55);
    ctx.quadraticCurveTo(0, -s * 1.25, s * 0.28, -s * 0.55);
    ctx.fill();
    ctx.fillStyle = '#f3d99c';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 0.38, 7 + Math.sin(a) * s * 0.38, s * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function bodom(x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.85, -s * 0.4, s * 0.7, s * 0.55, 0, s);
    ctx.bezierCurveTo(-s * 0.35, s * 0.2, -s * 0.15, -s * 0.35, 0, -s);
    ctx.fillStyle = '#1a3a5c';
    ctx.fill();
    ctx.strokeStyle = '#e8c56a';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(s * 0.08, -s * 0.15, s * 0.18, s * 0.38, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#d9b56a';
    ctx.fill();
    ctx.restore();
  }

  function kalamfur(x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.7, -s * 0.1, s * 0.15, s);
    ctx.quadraticCurveTo(-s * 0.2, 0, 0, -s);
    ctx.fillStyle = '#1f5c32';
    ctx.fill();
    ctx.restore();
  }

  function lola(x, y, s, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.quadraticCurveTo(-s * 0.55, -s * 0.1, -s * 0.2, -s);
    ctx.quadraticCurveTo(0, -s * 0.45, s * 0.2, -s);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.1, 0, s * 0.4);
    ctx.fill();
    ctx.restore();
  }

  function mohuSitora(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#f3d99c';
    ctx.beginPath();
    ctx.arc(0, 0, s, 0.55, Math.PI * 2 - 0.55);
    ctx.arc(s * 0.38, -s * 0.05, s * 0.72, Math.PI * 2 - 0.85, 0.85, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8c56a';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 ? s * 0.22 : s * 0.48;
      const px = s * 0.95 + Math.cos(a) * rr;
      const py = -s * 0.55 + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function waveRing(r) {
    ctx.beginPath();
    for (let i = 0; i <= 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const wobble = Math.sin(a * 18) * 7;
      const x = cx + Math.cos(a) * (r + wobble);
      const y = cy + Math.sin(a) * (r + wobble);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(232,197,106,.7)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  [140, 250, 365, 455].forEach((r, idx) => {
    ctx.strokeStyle = idx % 2 ? 'rgba(232,197,106,.75)' : 'rgba(26,58,92,.55)';
    ctx.lineWidth = idx === 0 ? 7 : 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  waveRing(300);

  shamsi(cx, cy, 86, 16, '#e8c56a', '#8a5a2c');
  shamsi(cx, cy, 52, 12, '#c42820', '#f3d99c');
  ctx.fillStyle = '#6a1410';
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();
  anorgul(cx, cy + 2, 12);

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    anorgul(cx + Math.cos(a) * 195, cy + Math.sin(a) * 195, 26);
    lola(cx + Math.cos(a + 0.31) * 195, cy + Math.sin(a + 0.31) * 195, 16, a);
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.12;
    bodom(cx + Math.cos(a) * 318, cy + Math.sin(a) * 318, 32, a + Math.PI / 2);
    kalamfur(cx + Math.cos(a + 0.26) * 318, cy + Math.sin(a + 0.26) * 318, 18, a);
  }
  for (let i = 0; i < 16; i++) {
    if (i === 15) continue;
    const a = (i / 16) * Math.PI * 2;
    mohuSitora(cx + Math.cos(a) * 430, cy + Math.sin(a) * 430, 14);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function isLightTheme() {
  return document.documentElement.classList.contains('theme-light');
}

export async function initDastarkhan() {
  const canvas = document.getElementById('dastarkhanCanvas');
  const wrap = document.getElementById('tablePerspective');
  const caption = document.getElementById('tableCaption');
  if (!canvas || !wrap || !window.DISHES?.length) return;

  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const scene = new THREE.Scene();

  const tableR = 3.7;
  function camForWidth() {
    const w = window.innerWidth;
    if (w < 480) return { y: 8.3, z: 9.4, fov: 38 };
    if (w < 900) return { y: 7.7, z: 8.7, fov: 34 };
    return { y: 7.2, z: 8.1, fov: 32 };
  }
  let camHome = camForWidth();
  const camera = new THREE.PerspectiveCamera(camHome.fov, 1, 0.1, 80);
  camera.position.set(0, camHome.y + 1.6, camHome.z + 1.8);
  camera.lookAt(0, 0.05, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.AmbientLight(0x4a3420, 0.7);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffe1b0, 1.25);
  key.position.set(5, 12, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
  key.shadow.bias = -0.00035;
  scene.add(key);
  const fill = new THREE.PointLight(0xff9a52, 7, 16, 1.6);
  fill.position.set(0, 3.8, 0);
  scene.add(fill);

  const carpet = new THREE.Mesh(
    new THREE.CircleGeometry(7.4, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a0c08, roughness: 0.94 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = -1.35;
  carpet.receiveShadow = true;
  scene.add(carpet);

  const tableGroup = new THREE.Group();
  scene.add(tableGroup);

  const woodTex = await loadTexture('/images/resto-interior.jpg');
  if (woodTex) {
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(2, 2);
  }

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x6a4220,
    map: woodTex,
    roughness: 0.66,
    metalness: 0.05
  });

  const top = new THREE.Mesh(new THREE.CylinderGeometry(tableR, tableR, 0.2, 80), woodMat);
  top.receiveShadow = true;
  top.castShadow = true;
  tableGroup.add(top);

  const cloth = new THREE.Mesh(
    new THREE.CircleGeometry(tableR - 0.08, 80),
    new THREE.MeshStandardMaterial({
      map: makeSuzaniTexture(),
      roughness: 0.82,
      metalness: 0.04,
      color: 0xffffff
    })
  );
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.11;
  cloth.receiveShadow = true;
  tableGroup.add(cloth);

  const rimGold = new THREE.Mesh(
    new THREE.TorusGeometry(tableR + 0.02, 0.05, 14, 90),
    new THREE.MeshStandardMaterial({ color: 0xb8944a, metalness: 0.62, roughness: 0.36 })
  );
  rimGold.rotation.x = Math.PI / 2;
  rimGold.position.y = 0.11;
  tableGroup.add(rimGold);

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const inlay = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xd9b56a, metalness: 0.7, roughness: 0.3 })
    );
    inlay.position.set(Math.cos(a) * (tableR - 0.18), 0.14, Math.sin(a) * (tableR - 0.18));
    tableGroup.add(inlay);
  }

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.2, 1.3, 10),
      new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.7 })
    );
    leg.position.set(Math.cos(a) * 2.6, -0.75, Math.sin(a) * 2.6);
    leg.castShadow = true;
    tableGroup.add(leg);
  }

  const dishPick = [];
  const count = window.DISHES.length;
  const radius = 2.15;
  const foodTextures = await Promise.all(window.DISHES.map((dish) => loadTexture(dish.img)));

  window.DISHES.forEach((dish, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const group = new THREE.Group();
    group.position.set(Math.cos(angle) * radius, 0.13, Math.sin(angle) * radius);
    group.userData = { id: dish.id, baseY: 0.13, name: dish.name, opened: false };

    const food = buildDishModel(dish.id, foodTextures[i]);
    food.userData = group.userData;
    food.scale.setScalar(0.95);
    group.add(food);

    const cloche = makeCloche(0.58);
    cloche.position.y = 0.02;
    group.userData.cloche = cloche;
    group.add(cloche);

    tableGroup.add(group);
    dishPick.push(group);
    group.scale.set(0.01, 0.01, 0.01);
    gsap.to(group.scale, {
      x: 1, y: 1, z: 1,
      delay: 0.05 * i,
      duration: 0.8,
      ease: 'power3.out'
    });
  });

  function setClocheOpen(group, open) {
    const cloche = group.userData.cloche;
    if (!cloche) return;
    group.userData.opened = open;
    const mat = cloche.userData.glassMat;
    gsap.to(cloche.position, {
      y: open ? 0.62 : 0.02,
      z: open ? -0.28 : 0,
      duration: 0.65,
      ease: 'power3.inOut'
    });
    gsap.to(cloche.rotation, { x: open ? -1.2 : 0, duration: 0.65, ease: 'power3.inOut' });
    if (mat) {
      if (open) {
        mat.transparent = true;
        mat.depthWrite = false;
        mat.needsUpdate = true;
        gsap.to(mat, { opacity: 0.14, metalness: 0.4, roughness: 0.12, duration: 0.55, ease: 'power2.out' });
      } else {
        gsap.to(mat, {
          opacity: 1,
          metalness: 0.88,
          roughness: 0.32,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            mat.transparent = false;
            mat.depthWrite = true;
            mat.needsUpdate = true;
          }
        });
      }
    }
    const glass = cloche.userData.glass;
    if (glass) {
      glass.raycast = open ? () => {} : THREE.Mesh.prototype.raycast;
    }
    const liner = cloche.userData.liner;
    if (liner) {
      liner.visible = !open;
      liner.raycast = open ? () => {} : THREE.Mesh.prototype.raycast;
    }
  }

  function hitIsCloche(obj) {
    while (obj) {
      if (obj.userData?.cloche === true) return true;
      obj = obj.parent;
    }
    return false;
  }

  function applyTheme() {
    const light = isLightTheme();
    const bg = light ? 0xefe6d4 : 0x0a0806;
    scene.background = new THREE.Color(bg);
    ambient.intensity = light ? 1 : 0.7;
    key.intensity = light ? 0.85 : 1.25;
    fill.intensity = light ? 3 : 7;
    renderer.toneMappingExposure = light ? 0.76 : 0.86;
    carpet.material.color.set(light ? 0xc45a42 : 0x1a0c08);
    woodMat.color.set(light ? 0x8a5a32 : 0x6a4220);
  }
  applyTheme();
  window.addEventListener('plovtg-theme', applyTheme);

  gsap.to(camera.position, {
    y: camHome.y,
    z: camHome.z,
    duration: 1.7,
    ease: 'power3.inOut',
    onUpdate: () => camera.lookAt(0, 0.05, 0)
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let autoRot = 0;
  let dragRot = 0;
  let dragging = false;
  let lastX = 0;
  let dragDelta = 0;

  function sizeRenderer() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    camHome = camForWidth();
    camera.fov = camHome.fov;
    camera.aspect = w / h;
    camera.position.y = camHome.y;
    camera.position.z = camHome.z;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  sizeRenderer();
  window.addEventListener('resize', sizeRenderer);

  function setPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function dishName(data) {
    const lang = window.currentLang || 'ru';
    return data.name?.[lang] || data.name?.ru || '';
  }

  wrap.addEventListener('pointerdown', (event) => {
    dragging = true;
    dragDelta = 0;
    lastX = event.clientX;
    wrap.setPointerCapture(event.pointerId);
  });
  wrap.addEventListener('pointerup', () => { dragging = false; });
  wrap.addEventListener('pointercancel', () => { dragging = false; });

  wrap.addEventListener('pointermove', (event) => {
    if (dragging) {
      const dx = event.clientX - lastX;
      dragRot += dx * 0.005;
      dragDelta += Math.abs(dx);
      lastX = event.clientX;
      return;
    }
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(dishPick, true)[0];
    const next = findDishGroup(hit?.object);
    if (hovered === next) return;
    if (hovered) {
      gsap.to(hovered.position, { y: hovered.userData.baseY, duration: 0.4, ease: 'power3.out' });
    }
    hovered = next;
    if (hovered) {
      gsap.to(hovered.position, { y: hovered.userData.baseY + 0.12, duration: 0.4, ease: 'power3.out' });
      if (caption) {
        caption.textContent = dishName(hovered.userData);
        caption.classList.add('show');
      }
    } else if (caption) {
      caption.classList.remove('show');
    }
  });

  wrap.addEventListener('pointerleave', () => {
    dragging = false;
    if (hovered) gsap.to(hovered.position, { y: hovered.userData.baseY, duration: 0.4, ease: 'power3.out' });
    hovered = null;
    caption?.classList.remove('show');
  });

  wrap.addEventListener('click', (event) => {
    if (dragDelta > 22) return;
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(dishPick, true);
    const group = findDishGroup(hits[0]?.object);
    if (!group) return;
    if (!group.userData.opened) {
      setClocheOpen(group, true);
      return;
    }
    const foodHit = hits.find((item) => {
      const owner = findDishGroup(item.object);
      return owner === group && !hitIsCloche(item.object);
    });
    if (foodHit && typeof window.openDishHistoryModal === 'function') {
      window.openDishHistoryModal(group.userData.id);
      return;
    }
    if (hits.some((item) => findDishGroup(item.object) === group && hitIsCloche(item.object))) {
      setClocheOpen(group, false);
    }
  });

  const scrollRoot = document.getElementById('tableScroll');
  function scrollSpin() {
    if (!scrollRoot) return 0;
    const rect = scrollRoot.getBoundingClientRect();
    const total = Math.max(scrollRoot.offsetHeight - window.innerHeight, 1);
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    return (scrolled / total) * 0.4;
  }

  renderer.setAnimationLoop(() => {
    autoRot += 0.0014;
    tableGroup.rotation.y = autoRot + dragRot + scrollSpin();
    camera.lookAt(0, 0.05, 0);
    renderer.render(scene, camera);
  });

  window.updateDastarkhanLabels = () => {
    if (hovered && caption) caption.textContent = dishName(hovered.userData);
  };
}
