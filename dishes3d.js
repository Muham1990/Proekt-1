import * as THREE from 'three';

function std(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.52,
    metalness: 0.04,
    envMapIntensity: 0.3,
    ...extras
  });
}

function photoMat(tex, fallback) {
  return new THREE.MeshStandardMaterial({
    color: tex ? 0xf4f4f4 : fallback,
    map: tex || null,
    roughness: 0.68,
    metalness: 0.02,
    envMapIntensity: 0.14
  });
}

function mesh(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function ceramicPlate(radius = 0.52, color = 0xf3ead8) {
  const g = new THREE.Group();
  const dish = mesh(
    new THREE.CylinderGeometry(radius * 0.9, radius, 0.048, 48),
    std(color, { roughness: 0.38 })
  );
  dish.position.y = 0.03;
  g.add(dish);
  const ring = mesh(
    new THREE.TorusGeometry(radius * 0.94, 0.018, 10, 48),
    std(0x2c4a72, { roughness: 0.4, metalness: 0.15 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.052;
  g.add(ring);
  return g;
}

function patternedBowl(radius = 0.48) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.06, 0),
    new THREE.Vector2(radius * 0.92, 0.02),
    new THREE.Vector2(radius, 0.15),
    new THREE.Vector2(radius * 0.84, 0.26)
  ];
  g.add(mesh(new THREE.LatheGeometry(pts, 36), std(0xf2ebe0, { roughness: 0.4 })));
  const rim = mesh(
    new THREE.TorusGeometry(radius * 0.84, 0.016, 8, 36),
    std(0x2a4a70, { roughness: 0.42 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.25;
  g.add(rim);
  return g;
}

function garlicHead() {
  const g = new THREE.Group();
  const bulb = mesh(new THREE.SphereGeometry(0.055, 14, 12), std(0xf4efe6, { roughness: 0.55 }));
  bulb.scale.set(1, 0.9, 1);
  bulb.position.y = 0.04;
  g.add(bulb);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const clove = mesh(new THREE.SphereGeometry(0.02, 8, 8), std(0xeee6d8));
    clove.position.set(Math.cos(a) * 0.036, 0.068, Math.sin(a) * 0.036);
    g.add(clove);
  }
  const stem = mesh(new THREE.CylinderGeometry(0.007, 0.012, 0.028, 8), std(0xe8e0d2));
  stem.position.y = 0.095;
  g.add(stem);
  return g;
}

function plov(tex) {
  const g = ceramicPlate(0.54);
  const rice = mesh(
    new THREE.SphereGeometry(0.38, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2.15),
    photoMat(tex, 0xe0b24a)
  );
  rice.scale.set(1, 0.42, 1);
  rice.position.y = 0.06;
  g.add(rice);

  const grain = new THREE.SphereGeometry(0.016, 5, 4);
  grain.scale(1.7, 0.5, 0.8);
  const inst = new THREE.InstancedMesh(grain, std(0xe3b24a, { roughness: 0.62 }), 160);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 160; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.34;
    dummy.position.set(Math.cos(a) * r, 0.12 + Math.sqrt(Math.max(0, 0.12 - r * r * 0.8)), Math.sin(a) * r);
    dummy.rotation.set(Math.random(), Math.random(), Math.random());
    dummy.scale.setScalar(0.7 + Math.random() * 0.5);
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.castShadow = true;
  g.add(inst);

  const garlic = garlicHead();
  garlic.position.y = 0.2;
  g.add(garlic);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const meat = mesh(new THREE.BoxGeometry(0.08, 0.045, 0.06), std(0x5a3220, { roughness: 0.72 }));
    meat.position.set(Math.cos(a) * 0.22, 0.2, Math.sin(a) * 0.22);
    meat.rotation.y = a;
    g.add(meat);
  }
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const carrot = mesh(new THREE.BoxGeometry(0.1, 0.01, 0.014), std(0xe67a22));
    carrot.position.set(Math.cos(a) * 0.2, 0.18 + Math.random() * 0.04, Math.sin(a) * 0.2);
    carrot.rotation.set(0.1, a, 0.25);
    g.add(carrot);
  }
  return g;
}

function mantiDumpling(open = false) {
  const g = new THREE.Group();
  const dough = std(0xe9d6b4, { roughness: 0.42 });
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.11, 0.01),
    new THREE.Vector2(0.14, 0.05),
    new THREE.Vector2(0.12, 0.1),
    new THREE.Vector2(0.055, 0.14),
    new THREE.Vector2(0.02, 0.17),
    new THREE.Vector2(0.008, 0.2)
  ];
  g.add(mesh(new THREE.LatheGeometry(pts, 26), dough));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const pleat = mesh(new THREE.BoxGeometry(0.008, 0.04, 0.006), dough);
    pleat.position.set(Math.cos(a) * 0.032, 0.155, Math.sin(a) * 0.032);
    pleat.rotation.y = a;
    pleat.rotation.z = 0.35;
    g.add(pleat);
  }
  const knot = mesh(new THREE.SphereGeometry(0.014, 8, 8), dough);
  knot.position.y = 0.208;
  g.add(knot);
  if (open) {
    const filling = mesh(new THREE.SphereGeometry(0.07, 14, 10, 0, Math.PI), std(0x6a4424, { roughness: 0.7 }));
    filling.rotation.y = Math.PI / 2;
    filling.position.set(0.025, 0.08, 0);
    g.add(filling);
  }
  return g;
}

function manti(tex) {
  const g = ceramicPlate(0.56);
  if (tex) {
    const photo = mesh(new THREE.CircleGeometry(0.42, 40), photoMat(tex, 0xe9d6b4));
    photo.rotation.x = -Math.PI / 2;
    photo.position.y = 0.056;
    g.add(photo);
  }
  const spots = [
    [0.18, 0.12, false], [0, 0.2, false], [-0.18, 0.12, false],
    [-0.2, -0.08, false], [0.2, -0.08, false], [0.02, -0.18, true]
  ];
  spots.forEach(([x, z, open], i) => {
    const d = mantiDumpling(open);
    d.position.set(x, 0.055, z);
    d.rotation.y = i * 0.4;
    d.scale.setScalar(0.88);
    g.add(d);
  });
  const cup = mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.06, 18), std(0x2a3d55));
  cup.position.set(0, 0.08, 0.02);
  g.add(cup);
  const cream = mesh(
    new THREE.SphereGeometry(0.065, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    std(0xfff8f0, { roughness: 0.22 })
  );
  cream.position.set(0, 0.09, 0.02);
  g.add(cream);
  return g;
}

function kurutob(tex) {
  const g = patternedBowl(0.5);
  if (tex) {
    const photo = mesh(new THREE.CircleGeometry(0.38, 40), photoMat(tex, 0xf4efe6));
    photo.rotation.x = -Math.PI / 2;
    photo.position.y = 0.17;
    g.add(photo);
  }
  for (let i = 0; i < 14; i++) {
    const chip = mesh(new THREE.BoxGeometry(0.14, 0.012, 0.1), std(0xe0b15a, { roughness: 0.55 }));
    const a = Math.random() * Math.PI * 2;
    chip.position.set(Math.cos(a) * 0.16, 0.19 + Math.random() * 0.04, Math.sin(a) * 0.16);
    chip.rotation.set(0.2, a, 0.35);
    g.add(chip);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tomato = mesh(new THREE.SphereGeometry(0.028, 10, 8), std(0xc0392b));
    tomato.position.set(Math.cos(a) * 0.18, 0.22, Math.sin(a) * 0.18);
    g.add(tomato);
  }
  for (let i = 0; i < 10; i++) {
    const crumb = mesh(new THREE.SphereGeometry(0.016, 6, 6), std(0xf7f4ee));
    crumb.position.set((Math.random() - 0.5) * 0.28, 0.21, (Math.random() - 0.5) * 0.28);
    g.add(crumb);
  }
  return g;
}

function skewerRod(len = 0.95) {
  const rod = mesh(new THREE.CylinderGeometry(0.01, 0.01, len, 8), std(0xb8bec4, { metalness: 0.88, roughness: 0.18 }));
  rod.rotation.z = Math.PI / 2;
  rod.position.y = 0.14;
  return rod;
}

function shashlik(tex) {
  const g = ceramicPlate(0.54);
  if (tex) {
    const photo = mesh(new THREE.CircleGeometry(0.4, 40), photoMat(tex, 0x7a4a28));
    photo.rotation.x = -Math.PI / 2;
    photo.position.y = 0.056;
    g.add(photo);
  }
  for (let s = 0; s < 2; s++) {
    const row = new THREE.Group();
    row.position.set(0, 0.02, (s - 0.5) * 0.16);
    row.rotation.y = 0.12 * (s ? -1 : 1);
    row.add(skewerRod(0.9));
    for (let i = 0; i < 4; i++) {
      const cube = mesh(new THREE.BoxGeometry(0.13, 0.11, 0.12), std(0x7a4a28, { roughness: 0.55 }));
      cube.position.set(-0.28 + i * 0.19, 0.14, 0);
      cube.rotation.y = 0.12 * i;
      row.add(cube);
    }
    g.add(row);
  }
  return g;
}

function kabob(tex) {
  const g = ceramicPlate(0.54);
  if (tex) {
    const photo = mesh(new THREE.CircleGeometry(0.4, 40), photoMat(tex, 0x6b3a1e));
    photo.rotation.x = -Math.PI / 2;
    photo.position.y = 0.056;
    g.add(photo);
  }
  const meat = std(0x6e3a1c, { roughness: 0.62 });
  const char = std(0x2a1810, { roughness: 0.8 });
  for (let s = 0; s < 2; s++) {
    const row = new THREE.Group();
    row.position.set(0, 0.02, (s - 0.5) * 0.15);
    row.add(skewerRod(0.88));
    for (let i = 0; i < 3; i++) {
      const patty = mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.16, 14), meat);
      patty.rotation.z = Math.PI / 2;
      patty.scale.set(1, 1, 0.72);
      patty.position.set(-0.22 + i * 0.22, 0.135, 0);
      row.add(patty);
      const mark = mesh(new THREE.BoxGeometry(0.15, 0.004, 0.012), char);
      mark.position.set(-0.22 + i * 0.22, 0.175, 0);
      row.add(mark);
    }
    g.add(row);
  }
  for (let i = 0; i < 4; i++) {
    const onion = mesh(new THREE.TorusGeometry(0.045, 0.008, 6, 14), std(0xf3d9b0));
    onion.position.set(-0.18 + i * 0.12, 0.08, 0.18);
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
  shape.moveTo(0, 0.2);
  shape.lineTo(-0.19, -0.14);
  shape.lineTo(0.19, -0.14);
  shape.closePath();
  const pastry = mesh(
    new THREE.ExtrudeGeometry(shape, {
      depth: 0.075, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.018, bevelSegments: 3
    }),
    std(0xe8b85a, { roughness: 0.48 })
  );
  pastry.rotation.x = -Math.PI / 2;
  pastry.position.y = 0.04;
  g.add(pastry);
  if (open) {
    const filling = mesh(new THREE.SphereGeometry(0.06, 12, 10, 0, Math.PI), std(0x6a4424));
    filling.rotation.x = Math.PI / 2;
    filling.position.set(-0.02, 0.07, 0.02);
    g.add(filling);
  }
  return g;
}

function samsa(tex) {
  const g = ceramicPlate(0.5);
  if (tex) {
    const photo = mesh(new THREE.CircleGeometry(0.36, 40), photoMat(tex, 0xe8b85a));
    photo.rotation.x = -Math.PI / 2;
    photo.position.y = 0.056;
    g.add(photo);
  }
  [[0.04, 0.06, 0.02, 0.1], [-0.16, 0.06, -0.06, 0.7], [0.14, 0.06, -0.1, -0.5]].forEach(([x, y, z, rot], i) => {
    const p = samsaPiece(i === 2);
    p.position.set(x, y, z);
    p.rotation.y = rot;
    p.scale.setScalar(0.82);
    g.add(p);
  });
  return g;
}

function oshi(tex) {
  const g = patternedBowl(0.46);
  const broth = mesh(new THREE.CircleGeometry(0.34, 32), photoMat(tex, 0xc8893a));
  broth.rotation.x = -Math.PI / 2;
  broth.position.y = 0.17;
  g.add(broth);
  for (let i = 0; i < 7; i++) {
    const noodle = mesh(new THREE.TorusGeometry(0.08 + (i % 3) * 0.02, 0.01, 6, 16), std(0xe8c98a));
    noodle.position.set((i % 3 - 1) * 0.07, 0.2, (Math.floor(i / 3) - 1) * 0.06);
    noodle.rotation.set(0.9, i * 0.4, 0.2);
    g.add(noodle);
  }
  return g;
}

function fatir(tex) {
  const g = ceramicPlate(0.5, 0xe8dcc4);
  const loaf = mesh(new THREE.CylinderGeometry(0.36, 0.38, 0.07, 40), photoMat(tex, 0xe0b15a));
  loaf.position.y = 0.09;
  g.add(loaf);
  const sesame = new THREE.InstancedMesh(new THREE.SphereGeometry(0.006, 5, 4), std(0x2a2118), 28);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 28; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.28;
    dummy.position.set(Math.cos(a) * r, 0.13, Math.sin(a) * r);
    dummy.updateMatrix();
    sesame.setMatrixAt(i, dummy.matrix);
  }
  g.add(sesame);
  return g;
}

function halisa(tex) {
  const g = patternedBowl(0.42);
  const pud = mesh(
    new THREE.SphereGeometry(0.3, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2.1),
    photoMat(tex, 0xe0b020)
  );
  pud.position.y = 0.16;
  g.add(pud);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const nut = mesh(new THREE.SphereGeometry(0.026, 8, 6), std(0xd8c4a0));
    nut.scale.set(1, 0.55, 0.8);
    nut.position.set(Math.cos(a) * 0.12, 0.3, Math.sin(a) * 0.12);
    g.add(nut);
  }
  return g;
}

function chakka(tex) {
  const g = patternedBowl(0.4);
  const yogurt = mesh(
    new THREE.SphereGeometry(0.26, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.15),
    photoMat(tex, 0xf7f4ee)
  );
  yogurt.position.y = 0.16;
  g.add(yogurt);
  return g;
}

function shirchoy(tex) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.07, 0),
    new THREE.Vector2(0.16, 0.02),
    new THREE.Vector2(0.2, 0.14),
    new THREE.Vector2(0.175, 0.2)
  ];
  g.add(mesh(new THREE.LatheGeometry(pts, 24), std(0xe7d3b0, { roughness: 0.35 })));
  const tea = mesh(new THREE.CircleGeometry(0.15, 24), photoMat(tex, 0xc4a06a));
  tea.rotation.x = -Math.PI / 2;
  tea.position.y = 0.15;
  g.add(tea);
  return g;
}

function dugob(tex) {
  const g = new THREE.Group();
  const glass = mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.4, 22),
    std(0xdceef5, { transparent: true, opacity: 0.22, roughness: 0.06, metalness: 0.1 })
  );
  glass.position.y = 0.22;
  g.add(glass);
  const drink = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.28, 20), photoMat(tex, 0xf4f1ea));
  drink.position.y = 0.18;
  g.add(drink);
  return g;
}

const BUILDERS = {
  plov, manti, kurutob, shashlik, kabob, samsa,
  'oshi-tugrama': oshi, fatir, halisa, chakka, shirchoy, dugob
};

export function buildDishModel(id, foodTex = null) {
  const fn = BUILDERS[id] || plov;
  const model = fn(foodTex);
  model.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  return model;
}
