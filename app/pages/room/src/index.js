import { constants } from "../../_shared/constants.js";
import RoomSocketBuilder from "./util/roomSocket.js";

const socketBuilder = new RoomSocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNamespaces.room,
});

const socket = socketBuilder
    .setOnUserConnected((user) => console.log("user connected! ", user))
    .setOnUserDisconnected((user) => console.log("user disconnected! ", user))
    .setOnRoomUpdated((room) => console.log('room list! ', room))
    .build();

const room = {
    id: '0001',
    topic: "Js Expert",
};

const user = {
    img: "https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/batman_hero_avatar_comics-512.png",
    username: "Wagner Morais",
};

socket.emit(constants.events.JOIN_ROOM, { user, room });
