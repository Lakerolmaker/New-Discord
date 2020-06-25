// Setup basic express server
var path = require('path');
var socket_port = process.env.socket_port || 3000;
var peerjs_port = process.env.peer_port || 3001;

var activeSockets = [];
var io = require('socket.io')(socket_port);
console.log("Socket Server running on port : " + socket_port)


const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: peerjs_port, path: '/myapp' });
console.log("Peerjs sevrer running on port : " + peerjs_port),


  io.on('connection', (socket) => {

    socket.on('send_username', data => {

      console.log("")
      console.log("--------- New connection ---------")
      console.log("Username : " + data.user.display_name)
      console.log("peer_id  : " + data.peer_id)
      console.log("----------------------------------")

      socket.user = data.user;
      socket.peer_id = data.peer_id
      socket.peer_video_id = data.peer_video_id

      let socket_ids = activeSockets.map(function(a) {
        return a.id;
      });
      let users = activeSockets.map(function(a) {
        return a.user;
      });

      let peer_ids = activeSockets.map(function(a) {
        return a.peer_id;
      });

      let peer_video_ids = activeSockets.map(function(a) {
        return a.peer_video_id;
      });

      socket.emit("update-user-list", {
        socket_ids: socket_ids,
        peer_ids: peer_ids,
        peer_video_ids: peer_video_ids,
        users: users
      });

      activeSockets.push(socket);

      socket.broadcast.emit("update-user-list", {
        socket_ids: [socket.id],
        peer_ids: [socket.peer_id],
        peer_video_ids: [socket.peer_video_id],
        users: [socket.user]
      });

    });

    socket.on("change_user_data", data => {
      socket.user = data.user;
      socket.broadcast.emit("update-user-list", {
        socket_ids: [socket.id],
        peer_ids: [socket.peer_id],
        users: [socket.user]
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
        user: socket.user,
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
