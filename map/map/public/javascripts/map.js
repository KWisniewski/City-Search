var socket = io.connect('http://localhost:3000');
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

socket.on('startGame', function(players){
    var ctx, img, c=$("#map-canvas")[0];
    ctx=c.getContext("2d");
    img=$("#map-image")[0];
    ctx.drawImage(img, 0, 0, 500, 500);

    $.each(players, function (key, value) {
        $('#players-list').append('<div id="paler" + key + "-frame"' +
            ' class="Player-Frame-Class">' +
            '<div id="player" + key + "-name" class="player-name">' + key + '</div>' +
            '<div id="player" + key + "-score" class="player-score">0</div>' +
            '</div>'
            );
    })
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
});


