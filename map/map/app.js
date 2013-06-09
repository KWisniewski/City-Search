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
    cities = require('./citiesdata').citiesCoords;

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
var selectRandomCity = function() {
    var cityName = Object.keys(cities)[Math.round(0 +
        (Object.keys(cities).length - 0) * Math.random()) % Object.keys(cities).length];
    console.log(cityName);
    return {name: cityName, coords: cities[cityName]};
}

var calculateDistanceBetweenPoints = function(usrX, usrY, cityX, cityY) {
    var distance = 0;
    if(usrX >= cityX && usrY >= cityY) {
             distance = Math.round(Math.sqrt(Math.pow((usrX - cityX),2) + Math.pow((usrY - cityY),2)));
    }
    if(usrX <= cityX && usrY >= cityY) {
        distance = Math.round(Math.sqrt(Math.pow((cityX - usrX),2) + Math.pow((usrY - cityY),2)));
    }
    if(usrX <= cityX && usrY <= cityY) {
        distance = Math.round(Math.sqrt(Math.pow((cityX - usrX),2) + Math.pow((cityY - usrY),2)));
    }
    if(usrX >= cityX && usrY <= cityY) {
        distance = Math.round(Math.sqrt(Math.pow((usrX - cityX),2) + Math.pow((cityY - usrY),2)));
    }
    return distance;
}
//oreo
for(var i = 0; i < rooms.length; i+=1){
    roomUsers[rooms[i]] = {};
    roomUsers[rooms[i]]['properties'] = {};
}

var howMuchUsers = function(obj){
    return Object.keys(obj).length - 1;
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
        console.log('USER ->', user);
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

        roomUsers[user.room][user.name].score = 0;
        roomUsers[user.room]['properties'].round = 0;   //numer rundy w grze
        roomUsers[user.room]['properties'].numOfPlayersSelections = 0;      //liczba graczy ktorzy wskazali juz wspolrzedne w danej rundzie

        socket.broadcast.emit('updateRooms', roomMessage);
        socket.emit('updateRooms', roomMessage);

        if(howMuchUsers(roomUsers[user.room]) === 2){
            var selectedCity = selectRandomCity();
            console.log("selected city to" + selectedCity);
            roomUsers[user.room]['properties'].selectedCity = selectedCity;    //dodanie wylosowanego miasta do obiektu pokoju
            console.log(selectedCity.name);
            socket.broadcast.to(user.room).emit('startGame', roomUsers[user.room], selectedCity.name, roomUsers[user.room]['properties'].round );
            socket.emit('startGame', roomUsers[user.room], selectedCity.name, roomUsers[user.room]['properties'].round );
        }
    });

//    socket.emit('endGame');

    socket.on('givePoints',function(userName, x, y, userRoom) {
        console.log(userName + ' ' + x + ' ' + y);
        roomUsers[userRoom][userName].x = x;
        roomUsers[userRoom][userName].y = y;
        roomUsers[userRoom]['properties'].numOfPlayersSelections++;
        console.log("WSPOLRZEDNE X MIASTA" + roomUsers[userRoom]['properties'].selectedCity.coords.x);
        roomUsers[userRoom][userName].score += calculateDistanceBetweenPoints(x, y, roomUsers[userRoom]['properties'].selectedCity.coords.x, roomUsers[userRoom]['properties'].selectedCity.coords.y );
        if(roomUsers[userRoom]['properties'].numOfPlayersSelections === 2) { //jezeli wszyscy przesla swojewybrane koordynaty nastpeuje wyliczanie wyniku
            roomUsers[userRoom]['properties'].round ++;
            roomUsers[userRoom]['properties'].numOfPlayersSelections = 0;
            var selectedCity = selectRandomCity();
            roomUsers[userRoom]['properties'].selectedCity = selectedCity;
            if(roomUsers[userRoom]['properties'].round < 2) {
            socket.broadcast.to(userRoom).emit('nextRound', roomUsers[userRoom], selectedCity.name, roomUsers[userRoom]['properties'].round );
            socket.emit('nextRound', roomUsers[userRoom], selectedCity.name, roomUsers[userRoom]['properties'].round );
            } else {
                //usuwanie wszystkich property z danego popju
                console.log("===================================================================");
                var winnerscore = roomUsers[userRoom][userName].score,
                winnerName = "";

                for (var key in roomUsers[userRoom]) {
                    if(key !== 'properties' && roomUsers[userRoom][key].score <= winnerscore){
                        winnerscore = roomUsers[userRoom][key].score;
                        winnerName = key;
                    }
                }

                for (var key in roomUsers[userRoom]) {
                    if(key !== 'properties'){
                        delete roomUsers[userRoom][key];
                    } else {
                        roomUsers[userRoom]['properties'] = {};
                    }
                }

                console.log('============== WINNER ==============');
                console.log(winnerName);
                socket.broadcast.to(userRoom).emit('endGame', winnerName);
                socket.emit('endGame', winnerName);

            }
        }
    });

    socket.on('removeUsersFromGroup', function(userRoom) {
        console.log('=========== clean ============');
        console.log(roomUsers);

        var roomMessage = {};

        for(var i = 0; i < rooms.length; i+=1){
            roomMessage[rooms[i]] = howMuchUsers(roomUsers[rooms[i]]);
        }
        console.log(roomMessage);

        socket.broadcast.emit('updateRooms', roomMessage);
        socket.emit('updateRooms', roomMessage);
        socket.leave(userRoom);
    });


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