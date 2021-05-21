export default class RoomService {
    constructor() {
        this.currentPeer = {};
        this.currentUser = {};
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
}
