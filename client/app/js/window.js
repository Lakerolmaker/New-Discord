const peer = new Peer({
  host: '81.230.72.203',
  port: 3001,
  path: '/myapp'
});

var localStream;
var port = 3000;

const socket = io('http://81.230.72.203:' + port);

var user;

var callsound = new Audio(' ./sound/call sound.mp3');


function createUserItemContainer(data, i) {

  $el = $('<li class="user_element"></li>')
  $el.attr('id', data.socket_ids[i]);

  if (user.avatar_url == undefined) {
    $img = $('<img class="avatar small_avatar" src="img/avatar.jpg">')
    $el.append($img)
  } else {
    $img = $('<img class="avatar small_avatar" src="' + data.users[i].avatar_url + '">')
    $el.append($img)
  }

  $a = $('<a href="#">' + data.users[i].display_name + '</a>')
  $a.on('click', ev => {
    displayToCallConfirmation(data.socket_ids[i], data.peer_ids[i])
  })

  $el.append($a)


  return $el;
}

function createMessageItem(user, message_content) {
  //: create the message body
  $el = $('<div class="message_body col-md-12"></div>')

  //: Add avatar to the message
  if (user.avatar_url == undefined) {
    $el.append('<img class="avatar" src="img/avatar.jpg"/>')
  } else {
    $el.append('<img class="avatar" src="' + user.avatar_url + '"/>')
  }

  //: add displayname of sender
  $el.append('<p class="message_displayname">' + user.display_name + '</p>')

  //: add message body
  $el.append('<div class="message_content">' + message_content + '</div>')

  $("#chat").append($el)

  //: Scroll to the bottom of the chat
  $('#chat').scrollTop($('#chat')[0].scrollHeight);

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

function displayToCallConfirmation(socket_id, peer_id) {
  var display_name = $("#" + socket_id).find("a").text()
  $("#to_call_confirtmation_title").html("Call User '" + display_name + "' ?")
  $("#to_call_confirtmation_body").html("Do you wish to call '" + display_name + "' ?")

  $("#call_user_btn").on('click', ev => {
    callUser(peer_id);
  })


  $("#to_call_confirtmation").modal('show')

}


function updateUserList(data) {
  const activeUserContainer = document.getElementById("userlist");

  data.socket_ids.forEach(function(socketId, i) {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser && data.socket_ids[0].lenght != 0) {
      //: Adds the user to the user list if it is not in it
      $("#userlist").append(createUserItemContainer(data, i));
    } else if (alreadyExistingUser) {
      //: updates the user element with the updated info
      $("#" + socketId).replaceWith(createUserItemContainer(data, i))
    }
  });

}

function toast(heading, text) {
  $.toast().reset('all');

  $.toast({
    text: text, // Text that is to be shown in the toast
    heading: heading, // Optional heading to be shown on the toast
    showHideTransition: 'fade', // fade, slide or plain
    allowToastClose: true, // Boolean value true or false
    hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: 'top-right', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
  })

}


function connectToNetwork() {
  if (peer._id != null && display_name != null) {
    console.log("connecting to network")
    socket.emit('send_username', {
      peer_id: peer._id,
      user: user
    });
  } else {
    window.setTimeout(connectToNetwork, 1000);
  }
}

function openBonapetit() {
  window.api.request("open_music_player")
}

function openSourcecode() {
  window.open('https://github.com/Lakerolmaker/New-Discord', '_blank', 'nodeIntegration=no')
}

function aboutClick() {
  toast("Info", "You don't wanna know how this was made")
}

function contactClick() {
  toast("Info", "I ain't wanna talk to you")
}

function playReciveCallSound() {
  callsound.currentTime = 0
  callsound.play();
}

function stopReciveCallSound() {
  callsound.pause();
}

function addSocketEvents() {
  socket.on("update-user-list", data => {
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
    createMessageItem(data.user, data.message)
  });
}

function addPeerjsEvents() {
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
      stopReciveCallSound()
      console.log("Call has been answered, making a connection")
      //: answer the call
      call.answer(localStream);
    })

    $("#reject_call_btn").on('click', function(e) {
      $("#call_confirtmation").modal("hide")
      stopReciveCallSound()
      socket.emit("reject-call", {
        to: data.socket
      });
    })

    //: when a stream is detected in the call
    call.on('stream', function(stream) {
      document.getElementById("remote-video").srcObject = stream;
    });

    //: Show the dialog
    $("#call_confirtmation").modal("show")
    playReciveCallSound();

  });
}

function addClickEvents() {
  $('#sidebarCollapse').on('click', function() {
    $('#sidebar').toggleClass('active');
    $(this).toggleClass('active');
  });

  $("#connect_btn").on('click', function(e) {
    $('#displayname_modal').modal('hide')
    display_name = $("#display_name").val()
    window.api.request("set_display_name", display_name)
    connectToNetwork();
  })
}

function addClientBackendEvents() {
  window.api.response("recive_user_info", (event, arg) => {
    user = arg;
    console.log("Display name: " + user.display_name)
    console.log(user)
    if (user.display_name == undefined) {
      $('#displayname_modal').modal('show')
    } else {
      connectToNetwork();
    }
  })

  window.api.response("message", (event, arg) => {
    console.log(arg)
  })
}

$(document).ready(function() {

  addSocketEvents()
  addPeerjsEvents()
  addClickEvents()
  addClientBackendEvents()

  $("#chat-form").on('submit', function(e) {
    e.preventDefault();
    if ($("#chat-input").val() != "") {
      socket.emit('send-message', {
        message: $("#chat-input").val()
      });
      createMessageItem(user, $("#chat-input").val())
      $("#chat-input").val("")
    }
  })

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
    .catch(error => {
      toast("Error", "Could not access the webcam")
    });




  //: Calls the backend of the client to request the displayname
  window.api.request("get_user_info")


})
