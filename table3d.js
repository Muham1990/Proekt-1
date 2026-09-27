import * as THREE from 'three';
import { gsap } from 'gsap';
import { buildDishModel } from './dishes3d.js';

const WOOD_URL = 'https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=1600&q=80';

function findDishGroup(obj) {
  while (obj) {
    if (obj.userData?.id) return obj;
    obj = obj.parent;
  }
  return null;
}

function loadTexture(url) {
  return new Promise((resolve) => {
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

export async function initDastarkhan() {
  const canvas = document.getElementById('dastarkhanCanvas');
  const wrap = document.getElementById('tablePerspective');
  const caption = document.getElementById('tableCaption');
  if (!canvas || !wrap || !window.DISHES?.length) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
  camera.position.set(0, 5.1, 7.6);
  camera.lookAt(0, 0.35, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.AmbientLight(0x4a3420, 0.7);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffd9a0, 2.2);
  key.position.set(6, 12, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.PointLight(0xff9a52, 18, 18, 1.6);
  fill.position.set(0, 4.2, 0);
  scene.add(fill);
  const rim = new THREE.PointLight(0xd9b56a, 10, 16, 2);
  rim.position.set(-5, 3, -4);
  scene.add(rim);

  const tableGroup = new THREE.Group();
  scene.add(tableGroup);

  const carpet = new THREE.Mesh(
    new THREE.CircleGeometry(7.4, 72),
    new THREE.MeshStandardMaterial({ color: 0x2a120c, roughness: 0.92, metalness: 0.04 })
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.y = -1.35;
  carpet.receiveShadow = true;
  scene.add(carpet);

  const woodTex = await loadTexture(WOOD_URL);
  if (woodTex) {
    woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(2.2, 2.2);
  }

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0xc0894a,
    map: woodTex,
    roughness: 0.42,
    metalness: 0.08
  });

  const top = new THREE.Mesh(new THREE.CylinderGeometry(4.35, 4.35, 0.22, 80), woodMat);
  top.receiveShadow = true;
  top.castShadow = true;
  tableGroup.add(top);

  const rimGold = new THREE.Mesh(
    new THREE.TorusGeometry(4.38, 0.07, 16, 90),
    new THREE.MeshStandardMaterial({ color: 0xd9b56a, metalness: 0.85, roughness: 0.22 })
  );
  rimGold.rotation.x = Math.PI / 2;
  rimGold.position.y = 0.12;
  tableGroup.add(rimGold);

  const innerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.03, 12, 64),
    new THREE.MeshStandardMaterial({ color: 0xf3d99c, metalness: 0.7, roughness: 0.3 })
  );
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.13;
  tableGroup.add(innerRing);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 1.35, 12),
      new THREE.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.7 })
    );
    leg.position.set(Math.cos(a) * 3.1, -0.78, Math.sin(a) * 3.1);
    leg.castShadow = true;
    tableGroup.add(leg);
  }

  const dishPick = [];
  const count = window.DISHES.length;
  const radius = 2.55;

  window.DISHES.forEach((dish, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const group = new THREE.Group();
    group.position.set(Math.cos(angle) * radius, 0.2, Math.sin(angle) * radius);
    group.userData = { id: dish.id, baseY: 0.2, name: dish.name };

    const food = buildDishModel(dish.id);
    food.userData = group.userData;
    group.add(food);

    tableGroup.add(group);
    dishPick.push(group);
    group.scale.set(0.01, 0.01, 0.01);
    gsap.to(group.scale, {
      x: 1, y: 1, z: 1,
      delay: 0.05 * i,
      duration: 0.7,
      ease: 'back.out(1.7)'
    });
  });

  const emberGeo = new THREE.BufferGeometry();
  const emberCount = 80;
  const positions = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const embers = new THREE.Points(
    emberGeo,
    new THREE.PointsMaterial({ color: 0xff9a52, size: 0.05, transparent: true, opacity: 0.55 })
  );
  scene.add(embers);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  let autoRot = 0;

  function sizeRenderer() {
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
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

  wrap.addEventListener('pointermove', (event) => {
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(dishPick, true)[0];
    const next = findDishGroup(hit?.object);
    if (hovered === next) return;
    if (hovered) gsap.to(hovered.position, { y: hovered.userData.baseY, duration: 0.35, ease: 'power2.out' });
    hovered = next;
    if (hovered) {
      gsap.to(hovered.position, { y: hovered.userData.baseY + 0.62, duration: 0.35, ease: 'power2.out' });
      if (caption) {
        caption.textContent = dishName(hovered.userData);
        caption.classList.add('show');
      }
    } else if (caption) {
      caption.classList.remove('show');
    }
  });

  wrap.addEventListener('pointerleave', () => {
    if (hovered) gsap.to(hovered.position, { y: hovered.userData.baseY, duration: 0.35 });
    hovered = null;
    caption?.classList.remove('show');
  });

  wrap.addEventListener('click', (event) => {
    setPointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(dishPick, true)[0];
    const group = findDishGroup(hit?.object);
    if (group?.userData?.id && typeof window.openDishHistoryModal === 'function') {
      window.openDishHistoryModal(group.userData.id);
    }
  });

  const scrollRoot = document.getElementById('tableScroll');
  function scrollSpin() {
    if (!scrollRoot) return 0;
    const rect = scrollRoot.getBoundingClientRect();
    const total = scrollRoot.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    return total > 0 ? (scrolled / total) * Math.PI : 0;
  }

  renderer.setAnimationLoop(() => {
    autoRot += 0.0032;
    tableGroup.rotation.y = autoRot + scrollSpin();
    const pos = embers.geometry.attributes.position;
    for (let i = 0; i < emberCount; i++) {
      pos.array[i * 3 + 1] += 0.012;
      if (pos.array[i * 3 + 1] > 6.5) pos.array[i * 3 + 1] = 0;
    }
    pos.needsUpdate = true;
    renderer.render(scene, camera);
  });

  window.updateDastarkhanLabels = () => {
    if (hovered && caption) caption.textContent = dishName(hovered.userData);
  };
}
