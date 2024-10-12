import * as signalR from "@microsoft/signalr";
import { updateTrail, updateClick } from "./graphics";

let isConnected = false;
const retryTimes = [0, 3000, 10000, 60000];
interface ConnectionMap {
    [key: string]: boolean | undefined;
}
let connections: ConnectionMap = {};
let connectionsCount = 0;
let connectionCounSpan = document.getElementById("ConnCount") as HTMLSpanElement;
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hub").withAutomaticReconnect({
        nextRetryDelayInMilliseconds: context => {
            const index = context.previousRetryCount < retryTimes.length ? context.previousRetryCount : retryTimes.length - 1;
            return retryTimes[index];
        }
    })
    .build();

connection.on("move", (connId: string, i: number, x: number, y: number) => {
    updateTrail(connId + i, x, y);
    if (connections[connId] == undefined) {
        connections[connId] = true;
        connectionsCount++;
        connectionCounSpan.innerText = connectionsCount.toString();
    }
});

connection.on("click", (x: number, y: number) => {
    updateClick(x, y);
});

connection
    .start()
    .then(() => {
        isConnected = true;
        console.log("SignalR connected");
    })
    .catch(err => {
        isConnected = false;
        console.error("SignalR connection error:", err);
    });

export function sendMove(i: number, x: number, y: number) {
    if (isConnected) {
        connection.send("Move", i, x, y)
            .then(() => { })
            .catch(err => console.error("Error sending move:", err));
    }
}

export function sendClick(x: number, y: number) {
    if (isConnected) {
        connection.send("Click", x, y)
            .then(() => { })
            .catch(err => console.error("Error sending click:", err));
    }
}
