/**
 * CardioGPSTracker
 * ─────────────────
 * Strava-style GPS activity tracker for outdoor cardio (Running, Walking, Cycling).
 *
 * Layout (Option 2 — Split Screen with collapsible dashboard):
 *  • Top section: full-width live Google Map with GPS route polyline
 *  • Bottom section: collapsible dashboard panel (timer, 2×2 metric grid, controls)
 *  • Drag handle / chevron button collapses the dashboard so the map expands
 *  • When collapsed, a slim floating HUD shows the timer on the map
 *
 * Features:
 *  • Live GPS coordinate streaming via navigator.geolocation.watchPosition
 *  • Real-time polyline drawn on a light-mode FlexTab-branded Google Map
 *  • Auto-calculated distance (Haversine formula — no Google API call needed)
 *  • Live pace (min/mi or min/km), calories, and elapsed time
 *  • Start / Pause / Resume / Finish controls
 *  • Post-session summary modal with full route map + 2×2 stats grid
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

// ── Brand-matched Google Maps styles (light mode — matches Option 2 prototype) ─
// Clean off-white (#f0f1f3) base, dark navy (#1a2332) roads & labels
const LIGHT_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f0f1f3" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#1a2332" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e2e4e8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#d4d7de" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#c8ccd4" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d8e8" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d8ead8" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d0d4dc" }] },
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
let mapScriptPromise: Promise<void> | null = null;
function loadMapScript(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (mapScriptPromise) return mapScriptPromise;
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
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Activity icon SVG ─────────────────────────────────────────────────────────
function ActivityIcon({ name, size = 20 }: { name: string; size?: number }) {
  if (name === 'Cycling') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
        <path d="M15 6a1 1 0 0 0-1-1h-1l-5 8h7l1-4"/>
        <path d="M12 6h5l2 6"/>
      </svg>
    );
  }
  if (name === 'Walking') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="4" r="1.5"/>
        <path d="M9 8l1.5 3L8 14h3l1 4"/>
        <path d="M15 8l-1.5 3L16 14h-3l-1 4"/>
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="1.5"/>
      <path d="M8 12l2-4 2 2 2-2 2 4"/>
      <path d="M7 17l2-5h6l2 5"/>
    </svg>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  icon, label, value, unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div style={{
      background: 'var(--secondary)',
      borderRadius: 16,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)' }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--foreground)', letterSpacing: -1, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: 'var(--muted-foreground)', fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
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
  const [distanceMetres, setDistanceMetres] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAvailable, setGpsAvailable] = useState(true);
  const [isLogging, setIsLogging] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
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
  const polylineRef = useRef<google.maps.Polyline | null>(null);
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
  const unitLabel = distanceUnit === 'miles' ? 'mi' : 'km';

  // ── Initialise live map ────────────────────────────────────────────────────
  const initLiveMap = useCallback(async (container: HTMLDivElement) => {
    await loadMapScript();
    const dark = isDarkMode();
    const map = new window.google.maps.Map(container, {
      zoom: 16,
      center: { lat: 37.7749, lng: -122.4194 },
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
      streetViewControl: false,
      gestureHandling: 'greedy',
      mapId: "DEMO_MAP_ID",
      styles: dark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
    });
    const polyline = new window.google.maps.Polyline({
      map,
      path: [],
      strokeColor: "#1a2332",
      strokeOpacity: 1,
      strokeWeight: 5,
      geodesic: true,
    });
    mapRef.current = map;
    polylineRef.current = polyline;
  }, []);

  // ── Initialise summary map ─────────────────────────────────────────────────
  const initSummaryMap = useCallback(async (container: HTMLDivElement, coords: LatLng[]) => {
    await loadMapScript();
    const dark = isDarkMode();
    const map = new window.google.maps.Map(container, {
      zoom: 14,
      center: coords[0] ?? { lat: 37.7749, lng: -122.4194 },
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: false,
      streetViewControl: false,
      gestureHandling: 'none',
      mapId: "DEMO_MAP_ID",
      styles: dark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
    });
    const polyline = new window.google.maps.Polyline({
      map,
      path: coords,
      strokeColor: "#1a2332",
      strokeOpacity: 1,
      strokeWeight: 5,
      geodesic: true,
    });
    if (coords.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      coords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, 48);
    }
    // Start marker (green)
    if (coords.length > 0) {
      const startDot = document.createElement("div");
      startDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)";
      new window.google.maps.marker.AdvancedMarkerElement({ map, position: coords[0], content: startDot });
    }
    // End marker (red)
    if (coords.length > 1) {
      const endDot = document.createElement("div");
      endDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)";
      new window.google.maps.marker.AdvancedMarkerElement({ map, position: coords[coords.length - 1], content: endDot });
    }
    // Suppress unused warning
    void polyline;
  }, []);

  // Mount: initialise live map + check GPS
  useEffect(() => {
    if (mapContainerRef.current) {
      initLiveMap(mapContainerRef.current);
    }
    if (!navigator.geolocation) {
      setGpsAvailable(false);
    }
    return () => {
      stopGPS();
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Summary map: init when modal opens
  useEffect(() => {
    if (!showSummary || !summaryMapContainerRef.current || !summaryData) return;
    initSummaryMap(summaryMapContainerRef.current, summaryData.coords);
  }, [showSummary, summaryData, initSummaryMap]);

  // Trigger Google Maps resize when dashboard collapses/expands (map height changes)
  useEffect(() => {
    if (mapRef.current) {
      window.google?.maps?.event?.trigger(mapRef.current, 'resize');
    }
  }, [dashboardCollapsed]);

  // ── Timer helpers ──────────────────────────────────────────────────────────
  function startTimer() {
    startTimeRef.current = Date.now() - pausedSecRef.current * 1000;
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  // ── GPS helpers ────────────────────────────────────────────────────────────
  function startGPS() {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPoint: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const prev = coordsRef.current;
        if (prev.length > 0) {
          const delta = haversineMetres(prev[prev.length - 1], newPoint);
          if (delta < 50) {
            distanceRef.current += delta;
            setDistanceMetres(distanceRef.current);
          }
        }
        coordsRef.current = [...prev, newPoint];

        if (mapRef.current && polylineRef.current) {
          polylineRef.current.setPath(coordsRef.current);
          mapRef.current.panTo(newPoint);

          if (currentMarkerRef.current) {
            currentMarkerRef.current.position = newPoint;
          } else {
            const dot = document.createElement("div");
            dot.style.cssText = "width:18px;height:18px;border-radius:50%;background:#1a2332;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)";
            currentMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current, position: newPoint, content: dot,
            });
          }

          if (!startMarkerRef.current && coordsRef.current.length === 1) {
            const startDot = document.createElement("div");
            startDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)";
            startMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current, position: newPoint, content: startDot,
            });
            mapRef.current.setCenter(newPoint);
          }
        }
        setGpsError(null);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Location access denied. Enable GPS in browser settings."
            : "GPS signal lost. Move to an open area."
        );
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
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
    setSummaryData({
      elapsedSec,
      distance: distanceInUnit,
      calories,
      coords: coordsRef.current,
    });
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
        exercise.name, 1, 0, 0,
        exercise.category,
        durationMin,
        parseFloat(summaryData.distance.toFixed(2)),
        distanceUnit,
        summaryData.calories,
        routePolyline,
      );
      setShowSummary(false);
      setPhase('idle');
      setElapsedSec(0);
      setDistanceMetres(0);
      setDashboardCollapsed(false);
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

  // ── Heights ────────────────────────────────────────────────────────────────
  // Map height: taller when dashboard is collapsed (near full-screen)
  // Dashboard height: 0 (hidden) when collapsed, auto when expanded
  const MAP_HEIGHT_EXPANDED = phase === 'idle' ? 220 : 280;
  const MAP_HEIGHT_COLLAPSED = 520;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      {/* ── MAP SECTION ──────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: dashboardCollapsed ? MAP_HEIGHT_COLLAPSED : MAP_HEIGHT_EXPANDED,
            transition: 'height 0.35s cubic-bezier(0.4,0,0.2,1)',
            background: 'var(--secondary)',
          }}
        />

        {/* Activity badge — top left */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'white', borderRadius: 24,
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 7,
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          color: '#1a2332',
        }}>
          <ActivityIcon name={exercise.name} size={18} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2332' }}>{exercise.name}</span>
          {phase === 'running' && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
              boxShadow: '0 0 0 2px rgba(34,197,94,0.3)',
              display: 'inline-block', marginLeft: 2,
            }} />
          )}
        </div>

        {/* Collapse/expand toggle — top right */}
        {phase !== 'idle' && (
          <button
            onClick={() => setDashboardCollapsed(c => !c)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'white', border: 'none', borderRadius: '50%',
              width: 36, height: 36, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              color: '#1a2332',
            }}
            title={dashboardCollapsed ? 'Show dashboard' : 'Expand map'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {dashboardCollapsed
                ? <polyline points="18 15 12 9 6 15" />   /* chevron up = show dashboard */
                : <polyline points="6 9 12 15 18 9" />    /* chevron down = expand map */
              }
            </svg>
          </button>
        )}

        {/* Floating mini-HUD when dashboard is collapsed */}
        {dashboardCollapsed && phase !== 'idle' && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '10px 20px',
            display: 'flex', alignItems: 'center', gap: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            color: '#1a2332',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 1 }}>Time</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{fmtTime(elapsedSec)}</div>
            </div>
            <div style={{ width: 1, height: 32, background: '#e5e7eb' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 1 }}>Dist</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{distanceInUnit.toFixed(2)}<span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginLeft: 2 }}>{unitLabel}</span></div>
            </div>
            <div style={{ width: 1, height: 32, background: '#e5e7eb' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 1 }}>Pace</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{pace}<span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginLeft: 2 }}>/{unitLabel}</span></div>
            </div>
          </div>
        )}

        {/* GPS error banner */}
        {gpsError && (
          <div style={{
            position: 'absolute', bottom: 8, left: 8, right: 8,
            background: 'rgba(239,68,68,0.92)', color: 'white',
            borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}>
            {gpsError}
          </div>
        )}

        {/* GPS unavailable overlay */}
        {!gpsAvailable && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}>
            <div style={{ textAlign: 'center', color: 'white', padding: 16 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>GPS not available</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>Use a device with location services</div>
            </div>
          </div>
        )}
      </div>

      {/* ── DASHBOARD SECTION (collapsible) ──────────────────────────────── */}
      <div style={{
        overflow: 'hidden',
        maxHeight: dashboardCollapsed ? 0 : 600,
        transition: 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--background)',
      }}>
        {/* Drag handle */}
        <div
          onClick={() => phase !== 'idle' && setDashboardCollapsed(c => !c)}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '10px 0 4px',
            cursor: phase !== 'idle' ? 'pointer' : 'default',
          }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>

        {/* FlexTab branding + unit toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 20px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--foreground)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.3 }}>FlexTab</span>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--secondary)', borderRadius: 20, padding: 3 }}>
            {(['miles', 'km'] as const).map(u => (
              <button
                key={u}
                onClick={() => onDistanceUnitChange(u)}
                disabled={phase === 'running'}
                style={{
                  padding: '4px 14px', borderRadius: 18, border: 'none',
                  cursor: phase === 'running' ? 'default' : 'pointer',
                  background: distanceUnit === u ? 'var(--foreground)' : 'transparent',
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

        {/* Big timer */}
        <div style={{
          textAlign: 'center',
          padding: '12px 20px 8px',
        }}>
          <span style={{
            fontSize: 56,
            fontWeight: 900,
            color: 'var(--foreground)',
            letterSpacing: -3,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {fmtTime(elapsedSec)}
          </span>
        </div>

        {/* 2×2 metric grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: '0 16px 12px',
        }}>
          <MetricCard
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
            label="Distance"
            value={distanceInUnit.toFixed(2)}
            unit={unitLabel}
          />
          <MetricCard
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
            label="Pace"
            value={pace}
            unit={`/${unitLabel}`}
          />
          <MetricCard
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>}
            label="Calories"
            value={String(calories)}
            unit="kcal"
          />
          <MetricCard
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            label="Elapsed"
            value={durationMin < 60 ? `${Math.floor(durationMin)}m` : `${Math.floor(durationMin / 60)}h ${Math.floor(durationMin % 60)}m`}
            unit=""
          />
        </div>

        {/* ── Control buttons ─────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 10 }}>
          {phase === 'idle' && (
            <button
              onClick={handleStart}
              disabled={!gpsAvailable}
              style={{
                flex: 1, padding: '16px 0',
                background: gpsAvailable ? 'var(--foreground)' : 'var(--muted)',
                color: gpsAvailable ? 'var(--background)' : 'var(--muted-foreground)',
                border: 'none', borderRadius: 16,
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
                  flex: 1, padding: '16px 0',
                  background: 'var(--secondary)', color: 'var(--foreground)',
                  border: '2px solid var(--border)', borderRadius: 16,
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
                  flex: 1, padding: '16px 0',
                  background: 'var(--foreground)', color: 'var(--background)',
                  border: 'none', borderRadius: 16,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Finish Activity
              </button>
            </>
          )}

          {phase === 'paused' && (
            <>
              <button
                onClick={handleResume}
                style={{
                  flex: 1, padding: '16px 0',
                  background: 'var(--secondary)', color: 'var(--foreground)',
                  border: '2px solid var(--border)', borderRadius: 16,
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
                  flex: 1, padding: '16px 0',
                  background: 'var(--foreground)', color: 'var(--background)',
                  border: 'none', borderRadius: 16,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Finish Activity
              </button>
            </>
          )}

          {phase === 'finished' && (
            <button
              onClick={() => setShowSummary(true)}
              style={{
                flex: 1, padding: '16px 0',
                background: 'var(--foreground)', color: 'var(--background)',
                border: 'none', borderRadius: 16,
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              View Summary
            </button>
          )}
        </div>

        {/* ── Prev / Next navigation ───────────────────────────────────────── */}
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
      </div>

      {/* ── ACTIVITY SUMMARY MODAL ───────────────────────────────────────── */}
      {showSummary && summaryData && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSummary(false); }}
        >
          <div style={{
            background: 'var(--card)', borderRadius: '24px 24px 0 0',
            width: '100%', maxWidth: 540, maxHeight: '92vh',
            overflow: 'auto', paddingBottom: 36,
          }}>
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>

            {/* Header */}
            <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity Complete</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--foreground)', marginTop: 2, letterSpacing: -0.5 }}>{exercise.name}</div>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                style={{ background: 'var(--secondary)', border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Route map */}
            <div style={{ margin: '14px 20px', borderRadius: 18, overflow: 'hidden', height: 240, background: 'var(--secondary)' }}>
              <div ref={summaryMapContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>

            {/* 2×2 stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 16px' }}>
              {[
                {
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                  label: 'Duration', value: fmtTime(summaryData.elapsedSec), unit: '',
                },
                {
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
                  label: 'Distance', value: summaryData.distance.toFixed(2), unit: unitLabel,
                },
                {
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
                  label: 'Pace', value: fmtPace(summaryData.elapsedSec, summaryData.distance, distanceUnit), unit: `/${unitLabel}`,
                },
                {
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
                  label: 'Calories', value: String(summaryData.calories), unit: 'kcal',
                },
              ].map(({ icon, label, value, unit }) => (
                <div key={label} style={{ background: 'var(--secondary)', borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted-foreground)', marginBottom: 6 }}>
                    {icon}
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--foreground)', letterSpacing: -0.5 }}>{value}</span>
                    {unit && <span style={{ fontSize: 13, color: 'var(--muted-foreground)', fontWeight: 600 }}>{unit}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Save button */}
            <div style={{ padding: '0 20px' }}>
              <button
                onClick={handleLogSession}
                disabled={isLogging}
                style={{
                  width: '100%', padding: '17px 0',
                  background: isLogging ? 'var(--muted)' : 'var(--foreground)',
                  color: isLogging ? 'var(--muted-foreground)' : 'var(--background)',
                  border: 'none', borderRadius: 16,
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
