var peerjs_host = '81.230.72.203/';
var peerjs_port = 3001;
const peer = new Peer({
  host: peerjs_host,
  port: peerjs_port,
  path: '/myapp'
});

const peer_video = new Peer({
  host: peerjs_host,
  port: peerjs_port,
  path: '/myapp'
});

var localStream_audio;
var localStream_video = new MediaStream();;
var remoteStream_audio;
var remoteStream_video;

var data_connection_audio;
var data_connection_video;

var socket_host = 'http://81.230.72.203/';
var socket_port = 3000;
const socket = io( socket_host + ':' + socket_port);

var user;

var callsound = new Audio(' ./sound/call sound.mp3');

//: a boolean of wheather or not the user is muted
var muted = false;

function createUserItemContainer(data, i) {

  $el = $('<li class="user_element"></li>')
  $el.attr('id', data.socket_ids[i]);

  if (data.users[i].avatar_url == undefined) {
    $img = $('<img class="avatar small_avatar" src="img/avatar.jpg">')
    $el.append($img)
  } else {
    $img = $('<img class="avatar small_avatar" src="' + data.users[i].avatar_url + '">')
    $el.append($img)
  }

  $a = $('<a href="#">' + data.users[i].display_name + '</a>')
  $a.on('click', ev => {
    displayToCallConfirmation(data.socket_ids[i], data.peer_ids[i], data.peer_video_ids[i])
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

function callUser(peer_id, peer_video_id) {

  peer.on('close', function(ev) {
    console.log("connection closed")
    disconnect_from_call();
  })

  peer.on('disconnected', function(ev) {
    console.log("connection disconnecting")
    disconnect_from_call();
  })

  var conn_audio = peer.connect(peer_id);
  data_connection_audio = conn_audio;
  conn_audio.on('open', function() {
    // Receive messages
    conn_audio.on('data', function(data) {
      console.log('Received', data);
      if (data == "disconnect") {
        disconnect_from_call()
      }
    });

    conn_audio.send('ping');
  });

  conn_audio.on('close', function(ev) {
    console.log("connection closed")
    disconnect_from_call();
  })

  conn_audio.on('disconnected', function(ev) {
    console.log("connection disconnecting")
    disconnect_from_call();
  })

  var call_audio = peer.call(peer_id,
    localStream_audio)

  call_audio.on('stream', function(stream) {
    document.getElementById("remote-audio").srcObject = stream;
    $("#call-ui").show(500)
  });

  //:  Video connection
  var conn_video = peer_video.connect(peer_video_id);
  data_connection_video = conn_video;
  conn_video.on('open', function() {
    // Receive messages
    conn_video.on('data', function(data) {
      console.log('Received', data);
    });

    conn_video.send('ping');
  });

  $("#turn_on_camera_btn").on('click', function(e) {
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
      .then(stream => {
        console.log("added video")
        localStream_video = stream;
        const localVideo = document.getElementById("local-video");
        localVideo.srcObject = stream;

        var conn_video = peer_video.call(peer_video_id,
          localStream_video)

        conn_video.on('stream', function(stream) {
          document.getElementById("remote-video").srcObject = stream;
        });
        $("#local-video").show(500)
      })
      .catch(error => {
        toast("Error", "Could not access the webcam")
      });
  })

  $("#turn_on_screen_Share_btn").on('click', function(e) {
    get_WindowCapure_sources().then(sources => {
      get_WindowCapure_Stream(sources[0].id).then(stream => {
        localStream_video = stream;
        const localVideo = document.getElementById("local-video");
        localVideo.srcObject = stream;

        var conn_video = peer_video.call(peer_video_id,
          localStream_video)

        conn_video.on('stream', function(stream) {
          document.getElementById("remote-video").srcObject = stream;
        });
        $("#local-video").show(500)
      })
    })
  })


}

function displayToCallConfirmation(socket_id, peer_id, peer_video_id) {
  var display_name = $("#" + socket_id).find("a").text()
  $("#to_call_confirtmation_title").html("Call User '" + display_name + "' ?")
  $("#to_call_confirtmation_body").html("Do you wish to call '" + display_name + "' ?")

  $("#call_user_btn").on('click', ev => {
    callUser(peer_id, peer_video_id);
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
  //  $.toast().reset('all');

  $.toast({
    text: text, // Text that is to be shown in the toast
    heading: heading, // Optional heading to be shown on the toast
    showHideTransition: 'fade', // fade, slide or plain
    allowToastClose: true, // Boolean value true or false
    hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 3, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: 'top-right', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
  })

}

function connectToNetwork() {
  if (peer._id != null && display_name != null && peer_video._id != null) {
    console.log("connecting to network")
    socket.emit('send_username', {
      peer_id: peer._id,
      peer_video_id: peer_video._id,
      user: user
    });
  } else {
    window.setTimeout(connectToNetwork, 1000);
  }
}

//: Disconnects from the call and cleans up all recourses.
//: NOTE: all streams must be destoyed for the connetion to end.
//: The audio stream is then reinitialized.
function disconnect_from_call() {
  console.log("disconnecting from call")
  data_connection_audio.close();
  data_connection_video.close();
  document.getElementById("remote-video").srcObject = null
  destroy_stream(localStream_audio)
  destroy_stream(localStream_video)
  destroy_stream(remoteStream_audio)
  destroy_stream(remoteStream_video)
  $("#call-ui").hide(500)
  $("#local-video").hide(500)
  getAudioStream().then(strem => {
    localStream_audio = strem;
  })

}

//: Destroys a stream
function destroy_stream(stream) {
  try {
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {}
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

//: Get's the stream for the camera connected to the user
async function getVideoStream() {
  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
  }).catch(error => {
    toast("Error", "Could not access the webcam")
  });
}

//: Get's the user selected microphone
async function getAudioStream() {
  return navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true
  }).catch(error => {
    toast("Error", "Could not access the microphone")
  });
}

async function get_WindowCapure_sources() {
  return window.api.get_desktopCapturer().getSources({
    types: ['window', 'screen'],
    fetchWindowIcons: true

  })
}

function get_WindowCapure_Stream(source_id) {

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source_id,
        minWidth: 1280,
        maxWidth: 1280,
        minHeight: 720,
        maxHeight: 720
      }
    },
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    }
  })

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
    createMessageItem(data.user, data.message)
  });
}

function addPeerjsEvents() {
  //: a new copnnection from another computer to this one
  peer.on('connection', function(conn) {
    data_connection_audio = conn;

    conn.on('data', function(data) {
      console.log('Received', data);
      if (data == "disconnect") {
        disconnect_from_call()
      }
      conn.send("pong")
    });

    conn.on('disconnected', function(data) {
      disconnect_from_call()
    });

    conn.on('close', function(ev) {
      console.log("connection closed")
      disconnect_from_call();
    })
  });

  //: someone is calling this computer
  peer.on('call', function(call) {

    $("#call_confirtmation_body").text(` wants to call you. Do accept this call?`)

    $("#answer_call_btn").on('click', function(e) {
      $("#call_confirtmation").modal("hide")
      stopReciveCallSound()
      console.log("Call has been answered, making a connection")
      //: answer the call
      call.answer(localStream_audio);
      $("#call-ui").show(500)
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
      console.log(stream)
      remoteStream_audio = stream;
      document.getElementById("remote-audio").srcObject = stream;
    });

    //: Show the dialog
    $("#call_confirtmation").modal("show")
    playReciveCallSound();
  });



  peer_video.on('connection', function(conn) {
    data_connection_video = conn;
    console.log("new connection")
    console.log(conn)
    conn.on('data', function(data) {
      console.log('Received', data);
      conn.send("pong")
    });

    $("#turn_on_camera_btn").on('click', function(e) {
      navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        })
        .then(stream => {
          console.log("added video")
          localStream_video = stream;
          const localVideo = document.getElementById("local-video");
          localVideo.srcObject = stream;

          var conn_video = peer_video.call(conn.peer,
            localStream_video)

          conn_video.on('stream', function(stream) {
            document.getElementById("remote-video").srcObject = stream;
          });
          $("#local-video").show(500)
        })
        .catch(error => {
          toast("Error", "Could not access the webcam")
        });
    })

    $("#turn_on_screen_Share_btn").on('click', function(e) {
      get_WindowCapure_sources().then(sources => {
        get_WindowCapure_Stream(sources[0].id).then(stream => {
          localStream_video = stream;
          const localVideo = document.getElementById("local-video");
          localVideo.srcObject = stream;

          var conn_video = peer_video.call(conn.peer,
            localStream_video)

          conn_video.on('stream', function(stream) {
            document.getElementById("remote-video").srcObject = stream;
          });
          $("#local-video").show(500)
        })
      })
    })

  });

  peer_video.on('call', function(call) {
    console.log("someone video called ")
    call.on('stream', function(stream) {
      console.log(stream)
      remoteStream_video = stream;
      document.getElementById("remote-video").srcObject = stream;
    });

    call.answer(localStream_video);
  });

}

function addClickEvents() {
  $('#sidebarCollapse').on('click', function() {
    $('#sidebar').toggleClass('active');
    $(this).toggleClass('active');
  });

  $("#connect_btn").on('click', function(e) {
    if ($("#display_name").val() != "") {
      $('#displayname_modal').modal('hide')
      display_name = $("#display_name").val()
      window.api.request("set_display_name", display_name)
      $("#main").show()
      connectToNetwork();
    } else {
      toast("Error", "Display name can't be empty")
    }
  })

  $("#disconnect_btn").on('click', function(e) {
    console.log("disconnecting from call")
    disconnect_from_call();
  })

  $("#mute_btn").on('click', function() {
    console.log("clicked 1")
    muted = !muted;
    if(muted){
      $("#mute_btn").addClass('centerButton_active');
      $("#mute_btn").removeClass('centerButton_deactive');
      $("#mute_btn svg").css("color", "#060607")
      localStream_audio.getTracks()[0].enabled = false
    }else{
      $("#mute_btn").addClass('centerButton_deactive');
      $("#mute_btn").removeClass('centerButton_active');
      $("#mute_btn svg").css("color", "#fff")
      localStream_audio.getTracks()[0].enabled = true
    }
  });

}

function addClientBackendEvents() {
  window.api.response("recive_user_info", (event, arg) => {
    user = arg;
    console.log(user)
    if (user.display_name == undefined) {
      $('#displayname_modal').modal('show')
    } else {
      console.log("Display name: " + user.display_name)
      $("#main").show()
      connectToNetwork();
    }
  })

  window.api.response("message", (event, arg) => {
    console.log(arg)
  })

  window.api.response("get_WindowCapure_Stream", (event, arg) => {
    console.log(arg)
  })
}

$(document).ready(function() {

  $("#call-ui").hide()
  $("#main").hide()

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

  //: initializes the audio stream
  getAudioStream().then(strem => {
    localStream_audio = strem;
  })

  //: Calls the backend of the client to request the displayname
  window.api.request("get_user_info")

})
