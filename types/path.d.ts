interface GeometryPoint {
  type: "Point";
  coordinates: [number, number, number]; // [longitude, latitude, altitude]
}

interface GeometryLineString {
  type: "LineString";
  coordinates: [number, number, number][]; // Array of [longitude, latitude, altitude]
}

type Geometry = GeometryPoint | GeometryLineString;

interface Properties {
  name?: string;
  styleUrl?: string;
  styleHash?: string;
  description?: string;
  icon?: string;
  "stroke-opacity"?: number;
  stroke?: string;
  "stroke-width"?: number;
}

interface Feature {
  type: "Feature";
  geometry: Geometry;
  properties: Properties;
  id?: string;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
}
