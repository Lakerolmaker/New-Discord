$(document).ready(function() {

  var tranition_time = 200;
  $("#settings_icon").on('click', function(e) {
    $("#main").hide(tranition_time, function() {

      if (user.server_ip4 != undefined) {
        $("#settings_server_ip4").val(user.server_ip4)
      }

      if (user.socket_port != undefined) {
        $("#settings_socket_port").val(user.socket_port)
      }

      if (user.peerjs_port != undefined) {
        $("#settings_peerjs_port").val(user.peerjs_port)
      }

      $("#settings_page").show(tranition_time)
    })

  })
  $("#back_btn").on('click', function(e) {
    $("#settings_page").hide(tranition_time, function() {
      $("#main").show(tranition_time)
    })
  })

  $("#new_avatar_image").on('change', function(ev) {
    //: Adds meta data about the files to the form data.
    var formdata = new FormData();
    var file = $("#new_avatar_image")[0].files[0]

    formdata.append("file", file)

    console.log(formdata)
    console.log(file)
    console.log(`http://${server_address}:${server_post_port}${server_post_path}`)
    $.ajax({
      url: `http://${server_address}:${server_post_port}${server_post_path}`,
      type: "POST",
      data: formdata,
      cache: false,
      contentType: false,
      processData: false,
      beforeSend: function() {

      },
      success: function(data) {

        console.log(data)
      },
      error: function(e) {
        console.log(e)
      }
    });


  })

  window.api.response("get_avatar_url", (event, arg) => {
    $("#upload_avatar").prop("disabled", false);
    user.avatar_url = arg
    socket.emit('change_user_data', {
      peer_id: peer._id,
      user: user
    });
    toast("Settings", "Avatar has been updated")
  })


  $("#settings_displayname").on('change', ev => {
    user.display_name = $("#settings_displayname").val()
    window.api.request("set_display_name", user.display_name)
    socket.emit('change_user_data', {
      peer_id: peer._id,
      user: user
    });
    toast("Settings", "Display name has been updated")
  })

  $("#settings_server_ip4").on('change', ev => {
    user.server_ip4 = $("#settings_server_ip4").val()
    window.api.request("set_server_ip4", user.server_ip4)
    toast("Settings", "Server Ip has been updated, please restart application.")
  })

  $("#settings_socket_port").on('change', ev => {
    user.socket_port = $("#settings_socket_port").val()
    window.api.request("set_socket_port", user.socket_port)
    toast("Settings", "Socket port has been updated, please restart application.")
  })

  $("#settings_peerjs_port").on('change', ev => {
    user.peerjs_port = $("#settings_peerjs_port").val()
    window.api.request("set_peerjs_port", user.peerjs_port)
    toast("Settings", "Peerjs port has been updated please restart application.")
  })


})
