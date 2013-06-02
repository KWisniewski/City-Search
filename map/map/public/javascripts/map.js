$(document).ready(function (){
    console.log("on");
    var socket = io.connect('http://localhost');
    socket.on('news', function(data){
        console.log(data);
        socket.emit('other', {my: 'data'});
    });
});
