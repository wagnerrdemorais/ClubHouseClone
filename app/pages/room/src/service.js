import UserStream from "./entities/userStream.js";
export default class RoomService {
    constructor({ media }) {
        this.media = media;
        this.currentPeer = {};
        this.currentUser = {};
        this.currentStream = {};

        this.peers = new Map();
    }

    async init() {
        this.currentStream = new UserStream({
            stream: await this.media.getUserAudio(),
            isFake: false,
        });
    }

    setCurrentPeer(peer) {
        this.currentPeer = peer;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateCurrentUserProfile(users) {
        this.currentUser = users.find(({ peerId }) => peerId === this.currentPeer.id);
    }

    upgradeUserPermission(user) {
        if (!user.isSpeaker) return;

        const isCurrentUser = user.id === this.currentUser.id;

        if (!isCurrentUser) return;

        this.currentUser = user;
    }

    async getCurrentStream() {
        const { isSpeaker } = this.currentUser;

        if (isSpeaker) {
            return this.currentStream.stream;
        }

        return this.media.createMediaStreamFake();
    }

    addReceivedPeer(call) {
        const callerId = call.peer;
        this.peers.set(callerId, { call });

        const isCurrentId = callerId === this.currentUser.id;
        return { isCurrentId };
    }

    disconnectPeer({peerId}){
        if(!this.peers.has(peerId)) return;

        this.peers.get(peerId).call.close()
        this.peers.delete(peerId)
    }

    async callNewUser(user) {
        //if user is speaker, then user calls me..
        const { isSpeaker } = this.currentUser;
        if (!isSpeaker) return;

        const stream = await this.getCurrentStream();
        this.currentPeer.call(user.peerId, stream);
    }
}
