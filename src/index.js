import "./cam.css";
// References to all the element we will need.
var video = document.querySelector("#camera-stream"),
  image = document.querySelector("#snap"),
  start_camera = document.querySelector("#start-camera"),
  controls = document.querySelector(".controls"),
  take_photo_btn = document.querySelector("#take-photo"),
  delete_photo_btn = document.querySelector("#delete-photo"),
  download_photo_btn = document.querySelector("#download-photo"),
  error_message = document.querySelector("#error-message"),
  api_request = document.querySelector("#api-photo"),
  hidden_canvas,
  byteCharacters,
  context;
// The getUserMedia interface is used for handling camera input.
// Some browsers need a prefix so here we're covering all the options
navigator.getMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

if (!navigator.getMedia) {
  displayErrorMessage(
    "Your browser doesn't have support for the navigator.getUserMedia interface."
  );
} else {
  // Request the camera.
  navigator.getMedia(
    {
      video: true
    },
    // Success Callback
    function(stream) {
      // Create an object URL for the video stream and
      // set it as src of our HTLM video element.
      video.srcObject = stream;

      // Play the video element to start the stream.
      video.play();
      video.onplay = function() {
        showVideo();
      };
    },
    // Error Callback
    function(err) {
      displayErrorMessage(
        "There was an error with accessing the camera stream: " + err.name,
        err
      );
    }
  );
}

// Mobile browsers cannot play video without user input,
// so here we're using a button to start it manually.
start_camera.addEventListener("click", function(e) {
  e.preventDefault();

  // Start video playback manually.
  video.play();
  showVideo();
});

take_photo_btn.addEventListener("click", function(e) {
  e.preventDefault();

  var snap = takeSnapshot();

  // Show image.
  image.setAttribute("src", snap);
  image.classList.add("visible");

  // Enable delete and save buttons
  delete_photo_btn.classList.remove("disabled");
  download_photo_btn.classList.remove("disabled");
  api_request.classList.remove("disabled");
  // Set the href attribute of the download button to the snap url.
  download_photo_btn.href = snap;

  // Pause video playback of stream.
  video.pause();
});

delete_photo_btn.addEventListener("click", function(e) {
  e.preventDefault();

  // Hide image.
  image.setAttribute("src", "");
  image.classList.remove("visible");

  // Disable delete and save buttons
  delete_photo_btn.classList.add("disabled");
  download_photo_btn.classList.add("disabled");
  api_request.classList.add("disabled");

  // Resume playback of stream.
  video.play();
});

api_request.addEventListener("click", function(e) {
  var xhr = new XMLHttpRequest();
  var data = new FormData();
  data.append("image", byteCharacters);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      alert(xhr.responseText);
    }
  };
  xhr.open(
    "POST",
    "https://microsoft-azure-microsoft-computer-vision-v1.p.rapidapi.com/analyze?visualfeatures=Categories%2CTags%2CColor%2CFaces%2CDescription"
  );
  xhr.setRequestHeader(
    "X-RapidAPI-Key",
    "<Your-Secret-Key>"
  );
  xhr.send(data);
});

function showVideo() {
  // Display the video stream and the controls.

  hideUI();
  video.classList.add("visible");
  controls.classList.add("visible");
}

function takeSnapshot() {
  // Here we're using a trick that involves a hidden canvas element.

  hidden_canvas = document.querySelector("canvas");
  context = hidden_canvas.getContext("2d");

  var width = video.videoWidth,
    height = video.videoHeight;

  if (width && height) {
    // Setup a canvas with the same dimensions as the video.
    hidden_canvas.width = width;
    hidden_canvas.height = height;

    // Make a copy of the current frame in the video on the canvas.
    context.drawImage(video, 0, 0, width, height);
    var block = hidden_canvas.toDataURL("image/png").split(";");
    // Get the content type of the image
    var contentType = block[0].split(":")[1]; // In this case "image/gif"
    // get the real base64 content of the file
    var realData = block[1].split(",")[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."

    // Convert it to a blob to upload
    byteCharacters = b64toBlob(realData, contentType);
    // Turn the canvas image into a dataURL that can be used as a src for our photo.
    return hidden_canvas.toDataURL("image/png");
  }
}

function displayErrorMessage(error_msg, error) {
  error = error || "";
  if (error) {
    console.log(error);
  }

  error_message.innerText = error_msg;

  hideUI();
  error_message.classList.add("visible");
}

function hideUI() {
  // Helper function for clearing the app UI.
  controls.classList.remove("visible");
  start_camera.classList.remove("visible");
  video.classList.remove("visible");
  error_message.classList.remove("visible");
}

function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || "";
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}