const peer = new Peer({
  host: '81.230.72.203',
  port: 3001,
  path: '/myapp'
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

  $el = $('<li class="user_element"></li>')
  $el.attr('id', data.socket_ids[i]);

  $a = $('<a href="#">' + data.usernames[i] + '</a>')
  $a.on('click', ev => {
    callUser(data.peer_ids[i]);
  })

  $el.append($a)

  $("#userlist").append($el)
  return $el;
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
  const activeUserContainer = document.getElementById("userlist");

  data.socket_ids.forEach(function(socketId, i) {
    const alreadyExistingUser = document.getElementById(socketId);
    if (!alreadyExistingUser && data.socket_ids[0].lenght != 0) {
      createUserItemContainer(data, i);
    }
  });

}

function toast(heading, text) {


  $.toast({
    text: text, // Text that is to be shown in the toast
    heading: heading, // Optional heading to be shown on the toast
    showHideTransition: 'fade', // fade, slide or plain
    allowToastClose: true, // Boolean value true or false
    hideAfter: 3000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: 'top-right', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
  })

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

function openBonapetit() {
  window.open('https://youtu.be/EV_3IEBVRss', '_blank', 'nodeIntegration=no')
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

  window.api.response("message", (event, arg) => {
    console.log(arg)
  })

  $('#sidebarCollapse').on('click', function() {
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
    $.toast({
      text: "GG! I have your Ip now, better luck next time noob", // Text that is to be shown in the toast
      heading: "Should have never trusted me", // Optional heading to be shown on the toast
      showHideTransition: 'fade', // fade, slide or plain
      icon: 'warning',
      allowToastClose: false, // Boolean value true or false
      hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
      stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
      position: 'mid-center', // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
    })
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
