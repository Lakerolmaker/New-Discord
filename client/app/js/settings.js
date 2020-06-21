$(document).ready(function() {


  $("#upload_avatar").on('change', function(ev) {
    $("#upload_avatar").prop("disabled", true);
    var path = $('#upload_avatar').prop('files')[0].path;
    window.api.request("upload_image", path)
    toast("Settings", "Uploading avatar")
  })

  window.api.response("get_avatar_url", (event, arg) => {
    $("#upload_avatar").prop("disabled", false);
    toast("Settings", "Avatar has been updated")
    user.avatar_url = arg
    connectToNetwork();
  })


  $("#settings_displayname").on('change', ev => {
    user.display_name = $("#settings_displayname").val()
    window.api.request("set_display_name", user.display_name)
    connectToNetwork();
    toast("Settings", "Display name has been updated")
  })


})
