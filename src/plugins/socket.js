const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const WebSocket = require("ws");
const uuid = require("uuid");

let wss = null;
let log = null;

class Websocket extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/socket/ws/:scope",
                type: "get",
                handler: handleSocketRegister
            },
            {
                path: "/socket/clients",
                type: "get",
                handler: handleSocketListClients
            },
        ];

        log = logger;

        wss = new WebSocket.Server({ noServer: true });

        if (!restifyserver.websocket) {
            restifyserver.websocket = {
                handlers: []
            };
        }

        restifyserver.websocket.wss = wss;
        restifyserver.websocket.clients = new Map();

        wss.on("connection", function connection(ws, scope) {
            ws.uuid = uuid.v4();
            ws.scope = scope;

            log.info("Socket: Connected client " + ws.uuid + " on scope " + scope);
            restifyserver.websocket.clients.set(ws.uuid, { ws });

            updateWebsocketPeers(restifyserver.websocket.clients, scope);

            restifyserver.websocket.handlers.forEach((handler) => {
                if (!handler.scope) {
                    return;
                }

                if (ws.scope === handler.scope) {
                    handler.func(ws);
                }
            });

            ws.on("close", () => {
                log.info("Socket: Disconnected client " + ws.uuid + " from scope " + scope);
                restifyserver.websocket.clients.delete(ws.uuid);
                updateWebsocketPeers(restifyserver.websocket.clients, scope);
            });
        });

        this.restifyserver = restifyserver;
        this.wsconfig = { func: handleSocketConnection, scope: "global" };
    }
}

function updateWebsocketPeers(peers, scope) {
    const peerList = Array.from(peers.values()).filter((peer) => {
        return (peer.ws.scope === scope);
    });

    const clients = peerList.map((peer) => {
        return peer.ws.uuid;
    });

    peerList.forEach((peer) => {
        peer.ws.send(JSON.stringify({ scope: scope, type: "peers", clients: clients }));
    });
}

function handleSocketListClients(req, res, next) {
    const clients = Array.from(this.restifyserver.websocket.clients.keys());
    res.send(200, { count: clients.length, clients });
}

function handleSocketRegister(req, res, next) {
    if (!res.claimUpgrade) {
        res.send(400, "Error: Expected Connection Upgrade");
        return;
    }

    const upgrade = res.claimUpgrade();
    wss.handleUpgrade(req, upgrade.socket, upgrade.head, (ws) => {
        wss.emit("connection", ws, req.params.scope);
    });

    next(false);
}


function handleSocketConnection(socket) {
    socket.on("message", (data) => {
        log.info("Socket Message Payload: " + data);
    });
}


module.exports = Websocket;
