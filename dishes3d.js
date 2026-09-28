import * as THREE from 'three';

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function std(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.04,
    envMapIntensity: 0.55,
    ...extras
  });
}

function physical(color, extras = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.35,
    metalness: 0.05,
    envMapIntensity: 0.7,
    ...extras
  });
}

function mesh(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function noiseCanvas(size, paint) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  paint(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

const riceMap = noiseCanvas(256, (ctx, size) => {
  ctx.fillStyle = '#d7a43a';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 3 ? '#e8bf55' : '#c48928';
    ctx.fillRect(Math.random() * size, Math.random() * size, 3 + Math.random() * 5, 1.2);
  }
});

const meatMap = noiseCanvas(128, (ctx, size) => {
  ctx.fillStyle = '#5a2e18';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 220; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#7a4020' : '#3a1c10';
    ctx.beginPath();
    ctx.ellipse(Math.random() * size, Math.random() * size, 4 + Math.random() * 10, 2 + Math.random() * 5, Math.random(), 0, Math.PI * 2);
    ctx.fill();
  }
});

const doughMap = noiseCanvas(128, (ctx, size) => {
  ctx.fillStyle = '#e8d2a8';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#f3e2c0' : '#d4b887';
    ctx.fillRect(Math.random() * size, Math.random() * size, 6, 3);
  }
});

function brassMat() {
  return physical(0xc9a24a, {
    metalness: 0.88,
    roughness: 0.22,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.2
  });
}

function brassLagan(radius = 0.7) {
  const g = new THREE.Group();
  const brass = brassMat();
  const inner = physical(0xa87828, { metalness: 0.72, roughness: 0.36, envMapIntensity: 0.9 });
  const floor = mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 0.94, 0.038, 72), inner);
  floor.position.y = 0.02;
  g.add(floor);
  const pts = [
    new THREE.Vector2(radius * 0.88, 0.03),
    new THREE.Vector2(radius * 1.02, 0.045),
    new THREE.Vector2(radius * 1.08, 0.11),
    new THREE.Vector2(radius * 1.0, 0.15),
    new THREE.Vector2(radius * 0.97, 0.13)
  ];
  g.add(mesh(new THREE.LatheGeometry(pts, 72), brass));
  const rim = mesh(
    new THREE.TorusGeometry(radius * 1.01, 0.014, 10, 72),
    physical(0xe0c36a, { metalness: 0.92, roughness: 0.16 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.14;
  g.add(rim);
  return g;
}

function ceramicPlate(radius = 0.52, color = 0xf3ead8) {
  const g = new THREE.Group();
  const dish = mesh(
    new THREE.CylinderGeometry(radius * 0.9, radius, 0.048, 56),
    physical(color, { roughness: 0.28, clearcoat: 0.5, clearcoatRoughness: 0.3 })
  );
  dish.position.y = 0.03;
  g.add(dish);
  const ring = mesh(
    new THREE.TorusGeometry(radius * 0.94, 0.016, 10, 48),
    std(0x2c4a72, { roughness: 0.38, metalness: 0.18 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.052;
  g.add(ring);
  return g;
}

function patternedBowl(radius = 0.48) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.05, 0),
    new THREE.Vector2(radius * 0.9, 0.02),
    new THREE.Vector2(radius, 0.16),
    new THREE.Vector2(radius * 0.86, 0.3)
  ];
  g.add(mesh(new THREE.LatheGeometry(pts, 48), physical(0xf2ebe0, { roughness: 0.32, clearcoat: 0.25 })));
  const rim = mesh(
    new THREE.TorusGeometry(radius * 0.86, 0.015, 8, 40),
    std(0x2a4a70, { roughness: 0.4, metalness: 0.12 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.29;
  g.add(rim);
  return g;
}

function garlicHead() {
  const g = new THREE.Group();
  const bulb = mesh(new THREE.SphereGeometry(0.058, 18, 14), std(0xf4efe6, { roughness: 0.58 }));
  bulb.scale.set(1, 0.88, 1);
  bulb.position.y = 0.04;
  g.add(bulb);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const clove = mesh(new THREE.SphereGeometry(0.022, 10, 8), std(0xeee6d8, { roughness: 0.5 }));
    clove.position.set(Math.cos(a) * 0.038, 0.07, Math.sin(a) * 0.038);
    g.add(clove);
  }
  const stem = mesh(new THREE.CylinderGeometry(0.006, 0.012, 0.03, 8), std(0xe8e0d2));
  stem.position.y = 0.1;
  g.add(stem);
  return g;
}

function scatterInstanced(geo, material, count, place) {
  const inst = new THREE.InstancedMesh(geo, material, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    place(dummy, i);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.castShadow = true;
  inst.receiveShadow = true;
  return inst;
}

function plov() {
  const g = brassLagan(0.72);
  const rand = rng(42);
  const riceMat = std(0xe0b24a, { map: riceMap, roughness: 0.62, envMapIntensity: 0.25 });
  const mound = mesh(
    new THREE.SphereGeometry(0.46, 48, 28, 0, Math.PI * 2, 0, Math.PI / 2.08),
    riceMat
  );
  mound.scale.set(1, 0.46, 1);
  mound.position.y = 0.06;
  g.add(mound);

  const grainGeo = new THREE.SphereGeometry(0.01, 5, 4);
  grainGeo.scale(2.1, 0.42, 0.7);
  g.add(scatterInstanced(grainGeo, riceMat, 260, (dummy) => {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * 0.4;
    const dome = Math.sqrt(Math.max(0, 0.42 * 0.42 - r * r)) * 0.5;
    dummy.position.set(Math.cos(a) * r, 0.07 + dome, Math.sin(a) * r);
    dummy.rotation.set(0.15, a, rand() * 0.6);
    dummy.scale.setScalar(0.55 + rand() * 0.4);
  }));

  const meatMat = std(0x8a4a24, { map: meatMap, roughness: 0.62 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.18;
    const r = 0.22;
    const dome = Math.sqrt(Math.max(0, 0.42 * 0.42 - r * r)) * 0.5;
    const meat = mesh(new THREE.SphereGeometry(0.055, 10, 8), meatMat);
    meat.scale.set(1.35, 0.7, 1.05);
    meat.position.set(Math.cos(a) * r, 0.1 + dome, Math.sin(a) * r);
    meat.rotation.set(0.2, a, 0.15);
    g.add(meat);
  }

  const carrotMat = std(0xe67a22, { roughness: 0.48 });
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.08 + rand() * 0.26;
    const dome = Math.sqrt(Math.max(0, 0.42 * 0.42 - r * r)) * 0.5;
    const carrot = mesh(new THREE.BoxGeometry(0.1, 0.01, 0.014), carrotMat);
    carrot.position.set(Math.cos(a) * r, 0.085 + dome, Math.sin(a) * r);
    carrot.rotation.set(0.05, a + 0.5, 0.2);
    g.add(carrot);
  }

  const chickMat = std(0xc9a066, { roughness: 0.55 });
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2;
    const pea = mesh(new THREE.SphereGeometry(0.022, 10, 8), chickMat);
    pea.scale.set(1, 0.82, 1);
    const r = 0.14 + rand() * 0.2;
    const dome = Math.sqrt(Math.max(0, 0.42 * 0.42 - r * r)) * 0.5;
    pea.position.set(Math.cos(a) * r, 0.09 + dome, Math.sin(a) * r);
    g.add(pea);
  }

  const berryMat = std(0x6a1210, { roughness: 0.45 });
  for (let i = 0; i < 22; i++) {
    const a = rand() * Math.PI * 2;
    const berry = mesh(new THREE.SphereGeometry(0.01, 6, 6), berryMat);
    const r = 0.08 + rand() * 0.28;
    const dome = Math.sqrt(Math.max(0, 0.42 * 0.42 - r * r)) * 0.5;
    berry.position.set(Math.cos(a) * r, 0.09 + dome, Math.sin(a) * r);
    g.add(berry);
  }

  const garlic = garlicHead();
  garlic.position.y = 0.22;
  garlic.scale.setScalar(1.05);
  g.add(garlic);
  return g;
}

function mantiDumpling(open, seed) {
  const g = new THREE.Group();
  const dough = std(0xe9d6b4, { map: doughMap, roughness: 0.4 });
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.12, 0.012),
    new THREE.Vector2(0.15, 0.055),
    new THREE.Vector2(0.13, 0.11),
    new THREE.Vector2(0.06, 0.155),
    new THREE.Vector2(0.022, 0.19),
    new THREE.Vector2(0.008, 0.22)
  ];
  g.add(mesh(new THREE.LatheGeometry(pts, 32), dough));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const pleat = mesh(new THREE.BoxGeometry(0.01, 0.045, 0.008), dough);
    pleat.position.set(Math.cos(a) * 0.034, 0.17, Math.sin(a) * 0.034);
    pleat.rotation.y = a;
    pleat.rotation.z = 0.4;
    g.add(pleat);
  }
  const knot = mesh(new THREE.SphereGeometry(0.016, 10, 8), dough);
  knot.position.y = 0.228;
  g.add(knot);
  if (open) {
    const filling = mesh(
      new THREE.SphereGeometry(0.075, 16, 12, 0, Math.PI),
      std(0x6a4424, { map: meatMap, roughness: 0.72 })
    );
    filling.rotation.y = Math.PI / 2;
    filling.position.set(0.03, 0.09, 0);
    g.add(filling);
  }
  g.rotation.y = seed;
  return g;
}

function manti() {
  const g = brassLagan(0.74);
  const spots = [
    [0.22, 0.14, false], [0.02, 0.26, false], [-0.22, 0.14, false],
    [-0.24, -0.1, false], [0.24, -0.1, false], [0.04, -0.24, true],
    [-0.02, 0.02, false]
  ];
  spots.forEach(([x, z, open], i) => {
    const d = mantiDumpling(open, i * 0.5);
    d.position.set(x, 0.05, z);
    d.scale.setScalar(0.92);
    g.add(d);
  });
  const cup = mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.062, 22), physical(0x2a3d55, { roughness: 0.3 }));
  cup.position.set(0.32, 0.09, 0.22);
  g.add(cup);
  const cream = mesh(
    new THREE.SphereGeometry(0.07, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    physical(0xfff8f0, { roughness: 0.18, clearcoat: 0.4 })
  );
  cream.position.set(0.32, 0.1, 0.22);
  g.add(cream);
  const herb = std(0x3d7a3a, { roughness: 0.7 });
  for (let i = 0; i < 10; i++) {
    const leaf = mesh(new THREE.BoxGeometry(0.03, 0.002, 0.01), herb);
    leaf.position.set((Math.random() - 0.5) * 0.4, 0.08, (Math.random() - 0.5) * 0.4);
    leaf.rotation.y = Math.random() * 3;
    g.add(leaf);
  }
  return g;
}

function kurutob() {
  const g = brassLagan(0.7);
  const bowl = patternedBowl(0.52);
  bowl.position.y = 0.04;
  g.add(bowl);
  const fatirMat = std(0xe0b15a, { map: doughMap, roughness: 0.55 });
  for (let i = 0; i < 16; i++) {
    const chip = mesh(new THREE.BoxGeometry(0.16, 0.014, 0.11), fatirMat);
    const a = Math.random() * Math.PI * 2;
    chip.position.set(Math.cos(a) * 0.18, 0.24 + Math.random() * 0.05, Math.sin(a) * 0.18);
    chip.rotation.set(0.25, a, 0.4);
    g.add(chip);
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const tomato = mesh(new THREE.SphereGeometry(0.032, 12, 10), std(0xc0392b, { roughness: 0.42 }));
    tomato.position.set(Math.cos(a) * 0.2, 0.28, Math.sin(a) * 0.2);
    g.add(tomato);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    const cukes = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 10), std(0x6aa84f));
    cukes.rotation.z = 0.8;
    cukes.position.set(Math.cos(a) * 0.12, 0.27, Math.sin(a) * 0.12);
    g.add(cukes);
  }
  for (let i = 0; i < 12; i++) {
    const crumb = mesh(new THREE.SphereGeometry(0.02, 8, 8), std(0xf7f4ee, { roughness: 0.35 }));
    crumb.position.set((Math.random() - 0.5) * 0.3, 0.27, (Math.random() - 0.5) * 0.3);
    g.add(crumb);
  }
  const oil = mesh(
    new THREE.CircleGeometry(0.16, 28),
    physical(0xc9a24a, { roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.45 })
  );
  oil.rotation.x = -Math.PI / 2;
  oil.position.y = 0.255;
  g.add(oil);
  return g;
}

function skewerRod(len = 0.95) {
  const rod = mesh(
    new THREE.CylinderGeometry(0.01, 0.01, len, 10),
    physical(0xb8bec4, { metalness: 0.9, roughness: 0.16 })
  );
  rod.rotation.z = Math.PI / 2;
  rod.position.y = 0.16;
  return rod;
}

function shashlik() {
  const g = brassLagan(0.72);
  const meatMat = std(0x7a4a28, { map: meatMap, roughness: 0.52 });
  const char = std(0x2a1810, { roughness: 0.85 });
  for (let s = 0; s < 3; s++) {
    const row = new THREE.Group();
    row.position.set(0, 0.04, (s - 1) * 0.16);
    row.rotation.y = 0.08 * (s - 1);
    row.add(skewerRod(0.96));
    for (let i = 0; i < 4; i++) {
      const cube = mesh(new THREE.BoxGeometry(0.14, 0.12, 0.125), meatMat);
      cube.position.set(-0.3 + i * 0.2, 0.16, 0);
      cube.rotation.y = 0.14 * i;
      cube.scale.set(1, 0.9 + (i % 2) * 0.12, 1);
      row.add(cube);
      const mark = mesh(new THREE.BoxGeometry(0.13, 0.004, 0.012), char);
      mark.position.set(-0.3 + i * 0.2, 0.22, 0);
      row.add(mark);
    }
    g.add(row);
  }
  for (let i = 0; i < 5; i++) {
    const onion = mesh(new THREE.TorusGeometry(0.042, 0.01, 8, 16), std(0xf3d9b0));
    onion.position.set(-0.22 + i * 0.11, 0.08, 0.28);
    onion.rotation.x = Math.PI / 2;
    g.add(onion);
  }
  return g;
}

function kabob() {
  const g = brassLagan(0.7);
  const meat = std(0x6e3a1c, { map: meatMap, roughness: 0.6 });
  const char = std(0x2a1810, { roughness: 0.8 });
  for (let s = 0; s < 3; s++) {
    const row = new THREE.Group();
    row.position.set(0, 0.04, (s - 1) * 0.15);
    row.add(skewerRod(0.9));
    for (let i = 0; i < 3; i++) {
      const patty = mesh(new THREE.CylinderGeometry(0.058, 0.064, 0.17, 16), meat);
      patty.rotation.z = Math.PI / 2;
      patty.scale.set(1, 1, 0.74);
      patty.position.set(-0.24 + i * 0.24, 0.155, 0);
      row.add(patty);
      const mark = mesh(new THREE.BoxGeometry(0.16, 0.004, 0.012), char);
      mark.position.set(-0.24 + i * 0.24, 0.2, 0);
      row.add(mark);
    }
    g.add(row);
  }
  for (let i = 0; i < 5; i++) {
    const onion = mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 14), std(0xf3d9b0));
    onion.position.set(-0.2 + i * 0.1, 0.08, 0.26);
    onion.rotation.x = Math.PI / 2;
    g.add(onion);
  }
  return g;
}

export function makeCloche(radius = 0.46) {
  const g = new THREE.Group();
  const domeGeo = new THREE.SphereGeometry(radius, 36, 20, 0, Math.PI * 2, 0, Math.PI / 2.02);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xc9d2d8,
    metalness: 0.88,
    roughness: 0.32,
    envMapIntensity: 1,
    transparent: false,
    opacity: 1,
    side: THREE.DoubleSide
  });
  const glass = mesh(domeGeo, glassMat);
  glass.position.y = 0.07;
  g.add(glass);
  const liner = mesh(
    new THREE.SphereGeometry(radius * 0.965, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2.02),
    std(0x9aa4ac, { metalness: 0.7, roughness: 0.45, side: THREE.BackSide })
  );
  liner.position.y = 0.07;
  g.add(liner);
  const band = mesh(
    new THREE.TorusGeometry(radius * 0.98, 0.018, 10, 36),
    std(0xb8c2ca, { metalness: 0.9, roughness: 0.18 })
  );
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.075;
  g.add(band);
  const stem = mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.06, 10), std(0xb8c2ca, { metalness: 0.88 }));
  stem.position.y = 0.54;
  g.add(stem);
  const knob = mesh(new THREE.SphereGeometry(0.032, 12, 10), std(0xd0d6dc, { metalness: 0.92, roughness: 0.16 }));
  knob.position.y = 0.58;
  g.add(knob);
  g.userData.cloche = true;
  g.userData.glassMat = glassMat;
  g.userData.glass = glass;
  g.userData.liner = liner;
  return g;
}

function samsaPiece(open = false) {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.22);
  shape.lineTo(-0.2, -0.15);
  shape.lineTo(0.2, -0.15);
  shape.closePath();
  const pastry = mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4
    }),
    std(0xe8b85a, { map: doughMap, roughness: 0.46 })
  );
  pastry.rotation.x = -Math.PI / 2;
  pastry.position.y = 0.04;
  g.add(pastry);
  if (open) {
    const filling = mesh(new THREE.SphereGeometry(0.065, 12, 10, 0, Math.PI), std(0x6a4424, { map: meatMap }));
    filling.rotation.x = Math.PI / 2;
    filling.position.set(-0.02, 0.08, 0.02);
    g.add(filling);
  }
  return g;
}

function samsa() {
  const g = brassLagan(0.66);
  [[0.05, 0.06, 0.04, 0.12], [-0.18, 0.06, -0.08, 0.75], [0.16, 0.06, -0.12, -0.5]].forEach(([x, y, z, rot], i) => {
    const p = samsaPiece(i === 2);
    p.position.set(x, y, z);
    p.rotation.y = rot;
    p.scale.setScalar(0.95);
    g.add(p);
  });
  const sesame = scatterInstanced(new THREE.SphereGeometry(0.006, 5, 4), std(0x2a2118), 40, (dummy) => {
    dummy.position.set((Math.random() - 0.5) * 0.45, 0.13, (Math.random() - 0.5) * 0.45);
  });
  g.add(sesame);
  return g;
}

function oshi() {
  const g = brassLagan(0.64);
  const bowl = patternedBowl(0.5);
  bowl.position.y = 0.04;
  g.add(bowl);
  const broth = mesh(
    new THREE.CircleGeometry(0.36, 36),
    physical(0xc8893a, { roughness: 0.18, metalness: 0.04 })
  );
  broth.rotation.x = -Math.PI / 2;
  broth.position.y = 0.22;
  g.add(broth);
  const noodleMat = std(0xe8c98a, { roughness: 0.45 });
  for (let i = 0; i < 12; i++) {
    const noodle = mesh(new THREE.TorusGeometry(0.07 + (i % 4) * 0.018, 0.011, 6, 20), noodleMat);
    noodle.position.set((i % 4 - 1.5) * 0.07, 0.25, (Math.floor(i / 4) - 1) * 0.07);
    noodle.rotation.set(0.95, i * 0.35, 0.25);
    g.add(noodle);
  }
  for (let i = 0; i < 5; i++) {
    const meat = mesh(new THREE.BoxGeometry(0.06, 0.03, 0.05), std(0x6a3a1c, { map: meatMap }));
    meat.position.set((i - 2) * 0.08, 0.26, 0.08);
    g.add(meat);
  }
  return g;
}

function fatir() {
  const g = brassLagan(0.68);
  const loaf = mesh(
    new THREE.CylinderGeometry(0.4, 0.42, 0.075, 48),
    std(0xe0b15a, { map: doughMap, roughness: 0.5 })
  );
  loaf.position.y = 0.1;
  g.add(loaf);
  const top = mesh(
    new THREE.TorusGeometry(0.22, 0.018, 8, 40),
    std(0xc99440, { roughness: 0.48 })
  );
  top.rotation.x = Math.PI / 2;
  top.position.y = 0.14;
  g.add(top);
  g.add(scatterInstanced(new THREE.SphereGeometry(0.007, 5, 4), std(0x2a2118), 48, (dummy) => {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.32;
    dummy.position.set(Math.cos(a) * r, 0.145, Math.sin(a) * r);
  }));
  return g;
}

function halisa() {
  const g = brassLagan(0.58);
  const bowl = patternedBowl(0.44);
  bowl.position.y = 0.04;
  g.add(bowl);
  const pud = mesh(
    new THREE.SphereGeometry(0.32, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2.08),
    physical(0xe0b020, { roughness: 0.28, clearcoat: 0.35 })
  );
  pud.position.y = 0.2;
  g.add(pud);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const nut = mesh(new THREE.SphereGeometry(0.028, 10, 8), std(0xd8c4a0));
    nut.scale.set(1, 0.55, 0.8);
    nut.position.set(Math.cos(a) * 0.13, 0.36, Math.sin(a) * 0.13);
    g.add(nut);
  }
  return g;
}

function chakka() {
  const g = brassLagan(0.56);
  const bowl = patternedBowl(0.42);
  bowl.position.y = 0.04;
  g.add(bowl);
  const yogurt = mesh(
    new THREE.SphereGeometry(0.28, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2.12),
    physical(0xf7f4ee, { roughness: 0.22, clearcoat: 0.2 })
  );
  yogurt.position.y = 0.2;
  g.add(yogurt);
  const oil = mesh(
    new THREE.CircleGeometry(0.1, 20),
    physical(0xc9a24a, { roughness: 0.1, transparent: true, opacity: 0.5 })
  );
  oil.rotation.x = -Math.PI / 2;
  oil.position.y = 0.34;
  g.add(oil);
  const herb = mesh(new THREE.BoxGeometry(0.04, 0.004, 0.014), std(0x3d7a3a));
  herb.position.set(0.06, 0.345, 0.02);
  g.add(herb);
  return g;
}

function shirchoy() {
  const g = brassLagan(0.5);
  const pts = [
    new THREE.Vector2(0.08, 0),
    new THREE.Vector2(0.18, 0.02),
    new THREE.Vector2(0.22, 0.16),
    new THREE.Vector2(0.19, 0.22)
  ];
  const cup = mesh(new THREE.LatheGeometry(pts, 32), physical(0xe7d3b0, { roughness: 0.28, clearcoat: 0.4 }));
  cup.position.y = 0.05;
  g.add(cup);
  const tea = mesh(
    new THREE.CircleGeometry(0.165, 28),
    physical(0xc4a06a, { roughness: 0.12 })
  );
  tea.rotation.x = -Math.PI / 2;
  tea.position.y = 0.2;
  g.add(tea);
  const ring = mesh(
    new THREE.TorusGeometry(0.195, 0.012, 8, 28),
    std(0x1f4a72, { roughness: 0.35, metalness: 0.15 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.26;
  g.add(ring);
  return g;
}

function dugob() {
  const g = brassLagan(0.5);
  const glass = mesh(
    new THREE.CylinderGeometry(0.13, 0.15, 0.42, 28),
    physical(0xdceef5, { transparent: true, opacity: 0.28, roughness: 0.06, metalness: 0.08 })
  );
  glass.position.y = 0.26;
  g.add(glass);
  const drink = mesh(
    new THREE.CylinderGeometry(0.11, 0.13, 0.3, 24),
    physical(0xf4f1ea, { roughness: 0.2 })
  );
  drink.position.y = 0.2;
  g.add(drink);
  const mint = mesh(new THREE.BoxGeometry(0.04, 0.08, 0.012), std(0x3d7a3a));
  mint.position.set(0.03, 0.4, 0);
  g.add(mint);
  return g;
}

const BUILDERS = {
  plov, manti, kurutob, shashlik, kabob, samsa,
  'oshi-tugrama': oshi, fatir, halisa, chakka, shirchoy, dugob
};

export function makeTeapot() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.22, 28, 18), physical(0xc9c4b8, { roughness: 0.26, metalness: 0.4 }));
  body.scale.set(1, 0.78, 1);
  body.position.y = 0.24;
  g.add(body);
  const lid = mesh(new THREE.SphereGeometry(0.1, 16, 12), physical(0xb7b2a6, { roughness: 0.28, metalness: 0.42 }));
  lid.position.y = 0.42;
  g.add(lid);
  const knob = mesh(new THREE.SphereGeometry(0.03, 10, 8), brassMat());
  knob.position.y = 0.52;
  g.add(knob);
  const spout = mesh(new THREE.CylinderGeometry(0.025, 0.04, 0.28, 12), physical(0xc9c4b8, { roughness: 0.26, metalness: 0.4 }));
  spout.position.set(0.22, 0.26, 0);
  spout.rotation.z = -0.85;
  g.add(spout);
  return g;
}

export function makePiala() {
  const g = new THREE.Group();
  const cup = mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.08, 24), physical(0xf3ead8, { roughness: 0.32 }));
  cup.position.y = 0.05;
  g.add(cup);
  const ring = mesh(new THREE.TorusGeometry(0.09, 0.01, 8, 24), std(0x1f4a72, { roughness: 0.32 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.09;
  g.add(ring);
  return g;
}

export function buildDishModel(id) {
  const fn = BUILDERS[id] || plov;
  const model = fn();
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return model;
}

export const DISH_ORDER = Object.keys(BUILDERS);
