// Use Environment Variables (.env) mapped via Vite (import.meta.env) for smart and secure configuration
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const READ_ONLY_IDENTITY_POOL_ID = import.meta.env.VITE_READ_ONLY_IDENTITY_POOL_ID || "us-east-1:0acbc318-83e7-4d7f-8e08-14cd429582ac";
export const WRITE_ONLY_IDENTITY_POOL_ID = import.meta.env.VITE_WRITE_ONLY_IDENTITY_POOL_ID || "us-east-1:ad71df16-41a9-4954-9c05-3e8ae281348a";

export const COGNITO = {
  USER_POOL_ID: import.meta.env.VITE_USER_POOL_ID || "us-east-1_DoywInSJz",
  USER_POOL_CLIENT_ID: import.meta.env.VITE_USER_POOL_CLIENT_ID || "408nm88sbnlr3u19kpcko6jcpc",
  DOMAIN: import.meta.env.VITE_COGNITO_DOMAIN || "us-east-1doywinsjz.auth.us-east-1.amazoncognito.com",
  REGION: import.meta.env.VITE_AWS_REGION || "us-east-1"
};

export const REGION = import.meta.env.VITE_AWS_REGION || "us-east-1";
export const API_KEY = import.meta.env.VITE_MAP_API_KEY || "v1.public.eyJqdGkiOiJmZmViYWE2Ni1mMWFlLTQ0M2ItODFhOS04YWUzNzkwY2UyYzAifXZjbQmXFkX3EEpiuivw2oXJ9Uv7VbQSWgUj9kgH4jxfsem2lnfkbkCoiUu7hUu6vpAD2z7A-Auv9XGJwZIsiaoD3DRIPWHMRsm4zrJeBxm0kgz3HGjyy4pz7TtXZoYAyi12tsSEW_KIljxs5O2QTnYx_j2L6Tntubh3SmHV42Laj6Vbn1ZNOu-IziKtqSmMSv6hRcOBYF1Tqmz_7exxfBvCssVJ-QTa2aZOtRCnTlNdE4ngj_xVZ1HI5QaP-qQPwXB8GMT9C7MaNUkhC3Jeq-00FLf2cjsxumhISsapFVq7QZeUT46JnU3TFTwCnM2zOuUtq428-0YuRCSjPCLuG1s.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx";

// Location Service Resources
export const TRACKER = import.meta.env.VITE_TRACKER_NAME || "TrackingDATN-Tracker";
export const GEOFENCE = import.meta.env.VITE_GEOFENCE_COLLECTION || "TrackingDATN-GeofenceCollection";

// Map Configuration
export const MAP = {
  STYLE: import.meta.env.VITE_MAP_STYLE || "Standard", // Try: Standard, Monochrome, Hybrid, Satellite
  COLOR_SCHEME: import.meta.env.VITE_MAP_COLOR_SCHEME || "Light",
};

// SQS Queue
export const SQS_QUEUE_URL = import.meta.env.VITE_SQS_QUEUE_URL || "https://sqs.us-east-1.amazonaws.com/145023123305/TrackingDATN-GeofenceEvents";

// Device Position History (in seconds)
export const DEVICE_POSITION_HISTORY_OFFSET = 3600; // 1 hour
