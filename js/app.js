const sheetSettingsKey = 'ImageViewer';
var viewer;
var sheet;
var mode = "select";
var sheetIndex = 0;
var urlIndex = 0;
var multiImages = true;
var toolbar = true;
var toolbarOpt = true;
var navbar = true;
var navbarOpt = true;
var toolbarColour = "rgba(0, 0, 0, .5)"
var navbarColour = "rgba(0, 0, 0, .5)";
// Andrei: Background Color
var backgroundColour = "rgba(0, 0, 0, 0.5)";
// / Background Color
var rotateImage = 0;

$(document).ready(function () {
  tableau.extensions.initializeAsync({'configure': configure}).then(function() {

    tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged, (settingsEvent) => {
      console.log("settings changed")
      setConfig(function(seenConfig, validConfig) {
        if (validConfig) {
          initializeViewer(true);
        } else {
          $('#invalidConfig').show();
        }
      });
    });
    setConfig(function(seenConfig, validConfig) {
      if (validConfig) {
        initializeViewer(true);
      } else if (!seenConfig) {
        console.log("Seen Config:", seenConfig);
        configure();
      } else {
        $('#invalidConfig').show();
      }
    });
  });

});

var setConfig = function (callback) {
  var validConfig = false;
  var seenConfig = false;
  if(tableau.extensions.settings.get(sheetSettingsKey)) {
    var settings = JSON.parse(tableau.extensions.settings.get(sheetSettingsKey));
    console.log("Got Settings", settings);
    seenConfig = settings.seenConfig;
    mode = settings.mode;
    sheetIndex = settings.sheetIndex;
    urlIndex = settings.urlIndex;
    toolbarOpt = settings.toolbarOpt;
    navbarOpt = settings.navbarOpt;
    toolbarColour = settings.toolbarColour;
    navbarColour = settings.navbarColour;
    // Andrei: Background Color
    backgroundColour = settings.backgroundColour;
    // / Background Color
    rotateImage = settings.rotateImage;
    if (settings.mode && settings.sheetIndex >= 0 && settings.urlIndex >= 0) {
      validConfig = true;
    }
  }
  callback(seenConfig, validConfig);
}

var initializeViewer = function (refresh) {
  sheet = tableau.extensions.dashboardContent.dashboard.worksheets[sheetIndex];
  sheet._eventListenerManagers["mark-selection-changed"]._handlers = [];
  sheet._eventListenerManagers["filter-changed"]._handlers = [];
  if (mode == "select") {
    // sheet.removeEventListener(tableau.TableauEventType.FilterChanged,function(ev) {
    //   console.log("Removed Filter Changed Listener", ev);
    // });
    sheet.addEventListener(tableau.TableauEventType.MarkSelectionChanged,getSelectedMarkData);
    if (refresh) {
      getSelectedMarkData();
    }
  } else if (mode == "filter") {
    // sheet.removeEventListener(tableau.TableauEventType.MarkSelectionChanged,function(ev) {
    //   console.log("Removed Mark Selection Listener", ev);
    // });
    sheet.addEventListener(tableau.TableauEventType.FilterChanged,getSummaryData);
    if (refresh) {
      getSummaryData();
    }
  }

}

var getSelectedMarkData = function () {
  console.log("getSelectedMarkData");
  sheet.getSelectedMarksAsync().then((selected) => {
    if (selected.data[0].data.length > 0) {
      sheet.getSummaryDataAsync({ignoreSelection: false}).then((data) => {
        console.log(data);
        if (data) {
          showImages(data.data);
        }
      });
    } else if (viewer) {
      viewer.destroy();
    }
    $('#images').html('');
  });
}

var getSummaryData = function() {
  console.log("getSummaryData");
  sheet.getSummaryDataAsync().then((data) => {
    if (data) {
      showImages(data.data);
    }
  });
}

/**
 * Extend the given object.
 * @param {*} obj - The object to be extended.
 * @param {*} args - The rest objects which will be merged to the first object.
 * @returns {Object} The extended object.
 */
var assign = Object.assign || function assign(obj) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (isObject(obj) && args.length > 0) {
    args.forEach(function (arg) {
      if (isObject(arg)) {
        Object.keys(arg).forEach(function (key) {
          obj[key] = arg[key];
        });
      }
    });
  }

  return obj;
};

function getImageNaturalSizes(image, callback) {
  var IN_BROWSER = typeof window !== 'undefined';
  var WINDOW = IN_BROWSER ? window : {};
  var IS_SAFARI = WINDOW.navigator && /(Macintosh|iPhone|iPod|iPad).*AppleWebKit/i.test(WINDOW.navigator.userAgent);
  var newImage = document.createElement('img');

  // Modern browsers (except Safari)
  if (image.naturalWidth && !IS_SAFARI) {
    callback(image.naturalWidth, image.naturalHeight);
    return newImage;
  }

  var body = document.body || document.documentElement;

  newImage.onload = function () {
    callback(newImage.width, newImage.height);

    if (!IS_SAFARI) {
      body.removeChild(newImage);
    }
  };

  newImage.src = image.src;

  // iOS Safari will convert the image automatically
  // with its orientation once append it into DOM
  if (!IS_SAFARI) {
    newImage.style.cssText = 'left:0;' + 'max-height:none!important;' + 'max-width:none!important;' + 'min-height:0!important;' + 'min-width:0!important;' + 'opacity:0;' + 'position:absolute;' + 'top:0;' + 'z-index:-1;';
    body.appendChild(newImage);
  }

  return newImage;
}

var showImages = function(dataset) {
  console.log(dataset);
  if (viewer) {
    viewer.destroy();
  }
  $('#images').html('');
  if (dataset.length > 0) {
    if (multiImages && dataset.length > 1) {
      for (var i = 0; i < dataset.length; i++) {
        $('#images').append('<li><img src="'+dataset[i][urlIndex].value+'"></li>');
      }
      if (navbarOpt) {
        navbar = true;
      } else {
        navbar = false;
      }
      if (toolbarOpt) {
        toolbar = true;
      } else {
        toolbar = false;
      }
    } else if (dataset.length == 1) {
      navbar = false;
      if (toolbarOpt) {
        toolbar = true;
      } else {
        toolbar = false;
      }
      $('#images').append('<li><img src="'+dataset[0][urlIndex].value+'"></li>');
    }
  }
  var images = document.getElementById('images');
  viewer = new Viewer(images, {
    inline: true,
    backdrop: false,
    rotatable: false,
    scalable: false,
    tooltip: false,
    movable: false,
    navbar: navbar,
    toolbar: toolbar,
    title: false,
    ready: function() {
      viewer.full();
      $('.viewer-toolbar li').css('background-color',toolbarColour);
      $('.viewer-navbar').css('background-color',navbarColour);
      // Andrei: Background Color
      $('body').css('background-color',backgroundColour);
      // / Background Color
      $('.viewer-play').hide();
      $('.viewer-reset').hide();
    },
    viewed: function() {
      viewer.rotate(rotateImage);
      var el = $('.viewer-container .viewer-canvas img');
      el.wrapAll('<a target="_blank" href="' + el.attr('src') + '"></a>');

      // var hei = $('.viewer-container .viewer-canvas').height();
      // viewer.zoomTo(hei / el.height());
    }
  });

  viewer.initImage = function initImage(done) {
    var _this2 = this;

    // console.log(this);

    var options = this.options,
        image = this.image,
        viewerData = this.viewerData;

    var footerHeight = this.footer.offsetHeight;
    var viewerWidth = viewerData.width;
    // var viewerHeight = Math.max(viewerData.height - footerHeight, footerHeight);
    var viewerHeight = viewerData.height;
    var oldImageData = this.imageData || {};
    var sizingImage = void 0;

    this.imageInitializing = {
      abort: function abort() {
        sizingImage.onload = null;
      }
    };

    sizingImage = getImageNaturalSizes(image, function (naturalWidth, naturalHeight) {
      var aspectRatio = naturalWidth / naturalHeight;
      var width = viewerWidth;
      var height = viewerHeight;

      _this2.imageInitializing = false;

      if (viewerHeight * aspectRatio > viewerWidth) {
        // height = viewerWidth / aspectRatio;
        width = viewerHeight * aspectRatio;
      } else {
        // width = viewerHeight * aspectRatio;
        height = viewerWidth / aspectRatio;
      }

      // width = Math.min(width * 0.9, naturalWidth);
      // height = Math.min(height * 0.9, naturalHeight);

      var imageData = {
        naturalWidth: naturalWidth,
        naturalHeight: naturalHeight,
        aspectRatio: aspectRatio,
        ratio: width / naturalWidth,
        width: width,
        height: height,
        left: (viewerWidth - width) / 2,
        top: (viewerHeight - height) / 2
      };
      var initialImageData = assign({}, imageData);

      if (options.rotatable) {
        imageData.rotate = oldImageData.rotate || 0;
        initialImageData.rotate = 0;
      }

      if (options.scalable) {
        imageData.scaleX = oldImageData.scaleX || 1;
        imageData.scaleY = oldImageData.scaleY || 1;
        initialImageData.scaleX = 1;
        initialImageData.scaleY = 1;
      }

      _this2.imageData = imageData;
      _this2.initialImageData = initialImageData;

      if (done) {
        done();
      }
    });
  };
}

function configure() {
  const popupUrl = `${window.location.origin}/configure.html`;
  tableau.extensions.ui.displayDialogAsync(popupUrl, 'Payload Message', { height: 550, width: 500 }).then((closePayload) => {
    setConfig(function(seenConfig, validConfig) {
      if (validConfig) {
        initializeViewer(true);
      } else {
        $('#invalidConfig').show();
      }
    });
  }).catch((error) => {
    switch(error.errorCode) {
      case tableau.ErrorCodes.DialogClosedByUser:
        setConfig(function(seenConfig, validConfig) {
          if (validConfig) {
            initializeViewer(true);
          } else {
            $('#invalidConfig').show();
          }
        });
        break;
      default:
        console.error(error.message);
    }
  });
}
