// Setup basic express server
var path = require('path');
var port = process.env.PORT || 3000;

var io = require('socket.io')(port);

var activeSockets = [];


console.log("Server running on port : " + port),
  io.on('connection', (socket) => {

    socket.on('send-username', data => {

      console.log("--------- New connection ---------")
      console.log("Username : " + data.username )
      console.log("peer_id  : " + data.peer_id)
      console.log("----------------------------------")

      socket.username = data.username;
      socket.peer_id = data.peer_id

      let socket_ids = activeSockets.map(function(a) {
        return a.id;
      });
      let usernames = activeSockets.map(function(a) {
        return a.username;
      });

      let peer_ids = activeSockets.map(function(a) {
        return a.peer_id;
      });

      socket.emit("update-user-list", {
        socket_ids: socket_ids,
        peer_ids: [peer_ids],
        usernames: usernames
      });

      activeSockets.push(socket);

      socket.broadcast.emit("update-user-list", {
        socket_ids: [socket.id],
        peer_ids: [socket.peer_id],
        usernames: [socket.username]
      });

    });

    socket.on("call-user", data => {
      console.log(socket.username + " is calling user: " + get_user(data.to)[0].username);
      socket.to(data.to).emit("call-user", {
        socket: socket.id,
        sdp: data.sdp,
        username: socket.username
      });
    });

    socket.on("make-answer", data => {
      socket.to(data.to).emit("make-answer", {
        socket: socket.id,
        sdp: data.sdp
      });
    });

    socket.on("reject-call", data => {
      socket.to(data.to).emit("call-rejected", {
        socket: socket.id
      });
    });


    socket.on("send-message", data => {
      socket.broadcast.emit("send-message", {
        username: socket.username,
        message: data.message
      });
    });

    socket.on("disconnect", () => {
      activeSockets = activeSockets.filter(function(existingSocket) {
        return existingSocket.id !== socket.id
      });
      socket.broadcast.emit("remove-user", {
        socketId: socket.id
      });
    });

  });


function get_user(socketId) {
  return activeSockets.filter(function(existingSocket) {
    return existingSocket.id !== socketId
  });
}
