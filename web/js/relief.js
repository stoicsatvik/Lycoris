// Colour-relief layer for the mission map: NASA Mars Trek MOLA shaded relief in Leaflet, with the planned route
// and places drawn from the same coordinates as the photo layer. Leaflet is loaded only when the layer is opened.
import { localToGeo } from "./terrain/places.js";

const CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const MOLA = "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg";
let loading = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  loading ??= new Promise((ok, fail) => {
    document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: CSS }));
    document.head.append(Object.assign(document.createElement("script"), { src: JS, onload: ok, onerror: () => { loading = null; fail(new Error("Leaflet did not load")); } }));
  });
  return loading;
}

// el: the .relief container. P: the current plan. LOCAL: the named places.
export async function showRelief(el, P, LOCAL) {
  if (el._map) { el._map.invalidateSize(); return; }
  el.innerHTML = `<p class="relief-note">Loading NASA Mars Trek…</p>`;
  try { await loadLeaflet(); } catch { el.innerHTML = `<p class="relief-note">The colour relief could not load. Check your connection, or switch back to the photo.</p>`; return; }
  const L = window.L;
  el.innerHTML = `<div style="position: absolute; inset: 0"></div><p class="relief-note">NASA MARS TREK · MOLA COLOUR SHADED RELIEF · REGIONAL VIEW, 463 m per pixel</p>`;
  // Equirectangular Mars: 512 px for 360° of longitude at zoom 0.
  const crs = L.extend({}, L.CRS.Simple, { projection: L.Projection.LonLat, transformation: new L.Transformation(1 / 360, 0.5, -1 / 360, 0.25), scale: (z) => 512 * Math.pow(2, z), zoom: (s) => Math.log(s / 512) / Math.LN2 });
  const map = L.map(el.firstElementChild, { crs, minZoom: 1, maxZoom: 8, zoomControl: false, attributionControl: false, maxBounds: [[-90, -180], [90, 180]], maxBoundsViscosity: 1 });
  L.control.zoom({ position: "topright" }).addTo(map);
  L.tileLayer(MOLA, { minZoom: 0, maxNativeZoom: 6, maxZoom: 8, tileSize: 256, noWrap: true }).addTo(map);
  const ll = (p) => { const g = localToGeo(p); return [g.lat, g.lon]; };
  const line = P.route.points.map(ll);
  L.polyline(line, { color: "#070C17", weight: 6, opacity: 0.55 }).addTo(map);
  L.polyline(line, { color: "#74E2FF", weight: 3 }).addTo(map);
  const ids = new Set([P.places[0].id, ...P.state.stops.map((s) => s.id), P.places.at(-1).id]);
  for (const p of LOCAL) {
    L.circleMarker(ll(p), { radius: ids.has(p.id) ? 6 : 4, color: "#FFF6E0", weight: 2, fillColor: ids.has(p.id) ? "#E8793F" : "#8296B3", fillOpacity: 1 })
      .addTo(map).bindTooltip(p.name, { permanent: ids.has(p.id), direction: "top", offset: [0, -8] });
  }
  // The relief is 463 m per pixel, so it opens on the region around the route, not on the route itself.
  map.setView(L.latLngBounds(line).getCenter(), 7);
  el._map = map;
}
