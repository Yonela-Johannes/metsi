"use client";

import { useEffect, useRef } from "react";
import type * as LType from "leaflet";
import { STATUS_META } from "@/lib/types";
import type { Station } from "@/lib/types";

interface MapCanvasProps {
  stations: Station[];
  layers: {
    levels: boolean;
    rain: boolean;
    stations: boolean;
    floodline: boolean;
  };
  onSelect: (s: Station) => void;
  playing: boolean;
}

export function MapCanvas({
  stations,
  layers,
  onSelect,
  playing,
}: MapCanvasProps) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<LType.Map | null>(null);
  const L = useRef<typeof LType | null>(null);
  const group = useRef<LType.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const leaflet = (await import("leaflet")).default;
      if (cancelled || !host.current || map.current) return;
      L.current = leaflet;
      const m = leaflet.map(host.current, {
        center: [-28.8, 24.8],
        zoom: 5,
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
        worldCopyJump: true,
      });
      m.attributionControl.setPrefix(false);
      // The CARTO basemap load is optional: if it is blocked or offline the
      // stations and region outlines are still drawn on the themed canvas.
      const tiles = leaflet.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> · DWS South Africa',
          maxZoom: 18,
          className: "map-tiles",
          errorTileUrl:
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        },
      );
      tiles.on("tileerror", () => {
        m.getContainer()?.classList.add("map--tiles-offline");
      });
      tiles.addTo(m);
      group.current = leaflet.layerGroup().addTo(m);
      map.current = m;
      // give the tile pane our theme filter
      const pane = m.getPane("tilePane");
      if (pane) pane.classList.add("map-pane");
      draw();
    })();

    // the zoom / reset buttons in HeroStage signal through this event
    const onZoom = (e: Event) => {
      const dir = (e as CustomEvent<1 | -1 | 0>).detail;
      const m = map.current;
      if (!m) return;
      if (dir === 0) m.setView([-28.8, 24.8], 5);
      else if (dir === 1) m.zoomIn();
      else m.zoomOut();
    };
    window.addEventListener('stage-zoom', onZoom);

    return () => {
      cancelled = true;
      window.removeEventListener('stage-zoom', onZoom);
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations, layers]);

  function draw() {
    const leaflet = L.current;
    const m = map.current;
    const g = group.current;
    if (!leaflet || !m || !g) return;
    g.clearLayers();

    if (layers.stations) {
      for (const s of stations) {
        const meta = STATUS_META[s.status];
        const color = meta.token;
        const rising = s.water_level - s.last_week_lvl > 0.5;
        const r = s.status === "major" ? 8 : s.status === "normal" ? 4.5 : 6;
        const marker = leaflet.circleMarker([s.latitude, s.longitude], {
          radius: r,
          color: "var(--ui-bg)",
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.9,
          opacity: 1,
          className: rising ? "map-marker--rising" : undefined,
        });
        marker.bindTooltip(
          `<strong>${escapeHtml(s.gauge)}</strong><br/>${s.water_level.toFixed(1)}% FSC · ${meta.label}`,
          { direction: "top", className: "map-tip", opacity: 1 },
        );
        marker.on("click", () => onSelectRef.current(s));
        marker.addTo(g);
      }
    }

    if (layers.rain) {
      const top = [...stations]
        .filter((s) => s.rain_fall > 0)
        .sort((a, b) => b.rain_fall - a.rain_fall)
        .slice(0, 12);
      for (const s of top) {
        leaflet
          .circleMarker([s.latitude, s.longitude], {
            radius: Math.min(26, 4 + Math.sqrt(s.rain_fall) * 3.2),
            color: "#3c86ff",
            weight: 1,
            fillColor: "#3c86ff",
            fillOpacity: 0.08,
            interactive: false,
          })
          .addTo(g);
      }
    }

    if (layers.floodline) {
      leaflet
        .polyline(
          [
            [-34.9, 19.9],
            [-33.9, 22.5],
            [-31.6, 25.4],
            [-30.2, 27.5],
            [-28.5, 30.4],
            [-26.6, 31.9],
            [-25.2, 31.8],
            [-23.9, 29.2],
            [-22.1, 29.3],
          ],
          {
            color: "var(--ui-coast)",
            weight: 2,
            dashArray: "6 7",
            opacity: 0.9,
            interactive: false,
          },
        )
        .addTo(g);
    }
  }

  return (
    <div className="stage-map">
      <div
        ref={host}
        className="stage-map__leaflet"
        aria-hidden="true"
        data-playing={playing ? "on" : "off"}
      />
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
