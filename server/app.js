// Setup basic express server
const path = require('path');
const macaddress = require('macaddress');
const ip = require('ip');
const {
  PeerServer
} = require('peer');

var socket_port = process.env.socket_port || 3000;
var peerjs_port = process.env.peer_port || 3001;
postServer_path = "/img_upload"
postServer_port = 3002

var mac_address;
macaddress.all().then(function(all) {
  mac_address = all.Ethernet.mac;
  console.log("Mac adress : " + mac_address)
});

const ip4 = ip.address()
console.log("Server running  on Ip4 adress : " + ip4)


var activeSockets = [];
var io = require('socket.io')(socket_port);
console.log("Socket Server running on port : " + socket_port)

const peerServer = PeerServer({
  port: peerjs_port,
  path: '/myapp'
});

console.log("Peerjs sevrer running on port : " + peerjs_port),

  startPostServer()


io.on('connection', (socket) => {

  socket.on('send_username', data => {

    console.log("")
    console.log("--------- New connection ---------")
    console.log("Username : " + data.user.display_name)
    console.log("peer_id  : " + data.user.peer_id)
    console.log("----------------------------------")

    socket.user = data.user;
    socket.user.socket_id = socket.id;

    let users = activeSockets.map(function(a) {
      return a.user;
    });

    socket.emit("update-user-list", {
      users: users
    });

    activeSockets.push(socket);

    socket.broadcast.emit("update-user-list", {
      users: [socket.user]
    });

  });

  socket.on("change_user_data", data => {
    socket.user = data.user;
    socket.user.socket_id = socket.id;
    socket.broadcast.emit("update-user-list", {
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

  socket.on("send-to-user", data => {
    socket.to(data.to).emit("send-to-user", {
      user: socket.user,
      message: data.message
    });
  });

  socket.on("disturb_user", data => {
    socket.to(data.to).emit("disturb_user", {
      user: socket.user,
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

function startPostServer() {
  var express = require('express')
  var fs = require('fs')
  const path = require('path');
  var bodyParser = require('body-parser')
  var postServer = express()


  const temp_path = path.resolve(__dirname, '.' + postServer_path);


  var fileupload = require("express-fileupload");
  postServer.use(fileupload({
    useTempFiles: true,
    preserveExtension: true,
    tempFileDir: temp_path
  }));
  postServer.post(postServer_path, function(request, response) {
    console.log('POST /')
    var file;

    if (!request.files) {
      response.send("File was not found");
      return;
    }

    file = request.files.FormFieldName;
    fileName = file.name

    console.log(request.files)

    response.send("File uploaded");
  })


  postServer.listen(postServer_port)
  console.log(`Post   Server running on port : ${postServer_port} on the path ${postServer_path}`)
}


function get_user(socketId) {
  return activeSockets.filter(function(existingSocket) {
    return existingSocket.id !== socketId
  });
}
