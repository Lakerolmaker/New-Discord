$(document).ready(function() {

  var tranition_time = 200;
  $("#settings_icon").on('click', function(e) {
    $("#main").hide(tranition_time, function() {
      $("#settings_page").show(tranition_time)
    })

  })
  $("#back_btn").on('click', function(e) {
    $("#settings_page").hide(tranition_time, function() {
      $("#main").show(tranition_time)
    })
  })

  $("#upload_avatar").on('change', function(ev) {
    $("#upload_avatar").prop("disabled", true);
    var path = $('#upload_avatar').prop('files')[0].path;
    window.api.request("upload_image", path)
    toast("Settings", "Uploading avatar")
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


})
