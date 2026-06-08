"use client";

import { useEffect, useRef } from "react";
import type { FarmerMapPin } from "@/lib/types";

type LatLng = {
  lat: number;
  lng: number;
};

type FarmersMapProps = {
  pins?: FarmerMapPin[];
  picker?: boolean;
  value?: LatLng;
  onChange?: (value: LatLng) => void;
  onSelectFarmer?: (id: number) => void;
  height?: number;
};

const defaultCenter = { lat: 12.9716, lng: 77.5946 };

export function FarmersMap({
  pins = [],
  picker = false,
  value = defaultCenter,
  onChange,
  onSelectFarmer,
  height = 360
}: FarmersMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let mapInstance: import("leaflet").Map | null = null;

    async function bootMap() {
      const L = await import("leaflet");

      if (disposed || !containerRef.current) return;

      const mapCenter =
        pins.length > 0 && !picker
          ? { lat: pins[0].lat, lng: pins[0].lng }
          : { lat: value.lat || defaultCenter.lat, lng: value.lng || defaultCenter.lng };

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([mapCenter.lat, mapCenter.lng], picker ? 11 : 8);

      mapInstance = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18
      }).addTo(map);

      const icon = L.divIcon({
        className: "nr-map-marker",
        html: "<span>NR</span>",
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      if (picker) {
        const marker = L.marker([value.lat, value.lng], { icon }).addTo(map);
        map.on("click", (event) => {
          const next = {
            lat: Number(event.latlng.lat.toFixed(5)),
            lng: Number(event.latlng.lng.toFixed(5))
          };
          marker.setLatLng([next.lat, next.lng]);
          onChange?.(next);
        });
      } else {
        for (const pin of pins) {
          const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(map);
          marker.bindPopup(`
            <strong>${pin.name || pin.username}</strong><br/>
            ${pin.product_count} products<br/>
            Rating: ${pin.avg_rating || "New"}
          `);
          marker.on("click", () => onSelectFarmer?.(pin.id));
        }

        if (pins.length > 1) {
          const bounds = L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng]));
          map.fitBounds(bounds, { padding: [28, 28], maxZoom: 11 });
        }
      }

      window.setTimeout(() => map.invalidateSize(), 120);
    }

    bootMap();

    return () => {
      disposed = true;
      mapInstance?.remove();
    };
  }, [height, onChange, onSelectFarmer, picker, pins, value.lat, value.lng]);

  return <div ref={containerRef} className="map-surface" style={{ height }} />;
}
