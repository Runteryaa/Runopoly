import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { roomManager } from "./rooms/RoomManager.js";
import { setupSocketHandlers } from "./sockets/connection.js";

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for Expo Web & Mobile apps
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Render.com health check endpoint
app.get("/healthz", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "runopoly-server",
    timestamp: new Date().toISOString(),
    publicRoomsCount: roomManager.getPublicRooms().length,
  });
});

// API endpoint for public room browser
app.get("/api/rooms", (req: Request, res: Response) => {
  res.status(200).json({
    rooms: roomManager.getPublicRooms(),
  });
});

// Setup WebSocket event handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🎲 RunoPoly Server running on port ${PORT}`);
  console.log(`🩺 Health check ready at http://localhost:${PORT}/healthz`);
});
