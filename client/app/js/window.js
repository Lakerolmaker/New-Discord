console.log('%c New Deeiscordo', 'font-weight: bold; font-size: 50px;color: red; background-color: black;');
console.log('%c Please do not try to break my program, plz', 'font-weight: bold ;  text-shadow: 2px 2px 5px red;');


var peerjs_host = "81.230.72.203";
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
var localStream_video;
var remoteStream_audio;
var remoteStream_video;

var data_connection_audio;
var data_connection_video;

var socket_host = 'http://81.230.72.203';
var socket_port = 3000;
const socket = io(socket_host + ':' + socket_port);

var user;
var user_page = null;

var callsound = new Audio(' ./sound/call sound.mp3');

//: a boolean of wheather or not the user is muted
var muted = false;

function createUserItemContainer(newuser, is_friend) {

  $el = $('<li class="user_element"></li>')
  $el.attr('id', newuser.socket_id);

  $img = $('<img class="avatar small_avatar" src="' + newuser.avatar_url + '">')
  $el.append($img)

  $a = $('<a href="#">' + newuser.display_name + '</a>')

  //: when a user is clicked the users info is loaded on the right screen
  $a.on('click', ev => {
    loadUserInfoToScreen(newuser);
  })

  $el.append($a)

  //: Adds different context menues to the user element depeding on the user is a friend or not
  if (is_friend) {
    $drop_down = $('<div class="dropdown-menu dropdown-menu-sm" id="context-menu"></div>')
    $add_friend = $('<a class="dropdown-item" href="#">Remove Friend</a>')
    $add_friend.on('click', ev => {
      removeFriend(user.mac_id, newuser)
    })
    $cancel = $('<a class="dropdown-item" href="#">Cancel</a>')
    $drop_down.append($add_friend)
    $drop_down.append($cancel)
    $el.append($drop_down)
  } else {
    $drop_down = $('<div class="dropdown-menu dropdown-menu-sm" id="context-menu"></div>')
    $add_friend = $('<a class="dropdown-item" href="#">Add Friend</a>')
    $add_friend.on('click', ev => {
      addFriend(user.mac_id, newuser)
    })
    $cancel = $('<a class="dropdown-item" href="#">Cancel</a>')
    $drop_down.append($add_friend)
    $drop_down.append($cancel)
    $el.append($drop_down)
  }

  $drop_down = $('<div class="dropdown-menu dropdown-menu-sm" id="context-menu"></div>')
  $add_friend = $('<a class="dropdown-item" href="#">Remove Friend</a>')
  $add_friend.on('click', ev => {
    if (is_friend) {
      removeFriend(user.mac_id, newuser)
    } else {
      addFriend(user.mac_id, newuser)
    }
  })
  $cancel = $('<a class="dropdown-item" href="#">Cancel</a>')
  $drop_down.append($add_friend)
  $drop_down.append($cancel)
  $el.append($drop_down)


  //: Adds right click options
  $el.on('contextmenu', function(e) {
    var top = e.pageY - 10;
    var left = e.pageX - 90;
    $drop_down.css({
      display: "block",
      top: top,
      left: left
    }).addClass("show");
    return false; //blocks default Webbrowser right click menu
  }).on("click", function() {
    $("#context-menu").removeClass("show").hide();
  });

  return $el;
}

function createMessageItem(newuser, message_content) {
  //: create the message body
  $el = $('<div class="message_body col-md-12"></div>')

  //: Add avatar to the message
  if (user.avatar_url == undefined) {
    $el.append('<img class="avatar" src="img/avatar.jpg"/>')
  } else {
    $el.append('<img class="avatar" src="' + newuser.avatar_url + '"/>')
  }

  $container = $('<div class="inner_message_container"></div>')

  //: add displayname of sender
  $container.append('<p class="message_displayname">' + newuser.display_name + '</p>')

  //: add message body
  $container.append('<div class="message_content">' + message_content + '</div>')
  $el.append($container)
  return $el;
}

function getYoutubeVideoId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ?
    match[2] :
    null;
}



function createPreviewItem(data) {
  console.log(data)

  //: create the message body
  $el = $('<div class="preview_body col-md-12"></div>')

  //: Youtube logic

  if (data.siteName == "YouTube") {
    const videoId = getYoutubeVideoId(data.url);
    //$player = $('<video tabindex="-1"  autoplay src="blob:https://www.youtube.com/1b12d8a5-5306-453c-8871-70693133fea8" style="width: 400px; height: 225px;"></video>')

    $player = $('<iframe width="560" height="315" src="https://www.youtube.com/embed/' + videoId + '" frameborder="0" allowfullscreen></iframe>')
    $el.append($player)
  } else if (data.contentType.includes("text/html")) {

    if (data.mediaType == "article") {
      if (data.images[0]) {
        $img = $('<img class="rounded preview_img_large" src="' + data.images[0] + '">')
        $el.append($img)
      }

      if (data.siteName != undefined) {
        $site_name = $('<div class="p preview_site_name" > ' + data.siteName + '</div>')
        $el.append($site_name)
      }

      if (data.url && data.title) {
        $div = $('<div class="preview_link_container" </div>')
        $a = $('<a class="preview_link" rel="noreferrer noopener" href="' + data.url + '"> ' + data.title + '</a>')
        $div.append($a)
        $el.append($div)
      }

      if (data.description) {
        $description = $('<div class="p preview_description" > ' + data.description + '</div>')
        $el.append($description)
      }

    } else {
      if (data.images[0]) {
        $img = $('<img class="rounded preview_img_small" src="' + data.images[0] + '">')
        $el.append($img)
      }

      if (data.url && data.title) {
        $div = $('<div class="preview_link_container" </div>')
        $a = $('<a class="preview_link" rel="noreferrer noopener" href="' + data.url + '"> ' + data.title + '</a>')
        $div.append($a)
        $el.append($div)
      }

      if (data.description) {
        $description = $('<div class="p preview_description" > ' + data.description + '</div>')
        $el.append($description)
      }
    }
  } else if (data.contentType.includes("asdakjsndkjasndkjasndkjn")) {

    if (data.url) {
      $img = $('<img class="rounded preview_img_large" src="' + data.url + '">')
      $el.append($img)
    }

  } else {

    if (data.images != undefined) {
      $img = $('<img class="rounded preview_img_small" src="' + data.images[0] + '">')
      $el.append($img)
    }

    if (data.url != undefined && data.title  != undefined) {
      $div = $('<div class="preview_link_container" </div>')
      $a = $('<a class="preview_link" rel="noreferrer noopener" href="' + data.url + '"> ' + data.title + '</a>')
      $div.append($a)
      $el.append($div)
    }else if(data.url != undefined){
      $div = $('<div class="preview_link_container" </div>')
      $a = $('<a class="preview_link" rel="noreferrer noopener" href="' + data.url + '"> ' + "Link" + '</a>')
      $div.append($a)
      $el.append($div)
    }

    if (data.description  != undefined) {
      $description = $('<div class="p preview_description" > ' + data.description + '</div>')
      $el.append($description)
    }

  }

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
    $("#video_div").show(500)
    $("#call-ui").show(1000)
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

function addFriend(friend_id, newuser) {
  user.friendList.push(friend_id)
  window.api.request("add_friend", friend_id)
  $("#" + newuser.socket_id).remove()
  $("#friendlist").append(createUserItemContainer(newuser, true));
}

function removeFriend(friend_id, newuser) {
  user.friendList = user.friendList.filter(id => id != friend_id);
  window.api.request("remove_friend", friend_id)
  $("#" + newuser.socket_id).remove()
  $("#userlist").append(createUserItemContainer(newuser, false));
}

function displayToCallConfirmation(user) {
  $("#to_call_confirtmation_title").html("Call User '" + user.display_name + "' ?")
  $("#to_call_confirtmation_body").html("Do you wish to call '" + user.display_name + "' ?")

  $("#call_user_btn").on('click', ev => {
    callUser(user.peer_id, user.peer_video_id);
  })

  $("#to_call_confirtmation").modal('show')
}

function updateUserList(data) {
  console.log(data)
  data.users.forEach(function(newuser, i) {
    const alreadyExistingUser = document.getElementById(newuser.socket_id);
    const is_friend = user.friendList.includes(newuser.mac_id);
    if (!alreadyExistingUser) {
      if (is_friend) {
        $("#friendlist").append(createUserItemContainer(newuser, is_friend));
      } else {
        $("#userlist").append(createUserItemContainer(newuser, is_friend));
      }
    } else if (alreadyExistingUser) {
      //: updates the user element with the updated info
      $("#" + newuser.socket_id).replaceWith(createUserItemContainer(newuser, is_friend))
    }

    //: create a userchat container
    var id = "user_chat" + newuser.socket_id
    if (!$("#" + id).length) {
      $("#user_chats").append($('<div class="chat" id="' + id + '"></div>'))
    }

  });

}

function toast(heading, text) {
  //  $.toast().reset('all');
  $.toast({
    text: text, // Text that is to be shown in the toast
    heading: heading, // Optional heading to be shown on the toast
    showHideTransition: 'fade', // fade, slide or plain
    allowToastClose: false, // Boolean value true or false
    hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 3, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: 'top-right', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
  })

}

function sendNotification(title, body) {
  window.api.request("send_notification", {
    "title": title,
    "body": body
  })
}

function getMessage() {
  if (user_page == null) {
    return $("#chat-input-global").val()
  } else {
    return $("#chat-input-user").val()
  }
}

function clearMessage() {
  if (user_page == null) {
    $("#chat-input-global").val("")
  } else {
    $("#chat-input-user").val("")
  }
}

//: Wheather to add to the global or a users chat.
function addMessageToScreen($el, addToGlobal, userdata) {
  if (addToGlobal == true) {
    $("#chat-global").append($el)

    //: Scroll to the bottom of the chat
    $el[0].scrollIntoView();
  } else {

    var id = "user_chat" + userdata.socket_id
    $("#" + id).append($el)

    //: Scroll to the bottom of the chat
    $el[0].scrollIntoView();
  }
}


function isValidURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

function messageHandler(user, message, addToGlobal, otherUser) {
  //: if the message is a url we add a preview to the message
  if (!message.startsWith("http")) {
    addMessageToScreen(createMessageItem(user, message), addToGlobal, otherUser)
  } else if (isValidURL(message)) {
    var data = {}
    data.user = user;
    data.message = message;
    data.addToGlobal = addToGlobal;
    data.otherUser = otherUser;
    window.api.request("get_web_data", data)
  }
}

function loadUserInfoToScreen(userdata) {
  //: adds the current user to a variable
  user_page = userdata;
  var id = "user_chat" + userdata.socket_id

  $("#user_header_name").text(userdata.display_name)

  //: Move chat contents to the screen.
  //: if there is a chat on screen.
  if ($("#chat_container_user").children().lenght) {
    $("#chat_container_user").children().appendTo("#user_chats")
  }
  $("#" + id).appendTo("#chat_container_user");


  //: when the call button is pressed
  $("#user_header_call_user_btn").on('click', ev => {
    displayToCallConfirmation(userdata)
  })

  //: when the video call button is pressed
  $("#user_header_call_user_video_btn").on('click', ev => {
    toast("Info", "Not implemented yet")
  })

  if ($("#global").is(":visible")) {
    $("#global").hide(200, "linear", ev => {
      $("#user-page").show(200, "linear")
    })
  }

}

function loadHomePage() {
  user_page = null;
  $("#chat_container_user").children().appendTo("#user_chats")
  if (!$("#global").is(":visible")) {
    $("#user-page").hide(200, "linear", ev => {
      $("#global").show(200, "linear")
    })
  }
}

function connectToNetwork() {
  if (peer._id != null && display_name != null && peer_video._id != null) {
    console.log("connecting to network")
    user.peer_id = peer._id;
    user.peer_video_id = peer_video._id;
    socket.emit('send_username', {
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
  $("#video_div").hide(1000)
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
    sendNotification(data.user.display_name, data.message)
    messageHandler(data.user, data.message, true)
  });

  socket.on("send-to-user", data => {
    sendNotification(data.user.display_name, data.message)
    messageHandler(data.user, data.message, false, data.user)
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
      $("#video_div").show(500)
      $("#call-ui").show(1000)
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

  $('#home_btn').on('click', function() {
    loadHomePage();
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
    if (muted) {
      $("#mute_btn").addClass('centerButton_active');
      $("#mute_btn").removeClass('centerButton_deactive');
      $("#mute_btn svg").css("color", "#060607")
      localStream_audio.getTracks()[0].enabled = false
    } else {
      $("#mute_btn").addClass('centerButton_deactive');
      $("#mute_btn").removeClass('centerButton_active');
      $("#mute_btn svg").css("color", "#fff")
      localStream_audio.getTracks()[0].enabled = true
    }
  });

  // open all links in a external browser
  $(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    window.api.open_link_in_browser(this.href)
  });

}

function addSubmitEvent() {
  $(".chat-form").on("submit", ev => {
    ev.preventDefault()
    var message = getMessage()
    clearMessage()
    if (message != "") {
      if (user_page == null) {
        socket.emit('send-message', {
          message: message
        });
        messageHandler(user, message, true)
      } else {
        socket.emit('send-to-user', {
          message: message,
          to: user_page.socket_id
        });
        messageHandler(user, message, false, user_page)
      }
    }
  })

}

function addClientBackendEvents() {
  window.api.response("recive_user_info", (event, arg) => {
    user = arg;
    console.log("User Data:")
    console.log(user)
    if (user.display_name == undefined) {
      $('#displayname_modal').modal('show')
    } else {
      console.log("Display name: " + user.display_name)
      $("#main").show()
      connectToNetwork();
    }
  })

  window.api.response("get_web_data", (event, arg) => {
    addMessageToScreen(createMessageItem(arg.user, arg.message), arg.addToGlobal, arg.otherUser)
    if (arg.web_data != undefined) {
      addMessageToScreen(createPreviewItem(arg.web_data), arg.addToGlobal, arg.otherUser)
    } else {
      console.log("no data given")
    }
  })

  window.api.response("message", (event, arg) => {
    console.log(arg)
  })


}

$(document).ready(function() {
  $("#main").hide()

  $("#call-ui").hide()
  $("#video_div").hide()
  $("#user-page").hide()


  addSocketEvents()
  addPeerjsEvents()
  addClickEvents()
  addClientBackendEvents()
  addSubmitEvent()

  //: initializes the audio stream
  getAudioStream().then(strem => {
    localStream_audio = strem;
  })

  //: Calls the backend of the client to request the displayname
  window.api.request("get_user_info")

})
