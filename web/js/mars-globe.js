const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
const jezero = { latitude: 18.38, longitude: 77.58 };

export function startMarsGlobe(scan) {
  const canvas = scan.querySelector("canvas");
  const planet = scan.querySelector(".scan-planet");
  const marker = scan.querySelector(".scan-marker");
  const instructions = scan.querySelector(".scan-instructions");
  let disposed = false;
  let cleanup = () => {};

  import(THREE_URL).then((THREE) => {
    if (disposed) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(33, 1, .1, 30);
    camera.position.z = 3.8;
    const geometry = new THREE.SphereGeometry(1, 64, 48);
    const material = new THREE.MeshStandardMaterial({ roughness: 1 });
    const globe = new THREE.Mesh(geometry, material);
    globe.rotation.order = "YXZ";
    const sun = new THREE.DirectionalLight(0xffc18f, 3.4);
    sun.position.set(4, 3, 5);
    scene.add(globe, new THREE.HemisphereLight(0xffe3cd, 0x231225, 1.1), sun);
    const latitude = THREE.MathUtils.degToRad(jezero.latitude);
    const longitude = THREE.MathUtils.degToRad(jezero.longitude + 180);
    const jezeroPoint = new THREE.Vector3(-Math.cos(longitude) * Math.cos(latitude), Math.sin(latitude), Math.sin(longitude) * Math.cos(latitude));
    const point = new THREE.Vector3();
    globe.rotation.y = Math.PI / 2 - longitude + .22;
    let frame = 0;
    let lastTime = 0;
    let drag = null;
    let texture = null;
    let active = false;
    const resize = () => {
      const size = planet.clientWidth;
      renderer.setSize(size, size, false);
    };
    const observer = new ResizeObserver(resize);
    const listeners = new AbortController();
    const options = { signal: listeners.signal };
    function rotate(dx, dy) {
      globe.rotation.y += dx;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + dy, -1.2, 1.2);
    }
    canvas.addEventListener("pointerdown", event => {
      if (!active || !event.isPrimary || event.button !== 0) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    }, options);
    canvas.addEventListener("pointermove", event => {
      if (drag?.id !== event.pointerId) return;
      rotate((event.clientX - drag.x) * .007, (event.clientY - drag.y) * .007);
      drag.x = event.clientX;
      drag.y = event.clientY;
    }, options);
    canvas.addEventListener("lostpointercapture", () => { drag = null; }, options);
    canvas.addEventListener("keydown", event => {
      const directions = { ArrowLeft: [-.12, 0], ArrowRight: [.12, 0], ArrowUp: [0, -.12], ArrowDown: [0, .12] };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      rotate(...direction);
    }, options);
    function tick(time) {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;
      if (!drag && scan.classList.contains("scan-animated")) rotate(delta * .000045, 0);
      point.copy(jezeroPoint).applyEuler(globe.rotation);
      marker.hidden = point.z <= 1 / camera.position.z;
      point.project(camera);
      marker.style.setProperty("--marker-x", `${(point.x + 1) * 50}%`);
      marker.style.setProperty("--marker-y", `${(1 - point.y) * 50}%`);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    }
    new THREE.TextureLoader().load("img/mars-global.webp", loaded => {
      if (disposed) { loaded.dispose(); return; }
      texture = loaded;
      texture.colorSpace = THREE.SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
      canvas.hidden = false;
      instructions.hidden = false;
      planet.classList.add("has-globe");
      active = true;
      observer.observe(planet);
      resize();
      frame = requestAnimationFrame(tick);
    });
    cleanup = () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      listeners.abort();
      texture?.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }).catch(() => {});

  return () => {
    disposed = true;
    cleanup();
  };
}
