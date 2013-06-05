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
//oreo, oreo, oreo!
// all environments
app.set('port', process.env.PORT || 3000);
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
var actualRoom = 0;
// rooms which are currently available in chat
var rooms = ['room1', 'room2', 'room3'];
var roomUsers = {};
//oreo
for(var i = 0; i < rooms.length; i+=1){
    roomUsers[rooms[i]] = {};
}

var howMuchUsers = function(obj){
    return Object.keys(obj).length;
};

io.sockets.on('connection', function (socket) {
    socket.username = 'aaa';

    socket.on('getRooms', function () {
        console.log("To ja robie cos hallo");
        var roomMessage = {};

        for(var i = 0; i < rooms.length; i+=1){
            roomMessage[rooms[i]] = howMuchUsers(roomUsers[rooms[i]]);
        }
        console.log(roomMessage);

        socket.broadcast.emit('setRooms', roomMessage);
        socket.emit('setRooms', roomMessage);
    });

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function (user) {

        var roomMessage = {};

        if(howMuchUsers(roomUsers[user.room]) >= 5){ // zrobic z tego for
            // zwrocic komunikat ze pokoj pelny i juz nie mozna
        }

        // store the username in the socket session for this client
        socket.username = user.name;
        // store the room name in the socket session for this client
        socket.room = user.room;
        // add the client's username to the global list
        usernames[user.name] = user.name;
        roomUsers[user.room][user.name] = {};
        // send client to room 1
        socket.join(user.room);

        console.log(roomUsers);

        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected to room1');
        // echo to room 1 that a person has connected to their room
        socket.broadcast.to(user.room).emit('updatechat', 'SERVER', user + ' has connected to this room');

        for(var i = 0; i < rooms.length; i+=1){
            roomMessage[rooms[i]] = howMuchUsers(roomUsers[rooms[i]]);
        }
        console.log(roomMessage);

        socket.broadcast.to(user.room).emit('updateRooms', roomMessage);
        socket.emit('updateRooms', roomMessage);

        if(howMuchUsers(roomUsers[user.room]) === 5){
            socket.broadcast.to(user.room).emit('startGame', roomUsers[user.room] );
            socket.emit('startGame', roomUsers[user.room] );
        }


    });

//    socket.emit('endGame');
//
//    socket.on('givePoints');
//
//    socket.on('sumPoints');
//
//    socket.on('coorPointed');

//    socket.broadcast.to(user.room).emit('Winner', roomMessage);
//    socket.emit('Winner');





    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        try
        {
            console.log("======= Remove User from Room =======")
            var roomMessage = {};
            delete usernames[socket.username];
            var users, room;
            for(var i = 0; i < rooms.length; i += 1){
                users = Object.keys(roomUsers[rooms[i]]);
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
            delete roomUsers[room][socket.username];

            console.log(roomUsers);

            // update list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);
            // echo globally that this client has left
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
            for(var i = 0; i < rooms.length; i+=1){
                roomMessage[rooms[i]] = howMuchUsers(roomUsers[rooms[i]]);
            }
            console.log(roomMessage);

            socket.broadcast.to(user.room).emit('updateRooms', roomMessage);
            socket.leave(socket.room);
        }
        catch(err)
        {
            console.log(err);
        }
    });
});