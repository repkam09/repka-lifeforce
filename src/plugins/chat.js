const LifeforcePlugin = require("../utils/LifeforcePlugin.js");
const fs = require("fs");


let log = null;

class WebSocketChat extends LifeforcePlugin {
    constructor(restifyserver, logger, name) {
        super(restifyserver, logger, name);
        this.apiMap = [];
        this.wsconfig = { func: handleSocketConnection, scope: "demo-chat" };

        log = logger;
    }
}

let chatPeerList = [];

function handleSocketConnection(socket) {
    chatPeerList.push(socket);

    socket.on("message", (data) => {

        const dataobj = JSON.parse(data);

        chatPeerList.forEach((peer) => {
            sendClientMessage(peer, { message: dataobj.value, user: socket.uuid });
        });
    });

    socket.on("close", () => {
        chatPeerList = chatPeerList.filter((peer) => {
            if (peer.uuid !== socket.uuid) {
                return true;
            }

            log.verbose("Pruned entry " + peer.uuid + " because of disconnect");
            return false;
        });
    });
}

function sendClientMessage(peer, message) {
    peer.send(JSON.stringify({ type: "chat", payload: message, scope: "demo-chat" }));
}

module.exports = WebSocketChat;
