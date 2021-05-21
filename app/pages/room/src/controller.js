import { constants } from "../../_shared/constants.js";
import Attendee from "./entities/attendee.js";

export default class RoomController {
    constructor({ socketBuilder, roomInfo, view, peerBuilder, roomService }) {
        this.socketBuilder = socketBuilder;
        this.roomInfo = roomInfo;
        this.view = view;
        this.peerBuilder = peerBuilder;
        this.roomService = roomService;

        this.socket = {};
    }

    static async initialize(deps) {
        return new RoomController(deps)._initialize();
    }

    async _initialize() {
        this._setupViewEvents();

        this.socket = this._setupSocket();
        this.roomService.setCurrentPeer(await this._setupWebRTC());
    }

    _setupViewEvents() {
        this.view.updateUserImage(this.roomInfo.user);
        this.view.updateRoomTopic(this.roomInfo.room);
    }

    _setupSocket() {
        return this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onDisconnected())
            .setOnRoomUpdated(this.onRoomUpdated())
            .setOnUserProfileUpgrade(this.onUserProfileUpgrade())
            .build();
    }

    async _setupWebRTC() {
        return this.peerBuilder.setOnError(this.onPeerError()).setOnConnectionOpened(this.onPeerConnectionOpened()).build();
    }

    onPeerError() {
        return (error) => {
            console.error("Bugou!: ", error);
        };
    }

    //when connection is opened, asks to enter the socket's room
    onPeerConnectionOpened() {
        return (peer) => {
            console.log("onPeerConnectionOpened: ", peer);
            this.roomInfo.user.peerId = peer.id;
            this.socket.emit(constants.events.JOIN_ROOM, this.roomInfo);
        };
    }

    onUserProfileUpgrade() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log("User Profile Updated", attendee.firstName);
            this.roomService.upgradeUserPermission(attendee);

            if (attendee.isSpeaker) {
                this.view.addAttendeeOnGrid(attendee);
            }
            this.activateUsersFeatures();
        };
    }

    onRoomUpdated() {
        return (data) => {
            console.log("onRoomUpdated, Data: ", data);
            const users = data.map((item) => new Attendee(item));
            this.view.updateAttendeesOnGrid(data);
            this.roomService.updateCurrentUserProfile(data);
            this.activateUsersFeatures();
        };
    }

    onDisconnected() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log(`${attendee.username} gone away!`);
            this.view.removeItemFromGrid(attendee.id, true);
        };
    }

    onUserConnected() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log("user connected! ", attendee);
            this.view.addAttendeeOnGrid(attendee);
        };
    }

    activateUsersFeatures() {
        const currentUser = this.roomService.getCurrentUser();
        this.view.showUserFeatures(currentUser.isSpeaker);
    }
}
