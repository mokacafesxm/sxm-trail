"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const SXM_CENTER = [-63.0501, 18.0708];
const ZOOM = 12;

const stops = [
  { id: 1, name: "Princess Juliana Airport", description: "Point de départ", coords: [-63.1089, 18.0410] },
  { id: 2, name: "Terres Basses", description: "Arrêt photo", coords: [-63.1300, 18.0680] },
  { id: 3, name: "Grand Case", description: "Village français", coords: [-63.0472, 18.1011] },
  { id: 4, name: "Bellevue", description: "Route du retour", coords: [-63.0650, 18.0750] },
];

export default function MapPage() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: SXM_CENTER,
      zoom: ZOOM,
      pitchWithRotate: false,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }),
      "bottom-right"
    );

    map.on("load", () => {
      map.setFog({
        color: "rgb(220, 215, 200)",
        "high-color": "rgb(150, 180, 200)",
        "horizon-blend": 0.1,
      });

      // Dashed route line
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: stops.map((s) => s.coords),
          },
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#F5A623",
          "line-width": 3,
          "line-dasharray": [2, 2],
        },
      });

      // Custom numbered markers + popups
      stops.forEach((stop) => {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ffffff;
          border: 2.5px solid #F5A623;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #1a1a1a;
          cursor: pointer;
          user-select: none;
        `;
        el.textContent = stop.id;

        const popup = new mapboxgl.Popup({ offset: 20, closeButton: false })
          .setHTML(
            `<strong style="font-size:14px">${stop.name}</strong>` +
            `<br/><span style="font-size:12px;color:#666">${stop.description}</span>`
          );

        new mapboxgl.Marker({ element: el })
          .setLngLat(stop.coords)
          .setPopup(popup)
          .addTo(map);
      });

      // Fit bounds to all stops
      const bounds = stops.reduce(
        (b, s) => b.extend(s.coords),
        new mapboxgl.LngLatBounds(stops[0].coords, stops[0].coords)
      );
      map.fitBounds(bounds, { padding: 80, duration: 1000 });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100vw", height: "100dvh" }}
    />
  );
}
