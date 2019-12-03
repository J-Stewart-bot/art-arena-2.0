// the core of the program; appends the paint interface to the
// DOM element given as an argument (parent)
function createPaint(parentElement) {
  var canvas = elt("canvas", { id: "my-canvas", width: 500, height: 300 });
  var cx = canvas.getContext("2d");
  var toolbar = elt("div", { class: "toolbar" });

  // calls the every function in controls, passing in context,
  // then appending the returned results to the toolbar
  for (var name in controls) toolbar.appendChild(controls[name](cx));

  var panel = elt("div", { class: "picturepanel" }, canvas);
  parentElement.appendChild(elt("div", { id: "toRemove" }, panel, toolbar));
}

function reset(cx) {
  var div = document.getElementById("toRemove");
  div.remove();
  createPaint(appDiv);
}

// creates an element with a name and object (attributes)
// appends all further arguments it gets as child nodes
// string arguments create text nodes
// ex: elt('div', {class: 'foo'}, 'Hello, world!');
function elt(name, attributes) {
  var node = document.createElement(name);
  if (attributes) {
    for (var attr in attributes)
      if (attributes.hasOwnProperty(attr))
        node.setAttribute(attr, attributes[attr]);
  }
  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];

    // if this argument is a string, create a text node
    if (typeof child == "string") child = document.createTextNode(child);
    node.appendChild(child);
  }
  return node;
}

// figures out canvas relative coordinates for accurate functionality
function relativePos(event, element) {
  var rect = element.getBoundingClientRect();
  return {
    x: Math.floor(event.clientX - rect.left),
    y: Math.floor(event.clientY - rect.top)
  };
}

// registers and unregisters listeners for tools
function trackDrag(onMove, onEnd) {
  function end(event) {
    removeEventListener("mousemove", onMove);
    // eslint-disable-next-line no-restricted-globals
    removeEventListener("mouseup", end);
    if (onEnd) onEnd(event);
  }
  // eslint-disable-next-line no-restricted-globals
  addEventListener("mousemove", onMove);
  // eslint-disable-next-line no-restricted-globals
  addEventListener("mouseup", end);
}

// used by tools.Spray
// randomly positions dots
function randomPointInRadius(radius) {
  for (;;) {
    var x = Math.random() * 2 - 1;
    var y = Math.random() * 2 - 1;
    // uses the Pythagorean theorem to test if a point is inside a circle
    if (x * x + y * y <= 1) return { x: x * radius, y: y * radius };
  }
}

// holds static methods to initialize the various controls;
// Object.create() is used to create a truly empty object
var controls = Object.create(null);

controls.tool = function(cx) {
  var select = elt("select");

  // populate the tools
  for (var name in tools) select.appendChild(elt("option", null, name));

  // calls the particular method associated with the current tool
  cx.canvas.addEventListener("mousedown", function(event) {
    // is the left mouse button being pressed?
    if (event.which == 1) {
      // the event needs to be passed to the method to determine
      // what the mouse is doing and where it is
      tools[select.value](event, cx);
      // don't select when user is clicking and dragging
      event.preventDefault();
    }
  });

  return elt("span", null, "Tool: ", select);
};

// color module
controls.color = function(cx) {
  let input = elt("input", { type: "color" });

  // on change, set the new color style for fill and stroke
  input.addEventListener("change", function() {
    cx.fillStyle = input.value;
    cx.strokeStyle = input.value;
  });
  return elt("span", null, "Color: ", input);
};

// brush size module
controls.brushSize = function(cx) {
  let select = elt("select");
  // select.classList.add("select");
  // various brush sizes
  let sizes = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    21,
    22,
    23,
    24,
    25,
    26,
    27,
    28,
    29,
    30,
    31,
    32,
    33,
    34,
    35,
    36,
    37,
    38,
    39,
    40,
    41,
    42,
    43,
    44,
    45,
    46,
    47,
    48,
    49,
    50,
    51,
    52,
    53,
    54,
    55,
    56,
    57,
    58,
    59,
    60,
    61,
    62,
    63,
    64,
    65,
    66,
    67,
    68,
    69,
    70,
    71,
    72,
    73,
    74,
    75,
    76,
    77,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85,
    86,
    87,
    88,
    89,
    90,
    91,
    92,
    93,
    94,
    95,
    96,
    97,
    98,
    99,
    100
  ];

  // build up a select group of size options
  sizes.forEach(function(size) {
    select.appendChild(elt("option", { value: size }, size + " pixels"));
  });

  // on change, set the new stroke thickness
  select.addEventListener("change", function() {
    cx.lineWidth = select.value;
  });
  return elt("span", null, "Brush size: ", select);
};

controls.save = function(cx) {
  var link = document.createElement("a");
  link.innerHTML = "download";
  link.addEventListener(
    "click",
    function(ev) {
      link.href = cx.canvas.toDataURL();
      link.download = "mypainting.png";
    },
    false
  );
  document.body.appendChild(link);
  return link;
};

const save = dir => {
  const file = document.getElementById("my-canvas").toDataURL();
  const randomNum = Math.random() * 100000000000000000;
  const uid = firebase.auth().currentUser.uid;

  // Create the file metadata
  const metadata = {
    contentType: "data_url"
  };

  // Upload file and metadata to the object 'images/mountains.jpg'
  let uploadTask = storageRef
    .child(uid + "/" + randomNum.toString())
    .putString(file, "data_url");

  // Listen for state changes, errors, and completion of the upload.
  uploadTask.on(
    firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
    function(snapshot) {
      // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
      var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log("Upload is " + progress + "% done");
      switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
          console.log("Upload is paused");
          break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
          console.log("Upload is running");
          break;
      }
    },
    function(error) {
      // A full list of error codes is available at
      // https://firebase.google.com/docs/storage/web/handle-errors
      switch (error.code) {
        case "storage/unauthorized":
          // User doesn't have permission to access the object
          break;

        case "storage/canceled":
          // User canceled the upload
          break;

        case "storage/unknown":
          // Unknown error occurred, inspect error.serverResponse
          break;
      }
    },
    function() {
      // Upload completed successfully, now we can get the download URL
      uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
        console.log("File available at", downloadURL);
      });
    }
  );
};

controls.cloudSave = function(cx) {
  let link = elt("button", { type: "button", onclick: "save()" }, "Save");
  return link;
};

// controls.cloudSave = function(cx) {
//   let link = document.createElement("a");
//   link.innerHTML = "cloudSave";
//   link.addEventListener(
//     "click",
//     function() {
//       const file = cx.canvas.toDataURL();
//       const randomNum = Math.random() * 100000000000000000;
//       const uid = firebase.auth().currentUser.uid;

//       // Create the file metadata
//       const metadata = {
//         contentType: "data_url"
//       };

//       // Upload file and metadata to the object 'images/mountains.jpg'
//       let uploadTask = storageRef
//         .child(uid + "/" + randomNum.toString())
//         .putString(file, "data_url");

//       // Listen for state changes, errors, and completion of the upload.
//       uploadTask.on(
//         firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
//         function(snapshot) {
//           // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
//           var progress =
//             (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//           console.log("Upload is " + progress + "% done");
//           switch (snapshot.state) {
//             case firebase.storage.TaskState.PAUSED: // or 'paused'
//               console.log("Upload is paused");
//               break;
//             case firebase.storage.TaskState.RUNNING: // or 'running'
//               console.log("Upload is running");
//               break;
//           }
//         },
//         function(error) {
//           // A full list of error codes is available at
//           // https://firebase.google.com/docs/storage/web/handle-errors
//           switch (error.code) {
//             case "storage/unauthorized":
//               // User doesn't have permission to access the object
//               break;

//             case "storage/canceled":
//               // User canceled the upload
//               break;

//             case "storage/unknown":
//               // Unknown error occurred, inspect error.serverResponse
//               break;
//           }
//         },
//         function() {
//           // Upload completed successfully, now we can get the download URL
//           uploadTask.snapshot.ref.getDownloadURL().then(function(downloadURL) {
//             console.log("File available at", downloadURL);
//           });
//         }
//       );
//     },
//     false
//   );
//   document.body.appendChild(link);
//   return link;
// };

controls.reset = function(cx) {
  var link = elt("button", { type: "button", onclick: "reset()" }, "Reset");
  return link;
};

// drawing tools
var tools = Object.create(null);

// line tool
// onEnd is for the erase function, which uses it to reset
// the globalCompositeOperation to source-over
tools.Line = function(event, cx, onEnd) {
  cx.lineCap = "round";

  // mouse position relative to the canvas
  var pos = relativePos(event, cx.canvas);
  trackDrag(function(event) {
    cx.beginPath();

    // move to current mouse position
    cx.moveTo(pos.x, pos.y);

    // update mouse position
    pos = relativePos(event, cx.canvas);

    // line to updated mouse position
    cx.lineTo(pos.x, pos.y);

    // stroke the line
    cx.stroke();
  }, onEnd);
};

tools.WeirdLine = function(event, cx, onEnd) {
  cx.lineCap = "butt";

  // mouse position relative to the canvas
  var pos = relativePos(event, cx.canvas);
  trackDrag(function(event) {
    cx.beginPath();

    // move to current mouse position
    cx.moveTo(pos.x, pos.y);

    // update mouse position
    pos = relativePos(event, cx.canvas);

    // line to updated mouse position
    cx.lineTo(pos.x, pos.y);

    // stroke the line
    cx.stroke();
  }, onEnd);
};

// erase tool
tools.Erase = function(event, cx) {
  // globalCompositeOperation determines how drawing operations
  // on a canvas affect what's already there
  // 'destination-out' makes pixels transparent, 'erasing' them
  // NOTE: this has been deprecated
  cx.globalCompositeOperation = "destination-out";
  tools.Line(event, cx, function() {
    cx.globalCompositeOperation = "source-over";
  });
};

// spray paint tool
tools.Spray = function(event, cx) {
  var radius = cx.lineWidth / 2;
  var area = radius * radius * Math.PI;
  var dotsPerTick = Math.ceil(area / 30);

  var currentPos = relativePos(event, cx.canvas);
  var spray = setInterval(function() {
    for (var i = 0; i < dotsPerTick; i++) {
      var offset = randomPointInRadius(radius);
      cx.fillRect(currentPos.x + offset.x, currentPos.y + offset.y, 1, 1);
    }
  }, 25);
  trackDrag(
    function(event) {
      currentPos = relativePos(event, cx.canvas);
    },
    function() {
      clearInterval(spray);
    }
  );
};

/**
 * allows the user to click and drag out a rectangle on the canvas
 *
 * @param {Object} event - mousedown event (specifically left button)
 * @param {Object} cx - the canvas 2d context object
 */
tools.Rectangle = function(event, cx) {
  var leftX, rightX, topY, bottomY;
  var clientX = event.clientX,
    clientY = event.clientY;

  // placeholder rectangle
  var placeholder = elt("div", { class: "placeholder" });

  // cache the relative position of mouse x and y on canvas
  var initialPos = relativePos(event, cx.canvas);

  // used for determining correct placeholder position
  var xOffset = clientX - initialPos.x,
    yOffset = clientY - initialPos.y;

  trackDrag(
    function(event) {
      document.body.appendChild(placeholder);

      var currentPos = relativePos(event, cx.canvas);
      var startX = initialPos.x,
        startY = initialPos.y;

      // assign leftX, rightX, topY and bottomY
      if (startX < currentPos.x) {
        leftX = startX;
        rightX = currentPos.x;
      } else {
        leftX = currentPos.x;
        rightX = startX;
      }

      if (startY < currentPos.y) {
        topY = startY;
        bottomY = currentPos.y;
      } else {
        topY = currentPos.y;
        bottomY = startY;
      }

      // set the style to reflect current fill
      placeholder.style.background = cx.fillStyle;

      // set div.style.left to leftX, width to rightX - leftX
      placeholder.style.left = leftX + xOffset + "px";
      placeholder.style.top = topY + yOffset + "px";
      placeholder.style.width = rightX - leftX + "px";
      placeholder.style.height = bottomY - topY + "px";
    },
    function() {
      // add rectangle to canvas with leftX, rightX, topY and bottomY
      cx.fillRect(leftX, topY, rightX - leftX, bottomY - topY);

      // destroy placeholder
      document.body.removeChild(placeholder);
    }
  );
};

/**
    draw a circle based on mouse position, color and pen size.
    does not allow for click / drag to see a placeholder.
    **/

tools.circle = function(event, cx) {
  var pos = relativePos(event, cx.canvas);
  let x = pos.x;
  let y = pos.y;
  cx.beginPath();
  cx.arc(x, y, 25, 0, 2 * Math.PI);
  cx.stroke();
};

/**
 * allows the user to load the color of a specific pixel
 *
 * @param {Object} event - mousedown event (specifically left button)
 * @param {Object} cx - the canvas 2d context object
 */

// helpers for flood fill

// iterates over N, S, E and W neighbors and performs a function fn
function forEachNeighbor(point, fn) {
  fn({ x: point.x - 1, y: point.y });
  fn({ x: point.x + 1, y: point.y });
  fn({ x: point.x, y: point.y - 1 });
  fn({ x: point.x, y: point.y + 1 });
}

// checks if 2 points in data, point1 and point2, have the same color
function isSameColor(data, point1, point2) {
  var offset1 = (point1.x + point1.y * data.width) * 4;
  var offset2 = (point2.x + point2.y * data.width) * 4;

  for (var i = 0; i < 4; i++) {
    if (data.data[offset1 + i] != data.data[offset2 + i]) {
      return false;
    }
  }
  return true;
}

/**
     * paints all adjacent matching pixels
     uses bfs
     */
tools["Flood Fill"] = function(event, cx) {
  var imageData = cx.getImageData(0, 0, cx.canvas.width, cx.canvas.height),
    // get sample point at current position, {x: int, y: int}
    sample = relativePos(event, cx.canvas),
    isPainted = new Array(imageData.width * imageData.height),
    toPaint = [sample];

  // while toPaint.length > 0
  while (toPaint.length) {
    // current point to check
    var current = toPaint.pop(),
      id = current.x + current.y * imageData.width;

    // check if current has already been painted
    if (isPainted[id]) continue;
    else {
      // if it hasn't, paint current and set isPainted to true
      cx.fillRect(current.x, current.y, 1, 1);
      isPainted[id] = true;
    }

    // for every neighbor (new function)
    forEachNeighbor(current, function(neighbor) {
      if (
        neighbor.x >= 0 &&
        neighbor.x < imageData.width &&
        neighbor.y >= 0 &&
        neighbor.y < imageData.height &&
        isSameColor(imageData, sample, neighbor)
      ) {
        toPaint.push(neighbor);
      }
    });
  }
};

// initialize the app
let appDiv = document.getElementById("canvasDiv");
createPaint(appDiv);
