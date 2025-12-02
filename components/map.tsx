'use client';
// Real map: Leaflet on OpenStreetMap's own tiles (no key), toned to the theme in CSS. Loaded only in the browser.
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Pin = { slug: string; lat: number; lng: number; label: string; href: string; name?: string };
type Box = [[number, number], [number, number]];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const token = (n: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/** Pins (links, staggered in) or one approximate area circle. `bounds` frames the camera; otherwise it fits the pins. */
export function MapView({ pins = [], area, bounds, label, note, className = 'map' }: {
  pins?: Pin[]; area?: { lat: number; lng: number; radius: number }; bounds?: Box; label: string; note?: string; className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const key = JSON.stringify([pins, area, bounds]);

  useEffect(() => {
    let map: Leaflet.Map | undefined;
    let alive = true;
    import('leaflet').then((L) => {
      if (!alive || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false, zoomSnap: 0.25, attributionControl: true });
      L.tileLayer(TILES, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);

      pins.forEach((p, i) => {
        const html = `<a class="pin" data-slug="${esc(p.slug)}" href="${esc(p.href)}"${p.name ? ` aria-label="${esc(p.name + ", " + p.label + " an hour")}" title="${esc(p.name)}"` : ""} style="animation-delay:${120 + i * 60}ms">${esc(p.label)}</a>`;
        L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'pin-anchor', html, iconSize: [0, 0] }), keyboard: false }).addTo(map!);
      });
      if (area) {
        const ink = token('--color-ink');
        L.circle([area.lat, area.lng], { radius: area.radius, color: ink, weight: 1.5, fillColor: token('--color-signal'), fillOpacity: 0.35 }).addTo(map);
      }

      if (bounds) map.fitBounds(bounds, { padding: [16, 16] });
      else if (area) map.setView([area.lat, area.lng], 14);
      else if (pins.length === 1) map.setView([pins[0].lat, pins[0].lng], 14);
      else if (pins.length) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [56, 56], maxZoom: 14 });
      else map.setView([56, -96], 3);
    });
    return () => { alive = false; map?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Pins are plain anchors inside Leaflet's DOM; route them through Next so the page doesn't reload.
  const onClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.pin');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    router.push(a.getAttribute('href')!);
  };

  return (
    <div className={className} role="region" aria-label={label}>
      <div ref={el} className="map-canvas" onClick={onClick} />
      {note && <span className="map-note">{note}</span>}
    </div>
  );
}
