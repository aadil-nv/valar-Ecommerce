import WebSocket, { WebSocketServer } from "ws";

let wss: WebSocketServer;

export const startWebSocketServer = (server: any) => {
  wss = new WebSocketServer({ server });
  console.log("Alerts WebSocket server started");

  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to Alerts WebSocket");

    ws.on("message", (msg) => {
      console.log("Received message from client:", msg.toString());
    });

    ws.on("close", () => {
      console.log("Client disconnected from Alerts WebSocket");
    });
  });
};

// Broadcast alerts to all connected clients
export const broadcastAlertUpdate = (alert: any) => {
  if (!wss) return;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(alert));
    }
  });
};
