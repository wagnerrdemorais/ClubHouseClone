import { constants } from "../../_shared/constants.js";
import LobbyController from "./controller.js";
import LobbySocketBuilder from "./util/lobbySocketBuilder.js";
import View from "./view.js";

const user = {
    img: "https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/batman_hero_avatar_comics-512.png",
    username: "Wagner Morais - " + Date.now(),
};

const socketBuilder = new LobbySocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNamespaces.lobby,
});

const dependencies = {
    socketBuilder,
    user,
    view: View,
};

LobbyController.initialize(dependencies).catch((error) => {
    alert(error.message);
});
