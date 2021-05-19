import { constants } from "../../_shared/constants.js";
import RoomController from "./controller.js";
import RoomSocketBuilder from "./util/roomSocket.js";
import View from "./view.js";

const room = {
    id: "0001",
    topic: "Js Expert",
};

const user = {
    img: "https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/batman_hero_avatar_comics-512.png",
    username: "Wagner Morais",
};

const roomInfo = { user, room };

const socketBuilder = new RoomSocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNamespaces.room,
});

const dependencies = {
    view: View,
    socketBuilder,
    roomInfo,
};

await RoomController.initialize(dependencies);
