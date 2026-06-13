interface Coords {
  lat: number
  lon: number
}

/**
 * Offline lookup of "City, ST" → coordinates for distance matching. There is no
 * backend or geocoding API in this demo, so locations outside this table simply
 * can't be placed (milesBetween returns null and the UI says so).
 */
const CITY_COORDS: Record<string, Coords> = {
  'portsmouth, nh': { lat: 43.0718, lon: -70.7626 },
  'manchester, nh': { lat: 42.9956, lon: -71.4548 },
  'portland, me': { lat: 43.6591, lon: -70.2568 },
  'boston, ma': { lat: 42.3601, lon: -71.0589 },
  'cambridge, ma': { lat: 42.3736, lon: -71.1097 },
  'worcester, ma': { lat: 42.2626, lon: -71.8023 },
  'providence, ri': { lat: 41.824, lon: -71.4128 },
  'hartford, ct': { lat: 41.7658, lon: -72.6734 },
  'burlington, vt': { lat: 44.4759, lon: -73.2121 },
  'new york, ny': { lat: 40.7128, lon: -74.006 },
  'brooklyn, ny': { lat: 40.6782, lon: -73.9442 },
  'queens, ny': { lat: 40.7282, lon: -73.7949 },
  'jersey city, nj': { lat: 40.7178, lon: -74.0431 },
  'newark, nj': { lat: 40.7357, lon: -74.1724 },
  'albany, ny': { lat: 42.6526, lon: -73.7562 },
  'buffalo, ny': { lat: 42.8864, lon: -78.8784 },
  'rochester, ny': { lat: 43.1566, lon: -77.6088 },
  'philadelphia, pa': { lat: 39.9526, lon: -75.1652 },
  'pittsburgh, pa': { lat: 40.4406, lon: -79.9959 },
  'washington, dc': { lat: 38.9072, lon: -77.0369 },
  'baltimore, md': { lat: 39.2904, lon: -76.6122 },
  'richmond, va': { lat: 37.5407, lon: -77.436 },
  'charlotte, nc': { lat: 35.2271, lon: -80.8431 },
  'raleigh, nc': { lat: 35.7796, lon: -78.6382 },
  'durham, nc': { lat: 35.994, lon: -78.8986 },
  'atlanta, ga': { lat: 33.749, lon: -84.388 },
  'miami, fl': { lat: 25.7617, lon: -80.1918 },
  'orlando, fl': { lat: 28.5384, lon: -81.3789 },
  'tampa, fl': { lat: 27.9506, lon: -82.4572 },
  'nashville, tn': { lat: 36.1627, lon: -86.7816 },
  'memphis, tn': { lat: 35.1495, lon: -90.049 },
  'new orleans, la': { lat: 29.9511, lon: -90.0715 },
  'chicago, il': { lat: 41.8781, lon: -87.6298 },
  'detroit, mi': { lat: 42.3314, lon: -83.0458 },
  'ann arbor, mi': { lat: 42.2808, lon: -83.743 },
  'minneapolis, mn': { lat: 44.9778, lon: -93.265 },
  'st paul, mn': { lat: 44.9537, lon: -93.09 },
  'madison, wi': { lat: 43.0731, lon: -89.4012 },
  'milwaukee, wi': { lat: 43.0389, lon: -87.9065 },
  'st louis, mo': { lat: 38.627, lon: -90.1994 },
  'kansas city, mo': { lat: 39.0997, lon: -94.5786 },
  'columbus, oh': { lat: 39.9612, lon: -82.9988 },
  'cleveland, oh': { lat: 41.4993, lon: -81.6944 },
  'cincinnati, oh': { lat: 39.1031, lon: -84.512 },
  'indianapolis, in': { lat: 39.7684, lon: -86.1581 },
  'austin, tx': { lat: 30.2672, lon: -97.7431 },
  'dallas, tx': { lat: 32.7767, lon: -96.797 },
  'houston, tx': { lat: 29.7604, lon: -95.3698 },
  'san antonio, tx': { lat: 29.4241, lon: -98.4936 },
  'oklahoma city, ok': { lat: 35.4676, lon: -97.5164 },
  'denver, co': { lat: 39.7392, lon: -104.9903 },
  'boulder, co': { lat: 40.015, lon: -105.2705 },
  'salt lake city, ut': { lat: 40.7608, lon: -111.891 },
  'phoenix, az': { lat: 33.4484, lon: -112.074 },
  'tucson, az': { lat: 32.2226, lon: -110.9747 },
  'albuquerque, nm': { lat: 35.0844, lon: -106.6504 },
  'las vegas, nv': { lat: 36.1699, lon: -115.1398 },
  'los angeles, ca': { lat: 34.0522, lon: -118.2437 },
  'pasadena, ca': { lat: 34.1478, lon: -118.1445 },
  'irvine, ca': { lat: 33.6846, lon: -117.8265 },
  'san diego, ca': { lat: 32.7157, lon: -117.1611 },
  'santa barbara, ca': { lat: 34.4208, lon: -119.6982 },
  'san francisco, ca': { lat: 37.7749, lon: -122.4194 },
  'oakland, ca': { lat: 37.8044, lon: -122.2712 },
  'berkeley, ca': { lat: 37.8715, lon: -122.273 },
  'san jose, ca': { lat: 37.3382, lon: -121.8863 },
  'sacramento, ca': { lat: 38.5816, lon: -121.4944 },
  'seattle, wa': { lat: 47.6062, lon: -122.3321 },
  'tacoma, wa': { lat: 47.2529, lon: -122.4443 },
  'portland, or': { lat: 45.5152, lon: -122.6784 },
  'boise, id': { lat: 43.615, lon: -116.2023 },
  'anchorage, ak': { lat: 61.2181, lon: -149.9003 },
  'honolulu, hi': { lat: 21.3069, lon: -157.8583 },
}

function normalize(location: string): string {
  return location.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim()
}

export function coordsFor(location: string): Coords | null {
  return CITY_COORDS[normalize(location)] ?? null
}

function haversineMiles(a: Coords, b: Coords): number {
  const R = 3958.8
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** Distance in miles between two "City, ST" strings, or null if either is unknown. */
export function milesBetween(a: string, b: string): number | null {
  const ca = coordsFor(a)
  const cb = coordsFor(b)
  if (ca && cb) return haversineMiles(ca, cb)
  if (normalize(a) === normalize(b)) return 0
  return null
}

export function formatDistance(miles: number): string {
  return miles < 5 ? 'In your area' : `~${Math.round(miles)} mi away`
}
