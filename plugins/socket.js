const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const WebSocket = require('ws');
const uuid = require("uuid");

let wss = null;
let log = null;

class Websocket extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [
            {
                path: "/socket/ws",
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

        const that = this;

        wss.on('connection', function connection(ws, sreq) {
            ws.uuid = uuid.v4();
            log.info("Socket: Connected client " + ws.uuid);
            restifyserver.websocket.clients.set(ws.uuid, { ws });

            restifyserver.websocket.handlers.forEach((handler) => {
                handler.call(that, ws);
            });

            ws.on('close', () => {
                log.info("Socket: Disconnected client " + ws.uuid);
                restifyserver.websocket.clients.delete(ws.uuid)
            });
        });

        this.restifyserver = restifyserver;
        this.ws = handleSocketConnection;
    }
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
        wss.emit('connection', ws, req);
    });

    next(false);
}


function handleSocketConnection(socket) {
    socket.on('message', (data) => {
        log.verbose("Socket Message Payload: " + data);
    });

    const clients = Array.from(this.restifyserver.websocket.clients.keys());
    socket.send(JSON.stringify({ type: "peers", message: "Connected Clients", clients: clients }));
}


module.exports = Websocket;
