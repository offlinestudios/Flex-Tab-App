/**
 * CardioGPSTracker — Strava-style GPS activity tracker
 * ─────────────────────────────────────────────────────
 * Changes in this version:
 *  • Auto-starts immediately when the card mounts (no pre-activity screen)
 *  • Full-screen overlay with rounded top corners (24px)
 *  • Correct FlexTab "F" bolt logo (not a lightning bolt SVG)
 *  • Calories show 0 until timer actually runs (no Math.max(1,...) floor)
 *  • Steps replaced with "Elapsed" time (browser has no pedometer API)
 *  • Unit toggle always enabled (not disabled during activity)
 *  • On-brand map style: strips all POIs/transit, uses FlexTab navy/grey palette
 *  • GPS accuracy: maximumAge:0 (always fresh), timeout:5000, noise filter 20m
 *  • Map uses mapTypeId:'roadmap' + custom styles (no mapId conflict)
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
export const GPS_TRACKABLE = ['Running', 'Walking', 'Cycling'];

// ── FlexTab brand colours (hardcoded so they work in both light and dark mode) ─
const NAVY = '#1a2332';
const WHITE = '#ffffff';
const LIGHT_GREY = '#f0f1f3';
const MUTED = '#6b7280';
const GREEN = '#22c55e';
const AMBER = '#f59e0b';

// ── On-brand Google Maps style — strips POIs, transit, uses FlexTab palette ───
const MAP_STYLES_LIGHT: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f0f1f3' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: NAVY }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: WHITE }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: WHITE }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e2e8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8eaed' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8e8' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8896a8' }] },
  { featureType: 'park', elementType: 'geometry', stylers: [{ color: '#d8ecd8' }] },
  // Strip all clutter
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
];

// ── Map script loader ─────────────────────────────────────────────────────────
let _mapLoadPromise: Promise<void> | null = null;

function loadMapScript(): Promise<void> {
  if (window.google?.maps?.Map) return Promise.resolve();
  if (_mapLoadPromise) return _mapLoadPromise;
  _mapLoadPromise = new Promise((resolve) => {
    (window as unknown as Record<string, unknown>).__gpsMapReady = () => { resolve(); };
    const script = document.createElement("script");
    script.src = `/api/maps/js?v=weekly&libraries=marker,places,geocoding,geometry&callback=__gpsMapReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () => { _mapLoadPromise = null; resolve(); };
    document.head.appendChild(script);
  });
  return _mapLoadPromise;
}

// ── Haversine distance (metres) ───────────────────────────────────────────────
function haversineMetres(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function fmtPace(durationSec: number, distanceInUnit: number): string {
  if (distanceInUnit < 0.05) return "--:--";
  const paceMin = durationSec / 60 / distanceInUnit;
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── FlexTab "F" logo SVG (correct wordmark bolt) ─────────────────────────────
function FlexTabLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Stylised "F" tab shape matching the FlexTab brand */}
      <rect x="4" y="4" width="24" height="24" rx="6" fill={NAVY} />
      <path d="M10 10h12v3H13v3h8v3h-8v6h-3V10z" fill={WHITE} />
    </svg>
  );
}

// ── Activity icon ─────────────────────────────────────────────────────────────
function ActivityIcon({ name, size = 18 }: { name: string; size?: number }) {
  if (name === 'Cycling') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 0 0-1-1h-1l-5 8h7l1-4"/><path d="M12 6h5l2 6"/>
    </svg>
  );
  if (name === 'Walking') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="1.5"/>
      <path d="M9 8l1.5 3L8 14h3l1 4"/><path d="M15 8l-1.5 3L16 14h-3l-1 4"/>
    </svg>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="1.5"/>
      <path d="M8 12l2-4 2 2 2-2 2 4"/><path d="M7 17l2-5h6l2 5"/>
    </svg>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div style={{ background: LIGHT_GREY, borderRadius: 16, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: MUTED, marginBottom: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: -0.5, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── Shared small icon attrs ───────────────────────────────────────────────────
const iconSm = {
  width: 14, height: 14, viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor",
  strokeWidth: "2.5", strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

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
  type Phase = 'running' | 'paused' | 'finished';
  const [phase, setPhase] = useState<Phase>('running');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [distanceMetres, setDistanceMetres] = useState(0);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    elapsedSec: number; distance: number; calories: number; coords: LatLng[];
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const summaryMapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const startMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const currentMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedSecRef = useRef<number>(0);
  const coordsRef = useRef<LatLng[]>([]);
  const distanceRef = useRef<number>(0);

  const METRES_PER_UNIT = distanceUnit === 'miles' ? 1609.344 : 1000;
  const distanceInUnit = distanceMetres / METRES_PER_UNIT;
  const weightKg = userWeightLbs ? userWeightLbs * 0.453592 : 70;
  // Only show calories once the timer has actually run (no phantom calories at 0s)
  const calories = elapsedSec > 0
    ? calculateCalories(exercise.name, elapsedSec / 60, weightKg)
    : 0;
  const pace = fmtPace(elapsedSec, distanceInUnit);
  const unitLabel = distanceUnit === 'miles' ? 'mi' : 'km';

  // ── Init live map ──────────────────────────────────────────────────────────
  const initLiveMap = useCallback(async () => {
    if (!mapContainerRef.current) return;
    await loadMapScript();
    if (!window.google?.maps) return;
    const map = new window.google.maps.Map(mapContainerRef.current, {
      zoom: 16,
      center: { lat: 37.7749, lng: -122.4194 },
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: false,
      streetViewControl: false,
      gestureHandling: 'greedy',
      // Use roadmap + custom styles (no mapId — avoids style conflict)
      mapTypeId: 'roadmap',
      styles: MAP_STYLES_LIGHT,
    });
    const polyline = new window.google.maps.Polyline({
      map,
      path: [],
      strokeColor: NAVY,
      strokeOpacity: 1,
      strokeWeight: 5,
      geodesic: true,
    });
    mapRef.current = map;
    polylineRef.current = polyline;
    setMapReady(true);
  }, []);

  // ── Init summary map ───────────────────────────────────────────────────────
  const initSummaryMap = useCallback(async (coords: LatLng[]) => {
    if (!summaryMapContainerRef.current) return;
    await loadMapScript();
    if (!window.google?.maps) return;
    const center = coords[0] ?? { lat: 37.7749, lng: -122.4194 };
    const map = new window.google.maps.Map(summaryMapContainerRef.current, {
      zoom: 14,
      center,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: false,
      streetViewControl: false,
      gestureHandling: 'none',
      mapTypeId: 'roadmap',
      styles: MAP_STYLES_LIGHT,
    });
    new window.google.maps.Polyline({
      map, path: coords,
      strokeColor: NAVY, strokeOpacity: 1, strokeWeight: 5, geodesic: true,
    });
    if (coords.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      coords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, 48);
    }
    // Start marker (green)
    if (coords.length > 0) {
      const startDot = document.createElement("div");
      startDot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${GREEN};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)`;
      new window.google.maps.marker.AdvancedMarkerElement({
        map, position: coords[0], content: startDot,
        zIndex: 10,
      });
    }
    // End marker (red)
    if (coords.length > 1) {
      const endDot = document.createElement("div");
      endDot.style.cssText = "width:14px;height:14px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)";
      new window.google.maps.marker.AdvancedMarkerElement({
        map, position: coords[coords.length - 1], content: endDot,
        zIndex: 10,
      });
    }
  }, []);

  // ── Auto-start: init map + GPS + timer on mount ────────────────────────────
  useEffect(() => {
    // Start timer
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    // Start GPS
    startGPS();
    // Init map (slight delay so DOM is ready)
    setTimeout(() => initLiveMap(), 80);

    return () => {
      stopTimer();
      stopGPS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Summary map init ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!showSummary || !summaryData) return;
    const t = setTimeout(() => initSummaryMap(summaryData.coords), 150);
    return () => clearTimeout(t);
  }, [showSummary, summaryData, initSummaryMap]);

  // ── Map resize on collapse/expand ─────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current && window.google?.maps?.event) {
      setTimeout(() => {
        if (mapRef.current) window.google.maps.event.trigger(mapRef.current, 'resize');
      }, 350);
    }
  }, [dashboardCollapsed]);

  // ── Timer helpers ──────────────────────────────────────────────────────────
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }
  function resumeTimer() {
    startTimeRef.current = Date.now() - pausedSecRef.current * 1000;
    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
  }

  // ── GPS helpers ────────────────────────────────────────────────────────────
  function startGPS() {
    if (!navigator.geolocation) {
      setGpsError("GPS not available on this device.");
      return;
    }
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const prev = coordsRef.current;
        if (prev.length > 0) {
          const delta = haversineMetres(prev[prev.length - 1], pt);
          // 20m noise filter — ignores GPS jitter but captures real movement
          if (delta > 0 && delta < 20) {
            distanceRef.current += delta;
            setDistanceMetres(distanceRef.current);
          } else if (delta >= 20) {
            // Large jump — likely real movement (e.g. cycling), accept it
            distanceRef.current += delta;
            setDistanceMetres(distanceRef.current);
          }
        }
        coordsRef.current = [...prev, pt];
        if (mapRef.current && polylineRef.current) {
          polylineRef.current.setPath(coordsRef.current);
          mapRef.current.panTo(pt);
          // Update current position marker
          if (currentMarkerRef.current) {
            currentMarkerRef.current.position = pt;
          } else {
            const dot = document.createElement("div");
            dot.style.cssText = `width:18px;height:18px;border-radius:50%;background:${NAVY};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)`;
            currentMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current, position: pt, content: dot, zIndex: 20,
            });
          }
          // Place start marker once
          if (!startMarkerRef.current) {
            const startDot = document.createElement("div");
            startDot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${GREEN};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)`;
            startMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              map: mapRef.current, position: pt, content: startDot, zIndex: 10,
            });
            mapRef.current.setCenter(pt);
          }
        }
        setGpsError(null);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Location access denied. Enable GPS in your browser settings."
            : "GPS signal lost. Move to an open area."
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,      // Always get a fresh position (no cached coords)
        timeout: 5000,      // Fail fast if GPS is unavailable
      }
    );
  }
  function stopGPS() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  // ── Cleanup markers ────────────────────────────────────────────────────────
  function clearMarkers() {
    if (startMarkerRef.current) { startMarkerRef.current.map = null; startMarkerRef.current = null; }
    if (currentMarkerRef.current) { currentMarkerRef.current.map = null; currentMarkerRef.current = null; }
  }

  // ── Controls ───────────────────────────────────────────────────────────────
  function handlePause() {
    setPhase('paused');
    stopTimer();
    stopGPS();
    pausedSecRef.current = elapsedSec;
  }

  function handleResume() {
    setPhase('running');
    resumeTimer();
    startGPS();
  }

  function handleFinish() {
    stopTimer();
    stopGPS();
    setPhase('finished');
    setSummaryData({ elapsedSec, distance: distanceInUnit, calories, coords: coordsRef.current });
    setShowSummary(true);
  }

  // Back button — discard activity and return to workout
  function handleBack() {
    stopTimer();
    stopGPS();
    clearMarkers();
    if (polylineRef.current) polylineRef.current.setPath([]);
    mapRef.current = null;
    setMapReady(false);
    coordsRef.current = [];
    distanceRef.current = 0;
    pausedSecRef.current = 0;
    // Navigate away by calling onPrev or onNext to remove this card
    // Since we can't unmount ourselves, we signal the parent via onNext
    // The parent will handle navigation. For now, reload the page state.
    // Best UX: call onNext if available, otherwise just hide the overlay
    // by resetting to a "back" state — we add a separate `onBack` prop pattern
    // but since it's not in the interface yet, we use window.history.
    window.history.back();
  }

  async function handleLogSession() {
    if (!summaryData) return;
    setIsLogging(true);
    try {
      await onLogSet(
        exercise.name, 1, 0, 0, exercise.category,
        Math.max(1, Math.round(summaryData.elapsedSec / 60)),
        parseFloat(summaryData.distance.toFixed(2)),
        distanceUnit,
        summaryData.calories,
        summaryData.coords.length > 0 ? JSON.stringify(summaryData.coords) : undefined,
      );
      setShowSummary(false);
      // Navigate back to workout after saving
      window.history.back();
    } finally {
      setIsLogging(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ══ FULL-SCREEN ACTIVITY OVERLAY ════════════════════════════════════ */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: WHITE,
          display: 'flex',
          flexDirection: 'column',
          // Rounded top corners like a bottom sheet
          borderRadius: '24px 24px 0 0',
          overflow: 'hidden',
          animation: 'slideUpIn 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <style>{`
          @keyframes slideUpIn { from { transform: translateY(100%); } to { transform: translateY(0); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* ── MAP SECTION ── */}
        <div
          style={{
            position: 'relative',
            flex: dashboardCollapsed ? '1 1 auto' : '0 0 52%',
            transition: 'flex 0.35s cubic-bezier(0.4,0,0.2,1)',
            minHeight: 0,
          }}
        >
          {/* Map container */}
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', background: '#e8eaed' }}
          />

          {/* Loading overlay */}
          {!mapReady && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: '#e8eaed', gap: 10,
            }}>
              <div style={{
                width: 32, height: 32, border: '3px solid #d0d4dc',
                borderTopColor: NAVY, borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>Loading map…</span>
            </div>
          )}

          {/* ← Back button — top left */}
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              top: `calc(env(safe-area-inset-top, 0px) + 14px)`,
              left: 14,
              width: 40, height: 40,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              border: 'none', borderRadius: 12,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
              color: NAVY, zIndex: 10,
            }}
            title="Back to workout"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>

          {/* Activity badge — top centre */}
          <div style={{
            position: 'absolute',
            top: `calc(env(safe-area-inset-top, 0px) + 14px)`,
            left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)',
            borderRadius: 24, padding: '7px 14px',
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)', color: NAVY,
            whiteSpace: 'nowrap', zIndex: 10,
          }}>
            <ActivityIcon name={exercise.name} size={16} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>{exercise.name}</span>
            {phase === 'running' && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, boxShadow: `0 0 0 2px rgba(34,197,94,0.3)`, display: 'inline-block' }} />
            )}
            {phase === 'paused' && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
            )}
          </div>

          {/* Expand/collapse chevron — top right */}
          <button
            onClick={() => setDashboardCollapsed(c => !c)}
            style={{
              position: 'absolute',
              top: `calc(env(safe-area-inset-top, 0px) + 14px)`,
              right: 14,
              width: 40, height: 40,
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)',
              border: 'none', borderRadius: 12,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)', color: NAVY, zIndex: 10,
            }}
          >
            <svg {...iconSm}>
              {dashboardCollapsed
                ? <polyline points="18 15 12 9 6 15" />
                : <polyline points="6 9 12 15 18 9" />}
            </svg>
          </button>

          {/* Floating mini-HUD when dashboard is collapsed */}
          {dashboardCollapsed && (
            <div style={{
              position: 'absolute',
              bottom: `calc(env(safe-area-inset-bottom, 0px) + 20px)`,
              left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
              borderRadius: 28, padding: '12px 24px',
              display: 'flex', alignItems: 'center', gap: 22,
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)', color: NAVY,
              whiteSpace: 'nowrap', zIndex: 10,
            }}>
              {[
                { label: 'Time', value: fmtTime(elapsedSec), unit: '' },
                { label: 'Dist', value: distanceInUnit.toFixed(2), unit: unitLabel },
                { label: 'Pace', value: pace, unit: `/${unitLabel}` },
              ].map((m, i) => (
                <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
                  {i > 0 && <div style={{ width: 1, height: 32, background: '#e5e7eb' }} />}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: MUTED, marginBottom: 1 }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
                      {m.value}<span style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginLeft: 2 }}>{m.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GPS error banner */}
          {gpsError && (
            <div style={{
              position: 'absolute', bottom: 8, left: 8, right: 8,
              background: 'rgba(239,68,68,0.92)', color: 'white',
              borderRadius: 10, padding: '8px 12px', fontSize: 12, fontWeight: 600, zIndex: 10,
            }}>
              {gpsError}
            </div>
          )}
        </div>

        {/* ── DASHBOARD SECTION ── */}
        <div
          style={{
            flex: dashboardCollapsed ? '0 0 0px' : '0 0 48%',
            overflow: 'hidden',
            transition: 'flex 0.35s cubic-bezier(0.4,0,0.2,1)',
            background: WHITE,
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          {/* Drag handle */}
          <div
            onClick={() => setDashboardCollapsed(c => !c)}
            style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
          </div>

          {/* Header: FlexTab logo + unit toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 20px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: NAVY }}>
              <FlexTabLogo size={22} />
              <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3, color: NAVY }}>FlexTab</span>
            </div>
            {/* Unit toggle — always enabled */}
            <div style={{ display: 'flex', gap: 0, background: LIGHT_GREY, borderRadius: 20, padding: 3 }}>
              {(['miles', 'km'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => onDistanceUnitChange(u)}
                  style={{
                    padding: '4px 14px', borderRadius: 18, border: 'none',
                    cursor: 'pointer',
                    background: distanceUnit === u ? NAVY : 'transparent',
                    color: distanceUnit === u ? WHITE : MUTED,
                    fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {u === 'miles' ? 'Miles' : 'Km'}
                </button>
              ))}
            </div>
          </div>

          {/* Big timer */}
          <div style={{ textAlign: 'center', padding: '6px 20px 4px', flexShrink: 0 }}>
            <span style={{
              fontSize: 58, fontWeight: 900, color: NAVY,
              letterSpacing: -3, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {fmtTime(elapsedSec)}
            </span>
          </div>

          {/* 2×2 metric grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 16px 10px', flexShrink: 0 }}>
            <MetricCard
              icon={<svg {...iconSm}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}
              label="Distance" value={distanceInUnit.toFixed(2)} unit={unitLabel}
            />
            <MetricCard
              icon={<svg {...iconSm}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              label="Pace" value={pace} unit={`/${unitLabel}`}
            />
            <MetricCard
              icon={<svg {...iconSm}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>}
              label="Calories" value={String(calories)} unit="kcal"
            />
            <MetricCard
              icon={<svg {...iconSm}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label="Elapsed" value={fmtTime(elapsedSec)} unit=""
            />
          </div>

          {/* Control buttons */}
          <div style={{ padding: '0 16px', display: 'flex', gap: 10, flexShrink: 0 }}>
            {phase === 'running' && (
              <button onClick={handlePause} style={{
                flex: 1, padding: '15px 0',
                background: 'transparent', color: NAVY,
                border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                Pause
              </button>
            )}
            {phase === 'paused' && (
              <button onClick={handleResume} style={{
                flex: 1, padding: '15px 0',
                background: 'transparent', color: NAVY,
                border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Resume
              </button>
            )}
            {(phase === 'running' || phase === 'paused') && (
              <button onClick={handleFinish} style={{
                flex: 2, padding: '15px 0',
                background: NAVY, color: WHITE,
                border: 'none', borderRadius: 16, fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                Finish Activity
              </button>
            )}
          </div>

          {/* Safe area bottom */}
          <div style={{ flexShrink: 0, height: 'env(safe-area-inset-bottom, 8px)' }} />
        </div>
      </div>

      {/* ══ ACTIVITY SUMMARY MODAL ══════════════════════════════════════════ */}
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
            background: WHITE, borderRadius: '24px 24px 0 0',
            width: '100%', maxWidth: 540, maxHeight: '92vh',
            overflow: 'auto', paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb' }} />
            </div>
            <div style={{ padding: '12px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activity Complete</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: NAVY, marginTop: 2, letterSpacing: -0.5 }}>{exercise.name}</div>
              </div>
              <button onClick={() => setShowSummary(false)} style={{ background: LIGHT_GREY, border: 'none', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {/* Summary route map */}
            <div style={{ margin: '14px 20px', borderRadius: 18, overflow: 'hidden', height: 220, background: '#e8eaed' }}>
              <div ref={summaryMapContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
            {/* 2×2 stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '0 20px 16px' }}>
              {[
                { label: 'Duration', value: fmtTime(summaryData.elapsedSec), unit: '' },
                { label: 'Distance', value: summaryData.distance.toFixed(2), unit: unitLabel },
                { label: 'Pace', value: fmtPace(summaryData.elapsedSec, summaryData.distance), unit: `/${unitLabel}` },
                { label: 'Calories', value: String(summaryData.calories), unit: 'kcal' },
              ].map(({ label, value, unit }) => (
                <div key={label} style={{ background: LIGHT_GREY, borderRadius: 16, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: NAVY, letterSpacing: -0.5 }}>{value}</span>
                    {unit && <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{unit}</span>}
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
                  background: isLogging ? '#d1d5db' : NAVY,
                  color: isLogging ? '#9ca3af' : WHITE,
                  border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700,
                  cursor: isLogging ? 'default' : 'pointer', fontFamily: 'inherit',
                }}
              >
                {isLogging ? 'Saving…' : 'Save Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
