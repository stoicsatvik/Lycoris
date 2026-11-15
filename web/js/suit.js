const MODEL_URL = "https://raw.githubusercontent.com/stoicsatvik/NASA/main/assets/astronaut_by_jungle_jim.glb";
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
const GLTF_URL = "https://esm.sh/three@0.160.1/examples/jsm/loaders/GLTFLoader.js?bundle";

// Render the supplied GLB directly; avoiding the full hosted viewer keeps the reference usable in Lycoris.
export function startSuit(root) {
  const canvas = root.querySelector("#suit-model");
  if (!canvas) return () => {};
  let alive = true, raf, renderer;
  Promise.all([import(THREE_URL), import(GLTF_URL)]).then(([THREE, { GLTFLoader }]) => {
    if (!alive) return;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 100), home = new THREE.Vector3();
    const rig = new THREE.Group(); scene.add(rig);
    scene.add(new THREE.HemisphereLight(0xc9d6ff, 0x12101b, 2.2));
    const key = new THREE.DirectionalLight(0xffd4ad, 3); key.position.set(4, -5, 8); scene.add(key);
    const rim = new THREE.DirectionalLight(0xff6ca9, 1.4); rim.position.set(-5, 4, 4); scene.add(rim);
    new GLTFLoader().load(MODEL_URL, (gltf) => {
      const box = new THREE.Box3().setFromObject(gltf.scene), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3()), span = Math.max(size.x, size.y, size.z);
      gltf.scene.position.sub(center); rig.add(gltf.scene);
      camera.up.set(0, 1, 0);
      camera.position.set(0, 0, span * 2.45); home.copy(camera.position); camera.lookAt(0, 0, 0);
      canvas.closest(".suit-viewer")?.classList.remove("viewer-fallback");
    }, undefined, () => canvas.closest(".suit-viewer")?.classList.add("viewer-fallback"));
    const resize = () => { const rect = canvas.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); };
    let drag, yaw = 0, pitch = 0;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => { if (!drag) return; yaw = drag.yaw + (e.clientX - drag.x) * .012; pitch = Math.max(-.3, Math.min(.3, drag.pitch + (e.clientY - drag.y) * .006)); });
    canvas.addEventListener("pointerup", () => { drag = null; });
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); camera.position.multiplyScalar(e.deltaY > 0 ? 1.08 : .92); }, { passive: false });
    root.querySelector("#suit-reset")?.addEventListener("click", () => { yaw = 0; pitch = 0; camera.position.copy(home); camera.lookAt(0, 0, 0); });
    addEventListener("resize", resize); resize();
    const tick = () => { raf = requestAnimationFrame(tick); rig.rotation.set(pitch, yaw, 0); renderer.render(scene, camera); }; tick();
    root._stopSuit = () => { removeEventListener("resize", resize); cancelAnimationFrame(raf); renderer.dispose(); };
  }).catch(() => canvas.closest(".suit-viewer")?.classList.add("viewer-fallback"));
  return () => { alive = false; root._stopSuit?.(); };
}
