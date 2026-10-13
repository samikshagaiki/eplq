export function haversine(lat1, lng1, lat2, lng2) {
  const values = [lat1, lng1, lat2, lng2].map(Number);
  if (!values.every(Number.isFinite)) return Infinity;
  [lat1, lng1, lat2, lng2] = values;
  if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lng1) > 180 || Math.abs(lng2) > 180) return Infinity;
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLng = radians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, a)));
}

// A simple client-side quadtree: it indexes decrypted POIs only in the browser.
// It is a performance aid, not a cryptographic or server-side privacy index.
export class PointQuadtree {
  constructor(points, bounds = { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180 }, capacity = 12, depth = 0) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.depth = depth;
    this.points = [];
    this.children = null;
    for (const point of points) this.insert(point);
  }

  contains(point) {
    const { minLat, maxLat, minLng, maxLng } = this.bounds;
    return point.lat >= minLat && point.lat <= maxLat && point.lng >= minLng && point.lng <= maxLng;
  }

  insert(point) {
    if (!this.contains(point)) return false;
    if (!this.children && (this.points.length < this.capacity || this.depth >= 12)) {
      this.points.push(point);
      return true;
    }
    if (!this.children) this.subdivide();
    return this.children.some((child) => child.insert(point));
  }

  subdivide() {
    const { minLat, maxLat, minLng, maxLng } = this.bounds;
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const d = this.depth + 1;
    this.children = [
      new PointQuadtree([], { minLat, maxLat: midLat, minLng, maxLng: midLng }, this.capacity, d),
      new PointQuadtree([], { minLat, maxLat: midLat, minLng: midLng, maxLng }, this.capacity, d),
      new PointQuadtree([], { minLat: midLat, maxLat, minLng, maxLng: midLng }, this.capacity, d),
      new PointQuadtree([], { minLat: midLat, maxLat, minLng: midLng, maxLng }, this.capacity, d),
    ];
    const previous = this.points;
    this.points = [];
    for (const point of previous) this.children.some((child) => child.insert(point));
  }

  query(bounds, output = []) {
    const a = this.bounds;
    if (bounds.maxLat < a.minLat || bounds.minLat > a.maxLat || bounds.maxLng < a.minLng || bounds.minLng > a.maxLng) return output;
    for (const point of this.points) {
      if (point.lat >= bounds.minLat && point.lat <= bounds.maxLat && point.lng >= bounds.minLng && point.lng <= bounds.maxLng) output.push(point);
    }
    if (this.children) for (const child of this.children) child.query(bounds, output);
    return output;
  }
}

export function getBoundingBox(lat, lng, radiusKm) {
  const latDelta = radiusKm / 110.574;
  const cosine = Math.max(0.01, Math.cos(lat * Math.PI / 180));
  const lngDelta = radiusKm / (111.320 * cosine);
  return {
    minLat: Math.max(-90, lat - latDelta), maxLat: Math.min(90, lat + latDelta),
    minLng: Math.max(-180, lng - lngDelta), maxLng: Math.min(180, lng + lngDelta),
  };
}
