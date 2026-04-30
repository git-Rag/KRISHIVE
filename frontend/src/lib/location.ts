export type FarmerLocation = {
  district: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  source: "gps" | "ip" | "cache" | "manual";
};

const LOCATION_CACHE_KEY = "krishive_location_cache_v1";
const LOCATION_SESSION_KEY = "krishive_location_session_v1";

function readCachedLocation(): FarmerLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(LOCATION_CACHE_KEY);
    if (!value) return null;
    return JSON.parse(value) as FarmerLocation;
  } catch {
    return null;
  }
}

function writeCachedLocation(location: FarmerLocation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
  window.sessionStorage.setItem(LOCATION_SESSION_KEY, "1");
}

async function reverseGeocode(lat: number, lon: number): Promise<Pick<FarmerLocation, "district" | "state" | "country">> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Reverse geocoding failed");
  const data = (await response.json()) as {
    address?: {
      state_district?: string;
      county?: string;
      city?: string;
      town?: string;
      state?: string;
      country?: string;
    };
  };
  return {
    district: data.address?.state_district || data.address?.county || data.address?.city || data.address?.town || "Unknown district",
    state: data.address?.state || "Unknown state",
    country: data.address?.country || "Unknown country",
  };
}

async function detectFromIp(): Promise<FarmerLocation> {
  const response = await fetch("https://ipapi.co/json/");
  if (!response.ok) throw new Error("IP location lookup failed");
  const data = (await response.json()) as {
    city?: string;
    region?: string;
    country_name?: string;
    latitude?: number;
    longitude?: number;
  };
  return {
    district: data.city || "Unknown district",
    state: data.region || "Unknown state",
    country: data.country_name || "Unknown country",
    lat: Number(data.latitude || 0),
    lon: Number(data.longitude || 0),
    source: "ip",
  };
}

export async function detectFarmerLocation(): Promise<FarmerLocation> {
  const cached = readCachedLocation();
  if (cached && (window.sessionStorage.getItem(LOCATION_SESSION_KEY) === "1" || !navigator.onLine)) {
    return { ...cached, source: "cache" };
  }

  if (!navigator.onLine && cached) {
    return { ...cached, source: "cache" };
  }

  try {
    const coords = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 600000,
      });
    });
    const lat = Number(coords.coords.latitude.toFixed(5));
    const lon = Number(coords.coords.longitude.toFixed(5));
    const place = await reverseGeocode(lat, lon);
    const location: FarmerLocation = { ...place, lat, lon, source: "gps" };
    writeCachedLocation(location);
    return location;
  } catch {
    const ipLocation = await detectFromIp();
    writeCachedLocation(ipLocation);
    return ipLocation;
  }
}

export function saveManualLocation(district: string, state = "Unknown state"): FarmerLocation {
  const location: FarmerLocation = {
    district: district.trim() || "Unknown district",
    state: state.trim() || "Unknown state",
    country: "India",
    lat: 0,
    lon: 0,
    source: "manual",
  };
  writeCachedLocation(location);
  return location;
}

export function getCachedLocation() {
  return readCachedLocation();
}

