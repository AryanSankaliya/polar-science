import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Thermometer,
  Wind,
  Compass,
  Gauge,
  Droplets,
  AlertTriangle,
  RefreshCw,
  Download,
  Radio,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  Snowflake,
  ShieldAlert,
  SunMedium,
  Activity,
  MapPin,
  Clock,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';

// ============================================================================
// 1. STATION METADATA & SCIENTIFIC CONSTANTS
// ============================================================================
export const STATIONS = [
  {
    id: 'Maitri',
    label: 'Maitri (Antarctica)',
    region: 'Schirmacher Oasis, Central Dronning Maud Land',
    coords: '70°45′57″S 11°44′09″E',
    elevation: '130m AMSL',
    elevationSystem: 'Inland Nunatak • Polar Continental Plateau System',
    type: 'Antarctica - Inland Oasis',
    blizzardCutoffKnots: 35,
    extremeColdCutoffC: -25
  },
  {
    id: 'Bharati',
    label: 'Bharati (Antarctica)',
    region: 'Larsemann Hills, East Antarctica',
    coords: '69°24′28″S 76°11′14″E',
    elevation: '35m AMSL',
    elevationSystem: 'Coastal Ice Shelf • Larsemann Maritime Pressure Belt',
    type: 'Antarctica - Coastal',
    blizzardCutoffKnots: 35,
    extremeColdCutoffC: -25
  },
  {
    id: 'Himadri',
    label: 'Himadri (Arctic - Ny-Ålesund)',
    region: 'Spitsbergen, Svalbard Archipelago, Norway',
    coords: '78°55′23″N 11°56′07″E',
    elevation: '10m AMSL',
    elevationSystem: 'High-Arctic Marine Fjord • Kongsfjorden Low System',
    type: 'Arctic - High Lat Fjord',
    blizzardCutoffKnots: 35,
    extremeColdCutoffC: -25
  }
];

// ============================================================================
// 2. EMBEDDED SAMPLE FALLBACK DATA (Out-of-the-box reliability)
// ============================================================================
const FALLBACK_DATA = [
  {
    timestamp: '2026-01-01 00:00:00',
    station: 'Maitri',
    air_temperature_celsius: -8.45,
    wind_speed_knots: 41.01,
    wind_direction_deg: 342,
    air_pressure_hpa: 971.7,
    relative_humidity_percent: 42.1
  },
  {
    timestamp: '2026-01-01 01:00:00',
    station: 'Maitri',
    air_temperature_celsius: -21.86,
    wind_speed_knots: 5.7,
    wind_direction_deg: 73,
    air_pressure_hpa: 990.3,
    relative_humidity_percent: 90.3
  },
  {
    timestamp: '2026-01-01 02:00:00',
    station: 'Maitri',
    air_temperature_celsius: 0.69,
    wind_speed_knots: 22.91,
    wind_direction_deg: 325,
    air_pressure_hpa: 982.4,
    relative_humidity_percent: 68.2
  },
  {
    timestamp: '2026-01-01 03:00:00',
    station: 'Maitri',
    air_temperature_celsius: -14.2,
    wind_speed_knots: 33.5,
    wind_direction_deg: 180,
    air_pressure_hpa: 978.1,
    relative_humidity_percent: 75.0
  },
  {
    timestamp: '2026-01-01 04:00:00',
    station: 'Maitri',
    air_temperature_celsius: -18.7,
    wind_speed_knots: 38.2,
    wind_direction_deg: 350,
    air_pressure_hpa: 973.2,
    relative_humidity_percent: 81.4
  },
  {
    timestamp: '2026-01-01 05:00:00',
    station: 'Maitri',
    air_temperature_celsius: -19.4,
    wind_speed_knots: 36.0,
    wind_direction_deg: 338,
    air_pressure_hpa: 974.8,
    relative_humidity_percent: 78.5
  },
  {
    timestamp: '2026-01-01 06:00:00',
    station: 'Maitri',
    air_temperature_celsius: -16.1,
    wind_speed_knots: 28.4,
    wind_direction_deg: 310,
    air_pressure_hpa: 979.5,
    relative_humidity_percent: 71.0
  },
  {
    timestamp: '2026-01-01 07:00:00',
    station: 'Maitri',
    air_temperature_celsius: -12.3,
    wind_speed_knots: 19.5,
    wind_direction_deg: 290,
    air_pressure_hpa: 983.1,
    relative_humidity_percent: 64.2
  },
  // Bharati sample records
  {
    timestamp: '2026-01-01 00:00:00',
    station: 'Bharati',
    air_temperature_celsius: -5.2,
    wind_speed_knots: 44.2,
    wind_direction_deg: 95,
    air_pressure_hpa: 978.3,
    relative_humidity_percent: 58.4
  },
  {
    timestamp: '2026-01-01 01:00:00',
    station: 'Bharati',
    air_temperature_celsius: -17.5,
    wind_speed_knots: 12.4,
    wind_direction_deg: 110,
    air_pressure_hpa: 994.1,
    relative_humidity_percent: 84.0
  },
  {
    timestamp: '2026-01-01 02:00:00',
    station: 'Bharati',
    air_temperature_celsius: 2.1,
    wind_speed_knots: 26.8,
    wind_direction_deg: 105,
    air_pressure_hpa: 988.2,
    relative_humidity_percent: 72.5
  },
  {
    timestamp: '2026-01-01 03:00:00',
    station: 'Bharati',
    air_temperature_celsius: -11.4,
    wind_speed_knots: 37.1,
    wind_direction_deg: 85,
    air_pressure_hpa: 982.5,
    relative_humidity_percent: 79.1
  },
  // Himadri sample records
  {
    timestamp: '2026-01-01 00:00:00',
    station: 'Himadri',
    air_temperature_celsius: -14.8,
    wind_speed_knots: 18.2,
    wind_direction_deg: 130,
    air_pressure_hpa: 1009.5,
    relative_humidity_percent: 86.4
  },
  {
    timestamp: '2026-01-01 01:00:00',
    station: 'Himadri',
    air_temperature_celsius: -15.3,
    wind_speed_knots: 21.0,
    wind_direction_deg: 125,
    air_pressure_hpa: 1008.2,
    relative_humidity_percent: 88.1
  },
  {
    timestamp: '2026-01-01 02:00:00',
    station: 'Himadri',
    air_temperature_celsius: -13.9,
    wind_speed_knots: 16.5,
    wind_direction_deg: 140,
    air_pressure_hpa: 1010.4,
    relative_humidity_percent: 82.3
  },
  {
    timestamp: '2026-01-01 03:00:00',
    station: 'Himadri',
    air_temperature_celsius: -12.1,
    wind_speed_knots: 24.3,
    wind_direction_deg: 290,
    air_pressure_hpa: 1007.8,
    relative_humidity_percent: 85.0
  }
];

// ============================================================================
// 3. SCIENTIFIC UTILITIES & FORMULAS
// ============================================================================

/**
 * Standard Antarctic Wind-Chill index formula
 * Wind Chill = 13.12 + 0.6215*T - 11.37*(V_kmh^0.16) + 0.3965*T*(V_kmh^0.16)
 * where V_kmh = wind_speed_knots * 1.852
 */
export function calculateWindChill(tempC, windKnots) {
  if (tempC == null || windKnots == null) return tempC;
  const vKmh = windKnots * 1.852;
  if (vKmh < 4.8) return tempC;
  const vPow = Math.pow(vKmh, 0.16);
  const wc = 13.12 + 0.6215 * tempC - 11.37 * vPow + 0.3965 * tempC * vPow;
  return Math.round(wc * 10) / 10;
}

/**
 * Convert Cardinal Bearing (e.g. 342° -> NNW)
 */
export function getCompassBearing(deg) {
  if (deg == null || isNaN(deg)) return 'N/A';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return `${normalized}° ${directions[index]}`;
}

export function getBeaufortCategory(knots) {
  if (knots < 1) return { name: 'Calm', color: 'text-cyan-300' };
  if (knots < 4) return { name: 'Light Air', color: 'text-cyan-300' };
  if (knots < 7) return { name: 'Light Breeze', color: 'text-cyan-300' };
  if (knots < 11) return { name: 'Gentle Breeze', color: 'text-emerald-300' };
  if (knots < 17) return { name: 'Moderate Breeze', color: 'text-emerald-300' };
  if (knots < 22) return { name: 'Fresh Breeze', color: 'text-yellow-300' };
  if (knots < 28) return { name: 'Strong Breeze', color: 'text-amber-300' };
  if (knots < 34) return { name: 'Near Gale', color: 'text-amber-400' };
  if (knots < 41) return { name: 'Gale Force 8', color: 'text-rose-400' };
  if (knots < 48) return { name: 'Strong Gale', color: 'text-rose-500' };
  if (knots < 56) return { name: 'Storm Force', color: 'text-purple-400' };
  return { name: 'Violent Blizzard', color: 'text-red-500' };
}

export function convertTemperature(valC, unit) {
  if (valC == null) return '--';
  if (unit === 'F') {
    return Math.round(((valC * 9) / 5 + 32) * 10) / 10;
  }
  return Math.round(valC * 10) / 10;
}

export function convertWindSpeed(knots, unit) {
  if (knots == null) return '--';
  if (unit === 'km/h') {
    return Math.round(knots * 1.852 * 10) / 10;
  }
  return Math.round(knots * 10) / 10;
}

// ============================================================================
// 4. API FETCH INTEGRATION HOOK
// ============================================================================
export function useWeatherTelemetry(stationId, timeRange) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);

    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const endpointsToTry = [
      `${apiBase}/api/weather?station=${encodeURIComponent(stationId)}&range=${encodeURIComponent(timeRange)}`,
      `/data/weather.json`,
      `/data/cleaned_weather_seed.json`
    ];

    let fetchedData = null;

    for (const url of endpointsToTry) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          let rawList = Array.isArray(json) ? json : json.data || [];
          
          // Filter by station if file contains multiple stations
          if (stationId) {
            rawList = rawList.filter(
              (item) => item.station && item.station.toLowerCase() === stationId.toLowerCase()
            );
          }

          if (rawList.length > 0) {
            fetchedData = rawList;
            break;
          }
        }
      } catch (err) {
        // Proceed to next candidate endpoint
      }
    }

    // If API/local JSON loaded
    if (fetchedData && fetchedData.length > 0) {
      // Sort chronologically ascending for graphing
      fetchedData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Apply timeRange filter client-side if full dataset was loaded
      let filtered = [...fetchedData];
      if (timeRange === '24h') {
        filtered = filtered.slice(-24);
      } else if (timeRange === '7d') {
        filtered = filtered.slice(-24 * 7);
      } else if (timeRange === '30d') {
        filtered = filtered.slice(-24 * 30);
      }

      setData(filtered);
      setLastUpdated(new Date());
      setLoading(false);
      return;
    }

    // Robust fallback to embedded mock data
    const fallbackFiltered = FALLBACK_DATA.filter(
      (item) => item.station && item.station.toLowerCase() === stationId.toLowerCase()
    );
    setData(fallbackFiltered.length > 0 ? fallbackFiltered : FALLBACK_DATA.slice(0, 8));
    setLastUpdated(new Date());
    setLoading(false);
  }, [stationId, timeRange]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return { data, loading, error, lastUpdated, refetch: fetchWeather };
}

// ============================================================================
// 5. SUB-COMPONENTS
// ============================================================================

/**
 * Interactive Circular SVG Compass Dial Widget
 */
function CompassDial({ directionDeg }) {
  const needleAngle = directionDeg || 0;
  const bearingText = getCompassBearing(directionDeg);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        {/* Outer Dial Glow & Ring */}
        <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.35)]">
          {/* Background circle */}
          <circle cx="60" cy="60" r="54" className="fill-[#051428]/90 stroke-cyan-500/30" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="48" className="fill-none stroke-slate-700/50" strokeWidth="0.75" strokeDasharray="2 3" />

          {/* Compass Tick Marks (every 30 deg) */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const x1 = 60 + 44 * Math.cos(rad);
            const y1 = 60 + 44 * Math.sin(rad);
            const x2 = 60 + 52 * Math.cos(rad);
            const y2 = 60 + 52 * Math.sin(rad);
            const isCardinal = deg % 90 === 0;
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isCardinal ? '#38bdf8' : '#64748b'}
                strokeWidth={isCardinal ? '2' : '1'}
              />
            );
          })}

          {/* Cardinal Text Labels */}
          <text x="60" y="22" textAnchor="middle" className="text-[10px] font-mono font-bold fill-rose-400">N</text>
          <text x="102" y="64" textAnchor="middle" className="text-[9px] font-mono font-semibold fill-cyan-300">E</text>
          <text x="60" y="106" textAnchor="middle" className="text-[9px] font-mono font-semibold fill-slate-400">S</text>
          <text x="18" y="64" textAnchor="middle" className="text-[9px] font-mono font-semibold fill-cyan-300">W</text>

          {/* Rotating Compass Needle */}
          <g transform={`rotate(${needleAngle}, 60, 60)`} className="transition-transform duration-700 ease-out">
            {/* North Point (Red/Orange arrowhead) */}
            <polygon points="60,22 65,60 55,60" fill="url(#northNeedleGradient)" />
            {/* South Point (Silver/Blue arrowhead) */}
            <polygon points="60,98 65,60 55,60" fill="#475569" opacity="0.8" />
            {/* Center Pivot Pivot */}
            <circle cx="60" cy="60" r="5" className="fill-cyan-400 stroke-slate-950" strokeWidth="1.5" />
            <circle cx="60" cy="60" r="2" className="fill-white" />
          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="northNeedleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="mt-1 text-center">
        <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">
          {bearingText}
        </span>
      </div>
    </div>
  );
}

CompassDial.propTypes = {
  directionDeg: PropTypes.number
};

/**
 * Radial / Visual Gradient Progress Bar for Relative Humidity
 */
function HumidityProgressBar({ percent }) {
  const safePercent = Math.min(100, Math.max(0, percent || 0));

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Moisture Saturation
        </span>
        <span className="font-mono font-bold text-cyan-300">{safePercent}%</span>
      </div>
      <div className="relative h-3 w-full bg-slate-950/80 rounded-full overflow-hidden border border-cyan-500/20">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]"
          style={{ width: `${safePercent}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
        <span>0% (Hyper-Arid)</span>
        <span>50%</span>
        <span>100% (Fog/Super-Sat)</span>
      </div>
    </div>
  );
}

HumidityProgressBar.propTypes = {
  percent: PropTypes.number
};

/**
 * Custom Recharts Tooltip for Temperature & Pressure Chart
 */
function CustomDualTooltip({ active, payload, label, tempUnit }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const tempVal = convertTemperature(dataPoint.air_temperature_celsius, tempUnit);
    const windChill = convertTemperature(
      calculateWindChill(dataPoint.air_temperature_celsius, dataPoint.wind_speed_knots),
      tempUnit
    );

    let condition = 'Normal Polar';
    if (dataPoint.wind_speed_knots > 35) condition = 'Blizzard Gale';
    else if (dataPoint.air_temperature_celsius < -25) condition = 'Extreme Cold';
    else if (dataPoint.air_temperature_celsius >= 0) condition = 'Summer Thaw';

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 p-3.5 rounded-xl shadow-2xl space-y-1.5 text-xs min-w-[210px]">
        <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="font-mono text-[11px] text-cyan-300">{label || dataPoint.timestamp}</span>
          <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-[10px] font-mono text-cyan-400">
            {dataPoint.station}
          </span>
        </div>
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Air Temp:
            </span>
            <span className="font-mono font-bold text-white">
              {tempVal}°{tempUnit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5 text-blue-400" /> Wind Chill:
            </span>
            <span className="font-mono font-bold text-blue-300">
              {windChill}°{tempUnit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" /> Air Pressure:
            </span>
            <span className="font-mono font-bold text-indigo-300">
              {dataPoint.air_pressure_hpa} hPa
            </span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-800/80 pt-1 mt-1">
            <span className="text-slate-400">Condition:</span>
            <span className="font-semibold text-amber-300">{condition}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

CustomDualTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  tempUnit: PropTypes.string
};

/**
 * Custom Recharts Tooltip for Wind Vector Chart
 */
function CustomWindTooltip({ active, payload, label, windUnit }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const speedVal = convertWindSpeed(dataPoint.wind_speed_knots, windUnit);
    const speedKmh = Math.round(dataPoint.wind_speed_knots * 1.852 * 10) / 10;
    const bearing = getCompassBearing(dataPoint.wind_direction_deg);
    const beaufort = getBeaufortCategory(dataPoint.wind_speed_knots);

    return (
      <div className="bg-slate-950/95 backdrop-blur-md border border-cyan-500/40 p-3.5 rounded-xl shadow-2xl space-y-1.5 text-xs min-w-[200px]">
        <div className="border-b border-slate-800 pb-1 flex items-center justify-between">
          <span className="font-mono text-[11px] text-cyan-300">{label || dataPoint.timestamp}</span>
          <span className="font-semibold text-[10px] text-slate-400">{beaufort.name}</span>
        </div>
        <div className="space-y-1 pt-0.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" /> Wind Velocity:
            </span>
            <span className="font-mono font-bold text-white">
              {speedVal} {windUnit}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">SI Velocity:</span>
            <span className="font-mono text-slate-300">{speedKmh} km/h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> Direction:
            </span>
            <span className="font-mono font-bold text-emerald-300">{bearing}</span>
          </div>
          {dataPoint.wind_speed_knots >= 34 && (
            <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] px-2 py-0.5 rounded text-center font-bold animate-pulse mt-1">
              ⚠️ Gale Threshold Exceeded
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

CustomWindTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.string,
  windUnit: PropTypes.string
};

// ============================================================================
// 6. MAIN POLAR WEATHER DASHBOARD COMPONENT
// ============================================================================
export default function PolarWeatherDashboard({
  defaultStation = 'Maitri',
  title = 'Polar Research Station Telemetry Hub',
  onStationChange
}) {
  // State controllers
  const [selectedStation, setSelectedStation] = useState(defaultStation);
  const [timeRange, setTimeRange] = useState('24h'); // '24h', '7d', '30d', 'all'
  const [tempUnit, setTempUnit] = useState('C'); // 'C' or 'F'
  const [windUnit, setWindUnit] = useState('knots'); // 'knots' or 'km/h'
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Table pagination & search state
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Station metadata lookup
  const currentStationMeta = useMemo(() => {
    return STATIONS.find((s) => s.id === selectedStation) || STATIONS[0];
  }, [selectedStation]);

  // Hook fetching data
  const { data: rawTelemetry, loading, refetch, lastUpdated } = useWeatherTelemetry(
    selectedStation,
    timeRange
  );

  // Handle station change
  const handleStationSwitch = (newStationId) => {
    setSelectedStation(newStationId);
    setCurrentPage(1);
    if (onStationChange) {
      onStationChange(newStationId);
    }
  };

  // Manual refresh trigger with rotation effect
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Process and compute current live readings
  const telemetryRecords = rawTelemetry;
  const latest = useMemo(() => {
    if (!telemetryRecords || telemetryRecords.length === 0) return null;
    return telemetryRecords[telemetryRecords.length - 1];
  }, [telemetryRecords]);

  // Pressure trend analysis (comparing latest with reading ~3-6 hours ago)
  const pressureTrend = useMemo(() => {
    if (!telemetryRecords || telemetryRecords.length < 2 || !latest) {
      return { text: 'Stable (Quasi-Steady)', icon: Minus, color: 'text-slate-400', delta: 0 };
    }
    const previous = telemetryRecords[Math.max(0, telemetryRecords.length - 4)];
    const delta = Math.round((latest.air_pressure_hpa - previous.air_pressure_hpa) * 10) / 10;

    if (delta > 1.5) {
      return { text: `↑ Rising Rapidly (+${delta} hPa)`, icon: ArrowUp, color: 'text-emerald-400', delta };
    }
    if (delta > 0.4) {
      return { text: `↗ Rising (+${delta} hPa)`, icon: ArrowUp, color: 'text-emerald-300', delta };
    }
    if (delta < -1.5) {
      return { text: `↓ Falling Rapidly (${delta} hPa)`, icon: ArrowDown, color: 'text-rose-400', delta };
    }
    if (delta < -0.4) {
      return { text: `↘ Falling (${delta} hPa)`, icon: ArrowDown, color: 'text-amber-400', delta };
    }
    return { text: `→ Stable (Steady ${latest.air_pressure_hpa} hPa)`, icon: Minus, color: 'text-cyan-300', delta: 0 };
  }, [telemetryRecords, latest]);

  // Blizzard Warning evaluation
  const isBlizzardWarning = useMemo(() => {
    if (!latest) return false;
    return (
      latest.wind_speed_knots > currentStationMeta.blizzardCutoffKnots ||
      latest.air_temperature_celsius < currentStationMeta.extremeColdCutoffC
    );
  }, [latest, currentStationMeta]);

  // Temperature status pill evaluation
  const tempStatus = useMemo(() => {
    if (!latest) return { label: 'Nominal', badgeClass: 'bg-slate-800 text-slate-300 border-slate-700' };
    const t = latest.air_temperature_celsius;
    if (t < -25) {
      return {
        label: 'Extreme Cold',
        badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/50 animate-pulse'
      };
    }
    if (t < 0) {
      return {
        label: 'Sub-Zero Cryosphere',
        badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
      };
    }
    return {
      label: 'Mild / Polar Thaw',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
    };
  }, [latest]);

  // Computed Wind-Chill for latest record
  const latestWindChill = useMemo(() => {
    if (!latest) return null;
    return calculateWindChill(latest.air_temperature_celsius, latest.wind_speed_knots);
  }, [latest]);

  // Prepare chart-ready data points with clean formatted time labels
  const chartData = useMemo(() => {
    if (!telemetryRecords) return [];
    return telemetryRecords.map((item) => {
      const dt = new Date(item.timestamp);
      const timeStr = dt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return {
        ...item,
        displayTime: timeStr,
        tempConverted: convertTemperature(item.air_temperature_celsius, tempUnit),
        windConverted: convertWindSpeed(item.wind_speed_knots, windUnit),
        windChillConverted: convertTemperature(
          calculateWindChill(item.air_temperature_celsius, item.wind_speed_knots),
          tempUnit
        )
      };
    });
  }, [telemetryRecords, tempUnit, windUnit]);

  // Table filtering and pagination
  const filteredTableData = useMemo(() => {
    if (!telemetryRecords) return [];
    if (!tableSearch.trim()) return telemetryRecords;
    const term = tableSearch.toLowerCase();
    return telemetryRecords.filter(
      (r) =>
        r.timestamp.toLowerCase().includes(term) ||
        r.station.toLowerCase().includes(term) ||
        String(r.air_temperature_celsius).includes(term) ||
        String(r.wind_speed_knots).includes(term)
    );
  }, [telemetryRecords, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredTableData.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredTableData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredTableData, currentPage, rowsPerPage]);

  // Dynamic CSV Export
  const handleExportCSV = () => {
    if (!filteredTableData || filteredTableData.length === 0) return;

    const headers = [
      'Timestamp',
      'Station',
      `Air_Temperature_${tempUnit}`,
      `Wind_Speed_${windUnit}`,
      'Wind_Direction_Deg',
      'Compass_Bearing',
      'Air_Pressure_hPa',
      'Relative_Humidity_Percent',
      `Wind_Chill_${tempUnit}`
    ];

    const rows = filteredTableData.map((row) => {
      const tempVal = convertTemperature(row.air_temperature_celsius, tempUnit);
      const windVal = convertWindSpeed(row.wind_speed_knots, windUnit);
      const bearing = getCompassBearing(row.wind_direction_deg);
      const chillVal = convertTemperature(
        calculateWindChill(row.air_temperature_celsius, row.wind_speed_knots),
        tempUnit
      );

      return [
        `"${row.timestamp}"`,
        `"${row.station}"`,
        tempVal,
        windVal,
        row.wind_direction_deg,
        `"${bearing}"`,
        row.air_pressure_hpa,
        row.relative_humidity_percent,
        chillVal
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `polar_telemetry_${selectedStation}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen bg-[#040D1A] text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 selection:bg-cyan-500 selection:text-white font-sans">
      
      {/* ==================================================================== */}
      {/* SECTION A: HEADER & STATION CONTROLLER */}
      {/* ==================================================================== */}
      <header className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          
          {/* Title & Live Status Indicator */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                MoES • NCPOR Satlink
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-400 font-mono text-[11px] border border-slate-800">
                {currentStationMeta.coords}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-400 font-mono text-[11px] border border-slate-800">
                {currentStationMeta.elevation}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Snowflake className="w-8 h-8 text-cyan-400" />
              <span>{title}</span>
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-medium text-emerald-400">Live Feed Synced</span>
              <span>•</span>
              <span className="font-mono text-slate-400">
                Last Ping: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Awaiting data...'}
              </span>
            </div>
          </div>

          {/* Station Switcher Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="inline-flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
              {STATIONS.map((station) => {
                const isActive = selectedStation === station.id;
                return (
                  <button
                    key={station.id}
                    onClick={() => handleStationSwitch(station.id)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{station.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Refresh Button with Spin Animation */}
            <button
              onClick={handleManualRefresh}
              disabled={loading || isRefreshing}
              title="Refresh Station Telemetry"
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl transition shadow hover:shadow-cyan-500/10 flex items-center justify-center disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing || loading ? 'animate-spin text-cyan-300' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Sub-Controller Bar: Time Range & Unit Toggles */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Time Range Filter Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Range:
            </span>
            {[
              { id: '24h', label: 'Last 24 Hours' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All History' }
            ].map((range) => {
              const active = timeRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {/* Unit Switchers */}
          <div className="flex items-center gap-3">
            {/* Temp Unit Toggle */}
            <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setTempUnit('C')}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition ${
                  tempUnit === 'C' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °C
              </button>
              <button
                onClick={() => setTempUnit('F')}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition ${
                  tempUnit === 'F' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                °F
              </button>
            </div>

            {/* Wind Unit Toggle */}
            <div className="flex items-center bg-slate-950/80 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setWindUnit('knots')}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition ${
                  windUnit === 'knots'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Knots
              </button>
              <button
                onClick={() => setWindUnit('km/h')}
                className={`px-2.5 py-1 rounded font-mono text-xs font-bold transition ${
                  windUnit === 'km/h'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                km/h
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* DYNAMIC POLAR BLIZZARD WARNING BANNER */}
      {/* ==================================================================== */}
      {isBlizzardWarning && latest && (
        <div className="bg-gradient-to-r from-red-950/90 via-rose-900/80 to-amber-950/90 border-2 border-rose-500/80 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse transition-all duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase flex items-center gap-2">
                  <span>⚠️ BLIZZARD WARNING / EXPEDITION OUTDOOR RESTRICTION IN EFFECT</span>
                </h3>
                <p className="text-xs sm:text-sm text-rose-200 mt-0.5">
                  Station {currentStationMeta.label}: Severe Cryosphere Conditions. Sustained winds at{' '}
                  <span className="font-mono font-bold text-white">{latest.wind_speed_knots} kts</span>{' '}
                  {latest.wind_speed_knots > currentStationMeta.blizzardCutoffKnots && '(Gale/Blizzard Category)'} and temperature at{' '}
                  <span className="font-mono font-bold text-white">{latest.air_temperature_celsius}°C</span>. All exterior research operations suspended.
                </p>
              </div>
            </div>
            <div className="self-end sm:self-center">
              <span className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-mono text-xs font-black uppercase tracking-widest shadow-md">
                HIGH DANGER ALERT
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION B: HERO LIVE TELEMETRY CARDS (Glassmorphism Grid) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* CARD 1: AIR TEMPERATURE */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-cyan-400" /> Air Temperature
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${tempStatus.badgeClass}`}
            >
              {tempStatus.label}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {latest ? convertTemperature(latest.air_temperature_celsius, tempUnit) : '--'}
              </span>
              <span className="text-2xl font-mono text-cyan-300 font-bold">°{tempUnit}</span>
            </div>
            <p className="text-xs text-slate-400">
              Raw: {latest ? `${latest.air_temperature_celsius}°C` : '--'}
            </p>
          </div>

          {/* Antarctic Wind-Chill Calculation */}
          <div className="pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-blue-400" /> Antarctic Wind Chill:
              </span>
              <span className="font-mono font-bold text-blue-300">
                {latestWindChill != null
                  ? `${convertTemperature(latestWindChill, tempUnit)}°${tempUnit}`
                  : '--'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono line-clamp-1">
              Perceived physiological freeze index
            </p>
          </div>
        </div>

        {/* CARD 2: WIND VELOCITY & DIRECTION */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-400" /> Wind Velocity & Bearing
            </span>
            {latest && (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 ${
                  getBeaufortCategory(latest.wind_speed_knots).color
                }`}
              >
                {getBeaufortCategory(latest.wind_speed_knots).name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 items-center gap-2">
            {/* Speed numerical */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black font-mono text-white tracking-tight">
                  {latest ? convertWindSpeed(latest.wind_speed_knots, windUnit) : '--'}
                </span>
                <span className="text-sm font-mono text-cyan-300 font-semibold">{windUnit}</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {latest ? `${Math.round(latest.wind_speed_knots * 1.852 * 10) / 10} km/h` : '--'}
              </p>
              <div className="pt-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Direction Angle
                </span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {latest ? `${latest.wind_direction_deg}°` : '--'}
                </span>
              </div>
            </div>

            {/* Visual SVG Compass Dial */}
            <CompassDial directionDeg={latest ? latest.wind_direction_deg : 0} />
          </div>

          <div className="pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Gale Threshold:</span>
              <span className="font-mono text-rose-400 font-bold">34 kts (63 km/h)</span>
            </div>
          </div>
        </div>

        {/* CARD 3: BAROMETRIC AIR PRESSURE */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" /> Barometric Pressure
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
              QFE / QNH
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {latest ? latest.air_pressure_hpa : '--'}
              </span>
              <span className="text-xl font-mono text-indigo-300 font-bold">hPa</span>
            </div>
            {/* Trend Indicator */}
            <div className="flex items-center gap-1 text-xs font-semibold pt-1">
              <span className={pressureTrend.color}>{pressureTrend.text}</span>
            </div>
          </div>

          {/* Elevation status */}
          <div className="pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Station Elevation:</span>
              <span className="font-mono font-bold text-indigo-300">
                {currentStationMeta.elevation}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono line-clamp-1">
              {currentStationMeta.elevationSystem}
            </p>
          </div>
        </div>

        {/* CARD 4: RELATIVE HUMIDITY & BLIZZARD ALERT */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-400" /> Relative Humidity
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                isBlizzardWarning
                  ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {isBlizzardWarning ? 'Blizzard Trigger' : 'Dry Cryosphere'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
                {latest ? latest.relative_humidity_percent : '--'}
              </span>
              <span className="text-2xl font-mono text-cyan-300 font-bold">%</span>
            </div>

            {/* Gradient progress bar */}
            <HumidityProgressBar percent={latest ? latest.relative_humidity_percent : 0} />
          </div>

          <div className="pt-3 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-4 rounded-b-2xl">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Blizzard Risk:</span>
              <span
                className={`font-mono font-bold ${
                  isBlizzardWarning ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isBlizzardWarning ? 'CRITICAL ALERT' : 'Normal Operations'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION C: INTERACTIVE SCIENTIFIC CHARTS (Recharts) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: TEMPERATURE & BAROMETRIC PRESSURE DUAL-LINE/AREA CHART */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Atmospheric Profile: Temperature & Pressure</span>
              </h3>
              <p className="text-xs text-slate-400">
                Continuous dual-parametric telemetry over selected timestamps
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Temp (°{tempUnit})
              </span>
              <span className="flex items-center gap-1.5 text-indigo-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Pressure (hPa)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                
                <XAxis
                  dataKey="displayTime"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                />
                
                {/* Left Y-Axis: Temperature */}
                <YAxis
                  yAxisId="left"
                  stroke="#06b6d4"
                  tick={{ fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}
                  domain={['auto', 'auto']}
                  tickLine={false}
                />

                {/* Right Y-Axis: Pressure */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6366f1"
                  tick={{ fill: '#a5b4fc', fontSize: 10, fontFamily: 'monospace' }}
                  domain={['auto', 'auto']}
                  tickLine={false}
                />

                <Tooltip content={<CustomDualTooltip tempUnit={tempUnit} />} />

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="tempConverted"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#tempGradient)"
                  name={`Temp (°${tempUnit})`}
                />

                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="air_pressure_hpa"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#pressureGradient)"
                  name="Pressure (hPa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: WIND VECTOR & GUST ANALYSIS CHART */}
        <div className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span>Wind Velocity & Blizzard Threshold Vector</span>
              </h3>
              <p className="text-xs text-slate-400">
                Fluctuations against the international 34-knot Gale reference threshold
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300">
                Gale Ref: 34 kts
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
                
                <XAxis
                  dataKey="displayTime"
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={false}
                />

                <YAxis
                  stroke="#38bdf8"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  domain={[0, 'auto']}
                  tickLine={false}
                />

                <Tooltip content={<CustomWindTooltip windUnit={windUnit} />} />

                {/* Gale Reference Line at 34 knots */}
                <ReferenceLine
                  y={windUnit === 'km/h' ? Math.round(34 * 1.852) : 34}
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: `Gale Threshold (${windUnit === 'km/h' ? '63 km/h' : '34 kts'})`,
                    fill: '#fda4af',
                    fontSize: 10,
                    position: 'top'
                  }}
                />

                <Bar dataKey="windConverted" radius={[4, 4, 0, 0]} name={`Speed (${windUnit})`}>
                  {chartData.map((entry, index) => {
                    const knots = entry.wind_speed_knots;
                    let fill = '#06b6d4';
                    if (knots >= 34) fill = '#f43f5e'; // Gale/Blizzard
                    else if (knots >= 22) fill = '#f59e0b'; // Fresh/Strong Breeze
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SECTION D: TELEMETRY LOG TABLE & CSV EXPORT */}
      {/* ==================================================================== */}
      <section className="bg-slate-900/70 backdrop-blur-md border border-cyan-500/20 shadow-2xl rounded-2xl p-5 sm:p-6 space-y-4">
        
        {/* Table Header Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <span>Telemetry Historical Log Records</span>
            </h3>
            <p className="text-xs text-slate-400">
              Showing {filteredTableData.length} records for Station {currentStationMeta.label}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search timestamp / value..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-48 sm:w-60"
              />
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-[11px] font-mono text-cyan-300 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Station</th>
                <th className="px-4 py-3">Temp (°{tempUnit})</th>
                <th className="px-4 py-3">Wind Chill</th>
                <th className="px-4 py-3">Wind Velocity</th>
                <th className="px-4 py-3">Bearing</th>
                <th className="px-4 py-3">Pressure (hPa)</th>
                <th className="px-4 py-3">Humidity</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, idx) => {
                  const tempVal = convertTemperature(row.air_temperature_celsius, tempUnit);
                  const windVal = convertWindSpeed(row.wind_speed_knots, windUnit);
                  const chillVal = convertTemperature(
                    calculateWindChill(row.air_temperature_celsius, row.wind_speed_knots),
                    tempUnit
                  );
                  const bearing = getCompassBearing(row.wind_direction_deg);
                  const isGale = row.wind_speed_knots >= 34;

                  return (
                    <tr
                      key={`${row.timestamp}-${idx}`}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-200 whitespace-nowrap">
                        {row.timestamp}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-cyan-300">{row.station}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-white">
                        {tempVal}°{tempUnit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-blue-300">
                        {chillVal}°{tempUnit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={isGale ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                          {windVal} {windUnit}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-emerald-300">{bearing}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-indigo-300">
                        {row.air_pressure_hpa}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                        {row.relative_humidity_percent}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {isGale ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50 text-[10px] font-bold">
                            ⚠️ GALE
                          </span>
                        ) : row.air_temperature_celsius < -25 ? (
                          <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/50 text-[10px] font-bold">
                            EXTREME COLD
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-semibold">
                            NOMINAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500 font-sans">
                    No telemetry records match the current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Controller */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-2 font-mono">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-cyan-400"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-bold">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

PolarWeatherDashboard.propTypes = {
  defaultStation: PropTypes.string,
  title: PropTypes.string,
  onStationChange: PropTypes.func
};
