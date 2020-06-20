var peer = new Peer({
  debug: 2
});

var localStream;
var port = 3000;

const socket = io('http://81.230.72.203:' + port);

function unselectUsersFromList() {
  const alreadySelectedUser = document.querySelectorAll(
    ".active-user.active-user--selected"
  );
  alreadySelectedUser.forEach(el => {
    el.setAttribute("class", "active-user");
  });
}

function createUserItemContainer(data, i) {
  const userContainerEl = document.createElement("div");


  const usernameEl = document.createElement("p");

  userContainerEl.setAttribute("class", "active-user");
  userContainerEl.setAttribute("id", data.socket_ids[i]);
  usernameEl.setAttribute("class", "username");
  usernameEl.setAttribute("class", "h4");
  usernameEl.innerHTML = `${data.usernames[i]}`;

  userContainerEl.appendChild(usernameEl);

  userContainerEl.addEventListener("click", () => {
    unselectUsersFromList();
    userContainerEl.setAttribute("class", "active-user active-user--selected");
    callUser(data.peer_ids[i]);
  });

  return userContainerEl;
}

function createMessageItem(displayname, message_content) {
  //: create the message body
  $el = $('<div class="message_body col-md-12"></div>')

  //: Add avatar to the message
  $el.append('<img class="avatar" src="img/avatar.jpg"/>')

  //: add displayname of sender
  $el.append('<p class="message_displayname">' + displayname + '</p>')

  //: add message body
  $el.append('<div class="message_content">' + message_content + '</div>')

  $("#chat").append($el)
  return $el;
}

function callUser(peer_id) {

  var conn = peer.connect(peer_id);

  conn.on('open', function() {
    // Receive messages
    conn.on('data', function(data) {
      console.log('Received', data);
    });

    conn.send('ping');
  });

  var call = peer.call(peer_id,
    localStream)

  call.on('stream', function(stream) {
    document.getElementById("remote-video").srcObject = stream;
  });

}


function updateUserList(data) {
  const activeUserContainer = document.getElementById("active-user-container");

  data.socket_ids.forEach(function(socketId, i) {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser && data.socket_ids[0].lenght != 0) {
      const userContainerEl = createUserItemContainer(data, i);
      activeUserContainer.appendChild(userContainerEl);
    }
  });

}


function connectToNetwork() {
  if (peer._id != null && display_name != null) {
    console.log("connecting to network")
    socket.emit('send-username', {
      username: display_name,
      peer_id: peer._id
    });
  } else {
    window.setTimeout(connectToNetwork, 1000);
  }
}

function openBonapetit(){
  window.open('https://youtu.be/EV_3IEBVRss', '_blank', 'nodeIntegration=no')
}

$(document).ready(function() {

  window.api.response("recive_display_name", (event, arg) => {
    console.log("Display name: " + arg)
    if (arg == undefined) {
      $('#displayname_modal').modal('show')
    } else {
      display_name = arg;
      window.api.request("set_display_name", display_name)
      connectToNetwork();
    }
  })

  $('#sidebarCollapse').on('click', function () {
       $('#sidebar').toggleClass('active');
       $(this).toggleClass('active');
   });

  var tranition_time = 200;
  $("#settings_icon").on('click', function(e) {
    $("#main").hide(tranition_time, function() {
      $("#settings_div").show(tranition_time)
    })

  })
  $("#back_btn").on('click', function(e) {
    $("#settings_div").hide(tranition_time, function() {
      $("#main").show(tranition_time)
    })
  })

  $("#connect_btn").on('click', function(e) {
    $('#displayname_modal').modal('hide')
    display_name = $("#display_name").val()
    window.api.request("set_display_name", display_name)
    connectToNetwork();
  })

  $("#chat-form").on('submit', function(e) {
    e.preventDefault();
    socket.emit('send-message', {
      username: display_name,
      message: $("#chat-input").val()
    });
    createMessageItem(display_name, $("#chat-input").val())
    $("#chat-input").val("")
  })


  socket.on("update-user-list", data => {
    console.log(data)
    updateUserList(data);
  });

  socket.on("remove-user", ({
    socketId
  }) => {
    const elToRemove = document.getElementById(socketId);

    if (elToRemove) {
      elToRemove.remove();
    }
  });


  socket.on("send-message", data => {
    createMessageItem(data.username, data.message)

    /*
    let myNotification = new Notification(data.username, {
      body: data.message
    })

    myNotification.onclick = () => {
      console.log('Notification clicked')
    }
    */
  });


  navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    })
    .then(stream => {
      localStream = stream;
      const localVideo = document.getElementById("local-video");
      localVideo.srcObject = stream;

      $("#local-video").show(500)
    })
    .catch(error => console.log(error));

  //: peerjs has initialized
  peer.on('open', function(id) {
    console.log('peer_id: ' + id);
  });

  //: a new copnnection from another computer to this one
  peer.on('connection', function(conn) {

    conn.on('data', function(data) {
      console.log('Received', data);
      conn.send("pong")
    });

  });

  //: someone is calling this computer
  peer.on('call', function(call) {


    $("#call_confirtmation_body").text(` wants to call you. Do accept this call?`)

    $("#answer_call_btn").on('click', function(e) {
      $("#call_confirtmation").modal("hide")
      console.log("Call has been answered, making a connection")
      //: answer the call
      call.answer(localStream);
    })

    $("#reject_call_btn").on('click', function(e) {
      $("#call_confirtmation").modal("hide")
      socket.emit("reject-call", {
        to: data.socket
      });
    })

    //: Show the dialog
    $("#call_confirtmation").modal("show")



    //: when a stream is detected in the call
    call.on('stream', function(stream) {
      document.getElementById("remote-video").srcObject = stream;
    });
  });


  //: Calls the backend of the client to request the displayname
  window.api.request("get_display_name")



})
