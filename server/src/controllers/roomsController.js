import { constants } from "../util/constants.js";
import Attendee from "../entities/attendee.js";
import Room from "../entities/room.js";

export default class RoomsController {
    #users = new Map();

    constructor() {
        this.rooms = new Map();
    }

    onNewConnection(socket) {
        const { id } = socket;
        console.log("connection stablishet with: ", id);
        this.#updateGlobalUserData(id);
    }

    disconnect(socket) {
        console.log("disconnect!! ", socket.id);
        this.#logoutUser(socket);
    }

    #logoutUser(socket) {
        const userId = socket.id;
        const user = this.#users.get(userId);
        const roomId = user.roomId;
        //remove user from user list
        this.#users.delete(userId);

        if (!this.rooms.has(roomId)) {
            return;
        }

        const room = this.rooms.get(roomId);
        const toBeRemoved = [...room.users].find(({ id }) => id === userId);
        //Remove user from room
        room.users.delete(toBeRemoved);

        //if room has no users remain, remove room
        if (!room.users.size) {
            this.rooms.delete(roomId);
            return;
        }

        const disconnectedUserWasAnOwner = userId === room.owner.id;
        const onlyOneUserLeft = room.users.size === 1;

        if (onlyOneUserLeft || disconnectedUserWasAnOwner) {
            room.owner = this.#getNewRoomOwner(room, socket);
        }

        //update room
        this.rooms.set(roomId, room);

        //notify disconnected user to room
        socket.to(roomId).emit(constants.event.USER_DISCONNECTED, user);
    }

    #notifyUserProfileUpgrade(socket, roomId, user) {
        socket.to(roomId).emit(constants.event.UPGRADE_USER_PERMISSION, user);
    }

    #getNewRoomOwner(room, socket) {
        const users = [...room.users.values()];
        const activeSpeakers = users.find((user) => user.isSpeaker);
        //check if disconnected user was owner, pass ownership to next
        //if has no speakers, get "oldest" attendee and promote it
        const [newOwner] = activeSpeakers ? [activeSpeakers] : users;
        newOwner.isSpeaker = true;

        const outdatedUser = this.#users.get(newOwner.id);
        //merge old and new

        const updatedUser = new Attendee({
            ...outdatedUser,
            ...newOwner,
        });

        this.#users.set(newOwner.id, updatedUser);

        this.#notifyUserProfileUpgrade(socket, room.id, newOwner);
        return newOwner;
    }

    joinRoom(socket, { user, room }) {
        const userId = (user.id = socket.id);
        const roomId = room.id;

        const updatedUserData = this.#updateGlobalUserData(userId, user, roomId);

        console.log("UpdatedUserData: ", { updatedUserData });

        const updatedRoom = this.#joinUserRoom(socket, updatedUserData, room);
        console.log("UpdatedRoom: ", { updatedRoom });
        this.#notifyUsersOnRoom(socket, roomId, updatedUserData);
        this.#replyWithActiveUsers(socket, updatedRoom.users);
    }

    #replyWithActiveUsers(socket, users) {
        const event = constants.event.LOBBY_UPDATED;
        socket.emit(event, [...users.values()]);
    }

    #notifyUsersOnRoom(socket, roomId, user) {
        const event = constants.event.USER_CONNECTED;
        socket.to(roomId).emit(event, user);
    }

    #joinUserRoom(socket, user, room) {
        const roomId = room.id;
        const existingRoom = this.rooms.has(roomId);
        const currentRoom = existingRoom ? this.rooms.get(roomId) : {};
        const currentUser = new Attendee({
            ...user,
            roomId,
        });

        const [owner, users] = existingRoom ? [currentRoom.owner, currentRoom.users] : [currentUser, new Set()];

        const updatedRoom = this.#mapRoom({
            ...currentRoom,
            ...room,
            owner,
            users: new Set([...users, ...[currentUser]]),
        });

        this.rooms.set(roomId, updatedRoom);

        socket.join(roomId);

        return this.rooms.get(roomId);
    }

    #mapRoom(room) {
        const users = [...room.users.values()];
        const speakersCount = users.filter((user) => user.isSpeaker).length;
        const featuredAttendees = users.slice(0, 3);
        const mappedRoom = new Room({
            ...room,
            featuredAttendees,
            speakersCount,
            attendeesCount: room.users.size,
        });

        return mappedRoom;
    }

    #updateGlobalUserData(userId, userData = {}, roomId = "") {
        const user = this.#users.get(userId) ?? {};
        const existingRoom = this.rooms.has(roomId);

        const updatedUserData = new Attendee({
            ...user,
            ...userData,
            roomId,
            isSpeaker: !existingRoom,
        });

        this.#users.set(userId, updatedUserData);

        return this.#users.get(userId);
    }

    getEvents() {
        const functions = Reflect.ownKeys(RoomsController.prototype)
            .filter((fn) => fn !== "constructor")
            .map((name) => [name, this[name].bind(this)]);

        return new Map(functions);
    }
}
