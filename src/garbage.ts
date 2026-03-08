import { Server } from 'socket.io';
import express from 'express';

const PORT = 5000;
const ADMIN = "Admin";

const server = express();

const expressServer = server.listen(PORT, () => {
    console.log(`express server is running on http://localhost:${PORT}`);
});

interface UsersState {
    users: any[];
    setUsers: (newUsersArray: any[]) => void;
}

const usersState: UsersState = {
    users: [],
    setUsers(newUsersArray: any[]) {
        this.users = newUsersArray;
    }
};

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENG === 'production' ? false : [
            "http://localhost:5500", "http://127.0.0.1:5500"
        ],
    },
})


io.on('connection', (socket) => {
    console.log(`user ${socket.id} connected`);
    // listening for message event
    socket.on('message', (data) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', buildMsg(data.name, data.text));
        }
    });

    // as opposed to io.emit(), which emits to all sockets, this is only to the user
    socket.emit('message', buildMsg(ADMIN, `welcome user ${socket.id.substring(0, 5)} to the server`));

    socket.on('enterRoom', ({ userName, room }) => {
        const prevRoom = getUser(socket.id)?.room;
        if (prevRoom) {
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${userName} has left the room`));
        }
        const user = activateUser(socket.id, userName, room);
        if (prevRoom) {
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            });
        }
        socket.join(user.room);
        socket.emit('message', buildMsg(ADMIN, `welcome ${user.name} to room ${user.room}`));
        socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`));

        io.to(user.room).emit('userList', {
            users: getUsersInRoom(user.room)
        });

        io.emit('roomList', {
            rooms: getAllActiveRooms()
        });
    });

    // upon connection to all others EXCEPT for the user socket.broadcast.emit
    socket.broadcast.emit('message', `user ${socket.id.substring(0, 5)} has joined the server`);

    // when user disconnects , to all others
    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        userLeavesApp(socket.id);
        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`));
            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            });
            io.emit('roomList', {
                rooms: getAllActiveRooms()
            });
        }
    })

    socket.on('activity', (userName) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit('activity', userName);
        }
        socket.broadcast.emit('activity', userName);
    })
});

function buildMsg(name: string, text: string) {
    return {
        name,
        text,
        time: new Date().toISOString()
    }
}

function activateUser(id: string, name: string, room: string) {
    const user = { id, name, room };
    usersState.setUsers([...usersState.users.filter(u => u.id !== id), user]);
    return user;
}

function userLeavesApp(id: string) {
    const user = usersState.users.find(u => u.id === id);
    usersState.setUsers(usersState.users.filter(u => u.id !== id));
    return user;
}

function getUser(id: string) {
    return usersState.users.find(u => u.id === id);
}

function getUsersInRoom(room: string) {
    return usersState.users.filter(u => u.room === room);
}

function getAllActiveRooms() {
    const rooms = usersState.users.map(u => u.room);
    return Array.from(new Set(rooms));
}
