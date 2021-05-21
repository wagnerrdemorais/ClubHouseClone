export default class PeerBuilder {
    constructor({ peerConfig }) {
        this.peerConfig = peerConfig;
        this.onError = () => {};
        this.onConnectionOpened = () => {};
    }

    setOnError(fn) {
        this.onError = fn;
        return this;
    }

    setOnConnectionOpened(fn) {
        this.onConnectionOpened = fn;

        return this;
    }

    async build() {
        // peer receives a list of arguments
        // new peer(id, conf1, conf2)
        // params = [], new Peer(...params)
        const peer = new globalThis.Peer(...this.peerConfig);
        peer.on("error", this.onError);

        return new Promise((resolve) => peer.on("open", () => {
                this.onConnectionOpened(peer);
                return resolve(peer);
            })
        );
    }
}
