// Homepage: the headline, a rotating Mars globe that tracks Jezero, and the numbered index strip.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js";
const JEZERO = { lat: 18.44, lon: 77.45 };

export function homeView() {
  return `<div class="home">
    <button type="button" class="motion" id="motion" aria-pressed="true">MOTION ON</button>
    <div class="edge-note" aria-hidden="true">18.44° N · 77.45° E · JEZERO · ISIDIS RIM</div>
    <section class="copy">
      <div class="eyebrow"><i></i>JEZERO CRATER / MARS</div>
      <h1>Every journey begins with a <em>better plan.</em></h1>
      <p>Explore the terrain. Compare the route. Inspect every estimate before an EVA begins.</p>
      <button type="button" class="go" data-home="open">Open mission map</button>
      <a class="hud-link" href="#/journey">Preview helmet HUD</a>
      <a class="source" href="https://trek.nasa.gov/mars/" target="_blank" rel="noreferrer">OPEN NASA MARS TREK ↗</a>
    </section>
    <div class="stage" id="stage">
      <span class="orbit a"></span><span class="orbit b"></span>
      <canvas id="globe" tabindex="0" role="button" aria-label="Mars. Select to zoom into Jezero Crater" data-home="open"></canvas>
      <span class="bracket tl"></span><span class="bracket tr"></span><span class="bracket bl"></span><span class="bracket br"></span>
      <span class="moon phobos"><i></i>PHOBOS</span><span class="moon deimos"><i></i>DEIMOS</span>
      <span class="target" id="target" style="opacity: 0"><span>JEZERO CRATER</span></span>
      <button type="button" class="zoom-in" aria-label="Zoom in to the mission map" data-home="open">+</button>
    </div>
    <div class="provenance">GLOBAL TEXTURE · VIKING COLOUR MOSAIC · NASA/JPL/USGS</div>
    <nav class="home-index" aria-label="Features">
      <a href="#/craters"><span class="no">01</span><span><b>Plan a traverse</b><em>Compare crossing and detour routes.</em></span><i aria-hidden="true">→</i></a>
      <a href="#/journey"><span class="no">02</span><span><b>Helmet HUD</b><em>Follow the journey, instrument by instrument.</em></span><i aria-hidden="true">→</i></a>
      <a class="claire" href="#/claire-gate"><span class="no">03</span><span><b>Experimental Claire <u>Unvalidated</u></b><em>Explore the temperature–radiation hypothesis.</em></span><i aria-hidden="true">→</i></a>
    </nav>
  </div>`;
}

// Starts the globe and the page's controls. Returns a function that stops everything.
export function startHome(root) {
  const canvas = root.querySelector("#globe"), stage = root.querySelector("#stage"), target = root.querySelector("#target"), motionBtn = root.querySelector("#motion");
  let alive = true, moving = !matchMedia("(prefers-reduced-motion: reduce)").matches, cleanup = () => {};
  const setMotion = (on) => { moving = on; motionBtn.setAttribute("aria-pressed", String(on)); motionBtn.textContent = on ? "MOTION ON" : "MOTION OFF"; };
  setMotion(moving);
  motionBtn.addEventListener("click", () => setMotion(!moving));

  // Clicking Mars, the + button or "Open mission map" zooms in, then opens the Jezero map.
  const open = () => { stage.classList.add("zoom"); setTimeout(() => { if (alive) location.hash = "#/map"; }, moving ? 650 : 0); };
  root.querySelectorAll('[data-home="open"]').forEach((el) => {
    el.addEventListener("click", open);
    el.addEventListener("keydown", (e) => { if (el === canvas && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); open(); } });
  });

  import(THREE_URL).then((THREE) => {
    if (!alive) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 6.6;
    const R = 2;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), new THREE.MeshStandardMaterial({ roughness: 0.97, metalness: 0, color: 0xdeb096 }));
    scene.add(sphere, new THREE.HemisphereLight(0xffe4c7, 0x160b06, 1.7));
    const sun = new THREE.DirectionalLight(0xffb16c, 3.2); sun.position.set(4, 2, 5); scene.add(sun);
    new THREE.TextureLoader().load("img/mars-global.webp", (t) => { t.colorSpace = THREE.SRGBColorSpace; sphere.material.map = t; sphere.material.color.set(0xffffff); sphere.material.needsUpdate = true; });

    // Longitude L sits at texture u = (L + 180) / 360. Start with Jezero a little left of centre.
    const u = (JEZERO.lon + 180) / 360, theta = ((90 - JEZERO.lat) * Math.PI) / 180;
    sphere.rotation.y = Math.PI / 2 - 2 * Math.PI * u - 0.45;
    const v = new THREE.Vector3();
    const resize = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); };
    addEventListener("resize", resize); resize();
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (moving) sphere.rotation.y += 0.0007;
      const phi = 2 * Math.PI * u + sphere.rotation.y;
      v.set(-R * Math.cos(phi) * Math.sin(theta), R * Math.cos(theta), R * Math.sin(phi) * Math.sin(theta));
      const facing = v.z / R; // 1 = pointing straight at the camera
      v.project(camera);
      const c = canvas.getBoundingClientRect(), s = stage.getBoundingClientRect();
      target.style.left = `${c.left - s.left + ((v.x + 1) / 2) * c.width}px`;
      target.style.top = `${c.top - s.top + ((1 - v.y) / 2) * c.height}px`;
      target.style.opacity = facing > 0.25 ? "1" : "0";
      renderer.render(scene, camera);
    };
    tick();
    cleanup = () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); renderer.dispose(); sphere.geometry.dispose(); sphere.material.map?.dispose(); sphere.material.dispose(); };
  }).catch(() => { canvas.style.background = "radial-gradient(circle at 40% 35%, #c96a3c, #6b2d16 70%)"; }); // no WebGL or offline: a plain disc

  return () => { alive = false; cleanup(); };
}
