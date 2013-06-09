var socket = io.connect('http://localhost:3000'),
    isInGame = false,  //true jesli uzytkownik jest w grze
    userName,
    myRoom,
    selectionMade = false;  //true jesli uzytkopwnik wybral lokalizacje

// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', function () {
    socket.emit('getRooms');
});


// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', function (username, data) {
    $('#conversation').append('<b>' + username + ':</b> ' + data + '<br>');
});

socket.on('setRooms', function (rooms) {
    $('#rooms').empty();
    $.each(rooms, function (key, value) {
        var str = '<div class="room" id="' + key + '">' + key + ' [' + value + ']' + '</div>'
        $('#rooms').append(str);
    });
    $('.room').on('click', function (event) {
        var name = prompt("What's your name?")
        userName = name;
        myRoom = this.id;
        socket.emit('adduser', {room: this.id, name: name});
    });
});

socket.on('updateRooms', function (rooms) {
    var links = $('#rooms').children();
    for(var i = 0; i < links.length; i += 1){
        var tmp = links[i];
        tmp.textContent = tmp.textContent.replace(/\[\d\]/, '[' + rooms[tmp.id] + ']');
    }
});

socket.on('startGame', function(players, cityName, roundNumber){
    $('#map-canvas').css("display","inline");
    var ctx, img, c=$("#map-canvas")[0];
    ctx=c.getContext("2d");
    img=$("#map-image")[0];
    ctx.drawImage(img, 0, 0, 600, 600);

    isInGame = true;
    $('#players-list').empty();
    $('#players-list').css("display", "inline");
    $('#round-counter').css("display", "block");
    $('#rooms-list').css("display","none");
    $('#selected-city-container').css("display","block");
    $('#selected-city-name').html(cityName);
    $('#round-counter').html('runda numer:' + roundNumber);

    $.each(players, function (key, value) {
        if(key !== 'properties'){
        $('#players-list').append('<div id="player' + key + '-frame"' +
            ' class="Player-Frame-Class">' +
            '<div id="player' + key + '-name" class="player-name">' + key + '</div>' +
            '<div id="player' + key + '-score" class="player-score">0</div>' +
            '</div>'
            );
        }
    });
});

socket.on('endGame', function(winnerName) {
    $('#players-list').empty();
    $('#players-list').css("display", "none");
    $('#rooms-list').css("display","inline");
    $('#selected-city-container').css("display","none");
    $('#round-counter').css("display","none");
    $('#map-canvas').css("display","none");
    alert(winnerName);
    isInGame = false;
    selectionMade = false;
    socket.emit('removeUsersFromGroup', myRoom);
});

socket.on('nextRound', function(players, cityName, roundNumber) {
    selectionMade = false;
    $('#selected-city-name').html(cityName);
    $('#round-counter').html('runda numer:' + roundNumber);

    $.each(players, function (key, value) {
        if(key !== 'properties'){
            console.log(this.score);
            $('#player' + key + '-score').html(this.score);
        }
    });
});

// on load of page
$(function () {
    // when the client clicks SEND
    $('#datasend').click(function () {
        var message = $('#data').val();
        $('#data').val('');
        // tell server to execute 'sendchat' and send along one parameter
        socket.emit('sendchat', message);
    });

    // when the client hits ENTER on their keyboard
    $('#data').keypress(function (e) {
        if (e.which == 13) {
            $(this).blur();
            $('#datasend').focus().click();
        }
    });

    $("#map-canvas").click(function(e){
        if(selectionMade === false) {
            var x = e.pageX - this.offsetLeft;
            var y = e.pageY - this.offsetTop;
            console.log(x +', '+ y);
        if(isInGame) {
            selectionMade = true;
            socket.emit('givePoints', userName ,x, y, myRoom);
        }
        }
    });
});


