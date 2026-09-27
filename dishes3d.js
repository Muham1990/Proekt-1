import * as THREE from 'three';

function std(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.52,
    metalness: 0.04,
    ...extras
  });
}

function mesh(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function bowl(radius = 0.42, color = 0xf2e6d0) {
  const g = new THREE.Group();
  const body = mesh(
    new THREE.SphereGeometry(radius, 28, 16, 0, Math.PI * 2, 0, Math.PI / 1.55),
    std(color, { roughness: 0.32, metalness: 0.12 })
  );
  body.rotation.x = Math.PI;
  body.position.y = radius * 0.62;
  g.add(body);
  return g;
}

function kazan() {
  const g = new THREE.Group();
  const pot = mesh(
    new THREE.SphereGeometry(0.5, 32, 18, 0, Math.PI * 2, 0, Math.PI / 1.45),
    std(0x2a2118, { metalness: 0.72, roughness: 0.28 })
  );
  pot.rotation.x = Math.PI;
  pot.position.y = 0.28;
  g.add(pot);
  const rim = mesh(
    new THREE.TorusGeometry(0.48, 0.03, 10, 32),
    std(0x4a3a28, { metalness: 0.65, roughness: 0.3 })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.34;
  g.add(rim);
  return g;
}

function riceMound() {
  const g = new THREE.Group();
  const grain = new THREE.SphereGeometry(0.035, 6, 5);
  grain.scale(1.6, 0.7, 1);
  const inst = new THREE.InstancedMesh(grain, std(0xe4b35a), 90);
  inst.castShadow = true;
  const dummy = new THREE.Object3D();
  let n = 0;
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.34;
    const y = 0.38 + Math.sqrt(Math.max(0, 0.12 - r * r * 0.7)) + Math.random() * 0.08;
    dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    dummy.rotation.set(Math.random(), Math.random(), Math.random());
    dummy.scale.setScalar(0.7 + Math.random() * 0.6);
    dummy.updateMatrix();
    inst.setMatrixAt(n++, dummy.matrix);
  }
  g.add(inst);
  return g;
}

function plov() {
  const g = kazan();
  g.add(riceMound());
  for (let i = 0; i < 7; i++) {
    const meat = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.12), std(0x6b3318));
    const a = (i / 7) * Math.PI * 2;
    meat.position.set(Math.cos(a) * 0.2, 0.48, Math.sin(a) * 0.2);
    meat.rotation.y = a;
    g.add(meat);
  }
  for (let i = 0; i < 10; i++) {
    const carrot = mesh(new THREE.BoxGeometry(0.12, 0.025, 0.035), std(0xe67a22));
    const a = Math.random() * Math.PI * 2;
    carrot.position.set(Math.cos(a) * 0.18, 0.46 + Math.random() * 0.08, Math.sin(a) * 0.18);
    carrot.rotation.set(0.2, a, 0.4);
    g.add(carrot);
  }
  const garlic = mesh(new THREE.SphereGeometry(0.055, 10, 8), std(0xf4efe4));
  garlic.position.set(0.08, 0.52, -0.04);
  g.add(garlic);
  return g;
}

function dumpling() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.14, 0.015),
    new THREE.Vector2(0.17, 0.08),
    new THREE.Vector2(0.12, 0.14),
    new THREE.Vector2(0.05, 0.18),
    new THREE.Vector2(0, 0.2)
  ];
  return mesh(new THREE.LatheGeometry(pts, 18), std(0xf0d8b0));
}

function manti() {
  const g = new THREE.Group();
  const plate = mesh(new THREE.CylinderGeometry(0.48, 0.5, 0.05, 28), std(0xf6eedd));
  plate.position.y = 0.04;
  g.add(plate);
  const spots = [[-0.16, 0.12], [0.16, 0.12], [0, 0.16], [-0.1, -0.1], [0.12, -0.12]];
  spots.forEach(([x, z], i) => {
    const d = dumpling();
    d.position.set(x, 0.06, z);
    d.rotation.y = i * 0.6;
    d.scale.setScalar(0.95);
    g.add(d);
  });
  const cream = mesh(new THREE.SphereGeometry(0.07, 10, 8), std(0xfff6ea, { roughness: 0.2 }));
  cream.scale.set(1.4, 0.35, 1.4);
  cream.position.set(0.02, 0.22, 0.02);
  g.add(cream);
  return g;
}

function kurutob() {
  const g = bowl(0.46, 0xe8d4b0);
  const sauce = mesh(new THREE.CircleGeometry(0.34, 24), std(0xf4f0e6, { roughness: 0.25 }));
  sauce.rotation.x = -Math.PI / 2;
  sauce.position.y = 0.2;
  g.add(sauce);
  for (let i = 0; i < 8; i++) {
    const bread = mesh(new THREE.BoxGeometry(0.16, 0.03, 0.1), std(0xd4a45a));
    const a = (i / 8) * Math.PI * 2;
    bread.position.set(Math.cos(a) * 0.16, 0.22, Math.sin(a) * 0.16);
    bread.rotation.set(0.15, a, 0.25);
    g.add(bread);
  }
  for (let i = 0; i < 5; i++) {
    const tomato = mesh(new THREE.SphereGeometry(0.045, 10, 8), std(0xc0392b));
    const a = i * 1.2;
    tomato.position.set(Math.cos(a) * 0.14, 0.26, Math.sin(a) * 0.14);
    g.add(tomato);
  }
  return g;
}

function skewer(length = 0.95) {
  const rod = mesh(
    new THREE.CylinderGeometry(0.012, 0.012, length, 8),
    std(0x9aa0a6, { metalness: 0.85, roughness: 0.2 })
  );
  rod.rotation.z = Math.PI / 2;
  rod.position.y = 0.22;
  return rod;
}

function shashlik() {
  const g = new THREE.Group();
  g.add(skewer(1.05));
  for (let i = 0; i < 4; i++) {
    const cube = mesh(new THREE.BoxGeometry(0.16, 0.14, 0.14), std(0x7a3b1a));
    cube.position.set(-0.36 + i * 0.24, 0.22, 0);
    cube.rotation.y = 0.2 * i;
    g.add(cube);
    if (i < 3) {
      const onion = mesh(new THREE.TorusGeometry(0.07, 0.018, 8, 16), std(0xf3d9b0));
      onion.position.set(-0.24 + i * 0.24, 0.22, 0);
      onion.rotation.z = Math.PI / 2;
      g.add(onion);
    }
  }
  return g;
}

function kabob() {
  const g = new THREE.Group();
  g.add(skewer(1));
  for (let i = 0; i < 3; i++) {
    const kofta = mesh(new THREE.CapsuleGeometry(0.075, 0.2, 6, 10), std(0x5c2e16));
    kofta.rotation.z = Math.PI / 2;
    kofta.position.set(-0.28 + i * 0.28, 0.22, 0);
    g.add(kofta);
  }
  return g;
}

function samsa() {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.2);
  shape.lineTo(-0.2, -0.16);
  shape.lineTo(0.2, -0.16);
  shape.closePath();
  const pastry = mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }),
    std(0xe0b15a)
  );
  pastry.rotation.x = -Math.PI / 2;
  pastry.position.y = 0.08;
  g.add(pastry);
  const sesame = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 6, 4), std(0xf5e6c8), 18);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 18; i++) {
    dummy.position.set((Math.random() - 0.5) * 0.22, 0.12, (Math.random() - 0.5) * 0.18);
    dummy.updateMatrix();
    sesame.setMatrixAt(i, dummy.matrix);
  }
  g.add(sesame);
  return g;
}

function oshi() {
  const g = bowl(0.44, 0xf0e2c8);
  const broth = mesh(new THREE.CircleGeometry(0.32, 24), std(0xc8893a, { roughness: 0.22 }));
  broth.rotation.x = -Math.PI / 2;
  broth.position.y = 0.2;
  g.add(broth);
  for (let i = 0; i < 9; i++) {
    const noodle = mesh(new THREE.TorusGeometry(0.1 + (i % 3) * 0.03, 0.012, 6, 18), std(0xe8c98a));
    noodle.position.set((i % 3 - 1) * 0.08, 0.24, (Math.floor(i / 3) - 1) * 0.07);
    noodle.rotation.set(0.8, i * 0.4, 0.3);
    g.add(noodle);
  }
  const meat = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.08), std(0x6a3014));
  meat.position.set(0.08, 0.26, 0.04);
  g.add(meat);
  return g;
}

function fatir() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const layer = mesh(new THREE.CylinderGeometry(0.38 - i * 0.02, 0.4 - i * 0.02, 0.035, 28), std(i % 2 ? 0xe8c37a : 0xd4a45c));
    layer.position.y = 0.05 + i * 0.04;
    g.add(layer);
  }
  return g;
}

function halisa() {
  const g = bowl(0.4, 0xc9a05a);
  const pud = mesh(new THREE.SphereGeometry(0.28, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), std(0xd4a017, { roughness: 0.18, metalness: 0.15 }));
  pud.position.y = 0.18;
  g.add(pud);
  for (let i = 0; i < 6; i++) {
    const nut = mesh(new THREE.SphereGeometry(0.03, 8, 6), std(0x6b4226));
    const a = (i / 6) * Math.PI * 2;
    nut.position.set(Math.cos(a) * 0.12, 0.42, Math.sin(a) * 0.12);
    g.add(nut);
  }
  return g;
}

function chakka() {
  const g = bowl(0.4, 0xe8dcc8);
  const yogurt = mesh(new THREE.SphereGeometry(0.26, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.1), std(0xf7f4ee, { roughness: 0.3 }));
  yogurt.position.y = 0.18;
  g.add(yogurt);
  return g;
}

function piala(liquidColor) {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.08, 0),
    new THREE.Vector2(0.16, 0.02),
    new THREE.Vector2(0.2, 0.14),
    new THREE.Vector2(0.18, 0.2)
  ];
  const cup = mesh(new THREE.LatheGeometry(pts, 20), std(0xe7d3b0, { roughness: 0.35 }));
  g.add(cup);
  const liquid = mesh(new THREE.CircleGeometry(0.155, 20), std(liquidColor, { roughness: 0.15 }));
  liquid.rotation.x = -Math.PI / 2;
  liquid.position.y = 0.15;
  g.add(liquid);
  return g;
}

function shirchoy() {
  return piala(0xc4a06a);
}

function dugob() {
  const g = new THREE.Group();
  const glass = mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.42, 20),
    std(0xdceef5, { transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.1 })
  );
  glass.position.y = 0.24;
  g.add(glass);
  const drink = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.3, 18), std(0xf4f1ea, { roughness: 0.2 }));
  drink.position.y = 0.2;
  g.add(drink);
  const mint = mesh(new THREE.BoxGeometry(0.06, 0.02, 0.03), std(0x3d8b4a));
  mint.position.set(0.02, 0.37, 0);
  g.add(mint);
  return g;
}

const BUILDERS = {
  plov, manti, kurutob, shashlik, kabob, samsa,
  'oshi-tugrama': oshi, fatir, halisa, chakka, shirchoy, dugob
};

export function buildDishModel(id) {
  const fn = BUILDERS[id] || plov;
  const model = fn();
  model.traverse((obj) => {
    if (obj.isMesh) obj.castShadow = true;
  });
  return model;
}
