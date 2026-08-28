export interface BusinessLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  primary: boolean;
  googleLocationId?: string;
}

export interface GoogleBusinessConnection {
  status: "disconnected" | "pending" | "connected";
  accountEmail?: string;
  connectedAt?: string;
}

const LOCATIONS_KEY = "robia_business_locations";
const GOOGLE_KEY = "robia_google_business_connection";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}

export function readBusinessLocations(): BusinessLocation[] {
  return read<BusinessLocation[]>(LOCATIONS_KEY, []);
}

export function saveBusinessLocations(locations: BusinessLocation[]) {
  window.localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
}

export function readGoogleBusinessConnection(): GoogleBusinessConnection {
  return read<GoogleBusinessConnection>(GOOGLE_KEY, { status: "disconnected" });
}

export function saveGoogleBusinessConnection(connection: GoogleBusinessConnection) {
  window.localStorage.setItem(GOOGLE_KEY, JSON.stringify(connection));
}