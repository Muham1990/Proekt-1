import * as THREE from 'three';
import { gsap } from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDishModel, DISH_ORDER } from './dishes3d.js?v=dish-show4';

function isLightTheme() {
  return document.documentElement.classList.contains('theme-light');
}

function dishLabel(data, lang) {
  return data?.name?.[lang] || data?.name?.ru || '';
}

function dishDesc(data, lang) {
  return data?.desc?.[lang] || data?.desc?.ru || '';
}

export async function initDastarkhan() {
  const canvas = document.getElementById('dastarkhanCanvas');
  const wrap = document.getElementById('tablePerspective');
  const caption = document.getElementById('tableCaption');
  const fallback = document.getElementById('tableFallback');
  const prevBtn = document.getElementById('dishPrev');
  const nextBtn = document.getElementById('dishNext');
  const dotsRoot = document.getElementById('dishDots');
  if (!canvas || !wrap) return;

  const glOk = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  })();
  if (!glOk) {
    fallback?.removeAttribute('hidden');
    canvas.classList.add('is-hidden');
    throw new Error('WebGL unavailable');
  }

  const catalog = Array.isArray(window.DISHES) ? window.DISHES : [];
  const slides = DISH_ORDER.map((id) => catalog.find((d) => d.id === id) || { id, name: { ru: id }, desc: { ru: '' } });
  if (!slides.length) return;

  const mobile = window.matchMedia('(max-width: 768px)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const quality = mobile || cores <= 4 ? 'low' : (window.devicePixelRatio > 2 ? 'medium' : 'high');
  window.setDastarkhanProgress?.(22);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x100c08, 0.045);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 1.55, 2.55);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality === 'high',
    alpha: false,
    preserveDrawingBuffer: true,
    powerPreference: mobile ? 'low-power' : 'high-performance'
  });
  renderer.setClearColor(0x100c08, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'low' ? 1.2 : quality === 'medium' ? 1.5 : 2));
  renderer.shadowMap.enabled = quality !== 'low';
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;

  const ambient = new THREE.AmbientLight(0x4a3424, 0.55);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0xffe6c4, 0x1a0c08, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffe1b0, 1.45);
  key.position.set(2.2, 4.4, 2.4);
  key.castShadow = quality !== 'low';
  key.shadow.mapSize.set(quality === 'high' ? 1024 : 512, quality === 'high' ? 1024 : 512);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffc478, 0.7);
  rim.position.set(-2.4, 2.2, -1.6);
  scene.add(rim);
  const lantern = new THREE.PointLight(0xff9a52, 6.5, 8, 1.6);
  lantern.position.set(0, 2.4, 0.4);
  scene.add(lantern);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 64),
    new THREE.MeshStandardMaterial({ color: 0x140c08, roughness: 0.92, metalness: 0.02 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const cloth = new THREE.Mesh(
    new THREE.CircleGeometry(0.92, 64),
    new THREE.MeshStandardMaterial({ color: 0x1a0808, roughness: 0.9, metalness: 0.02 })
  );
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.005;
  cloth.receiveShadow = true;
  scene.add(cloth);

  for (let i = 0; i < 3; i++) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffc070 })
    );
    const a = (i / 3) * Math.PI * 2;
    glow.position.set(Math.cos(a) * 1.7, 1.55, Math.sin(a) * 1.4 - 0.4);
    scene.add(glow);
    const lamp = new THREE.PointLight(0xffb060, 2.2, 5, 2);
    lamp.position.copy(glow.position);
    scene.add(lamp);
  }

  const stage = new THREE.Group();
  scene.add(stage);

  const models = slides.map((dish, i) => {
    window.setDastarkhanProgress?.(24 + Math.round((i / slides.length) * 60));
    const model = buildDishModel(dish.id);
    model.userData.dish = dish;
    model.position.set(0, 0.02, 0);
    model.scale.setScalar(1.42);
    model.visible = i === 0;
    stage.add(model);
    return model;
  });

  window.setDastarkhanProgress?.(90);

  let index = 0;
  let busy = false;
  let dragRot = 0;
  let vel = 0;
  let dragging = false;
  let lastX = 0;
  let pressX = 0;
  let pressY = 0;
  let visible = true;
  const look = new THREE.Vector3(0, 0.28, 0);

  function applyTheme() {
    const light = isLightTheme();
    const bg = light ? 0xefe6d4 : 0x100c08;
    scene.background = new THREE.Color(bg);
    scene.fog.color.set(bg);
    ambient.intensity = light ? 0.9 : 0.55;
    key.intensity = light ? 1.05 : 1.45;
    lantern.intensity = light ? 3.2 : 6.5;
    renderer.toneMappingExposure = light ? 0.92 : 1.05;
    floor.material.color.set(light ? 0xc45a42 : 0x140c08);
    cloth.material.color.set(light ? 0xb42318 : 0x1a0808);
  }
  applyTheme();
  window.addEventListener('plovtg-theme', applyTheme);

  function sizeRenderer() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.fov = w < 700 ? 36 : 32;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  sizeRenderer();
  window.addEventListener('resize', sizeRenderer);

  function priceText(dish) {
    if (dish.price == null) return '';
    return `${dish.price} ${window.currentLang === 'en' ? 'TJS' : 'сомони'}`;
  }

  function updateCaption() {
    if (!caption) return;
    const lang = window.currentLang || 'ru';
    const dish = slides[index];
    const name = dishLabel(dish, lang);
    const desc = dishDesc(dish, lang);
    const price = priceText(dish);
    caption.innerHTML = `<strong>${name}</strong>${desc ? `<span>${desc}</span>` : ''}${price ? `<span>${price}</span>` : ''}`;
    caption.classList.add('show');
    canvas.setAttribute('aria-label', name);
  }

  function updateDots() {
    if (!dotsRoot) return;
    [...dotsRoot.children].forEach((btn, i) => {
      btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
      btn.classList.toggle('is-active', i === index);
    });
  }

  if (dotsRoot) {
    dotsRoot.innerHTML = '';
    slides.forEach((dish, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dish-dot';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', dishLabel(dish, window.currentLang || 'ru'));
      btn.addEventListener('click', () => goTo(i));
      dotsRoot.appendChild(btn);
    });
  }

  function goTo(next, dirHint) {
    if (busy || next === index) return;
    const total = slides.length;
    next = ((next % total) + total) % total;
    const dir = dirHint ?? (next > index ? 1 : -1);
    const outgoing = models[index];
    const incoming = models[next];
    busy = true;
    incoming.visible = true;
    incoming.position.x = dir * 2.8;
    incoming.rotation.y = dir * 0.7;
    incoming.scale.setScalar(0.42);
    dragRot = 0;
    vel = 0;

    const dur = reduce ? 0.01 : 0.9;
    const tl = gsap.timeline({
      defaults: { duration: dur, ease: 'power3.inOut' },
      onComplete: () => {
        outgoing.visible = false;
        outgoing.position.set(0, 0.02, 0);
        outgoing.rotation.y = 0;
        outgoing.scale.setScalar(1.42);
        incoming.position.set(0, 0.02, 0);
        incoming.scale.setScalar(1.42);
        index = next;
        busy = false;
        updateCaption();
        updateDots();
      }
    });
    tl.to(outgoing.position, { x: -dir * 2.8 }, 0)
      .to(outgoing.rotation, { y: `-=${dir * 1.05}` }, 0)
      .to(outgoing.scale, { x: 0.42, y: 0.42, z: 0.42 }, 0)
      .to(incoming.position, { x: 0 }, 0)
      .to(incoming.rotation, { y: 0 }, 0)
      .to(incoming.scale, { x: 1.42, y: 1.42, z: 1.42 }, 0);

    if (caption && !reduce) {
      gsap.fromTo(caption, { autoAlpha: 0.2, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, delay: 0.18, ease: 'power2.out' });
    }
  }

  function step(dir) {
    goTo(index + dir, dir);
  }

  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  wrap.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
  });

  document.addEventListener('keydown', (event) => {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const rect = wrap.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.72 && rect.bottom > 80;
    if (!inView) return;
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });

  wrap.tabIndex = 0;
  canvas.style.touchAction = 'pan-y';
  wrap.style.touchAction = 'manipulation';

  canvas.addEventListener('pointerdown', (event) => {
    dragging = false;
    pressX = lastX = event.clientX;
    pressY = event.clientY;
    vel = 0;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (event.buttons === 0 && event.pointerType !== 'touch') return;
    const dx = event.clientX - pressX;
    const dy = event.clientY - pressY;
    if (Math.hypot(dx, dy) > 8 && Math.abs(dx) >= Math.abs(dy)) {
      dragging = true;
      const delta = (event.clientX - lastX) * 0.01;
      dragRot += delta;
      vel = delta;
      lastX = event.clientX;
    }
  });
  canvas.addEventListener('pointerup', (event) => {
    if (dragging && Math.abs(event.clientX - pressX) > 140 && Math.abs(vel) > 0.04) {
      step(event.clientX - pressX > 0 ? -1 : 1);
    }
    dragging = false;
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; });

  gsap.fromTo(camera.position, { y: 2.4, z: 3.6 }, {
    y: 1.55,
    z: 2.55,
    duration: reduce ? 0.01 : 1.5,
    ease: 'power3.inOut',
    onUpdate: () => camera.lookAt(look)
  });
  camera.lookAt(look);

  if (!reduce) {
    gsap.from(models[0].scale, { x: 0.2, y: 0.2, z: 0.2, duration: 1.1, ease: 'back.out(1.4)' });
    gsap.from(models[0].rotation, { y: -0.8, duration: 1.2, ease: 'power3.out' });
  }

  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
  }, { threshold: 0.08 });
  observer.observe(wrap);

  updateCaption();
  updateDots();

  renderer.setAnimationLoop(() => {
    if (!visible) return;
    if (!dragging) {
      vel *= 0.94;
      if (Math.abs(vel) < 0.00008) vel = 0;
      dragRot += vel;
      if (!busy && !reduce) dragRot += 0.0032;
    }
    const current = models[index];
    if (current && !busy) current.rotation.y = dragRot;
    lantern.intensity = (isLightTheme() ? 3.2 : 6.5) + Math.sin(performance.now() * 0.0016) * 0.35;
    camera.lookAt(look);
    renderer.render(scene, camera);
  });

  window.updateDastarkhanLabels = () => {
    updateCaption();
    if (dotsRoot) {
      [...dotsRoot.children].forEach((btn, i) => {
        btn.setAttribute('aria-label', dishLabel(slides[i], window.currentLang || 'ru'));
      });
    }
  };
}
