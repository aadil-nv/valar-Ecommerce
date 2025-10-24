import { Server } from "ws";

let wss: Server;

export const startWebSocketServer = (server: any) => {
  wss = new Server({ server });
  console.log(`WebSocket server started`.gray.white);

  wss.on("connection", (ws) => {
    console.log("Client connected via WebSocket");

    ws.on("message", (message) => {
      console.log("Received message from client:", message.toString());
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });
};

// Broadcast analytics updates to all clients
export const broadcastAnalyticsUpdate = (data: any) => {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};
