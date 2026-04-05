import cors, { CorsOptions } from "cors";
import { ENV } from "./env";

const defaultAllowedOrigins = [
  "http://localhost:4000",
  "http://localhost:3000",
  "http://localhost:5173",
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or server-to-server requests)
    if (!origin) return callback(null, true);
    
    const allowed = ENV.isProduction ? ENV.allowedOrigins : defaultAllowedOrigins;
    
    if (allowed.includes(origin)) {
      callback(null, true);
    } else if (!ENV.isProduction && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) {
      // In dev mode, loosely allow any localhost port
      callback(null, true);
    } else {
      // Drop CORS headers
      callback(new Error(`CORS error: disabled for origin ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

export const corsMiddleware = cors(corsOptions);
