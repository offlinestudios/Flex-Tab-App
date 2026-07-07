/**
 * CardioGPSTracker
 * ─────────────────
 * Strava-style GPS activity tracker for outdoor cardio (Running, Walking, Cycling).
 *
 * Features:
 *  • Live GPS coordinate streaming via navigator.geolocation.watchPosition
 *  • Real-time polyline drawn on a custom-styled Google Map
 *  • Auto-calculated distance (using Haversine formula — no Google API call needed)
 *  • Live pace (min/mi or min/km), calories, and elapsed time
 *  • Start / Pause / Resume / Finish controls
 *  • On-brand dark/light map styling matching FlexTab palette
 *  • Post-session summary modal with full route map
 *  • Saves GPS polyline JSON to the database via onLogSet
 */
/// <reference types="@types/google.maps" />
import { useState, useRef, useEffect, useCallback } from "react";
import { calculateCalories } from "@/utils/calorieCalculations";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LatLng { lat: number; lng: number; }

interface CardioGPSTrackerProps {
  exercise: { id: string; name: string; category: string };
  distanceUnit: 'miles' | 'km';
  userWeightLbs?: number;
  onDistanceUnitChange: (unit: 'miles' | 'km') => void;
  onLogSet: (
    exercise: string,
    sets: number,
    reps: number,
    weight: number,
    category?: string,
    duration?: number,
    distance?: number,
    distanceUnit?: 'miles' | 'km',
    calories?: number,
    routePolyline?: string,
  ) => Promise<void>;
  onNext?: () => void;
  onPrev?: () => void;
  totalExercises?: number;
  currentIndex?: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const GPS_TRACKABLE = ['Running', 'Walking', 'Cycling'];

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY as string;
const FORGE_BASE_URL =
  (import.meta.env.VITE_FRONTEND_FORGE_API_URL as string) ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

// ── Brand-matched Google Maps styles ─────────────────────────────────────────
// Light mode: clean off-white (#f0f1f3) base, navy (#1a2332) labels
// Dark mode: navy (#1a2332) base, light (#f0f1f3) labels
const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f0f1f3" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#1a2332" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f0f1f3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e4e8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d4d7de" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d8e8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d8ead8" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a2332" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#f0f1f3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a2332" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#252836" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#2e3347" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2e3347" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1520" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1e2d1e" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

// ── Haversine distance (metres between two LatLng points) ─────────────────────
function haversineMetres(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ── Google Maps script loader (reuses existing window.google if loaded) ────────
// Uses the same proxy URL and libraries as Map.tsx to avoid double-loading.
let mapScriptPromise: Promise<void> | null = null;
function loadMapScript(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (mapScriptPromise) return mapScriptPromise;
  // Check if a Maps script tag is already in the DOM (loaded by Map.tsx)
  const existing = document.querySelector('script[src*="maps/api/js"]');
  if (existing) {
    mapScriptPromise = new Promise((resolve) => {
      if (window.google?.maps) { resolve(); return; }
      existing.addEventListener('load', () => resolve(), { once: true });
    });
    return mapScriptPromise;
  }
  mapScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
  return mapScriptPromise;
}

// ── Detect dark mode ──────────────────────────────────────────────────────────
function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// ── Format seconds as MM:SS ───────────────────────────────────────────────────
function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ── Format pace as M:SS/unit ──────────────────────────────────────────────────
function fmtPace(durationSec: number, distanceInUnit: number, unit: 'miles' | 'km'): string {
  if (distanceInUnit < 0.05) return "--:--";
  const paceMin = durationSec / 60 / distanceInUnit;
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}/${unit === 'miles' ? 'mi' : 'km'}`;
}

// ── Activity icon SVG ─────────────────────────────────────────────────────────
function ActivityIcon({ name }: { name: string }) {
  if (name === 'Cycling') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
        <path d="M15 6a1 1 0 0 0-1-1h-1l-5 8h7l1-4"/>
        <path d="M12 6h5l2 6"/>
      </svg>
    );
  }
  if (name === 'Walking') {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="1.5"/>
        <path d="M9 8l1.5 3L8 14h3l1 4"/>
        <path d="M15 8l-1.5 3L16 14h-3l-1 4"/>
      </svg>
    );
  }
  // Running (default)
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="1.5"/>
      <path d="M8 12l2-4 2 2 2-2 2 4"/>
      <path d="M7 17l2-5h6l2 5"/>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CardioGPSTracker({
  exercise,
  distanceUnit,
  userWeightLbs,
  onDistanceUnitChange,
  onLogSet,
  onNext,
  onPrev,
  totalExercises = 1,
  currentIndex = 0,
}: CardioGPSTrackerProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  type Phase = 'idle' | 'running' | 'paused' | 'finished';
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [coords, setCoords] = useState<LatLng[]>([]);
  const [distanceMetres, setDistanceMetres] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    elapsedSec: number;
    distance: number;
    calories: number;
    coords: LatLng[];
  } | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const summaryMapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const summaryMapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const summaryPolylineRef = useRef<google.maps.Polyline | null>(null);
  const startMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const currentMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedSecRef = useRef<number>(0);
  const coordsRef = useRef<LatLng[]>([]);
  const distanceRef = useRef<number>(0);

  // ── Derived values ─────────────────────────────────────────────────────────
  const METRES_PER_UNIT = distanceUnit === 'miles' ? 1609.344 : 1000;
  const distanceInUnit = distanceMetres / METRES_PER_UNIT;
  const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70;
  const durationMin = elapsedSec / 60;
  const calories = calculateCalories(exercise.name, Math.max(1, durationMin), weightKg);
  const pace = fmtPace(elapsedSec, distanceInUnit, distanceUnit);

  // ── Initialise map ─────────────────────────────────────────────────────────
  const initMap = useCallback(async (container: HTMLDivElement, forSummary = false) => {
    await loadMapScript();
    const dark = isDarkMode();
    const map = new window.google.maps.Map(container, {
      zoom: 16,
      center: { lat: 37.7749, lng: -122.4194 },
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: !forSummary,
      streetViewControl: false,
      gestureHandling: forSummary ? 'none' : 'greedy',
      mapId: "DEMO_MAP_ID",
      styles: dark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
    });

    const polyline = new window.google.maps.Polyline({
      map,
      path: [],
      strokeColor: dark ? "#f0f1f3" : "#1a2332",
      strokeOpacity: 1,
      strokeWeight: 4,
      geodesic: true,
    });

    if (forSummary) {
      summaryMapRef.current = map;
      summaryPolylineRef.current = polyline;
    } else {
      mapRef.current = map;
      polylineRef.current = polyline;
      setMapReady(true);
    }

    return { map, polyline };
  }, []);

  // Initialise live tracking map on mount
  useEffect(() => {
    if (!mapContainerRef.current) return;
    initMap(mapContainerRef.current, false);

    // Check GPS availability
    if (!navigator.geolocation) {
      setGpsAvailable(false);
    }

    return () => {
      stopGPS();
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialise summary map when summary is shown
  useEffect(() => {
    if (!showSummary || !summaryMapContainerRef.current || !summaryData) return;
    initMap(summaryMapContainerRef.current, true).then(({ map, polyline }) => {
      if (summaryData.coords.length > 0) {
        polyline.setPath(summaryData.coords);
        const bounds = new window.google.maps.LatLngBounds();
        summaryData.coords.forEach(c => bounds.extend(c));
        map.fitBounds(bounds, 40);
        // Start marker
        const startDot = document.createElement("div");
        startDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)";
        new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: summaryData.coords[0],
          content: startDot,
        });
        // End marker
        const endDot = document.createElement("div");
        endDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)";
        new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: summaryData.coords[summaryData.coords.length - 1],
          content: endDot,
        });
      }
    });
  }, [showSummary, summaryData, initMap]);

  // ── Timer helpers ──────────────────────────────────────────────────────────
  function startTimer() {
    startTimeRef.current = Date.now() - pausedSecRef.current * 1000;
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ── GPS helpers ────────────────────────────────────────────────────────────
  function startGPS() {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPoint: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const prev = coordsRef.current;

        // Compute incremental distance
        if (prev.length > 0) {
          const delta = haversineMetres(prev[prev.length - 1], newPoint);
          // Filter out GPS noise (ignore jumps > 50 m in one update)
          if (delta < 50) {
            distanceRef.current += delta;
            setDistanceMetres(distanceRef.current);
          }
        }

        coordsRef.current = [...prev, newPoint];
        setCoords(coordsRef.current);

        // Update map
        if (mapRef.current && polylineRef.current) {
          polylineRef.current.setPath(coordsRef.current);
          mapRef.current.panTo(newPoint);

          // Update current position marker
          if (currentMarkerRef.current) {
            currentMarkerRef.current.position = newPoint;
          } else {
            const dot = document.createElement("div");
            dot.style.cssText = "width:16px;height:16px;border-radius:50%;background:var(--foreground);border:3px solid var(--background);box-shadow:0 2px 8px rgba(0,0,0,0.4)";
            currentMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current,
              position: newPoint,
              content: dot,
            });
          }

          // Add start marker once
          if (!startMarkerRef.current && coordsRef.current.length === 1) {
            const startDot = document.createElement("div");
            startDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)";
            startMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current,
              position: newPoint,
              content: startDot,
            });
            mapRef.current.setCenter(newPoint);
          }
        }

        setGpsError(null);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Location access denied. Please enable GPS in your browser settings."
            : "GPS signal lost. Move to an open area."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 15000,
      }
    );
  }

  function stopGPS() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  function handleStart() {
    setPhase('running');
    startTimer();
    startGPS();
  }

  function handlePause() {
    setPhase('paused');
    stopTimer();
    stopGPS();
    pausedSecRef.current = elapsedSec;
  }

  function handleResume() {
    setPhase('running');
    startTimer();
    startGPS();
  }

  function handleFinish() {
    stopTimer();
    stopGPS();
    setPhase('finished');
    const snap = {
      elapsedSec,
      distance: distanceInUnit,
      calories,
      coords: coordsRef.current,
    };
    setSummaryData(snap);
    setShowSummary(true);
  }

  // ── Log session ────────────────────────────────────────────────────────────
  async function handleLogSession() {
    if (!summaryData) return;
    setIsLogging(true);
    try {
      const durationMin = Math.max(1, Math.round(summaryData.elapsedSec / 60));
      const routePolyline = summaryData.coords.length > 0
        ? JSON.stringify(summaryData.coords)
        : undefined;
      await onLogSet(
        exercise.name,
        1, 0, 0,
        exercise.category,
        durationMin,
        parseFloat(summaryData.distance.toFixed(2)),
        distanceUnit,
        summaryData.calories,
        routePolyline,
      );
      setShowSummary(false);
      // Reset for next session
      setPhase('idle');
      setElapsedSec(0);
      setCoords([]);
      setDistanceMetres(0);
      coordsRef.current = [];
      distanceRef.current = 0;
      pausedSecRef.current = 0;
      if (polylineRef.current) polylineRef.current.setPath([]);
      if (startMarkerRef.current) { startMarkerRef.current.map = null; startMarkerRef.current = null; }
      if (currentMarkerRef.current) { currentMarkerRef.current.map = null; currentMarkerRef.current = null; }
    } finally {
      setIsLogging(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const isGPSTrackable = GPS_TRACKABLE.includes(exercise.name);

  // ── Metric pill component ──────────────────────────────────────────────────
  function MetricPill({ label, value, sub }: { label: string; value: string; sub?: string }) {
    return (
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', letterSpacing: -0.5 }}>{value}</span>
          {sub && <span style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 500 }}>{sub}</span>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', borderRadius: '0 0 0 0', overflow: 'hidden' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: phase === 'idle' ? 200 : 260,
            transition: 'height 0.3s ease',
            background: 'var(--secondary)',
          }}
        />
        {/* GPS error banner */}
        {gpsError && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8, right: 8,
            background: 'rgba(239,68,68,0.9)', color: 'white',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>
            {gpsError}
          </div>
        )}
        {/* GPS unavailable notice */}
        {!gpsAvailable && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', borderRadius: 0,
          }}>
            <div style={{ textAlign: 'center', color: 'white', padding: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>GPS not available</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Use a device with location services</div>
            </div>
          </div>
        )}
        {/* Activity badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'var(--card)', borderRadius: 20,
          padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          color: 'var(--foreground)',
        }}>
          <ActivityIcon name={exercise.name} />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{exercise.name}</span>
        </div>
      </div>

      {/* ── Metrics row ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        gap: 0,
      }}>
        <MetricPill label="Time" value={fmtTime(elapsedSec)} />
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        <MetricPill
          label="Distance"
          value={distanceInUnit.toFixed(2)}
          sub={distanceUnit === 'miles' ? 'mi' : 'km'}
        />
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        <MetricPill label="Pace" value={pace} />
        <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        <MetricPill label="Cal" value={String(calories)} sub="kcal" />
      </div>

      {/* ── Unit toggle + controls ────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-foreground)' }}>Unit</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['miles', 'km'] as const).map(u => (
            <button
              key={u}
              onClick={() => onDistanceUnitChange(u)}
              disabled={phase === 'running'}
              style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: phase === 'running' ? 'default' : 'pointer',
                background: distanceUnit === u ? 'var(--foreground)' : 'var(--secondary)',
                color: distanceUnit === u ? 'var(--background)' : 'var(--muted-foreground)',
                fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                opacity: phase === 'running' ? 0.6 : 1,
                transition: 'all 0.15s',
              }}
            >
              {u === 'miles' ? 'Miles' : 'Km'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Control buttons ───────────────────────────────────────────────── */}
      <div style={{ padding: '12px 16px 8px', display: 'flex', gap: 10 }}>
        {phase === 'idle' && (
          <button
            onClick={handleStart}
            disabled={!gpsAvailable}
            style={{
              flex: 1, padding: '15px 0',
              background: gpsAvailable ? 'var(--foreground)' : 'var(--muted)',
              color: gpsAvailable ? 'var(--background)' : 'var(--muted-foreground)',
              border: 'none', borderRadius: 14,
              fontSize: 16, fontWeight: 700, cursor: gpsAvailable ? 'pointer' : 'default',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Activity
          </button>
        )}

        {phase === 'running' && (
          <>
            <button
              onClick={handlePause}
              style={{
                flex: 1, padding: '15px 0',
                background: 'var(--secondary)', color: 'var(--foreground)',
                border: '2px solid var(--border)', borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Pause
            </button>
            <button
              onClick={handleFinish}
              style={{
                flex: 1, padding: '15px 0',
                background: 'var(--foreground)', color: 'var(--background)',
                border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              Finish
            </button>
          </>
        )}

        {phase === 'paused' && (
          <>
            <button
              onClick={handleResume}
              style={{
                flex: 1, padding: '15px 0',
                background: 'var(--secondary)', color: 'var(--foreground)',
                border: '2px solid var(--border)', borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Resume
            </button>
            <button
              onClick={handleFinish}
              style={{
                flex: 1, padding: '15px 0',
                background: 'var(--foreground)', color: 'var(--background)',
                border: 'none', borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              Finish
            </button>
          </>
        )}

        {phase === 'finished' && (
          <button
            onClick={() => setShowSummary(true)}
            style={{
              flex: 1, padding: '15px 0',
              background: 'var(--foreground)', color: 'var(--background)',
              border: 'none', borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            View Summary
          </button>
        )}
      </div>

      {/* ── Prev / Next navigation ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 20px 16px' }}>
        {currentIndex > 0 && onPrev ? (
          <button
            onClick={onPrev}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'inherit', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Previous Exercise
          </button>
        ) : <div />}
        {onNext && (
          <button
            onClick={onNext}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--foreground)', fontFamily: 'inherit', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {currentIndex < totalExercises - 1 ? 'Next Exercise' : 'Add Exercise'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>

      {/* ── Activity Summary Modal ────────────────────────────────────────── */}
      {showSummary && summaryData && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSummary(false); }}
        >
          <div style={{
            background: 'var(--card)', borderRadius: '24px 24px 0 0',
            width: '100%', maxWidth: 520, maxHeight: '90vh',
            overflow: 'auto', paddingBottom: 32,
          }}>
            {/* Header */}
            <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Complete</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', marginTop: 2 }}>{exercise.name}</div>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                style={{ background: 'var(--secondary)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Route map */}
            <div style={{ margin: '16px 20px', borderRadius: 16, overflow: 'hidden', height: 220 }}>
              <div ref={summaryMapContainerRef} style={{ width: '100%', height: '100%', background: 'var(--secondary)' }} />
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, padding: '0 20px 16px' }}>
              {[
                { label: 'Duration', value: fmtTime(summaryData.elapsedSec), unit: '' },
                { label: 'Distance', value: summaryData.distance.toFixed(2), unit: distanceUnit === 'miles' ? 'mi' : 'km' },
                { label: 'Pace', value: fmtPace(summaryData.elapsedSec, summaryData.distance, distanceUnit), unit: '' },
                { label: 'Calories', value: String(summaryData.calories), unit: 'kcal' },
              ].map(({ label, value, unit }) => (
                <div key={label} style={{
                  background: 'var(--secondary)', borderRadius: 14,
                  padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)', letterSpacing: -0.5 }}>{value}</span>
                    {unit && <span style={{ fontSize: 12, color: 'var(--muted-foreground)', fontWeight: 500 }}>{unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Log button */}
            <div style={{ padding: '0 20px' }}>
              <button
                onClick={handleLogSession}
                disabled={isLogging}
                style={{
                  width: '100%', padding: '16px 0',
                  background: isLogging ? 'var(--muted)' : 'var(--foreground)',
                  color: isLogging ? 'var(--muted-foreground)' : 'var(--background)',
                  border: 'none', borderRadius: 14,
                  fontSize: 16, fontWeight: 700, cursor: isLogging ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {isLogging ? 'Saving…' : 'Save Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { GPS_TRACKABLE };
