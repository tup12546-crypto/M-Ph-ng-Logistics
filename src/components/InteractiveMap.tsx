/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import {
  LocationHub,
  RouteEvaluation,
  TransportMode,
  WorkshopRound
} from '../types/logistics';
import { LOCATION_HUBS } from '../data/defaultData';
import { getRealisticPathCoordinates } from '../utils/geoPaths';
import {
  calculateHaversineKm,
  formatWorkshopUSD,
  getModeLabelVi
} from '../utils/logisticsEngine';
import {
  AlertTriangle,
  Crosshair,
  Globe,
  Layers,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Scan,
  Siren,
  SlidersHorizontal,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface InteractiveMapProps {
  officialEvaluations: RouteEvaluation[];
  customEvaluations: RouteEvaluation[];
  viewingRouteId: string;
  onSelectRoute: (routeId: string) => void;
  selectedEvaluation: RouteEvaluation;
  viewingRound: WorkshopRound;
  selectedHub: LocationHub | null;
  onSelectHub: (hub: LocationHub | null) => void;
  isDark?: boolean;
}

type MapLayerStyle = 'STANDARD' | 'SATELLITE';

const MODE_COLORS_LIGHT: Record<TransportMode, string> = {
  ROAD: '#059669', // Xanh lá (Đường bộ)
  SEA: '#0284c7',  // Xanh dương biển (Đường biển)
  RAIL: '#ea580c', // Cam đất (Đường sắt)
  AIR: '#7c3aed'   // Tím đậm (Đường hàng không — tách biệt rõ với Xanh biển)
};

const MODE_COLORS_DARK: Record<TransportMode, string> = {
  ROAD: '#34d399', // Ngọc lục bảo sáng (Đường bộ)
  SEA: '#38bdf8',  // Xanh đại dương sáng (Đường biển)
  RAIL: '#fb923c', // Cam sáng (Đường sắt)
  AIR: '#c084fc'   // Tím sáng (Đường hàng không)
};

function getModeColor(mode: TransportMode, isDark: boolean): string {
  return isDark ? MODE_COLORS_DARK[mode] : MODE_COLORS_LIGHT[mode];
}

interface ContinuousSegment {
  from: [number, number];
  to: [number, number];
  startDistKm: number;
  endDistKm: number;
  lengthKm: number;
  legIdx: number;
  mode: TransportMode;
}

function createVehicleDivIcon(mode: TransportMode, code: string, isDark: boolean): L.DivIcon {
  const modeShort =
    mode === 'SEA' ? 'Tàu biển' : mode === 'AIR' ? 'Máy bay' : mode === 'RAIL' ? 'Đường sắt' : 'Xe tải';
  const modeEmoji =
    mode === 'SEA' ? '🚢' : mode === 'AIR' ? '✈️' : mode === 'RAIL' ? '🚆' : '🚛';
  const borderColor = getModeColor(mode, isDark);

  return L.divIcon({
    html: `<div style="
      position: relative;
      width: 38px;
      height: 38px;
      border-radius: 9999px;
      background: #0f172a;
      border: 3px solid ${borderColor};
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      will-change: transform;
    ">
      <span>${modeEmoji}</span>
      <span style="
        position: absolute;
        bottom: -18px;
        left: 50%;
        transform: translateX(-50%);
        background: #0f172a;
        color: #f8fafc;
        border: 1px solid ${borderColor};
        border-radius: 4px;
        padding: 1px 6px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 10px;
        font-weight: 600;
        white-space: nowrap;
      ">${code} · ${modeShort}</span>
    </div>`,
    className: 'animated-cargo-vehicle',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

function createSovereigntyMarker(label: string, coords: [number, number]): L.Marker {
  return L.marker(coords, {
    interactive: false,
    zIndexOffset: 250,
    icon: L.divIcon({
      html: `<div class="vn-archipelago-label" style="
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 7px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.82);
        color: #f8fafc;
        border: 1px solid rgba(251, 191, 36, 0.7);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.01em;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
      ">
        <span style="display:inline-block;width:6px;height:6px;border-radius:999px;background:#ef4444;border:1px solid #fde047;"></span>
        <span>${label}</span>
      </div>`,
      className: 'vn-sovereignty-marker',
      iconSize: [165, 22],
      iconAnchor: [6, 11]
    })
  });
}

interface CountryLabelSpec {
  name: string;
  coords: [number, number];
  priority?: 'primary' | 'secondary';
  minZoom?: number;
}

const REAL_WORLD_COUNTRIES: CountryLabelSpec[] = [
  // Đông Nam Á
  { name: 'Việt Nam', coords: [17.4, 106.5], priority: 'primary', minZoom: 2 },
  { name: 'Lào', coords: [19.8, 102.5], priority: 'secondary', minZoom: 5 },
  { name: 'Campuchia', coords: [12.7, 104.9], priority: 'secondary', minZoom: 5 },
  { name: 'Thái Lan', coords: [15.0, 99.6], priority: 'primary', minZoom: 3 },
  { name: 'Myanmar', coords: [21.3, 96.1], priority: 'secondary', minZoom: 5 },
  { name: 'Malaysia', coords: [4.2, 102.0], priority: 'primary', minZoom: 3 },
  { name: 'Singapore', coords: [1.1, 103.85], priority: 'primary', minZoom: 5 },
  { name: 'Indonesia', coords: [-2.2, 113.5], priority: 'primary', minZoom: 2 },
  { name: 'Philippines', coords: [13.2, 122.4], priority: 'secondary', minZoom: 4 },

  // Đông Á, Nam Á & Trung Á
  { name: 'Trung Quốc', coords: [35.4, 103.8], priority: 'primary', minZoom: 2 },
  { name: 'Ấn Độ', coords: [21.8, 79.0], priority: 'primary', minZoom: 2 },
  { name: 'Sri Lanka', coords: [7.8, 80.7], priority: 'secondary', minZoom: 5 },
  { name: 'Pakistan', coords: [30.4, 69.3], priority: 'secondary', minZoom: 4 },
  { name: 'Kazakhstan', coords: [48.1, 67.2], priority: 'primary', minZoom: 2 },
  { name: 'Nga', coords: [59.5, 62.0], priority: 'primary', minZoom: 2 },

  // Trung Đông & Bắc Phi (Hành lang Suez & Dubai)
  { name: 'Iran', coords: [32.8, 53.7], priority: 'primary', minZoom: 3 },
  { name: 'UAE', coords: [24.2, 54.4], priority: 'primary', minZoom: 4 },
  { name: 'Oman', coords: [20.5, 56.8], priority: 'secondary', minZoom: 5 },
  { name: 'Ả Rập Xê Út', coords: [24.0, 44.5], priority: 'primary', minZoom: 2 },
  { name: 'Yemen', coords: [15.6, 48.2], priority: 'secondary', minZoom: 5 },
  { name: 'Ai Cập', coords: [26.8, 30.8], priority: 'primary', minZoom: 2 },
  { name: 'Thổ Nhĩ Kỳ', coords: [39.1, 35.2], priority: 'primary', minZoom: 3 },

  // Châu Âu
  { name: 'Đức', coords: [51.3, 10.4], priority: 'primary', minZoom: 2 },
  { name: 'Pháp', coords: [46.6, 2.3], priority: 'primary', minZoom: 2 },
  { name: 'Anh', coords: [54.4, -2.5], priority: 'primary', minZoom: 3 },
  { name: 'Hà Lan', coords: [52.4, 5.4], priority: 'secondary', minZoom: 5 },
  { name: 'Bỉ', coords: [50.5, 4.5], priority: 'secondary', minZoom: 6 },
  { name: 'Thụy Sĩ', coords: [46.8, 8.2], priority: 'secondary', minZoom: 6 },
  { name: 'Áo', coords: [47.6, 14.5], priority: 'secondary', minZoom: 5 },
  { name: 'Ý', coords: [42.6, 12.6], priority: 'primary', minZoom: 3 },
  { name: 'Tây Ban Nha', coords: [40.2, -3.7], priority: 'primary', minZoom: 2 },
  { name: 'Bồ Đào Nha', coords: [39.5, -8.3], priority: 'secondary', minZoom: 5 },
  { name: 'Hy Lạp', coords: [39.1, 22.0], priority: 'secondary', minZoom: 4 },
  { name: 'Ba Lan', coords: [52.2, 19.4], priority: 'secondary', minZoom: 4 },
  { name: 'Ukraine', coords: [49.0, 31.4], priority: 'primary', minZoom: 3 }
];

function createCountryLabelMarker(
  spec: CountryLabelSpec,
  mapStyle: MapLayerStyle,
  isDark: boolean
): L.Marker {
  const isPrimary = spec.priority === 'primary';
  const isSatellite = mapStyle === 'SATELLITE';
  const textColor = isSatellite || isDark ? '#f8fafc' : '#1e293b';
  const bgStyle = isSatellite
    ? 'background: transparent;'
    : isDark
    ? 'background: rgba(30, 41, 59, 0.86); padding: 1px 5px; border-radius: 4px;'
    : 'background: rgba(235, 237, 240, 0.92); padding: 1px 5px; border-radius: 4px;';
  const halo = isSatellite
    ? '0 1px 3px rgba(2, 6, 23, 0.95), 0 0 8px rgba(2, 6, 23, 0.85)'
    : 'none';

  return L.marker(spec.coords, {
    interactive: false,
    zIndexOffset: 120,
    icon: L.divIcon({
      html: `<div style="
        display: inline-block;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: ${isPrimary ? '11px' : '10px'};
        font-weight: ${isPrimary ? '700' : '600'};
        letter-spacing: 0.03em;
        color: ${textColor};
        text-shadow: ${halo};
        ${bgStyle}
        white-space: nowrap;
        text-align: center;
        line-height: 1.25;
        pointer-events: none;
      ">${spec.name}</div>`,
      className: 'map-country-marker',
      iconSize: [110, 18],
      iconAnchor: [55, 9]
    })
  });
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  officialEvaluations,
  customEvaluations,
  viewingRouteId,
  onSelectRoute,
  selectedEvaluation,
  viewingRound,
  selectedHub,
  onSelectHub,
  isDark = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef = useRef<L.TileLayer | null>(null);
  const sovereigntyLayerRef = useRef<L.LayerGroup | null>(null);
  const countryLabelsLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const hubMarkersRef = useRef<L.LayerGroup | null>(null);
  const animatedMarkerRef = useRef<L.Marker | null>(null);
  const currentMarkerKeyRef = useRef<string>('');

  // RAF animation refs (strictly cleaned on stop/route switch/unmount)
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const lastUiSyncTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);
  const zoomSettledTimeRef = useRef<number>(0);

  const [mapStyle, setMapStyle] = useState<MapLayerStyle>('STANDARD');
  const [showCountryLabels, setShowCountryLabels] = useState<boolean>(true);
  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(false);
  const [isFullscreenMap, setIsFullscreenMap] = useState<boolean>(false);
  const [showAllRoutes, setShowAllRoutes] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [followVehicle, setFollowVehicle] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [activeLegIndex, setActiveLegIndex] = useState<number>(0);

  const allEvaluations = useMemo(
    () => [...officialEvaluations, ...customEvaluations],
    [officialEvaluations, customEvaluations]
  );

  const activeRoute = selectedEvaluation.route;
  const isRouteValid = selectedEvaluation.validation.isValid;
  const isRound2 = viewingRound === 2;

  // Build distance-parameterized continuous path for smooth interpolation
  const continuousPath = useMemo(() => {
    const segments: ContinuousSegment[] = [];
    let cumulativeKm = 0;

    activeRoute.legs.forEach((leg, legIdx) => {
      const fromHub = LOCATION_HUBS.find((h) => h.id === leg.fromHubId);
      const toHub = LOCATION_HUBS.find((h) => h.id === leg.toHubId);
      if (!fromHub || !toHub || fromHub.id === toHub.id) return;

      const pts = getRealisticPathCoordinates(fromHub, toHub, leg.mode);
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const segKm = Math.max(0.5, calculateHaversineKm(p1, p2));
        segments.push({
          from: p1,
          to: p2,
          startDistKm: cumulativeKm,
          endDistKm: cumulativeKm + segKm,
          lengthKm: segKm,
          legIdx,
          mode: leg.mode
        });
        cumulativeKm += segKm;
      }
    });

    return {
      segments,
      totalDistKm: Math.max(1, cumulativeKm)
    };
  }, [activeRoute]);

  const samplePathAtProgress = useCallback(
    (progressPct: number): { coord: [number, number]; legIdx: number; mode: TransportMode } => {
      const { segments, totalDistKm } = continuousPath;
      if (segments.length === 0) {
        const firstHub = LOCATION_HUBS.find((h) => h.id === activeRoute.hubIds[0]);
        return {
          coord: firstHub ? firstHub.coordinates : [11.0525, 106.6822],
          legIdx: 0,
          mode: 'ROAD'
        };
      }

      const clamped = Math.max(0, Math.min(100, progressPct));
      const targetKm = (clamped / 100) * totalDistKm;

      let chosen = segments[segments.length - 1];
      for (let i = 0; i < segments.length; i++) {
        if (targetKm <= segments[i].endDistKm || i === segments.length - 1) {
          chosen = segments[i];
          break;
        }
      }

      const segFrac =
        chosen.lengthKm > 0
          ? Math.max(0, Math.min(1, (targetKm - chosen.startDistKm) / chosen.lengthKm))
          : 1;

      const lat = chosen.from[0] + (chosen.to[0] - chosen.from[0]) * segFrac;
      const lng = chosen.from[1] + (chosen.to[1] - chosen.from[1]) * segFrac;

      return {
        coord: [lat, lng],
        legIdx: chosen.legIdx,
        mode: chosen.mode
      };
    },
    [continuousPath, activeRoute.hubIds]
  );

  const cancelAnimationLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const updateAnimatedMarker = useCallback(
    (progressPct: number, panCamera: boolean) => {
      const map = mapInstanceRef.current;
      if (!map || !isRouteValid) return;

      const { coord, legIdx, mode } = samplePathAtProgress(progressPct);
      const markerKey = `${activeRoute.code}-${mode}-${isDark ? 'dark' : 'light'}`;

      if (!animatedMarkerRef.current) {
        animatedMarkerRef.current = L.marker(coord, {
          icon: createVehicleDivIcon(mode, activeRoute.code, isDark),
          zIndexOffset: 1000
        }).addTo(map);
        currentMarkerKeyRef.current = markerKey;
      } else {
        animatedMarkerRef.current.setLatLng(coord);
        if (currentMarkerKeyRef.current !== markerKey) {
          animatedMarkerRef.current.setIcon(createVehicleDivIcon(mode, activeRoute.code, isDark));
          currentMarkerKeyRef.current = markerKey;
        }
      }

      if (panCamera && followVehicle && performance.now() >= zoomSettledTimeRef.current) {
        map.setView(coord, map.getZoom(), { animate: false });
      }

      return legIdx;
    },
    [activeRoute.code, followVehicle, isDark, isRouteValid, samplePathAtProgress]
  );

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [28.0, 58.0],
      zoom: 3,
      minZoom: 2,
      maxZoom: 15,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: false
    });

    routeLayersRef.current = L.layerGroup().addTo(map);
    hubMarkersRef.current = L.layerGroup().addTo(map);

    // Permanent Vietnamese sovereignty archipelago labels (Hoàng Sa & Trường Sa)
    const sovereigntyGroup = L.layerGroup().addTo(map);
    createSovereigntyMarker('Quần đảo Hoàng Sa (Việt Nam)', [16.5, 112.0]).addTo(sovereigntyGroup);
    createSovereigntyMarker('Quần đảo Trường Sa (Việt Nam)', [10.0, 114.2]).addTo(sovereigntyGroup);
    sovereigntyLayerRef.current = sovereigntyGroup;

    // Real-world country labels layer (populated in theme/style effect)
    countryLabelsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      cancelAnimationLoop();
      map.remove();
      mapInstanceRef.current = null;
      baseTileLayerRef.current = null;
      labelTileLayerRef.current = null;
      sovereigntyLayerRef.current = null;
      countryLabelsLayerRef.current = null;
      routeLayersRef.current = null;
      hubMarkersRef.current = null;
      animatedMarkerRef.current = null;
    };
  }, [cancelAnimationLoop]);

  // Render real-world country name labels with zoom-aware decluttering and crisp contrast
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = countryLabelsLayerRef.current;
    if (!map || !group) return;

    const renderLabels = () => {
      group.clearLayers();
      if (!showCountryLabels) return;
      const currentZoom = map.getZoom();
      REAL_WORLD_COUNTRIES.forEach((spec) => {
        if (currentZoom >= (spec.minZoom ?? 2)) {
          createCountryLabelMarker(spec, mapStyle, isDark).addTo(group);
        }
      });
    };

    renderLabels();
    map.on('zoomend', renderLabels);
    return () => {
      map.off('zoomend', renderLabels);
    };
  }, [showCountryLabels, mapStyle, isDark]);

  // Switch tile layers cleanly (Esri Light/Dark Gray Canvas for clean label-free Standard map, Esri World Imagery for Satellite — zero API-key watermarks, zero nine-dash line)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) {
      map.removeLayer(baseTileLayerRef.current);
      baseTileLayerRef.current = null;
    }
    if (labelTileLayerRef.current) {
      map.removeLayer(labelTileLayerRef.current);
      labelTileLayerRef.current = null;
    }

    if (mapStyle === 'SATELLITE') {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Imagery © Esri',
          maxZoom: 17
        }
      ).addTo(map);
    } else if (isDark) {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 16
        }
      ).addTo(map);
    } else {
      baseTileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles © Esri',
          maxZoom: 16
        }
      ).addTo(map);
    }
  }, [mapStyle, isDark]);

  // Fit bounds helper
  const fitActiveRouteBounds = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const coords: [number, number][] = [];
    const targetEvals = showAllRoutes ? allEvaluations : [selectedEvaluation];

    targetEvals.forEach((ev) => {
      ev.route.hubIds.forEach((hubId) => {
        const hub = LOCATION_HUBS.find((h) => h.id === hubId);
        if (hub) coords.push(hub.coordinates);
      });
    });

    if (coords.length >= 2) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [44, 44], maxZoom: 6, animate: true });
    }
  }, [allEvaluations, selectedEvaluation, showAllRoutes]);

  // Escape key exits fullscreen & resize map cleanly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenMap) {
        setIsFullscreenMap(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenMap]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [isFullscreenMap]);

  // Draw route polylines & hub markers whenever route/round/mode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayersRef.current;
    const hubGroup = hubMarkersRef.current;
    if (!map || !routeGroup || !hubGroup) return;

    routeGroup.clearLayers();
    hubGroup.clearLayers();

    // Stop simulation & clear vehicle marker if route switched or became invalid
    cancelAnimationLoop();
    setIsSimulating(false);
    progressRef.current = 0;
    setSimProgress(0);
    setActiveLegIndex(0);

    if (animatedMarkerRef.current) {
      map.removeLayer(animatedMarkerRef.current);
      animatedMarkerRef.current = null;
      currentMarkerKeyRef.current = '';
    }

    const routesToDraw = showAllRoutes ? allEvaluations : [selectedEvaluation];

    // Draw non-selected routes first (muted)
    routesToDraw.forEach((ev) => {
      const isSelected = ev.route.id === viewingRouteId;
      if (isSelected) return;

      ev.route.legs.forEach((leg) => {
        const fromHub = LOCATION_HUBS.find((h) => h.id === leg.fromHubId);
        const toHub = LOCATION_HUBS.find((h) => h.id === leg.toHubId);
        if (!fromHub || !toHub || fromHub.id === toHub.id) return;

        const pathPts = getRealisticPathCoordinates(fromHub, toHub, leg.mode);
        const line = L.polyline(pathPts, {
          color: getModeColor(leg.mode, isDark || mapStyle === 'SATELLITE'),
          weight: 2.5,
          opacity: 0.42,
          dashArray: leg.mode === 'AIR' ? '5 7' : leg.mode === 'RAIL' ? '10 5' : undefined
        });
        line.on('click', () => onSelectRoute(ev.route.id));
        line.addTo(routeGroup);
      });
    });

    const useBrightPalette = isDark || mapStyle === 'SATELLITE';

    // Draw selected route prominently — ALWAYS preserve true transport mode color!
    selectedEvaluation.route.legs.forEach((leg, legIdx) => {
      const fromHub = LOCATION_HUBS.find((h) => h.id === leg.fromHubId);
      const toHub = LOCATION_HUBS.find((h) => h.id === leg.toHubId);
      if (!fromHub || !toHub || fromHub.id === toHub.id) return;

      const hasLegError = Boolean(selectedEvaluation.validation.legErrors[legIdx]);
      const hasTrouble = isRound2 && selectedEvaluation.affectedLegIndex === legIdx;
      const pathPts = getRealisticPathCoordinates(fromHub, toHub, leg.mode);

      // Always keep the authentic transport mode color for valid legs (never paint Air/Sea legs solid red)
      const lineColor = hasLegError ? '#dc2626' : getModeColor(leg.mode, useBrightPalette);

      // Subtle rose warning halo ONLY underneath the affected leg in Round 2 so mode color stays 100% accurate
      if (hasTrouble && !hasLegError) {
        L.polyline(pathPts, {
          color: '#f43f5e',
          weight: 10,
          opacity: 0.34,
          lineCap: 'round'
        }).addTo(routeGroup);
      }

      // Crisp contrast halo for visibility on satellite & standard map
      L.polyline(pathPts, {
        color: useBrightPalette ? '#020617' : '#ffffff',
        weight: 6.5,
        opacity: 0.78
      }).addTo(routeGroup);

      const activeLine = L.polyline(pathPts, {
        color: lineColor,
        weight: 4,
        opacity: 0.98,
        dashArray: hasLegError
          ? '6 6'
          : leg.mode === 'AIR'
          ? '7 7'
          : leg.mode === 'RAIL'
          ? '10 5'
          : undefined
      }).addTo(routeGroup);

      activeLine.bindTooltip(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;">
          <strong>Chặng ${legIdx + 1}: ${fromHub.shortName} → ${toHub.shortName}</strong><br/>
          <span>${getModeLabelVi(leg.mode)} · ${leg.distanceKm.toLocaleString('vi-VN')} km</span>
          ${hasLegError ? '<br/><span style="color:#dc2626;font-weight:700;">Lỗi hạ tầng chặng này</span>' : ''}
          ${hasTrouble ? '<br/><span style="color:#e11d48;font-weight:700;">Chặng có phát sinh sự cố Vòng 2</span>' : ''}
        </div>`,
        { sticky: true }
      );
    });

    // Draw hub markers for active route
    const uniqueHubIds = Array.from(new Set(selectedEvaluation.route.hubIds));
    uniqueHubIds.forEach((hubId) => {
      const hub = LOCATION_HUBS.find((h) => h.id === hubId);
      if (!hub) return;

      const isOrigin = hub.id === selectedEvaluation.route.hubIds[0];
      const isDest =
        hub.id === selectedEvaluation.route.hubIds[selectedEvaluation.route.hubIds.length - 1];
      const isSelectedHub = selectedHub?.id === hub.id;
      // Accurately highlight ONLY the exact hub where the Round 2 incident occurs
      const hasTroubleHub =
        isRound2 && selectedEvaluation.affectedHubId === hub.id;

      if (hasTroubleHub) {
        L.circleMarker(hub.coordinates, {
          radius: 14,
          fillColor: '#f43f5e',
          color: '#f43f5e',
          weight: 2,
          opacity: 0.85,
          fillOpacity: 0.22,
          interactive: false
        }).addTo(hubGroup);
      }

      const dotColor = hasTroubleHub
        ? '#e11d48'
        : isOrigin
        ? '#059669'
        : isDest
        ? '#2563eb'
        : '#f59e0b';

      const marker = L.circleMarker(hub.coordinates, {
        radius: isSelectedHub ? 9 : isOrigin || isDest ? 8 : 6.5,
        fillColor: dotColor,
        color: '#ffffff',
        weight: isSelectedHub ? 3 : 2,
        fillOpacity: 1
      });

      marker.on('click', () => onSelectHub(hub));
      marker.bindTooltip(
        `<div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;">
          <strong>${hub.shortName}</strong> (${hub.code})
          ${hasTroubleHub ? '<br/><span style="color:#e11d48;font-weight:700;">Điểm phát sinh sự cố Giáng sinh</span>' : ''}
        </div>`,
        { direction: 'top', offset: [0, -8] }
      );
      marker.addTo(hubGroup);
    });

    // Place stationary vehicle marker at 0% if route is valid
    if (isRouteValid) {
      updateAnimatedMarker(0, false);
    }

    fitActiveRouteBounds();
  }, [
    allEvaluations,
    cancelAnimationLoop,
    fitActiveRouteBounds,
    isDark,
    isRound2,
    isRouteValid,
    mapStyle,
    onSelectHub,
    onSelectRoute,
    selectedEvaluation,
    selectedHub?.id,
    showAllRoutes,
    updateAnimatedMarker,
    viewingRouteId
  ]);

  // Smooth RAF animation loop
  useEffect(() => {
    if (!isSimulating || !isRouteValid) {
      cancelAnimationLoop();
      return;
    }

    lastFrameTimeRef.current = performance.now();
    lastUiSyncTimeRef.current = performance.now();

    const step = (now: number) => {
      const dtSec = Math.min(0.08, Math.max(0, (now - lastFrameTimeRef.current) / 1000));
      lastFrameTimeRef.current = now;

      // Full route takes ~14 seconds at 1x speed
      const deltaPct = dtSec * (100 / 14) * simSpeed;
      const nextProgress = Math.min(100, progressRef.current + deltaPct);
      progressRef.current = nextProgress;

      const legIdx = updateAnimatedMarker(nextProgress, true);

      if (now - lastUiSyncTimeRef.current >= 80 || nextProgress >= 100) {
        lastUiSyncTimeRef.current = now;
        setSimProgress(Number(nextProgress.toFixed(1)));
        if (typeof legIdx === 'number') {
          setActiveLegIndex(legIdx);
        }
      }

      if (nextProgress >= 100) {
        setIsSimulating(false);
        rafIdRef.current = null;
        return;
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationLoop();
    };
  }, [cancelAnimationLoop, isRouteValid, isSimulating, simSpeed, updateAnimatedMarker]);

  const handleTogglePlay = () => {
    if (!isRouteValid) return;

    if (isSimulating) {
      setIsSimulating(false);
      return;
    }

    if (progressRef.current >= 99.5) {
      progressRef.current = 0;
      setSimProgress(0);
      setActiveLegIndex(0);
      updateAnimatedMarker(0, false);
    }

    const map = mapInstanceRef.current;
    if (map && followVehicle) {
      const { coord } = samplePathAtProgress(progressRef.current);
      if (map.getZoom() < 5) {
        zoomSettledTimeRef.current = performance.now() + 450;
        map.flyTo(coord, 5, { duration: 0.4 });
      }
    }

    setIsSimulating(true);
  };

  const handleResetProgress = () => {
    setIsSimulating(false);
    progressRef.current = 0;
    setSimProgress(0);
    setActiveLegIndex(0);
    if (isRouteValid) {
      updateAnimatedMarker(0, false);
    }
    fitActiveRouteBounds();
  };

  const handleScrub = (value: number) => {
    if (!isRouteValid) return;
    setIsSimulating(false);
    progressRef.current = value;
    setSimProgress(value);
    const legIdx = updateAnimatedMarker(value, followVehicle);
    if (typeof legIdx === 'number') {
      setActiveLegIndex(legIdx);
    }
  };

  // Current active leg info for playback readout
  const currentLegEval =
    selectedEvaluation.legs[activeLegIndex] || selectedEvaluation.legs[0] || null;
  const originHub = selectedEvaluation.hubs[0]?.hub;
  const destHub = selectedEvaluation.hubs[selectedEvaluation.hubs.length - 1]?.hub;

  // Details for selected hub inspector
  const selectedHubEval = selectedHub
    ? selectedEvaluation.hubs.find((h) => h.hub.id === selectedHub.id) || null
    : null;
  const selectedHubIncomingLegs = selectedHub
    ? selectedEvaluation.legs.filter((l) => l.toHub.id === selectedHub.id)
    : [];
  const selectedHubOutgoingLegs = selectedHub
    ? selectedEvaluation.legs.filter((l) => l.fromHub.id === selectedHub.id)
    : [];
  const selectedHubTroubleNotes = useMemo(() => {
    if (!selectedHub || !isRound2) return [];
    const notes: string[] = [];
    if (selectedHubEval?.hasTroubleImpact && selectedHubEval.troubleImpactNote) {
      notes.push(selectedHubEval.troubleImpactNote);
    }
    selectedEvaluation.legs.forEach((leg) => {
      if (
        leg.hasTroubleImpact &&
        leg.troubleImpactNote &&
        (leg.fromHub.id === selectedHub.id || leg.toHub.id === selectedHub.id) &&
        !notes.includes(leg.troubleImpactNote)
      ) {
        notes.push(
          `Chặng ${leg.legIndex + 1} (${leg.fromHub.shortName} → ${leg.toHub.shortName}): ${leg.troubleImpactNote}`
        );
      }
    });
    return notes;
  }, [isRound2, selectedEvaluation.legs, selectedHub, selectedHubEval]);

  return (
    <section
      id="ban-do"
      className={`${
        isFullscreenMap
          ? 'fixed inset-0 z-50 flex flex-col p-3 sm:p-4 overflow-y-auto'
          : 'rounded-2xl border overflow-hidden'
      } ${
        isDark
          ? 'bg-slate-900 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Map Toolbar: Route context + 2 Primary Actions + Controls Toggle */}
      <div
        className={`px-4 sm:px-5 py-3.5 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {activeRoute.code}
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
              Bản đồ lộ trình: {originHub?.shortName || 'Việt Nam'} → {destHub?.shortName || 'Stuttgart'}
            </h2>
          </div>
          <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {selectedEvaluation.shortModeSequence} · {selectedEvaluation.totalDistanceKm.toLocaleString('vi-VN')} km ·{' '}
            {selectedEvaluation.activeTimeRangeLabel} · {formatWorkshopUSD(selectedEvaluation.totalCostUSD)} USD
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Primary Action 1: Play / Pause */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!isRouteValid}
            data-testid="map-play-toggle"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              !isRouteValid
                ? isDark
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isSimulating
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulating ? 'Tạm dừng' : 'Chạy mô phỏng'}</span>
          </button>

          {/* Primary Action 2: Fit full route */}
          <button
            type="button"
            onClick={fitActiveRouteBounds}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span>Xem toàn tuyến</span>
          </button>

          {/* Secondary grouped controls disclosure */}
          <button
            type="button"
            onClick={() => setShowControlsDrawer((v) => !v)}
            aria-expanded={showControlsDrawer}
            data-testid="map-controls-toggle"
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              showControlsDrawer
                ? isDark
                  ? 'border-blue-500 bg-blue-950/50 text-blue-300'
                  : 'border-blue-600 bg-blue-50 text-blue-700'
                : isDark
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Điều khiển bản đồ</span>
          </button>

          {isFullscreenMap && (
            <button
              type="button"
              onClick={() => setIsFullscreenMap(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Thoát toàn màn hình (Esc)</span>
            </button>
          )}
        </div>
      </div>

      {/* Invalid route lock banner */}
      {!isRouteValid && (
        <div
          role="alert"
          data-testid="map-invalid-route-alert"
          className={`px-4 sm:px-5 py-3 border-b flex items-start gap-2.5 text-sm ${
            isDark
              ? 'bg-rose-950/35 border-rose-900/60 text-rose-200'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
          <div>
            <p className="font-semibold">
              Đã khóa mô phỏng vì tuyến đang có lỗi hạ tầng hoặc điểm trùng nhau.
            </p>
            <p className="text-xs mt-0.5 opacity-90">
              {selectedEvaluation.validation.allErrors[0]}
            </p>
          </div>
        </div>
      )}

      {/* Collapsible Map Controls Panel */}
      {showControlsDrawer && (
        <div
          data-testid="map-controls-drawer"
          className={`px-4 sm:px-5 py-3 border-b flex flex-wrap items-center gap-x-5 gap-y-2.5 text-xs ${
            isDark
              ? 'border-slate-800 bg-slate-900/95 text-slate-300'
              : 'border-slate-200 bg-slate-50 text-slate-700'
          }`}
        >
          {/* Speed selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold">Tốc độ:</span>
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSimSpeed(spd)}
                className={`px-2 py-1 rounded font-mono font-semibold border transition-colors ${
                  simSpeed === spd
                    ? 'bg-blue-600 text-white border-blue-600'
                    : isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {spd.toString().replace('.', ',')}×
              </button>
            ))}
          </div>

          {/* Follow vehicle */}
          <button
            type="button"
            onClick={() => setFollowVehicle((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold border transition-colors ${
              followVehicle
                ? isDark
                  ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300'
                  : 'border-emerald-600 bg-emerald-50 text-emerald-700'
                : isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{followVehicle ? 'Đang bám theo phương tiện' : 'Tự do di chuyển bản đồ'}</span>
          </button>

          {/* Map Layer: Standard vs Satellite */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMapStyle('STANDARD')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold border transition-colors ${
                mapStyle === 'STANDARD'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                  : isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Tiêu chuẩn</span>
            </button>
            <button
              type="button"
              onClick={() => setMapStyle('SATELLITE')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold border transition-colors ${
                mapStyle === 'SATELLITE'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900'
                  : isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300'
                  : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Vệ tinh</span>
            </button>
          </div>

          {/* Toggle real-world country names */}
          <button
            type="button"
            onClick={() => setShowCountryLabels((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold border transition-colors ${
              showCountryLabels
                ? isDark
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-blue-600 bg-blue-50 text-blue-700'
                : isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{showCountryLabels ? 'Đang hiện tên quốc gia' : 'Hiện tên quốc gia'}</span>
          </button>

          {/* 1 route vs All routes */}
          <button
            type="button"
            onClick={() => setShowAllRoutes((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold border transition-colors ${
              showAllRoutes
                ? isDark
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-blue-600 bg-blue-50 text-blue-700'
                : isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showAllRoutes ? 'Đang hiện tất cả tuyến' : 'Chỉ hiện 1 tuyến đang xem'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreenMap((v) => !v)}
            data-testid="map-fullscreen-toggle"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-semibold border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
            }`}
          >
            {isFullscreenMap ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Thu nhỏ (Esc)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Toàn màn hình</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Map Canvas (clean, zero overlapping bottom HUD/legend) */}
      <div
        className={`relative w-full ${
          isFullscreenMap ? 'flex-1 min-h-[340px]' : 'h-[360px] sm:h-[430px] lg:h-[480px]'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Minimal Zoom Controls in top-right only */}
        <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            aria-label="Phóng to bản đồ"
            className={`p-2 rounded-lg border shadow-sm transition-colors ${
              isDark
                ? 'bg-slate-900/90 border-slate-700 text-slate-100 hover:bg-slate-800'
                : 'bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            aria-label="Thu nhỏ bản đồ"
            className={`p-2 rounded-lg border shadow-sm transition-colors ${
              isDark
                ? 'bg-slate-900/90 border-slate-700 text-slate-100 hover:bg-slate-800'
                : 'bg-white/95 border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dedicated Playback Progress Bar (separated below canvas — never overlaps legend) */}
      <div
        className={`px-4 sm:px-5 py-3 border-t flex flex-col gap-2 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono font-bold tabular-nums text-blue-600 dark:text-blue-400">
              {Math.round(simProgress)}%
            </span>
            {currentLegEval ? (
              <span className="truncate font-medium">
                Chặng {currentLegEval.legIndex + 1}/{selectedEvaluation.legs.length}:{' '}
                <strong>{getModeLabelVi(currentLegEval.mode)}</strong> ({currentLegEval.fromHub.shortName} →{' '}
                {currentLegEval.toHub.shortName})
              </span>
            ) : (
              <span>Chưa có chặng hợp lệ</span>
            )}
          </div>
          <button
            type="button"
            onClick={handleResetProgress}
            data-testid="map-reset-progress"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-semibold border transition-colors ${
              isDark
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại 0%</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-medium shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {originHub?.shortName || 'Xuất phát'}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={simProgress}
            disabled={!isRouteValid}
            onChange={(e) => handleScrub(Number(e.target.value))}
            aria-label="Tiến độ mô phỏng lộ trình"
            data-testid="map-progress-slider"
            className="w-full accent-blue-600 cursor-pointer disabled:opacity-50"
          />
          <span className={`text-[11px] font-medium shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {destHub?.shortName || 'Stuttgart'}
          </span>
        </div>
      </div>

      {/* Dedicated Legend & Clickable Stops Strip (strictly separated below playback bar) */}
      <div
        className={`px-4 sm:px-5 py-3 border-t flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" data-testid="map-mode-legend">
          <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Chú giải:
          </span>
          {(['ROAD', 'SEA', 'RAIL', 'AIR'] as TransportMode[]).map((mode) => {
            const swatchColor = getModeColor(mode, isDark || mapStyle === 'SATELLITE');
            const isDashed = mode === 'AIR' || mode === 'RAIL';
            return (
              <span key={mode} className="inline-flex items-center gap-1.5 font-medium">
                {isDashed ? (
                  <span
                    className="inline-block w-4 h-0"
                    style={{
                      borderTop: `2.5px dashed ${swatchColor}`
                    }}
                  />
                ) : (
                  <span
                    className="inline-block w-4 h-1 rounded-full"
                    style={{ backgroundColor: swatchColor }}
                  />
                )}
                <span>{getModeLabelVi(mode)}</span>
              </span>
            );
          })}
          {isRound2 && (
            <span className="inline-flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/35" />
              <span>Điểm sự cố Vòng 2</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`font-semibold mr-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Điểm dừng (bấm xem phí & sự cố):
          </span>
          {selectedEvaluation.hubs.map((hubEval, idx) => {
            const isSelectedStop = selectedHub?.id === hubEval.hub.id;
            return (
              <button
                key={`${hubEval.hub.id}-${idx}`}
                type="button"
                onClick={() => onSelectHub(hubEval.hub)}
                className={`px-2 py-1 rounded-md border font-medium transition-colors ${
                  isSelectedStop
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : hubEval.hasTroubleImpact && isRound2
                    ? isDark
                      ? 'border-rose-700 bg-rose-950/40 text-rose-300 hover:bg-rose-950/70'
                      : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : isDark
                    ? 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {idx + 1}. {hubEval.hub.shortName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hub Inspector Panel */}
      {selectedHub && (
        <div
          data-testid="hub-inspector-panel"
          className={`px-4 sm:px-5 py-4 border-t ${
            isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50/90'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {selectedHub.code}
                </span>
                <h3 className="text-sm sm:text-base font-bold">{selectedHub.name}</h3>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {selectedHub.address}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectHub(null)}
              aria-label="Đóng chi tiết điểm dừng"
              className={`p-1.5 rounded-lg border ${
                isDark
                  ? 'border-slate-700 text-slate-400 hover:text-slate-200'
                  : 'border-slate-200 text-slate-500 hover:text-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Incoming & Outgoing legs */}
            <div
              className={`rounded-lg border p-3 ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
              }`}
            >
              <p className={`font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Chặng vào / ra trên {activeRoute.code}
              </p>
              <p>
                <span className="font-semibold">Vào: </span>
                {selectedHubIncomingLegs.length > 0
                  ? selectedHubIncomingLegs
                      .map((l) => `${getModeLabelVi(l.mode)} từ ${l.fromHub.shortName}`)
                      .join('; ')
                  : 'Điểm xuất phát đầu tiên'}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Ra: </span>
                {selectedHubOutgoingLegs.length > 0
                  ? selectedHubOutgoingLegs
                      .map((l) => `${getModeLabelVi(l.mode)} đi ${l.toHub.shortName}`)
                      .join('; ')
                  : 'Điểm giao hàng cuối cùng'}
              </p>
            </div>

            {/* Handling fee transparency */}
            <div
              className={`rounded-lg border p-3 ${
                isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
              }`}
            >
              <p className={`font-semibold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Phí xử lý bình thường tại điểm này
              </p>
              {selectedHubEval ? (
                <>
                  <p className="font-mono font-bold text-sm tabular-nums">
                    {formatWorkshopUSD(selectedHubEval.effectiveCostUSD)} USD{' '}
                    <span className="font-sans text-xs font-normal opacity-80">
                      (~{selectedHub.avgHandlingHours} giờ xử lý)
                    </span>
                  </p>
                  <p
                    className={`mt-1 font-semibold ${
                      selectedEvaluation.pricingBasis === 'WORKSHOP_QUOTE'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {selectedEvaluation.pricingBasis === 'WORKSHOP_QUOTE'
                      ? 'Đã tính trong giá trọn gói workshop (không cộng trùng).'
                      : 'Cộng vào giá ước tính của tuyến tự thiết kế.'}
                  </p>
                </>
              ) : (
                <p className="opacity-80">Điểm này không nằm trên tuyến đang xem.</p>
              )}
            </div>

            {/* Round 2 incident at this hub */}
            <div
              className={`rounded-lg border p-3 ${
                selectedHubTroubleNotes.length > 0
                  ? isDark
                    ? 'border-rose-800/70 bg-rose-950/35 text-rose-200'
                    : 'border-rose-200 bg-rose-50 text-rose-900'
                  : isDark
                  ? 'border-slate-800 bg-slate-900'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <p className="font-semibold mb-1.5 flex items-center gap-1.5">
                {selectedHubTroubleNotes.length > 0 && <Siren className="w-3.5 h-3.5 text-rose-600" />}
                <span>Sự cố cao điểm Giáng sinh</span>
              </p>
              {!isRound2 ? (
                <p className="opacity-80">Đang xem Vòng 1 (chưa mở tin sự cố Giáng sinh).</p>
              ) : selectedHubTroubleNotes.length > 0 ? (
                <ul className="space-y-1">
                  {selectedHubTroubleNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              ) : (
                <p className="opacity-80">Không ghi nhận sự cố Vòng 2 riêng tại điểm dừng này.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
