export const constants = {
    socketUrl: "https://ch-socket-server.herokuapp.com/",
    socketNamespaces: {
        room: "room",
        lobby: "lobby",
    },

    peerConfig: Object.values({
        id: undefined,
        config: {
            host: "ch-peerjs-server.herokuapp.com",
            secure: true,
            path: "/",
        },
    }),

    pages: {
        lobby: "/pages/lobby",
        login: "/pages/login",
    },

    events: {
        USER_CONNECTED: "userConnection",
        USER_DISCONNECTED: "userDisconnection",

        JOIN_ROOM: "joinRoom",
        LOBBY_UPDATED: "lobbyUpdated",
        UPGRADE_USER_PERMISSION: "upgradeUserPermission",

        SPEAK_REQUEST: "speakRequest",
        SPEAK_ANSWER: "speakAnswer",
    },
    firebaseConfig: {
        apiKey: "AIzaSyDzs_aDyN-dHQ9tZNZS_Z_HJhQ-dbLq4aY",
        authDomain: "semanajsexpert-db094.firebaseapp.com",
        projectId: "semanajsexpert-db094",
        storageBucket: "semanajsexpert-db094.appspot.com",
        messagingSenderId: "522261791773",
        appId: "1:522261791773:web:f9cf41722f867cbc6a32f4",
        measurementId: "G-9NLXQQW8Z7",
    },
    storageKey: "jsexpert:storage:user",
};
