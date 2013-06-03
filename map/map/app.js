/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , user = require('./routes/user')
    , http = require('http')
    , path = require('path');

var app = express(),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

// usernames which are currently connected to the chat
var usernames = {};
var rooms = [];
var actualRoom = 0;
// rooms which are currently available in chat
var rooms = ['room1', 'room2', 'room3'];
var RoomUsers = {};
for(var i = 0; i < rooms.length; i+=1){
    RoomUsers[rooms[i]] = {};
}

var HowMuchUsers = function(obj){
    return Object.keys(obj).length;
};

io.sockets.on('connection', function (socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function (username) {

        if(HowMuchUsers(RoomUsers[rooms[actualRoom]]) > 0){ // zrobic z tego for
            actualRoom += 1;
        }

        // store the username in the socket session for this client
        socket.username = username;
        // store the room name in the socket session for this client
        socket.room = rooms[actualRoom];
        // add the client's username to the global list
        usernames[username] = username;
        RoomUsers[rooms[actualRoom]][username] = {};
        // send client to room 1
        socket.join(rooms[actualRoom]);

        console.log(RoomUsers);

        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected to room1');
        // echo to room 1 that a person has connected to their room
        socket.broadcast.to(rooms[actualRoom]).emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, rooms[actualRoom]);
    });

//    socket.on('switchRoom', function (newroom) {
//        // leave the current room (stored in session)
//        socket.leave(socket.room);
//        // join new room, received as function parameter
//        socket.join(newroom);
//        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
//        // sent message to OLD room
//        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');
//        // update socket session room title
//        socket.room = newroom;
//        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
//        socket.emit('updaterooms', rooms, newroom);
//    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        console.log("======= Remove User from Room =======")
        delete usernames[socket.username];
        var users, room;
        for(var i = 0; i < rooms.length; i += 1){
            users = Object.keys(RoomUsers[rooms[i]]);
            console.log(users);
            for(var u = 0; u < users.length; u += 1){
                if(users[u] === socket.username){
                    room = rooms[i];
                    break;
                }
            }
            if(room !== undefined){
                break;
            }
        }
        console.log('*== Removing ' + socket.username + ' from ' + room + ' ==*');
        delete RoomUsers[room][socket.username]

        console.log(RoomUsers);

//        for(var i = 0; i < rooms;)
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});