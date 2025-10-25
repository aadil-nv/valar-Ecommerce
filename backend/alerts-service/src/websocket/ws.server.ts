import { WebSocketServer, WebSocket } from "ws";
import { config } from "../config/env.config"; // Adjust path to your config file

let wss: WebSocketServer | null = null;

export const startWebSocketServer = () => {
  try {
    // Use port from config or default to 8081
    const WS_PORT = parseInt(config.WS_PORT || "8081", 10);
    console.log(`WebSocket port is: ${WS_PORT}`.bgBlue.bold);

    // Create WebSocket server on the specified port
    wss = new WebSocketServer({ port: WS_PORT });
    
    console.log(`WebSocket server started on port ${WS_PORT}`.bgBlue.bold);

    wss.on("connection", (ws: WebSocket, req) => {
      console.log(`New WebSocket client connected from ${req.socket.remoteAddress}`.bgCyan.bold);
      // Log current number of connected clients
      console.log(`Total connected clients: ${wss?.clients.size}`.bgCyan.bold);

      ws.on("message", (message) => {
        console.log(`Received message: ${message}`.bgGreen.bold);
      });

      ws.on("close", (code, reason) => {
        console.log(`WebSocket client disconnected. Code: ${code}, Reason: ${reason}`.bgCyan.bold);
        console.log(`Total connected clients: ${wss?.clients.size}`.bgCyan.bold);
      });

      ws.on("error", (error) => {
        console.error(`WebSocket client error: ${error.message}`.bgRed.bold);
      });

      // Send a test message to the client upon connection
      ws.send(JSON.stringify({ event: "connection_test", data: { message: "Connected to WebSocket server" } }));
    });

    wss.on("error", (error) => {
      console.error(`WebSocket server error: ${error.message}`.bgRed.bold);
    });

    wss.on("listening", () => {
      console.log(`WebSocket server is listening on port ${WS_PORT}`.bgBlue.bold);
    });

  } catch (error) {
    console.error(`Failed to start WebSocket server: ${(error as Error).message}`.bgRed.bold);
    throw error;
  }
};

export const broadcastAlertUpdate = (message: { event: "new_alert" | "update_alert" | "delete_alert" | "clear_alerts"; data?: any }) => {

    console.log("broadcast event is calling ===>",message);
    
  if (!wss) {
    console.error("WebSocket server not initialized".bgRed.bold);
    return;
  }

  console.log(`Broadcasting message to ${wss.clients.size} clients: ${JSON.stringify(message)}`.bgYellow.bold);

  wss.clients.forEach((client) => {
    console.log("11111111111111111111111111111");
    
    if (client.readyState === WebSocket.OPEN) {
        console.log("222222222222222222222222");
        
      try {
        client.send(JSON.stringify({event:message.event,data:message.data}));
        // console.log(`Sent message to client ${client._socket.remoteAddress}`.bgGreen.bold);
      } catch (error) {
        console.error(`Failed to send message to client: ${(error as Error).message}`.bgRed.bold);
      }
    } else {
      console.log(`Client not in OPEN state: ${client.readyState}`.bgYellow.bold);
    }
  });
};