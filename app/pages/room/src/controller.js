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
        this.roomService.init();

        this.socket = this._setupSocket();
        this.roomService.setCurrentPeer(await this._setupWebRTC());
    }

    _setupViewEvents() {
        this.view.configureOnMicrophoneActivation(this.onMicrophoneActivation())
        this.view.configureLeaveButton()
        this.view.configureClapButton(this.onClapPressed());
        this.view.updateUserImage(this.roomInfo.user);
        this.view.updateRoomTopic(this.roomInfo.room);
    }

    onMicrophoneActivation() {
        return async () => {
            await this.roomService.toogleAudioActivation()
        };
    }

    onClapPressed() {
        return () => {
            this.socket.emit(constants.events.SPEAK_REQUEST, this.roomInfo.user);
        };
    }

    _setupSocket() {
        return this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onDisconnected())
            .setOnRoomUpdated(this.onRoomUpdated())
            .setOnUserProfileUpgrade(this.onUserProfileUpgrade())
            .setOnSpeakRequested(this.onSpeakRequested())
            .build();
    }

    onSpeakRequested() {
        return (data) => { 
            const user = new Attendee(data)
            const result = prompt(`${user.username} pediu para falar!, aceitar? 1 sim, 0 não`)
            this.socket.emit(constants.events.SPEAK_ANSWER, { answer: !!Number(result), user })
        }
    }

    async _setupWebRTC() {
        return this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onCallReceived())
            .setOnCallError(this.onCallError())
            .setOnCallClose(this.onCallClose())
            .setOnStreamReceived(this.onStreamReceived())
            .build();
    }

    onStreamReceived() {
        return (call, stream) => {
            const callerId = call.peer;
            console.log("onStreamReceived: ", call, stream);
            const { isCurrentId } = this.roomService.addReceivedPeer(call);
            this.view.renderAudioElement({
                callerId,
                stream,
                isCurrentId
            });
        };
    }

    onCallClose() {
        return (call) => {
            console.log("onCallClosed: ", call);
            const peerId = call.peer;
            this.roomService.disconnectPeer({ peerId });
        };
    }

    onCallError() {
        return (call, error) => {
            console.log("onCallError", call, error);
            const peerId = call.peer;
            this.roomService.disconnectPeer({ peerId });
        };
    }

    onCallReceived() {
        return async (call) => {
            const stream = await this.roomService.getCurrentStream();
            console.log("onCallReceived: ", call);
            call.answer(stream);
        };
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

            if (attendee.isSpeaker) {
                this.roomService.upgradeUserPermission(attendee);
                this.view.addAttendeeOnGrid(attendee, true);
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
            this.roomService.disconnectPeer(attendee);
        };
    }

    onUserConnected() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log("user connected! ", attendee);
            this.view.addAttendeeOnGrid(attendee);

            //lets call
            this.roomService.callNewUser(attendee);
        };
    }

    activateUsersFeatures() {
        const currentUser = this.roomService.getCurrentUser();
        this.view.showUserFeatures(currentUser.isSpeaker);
    }
}
