"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it; if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = o[Symbol.iterator](); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

console.log('It works!');

function scrollToElement(selector, callback) {
  $('html').animate({
    scrollTop: $(selector).offset().top + 'px'
  }, 500, callback);
}

$('a[href^="#"]').click(function (e) {
  e.preventDefault();
  scrollToElement($(this).attr('href'));
}); // Подать заявку

var fileinputs = document.querySelectorAll('input[type="file"]');
Array.prototype.forEach.call(fileinputs, function (input) {
  var label = input.nextElementSibling;
  var labelVal = label.innerHTML;
  input.addEventListener('change', function (e) {
    var fileName = '';

    if (this.files && this.files.length > 1) {
      fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
    } else {
      fileName = e.target.value.split('\\').pop();
    }

    var text = labelVal;

    if (fileName) {
      text = fileName;
    }

    label.innerHTML = text;
  });
});
var $formSlider = $(".form-steps");

function onFormSubmit() {
  console.log('Submit!');
  $formSlider.trigger("next.owl.carousel");
}

function onFromSliderChanged(event) {
  var current = event.item.index + 1;
  var total = event.item.count - 3;
  var $step = $formSlider.find(".form-step")[current - 1];
  var title = $step.dataset.title;
  $(".js-form-current").text(current);
  $(".js-form-total").text(total);
  $formSlider.find(".owl-dots").attr("hidden", current > 2);
  $(".form__title-prefix").attr("hidden", current > 2);

  if (title) {
    $(".js-form-title").text(title);
  }
}

$formSlider.addClass("owl-carousel").owlCarousel({
  loop: false,
  nav: false,
  dots: true,
  items: 1,
  margin: 10,
  mouseDrag: false,
  touchDrag: false,
  onInitialized: onFromSliderChanged,
  responsive: {
    0: {
      autoHeight: true
    },
    768: {
      autoHeight: false
    }
  }
}).on("changed.owl.carousel", onFromSliderChanged);
$(".js-form-next").click(function (e) {
  e.preventDefault();
  $formSlider.trigger("next.owl.carousel");
});
$(".js-form-prev").click(function (e) {
  e.preventDefault();
  $formSlider.trigger("prev.owl.carousel");
});
$(".form").submit(function (e) {
  e.preventDefault();
  onFormSubmit();
}); // Галерея

var $gallery = $('.gallery');
$gallery.children().each(function (index) {
  $(this).attr('data-position', index);
});
$gallery.addClass("owl-carousel").owlCarousel({
  loop: true,
  nav: false,
  dots: true,
  items: 4,
  margin: 10,
  responsive: {
    0: {
      items: 1,
      mouseDrag: true,
      touchDrag: true
    },
    768: {
      items: 4,
      mouseDrag: false,
      touchDrag: false
    }
  }
});
var prevPosition = 0;
$(document).on('click', '.gallery .owl-item > *', function () {
  // BUG: решить, что делать, когда position < prevPosition
  var position = $(this).data('position');
  var len = position - prevPosition; // console.warn(prevPosition, position, len);

  if (len <= 0) {
    len = 7 % (7 - position) + 1;
  }

  if (prevPosition == position) {
    len = 0;
  }

  console.log(prevPosition, position, len);
  prevPosition = position;

  for (var i = 0; i < len; i++) {
    $gallery.trigger('next.owl.carousel', [300]);
  }
}); // секция слайдер начало

$(".owl-carousel").owlCarousel({
  nav: true,
  dots: true,
  center: true,
  stagePadding: 30,
  loop: true,
  items: 3,
  responsive: {
    0: {
      items: 1,
      margin: 1
    },
    768: {
      margin: 225,
      items: 3,
      mouseDrag: false,
      touchDrag: false
    }
  }
}); // секция слайдер конец
// Школы

var $schoolSlider = $(".schools");

function initSchoolSlider() {
  $schoolSlider.addClass("owl-carousel").owlCarousel({
    loop: false,
    nav: true,
    dots: true,
    items: 1,
    margin: 1,
    // autoHeight: true,
    responsive: {
      0: {
        mouseDrag: true,
        touchDrag: true
      },
      768: {
        mouseDrag: false,
        touchDrag: false
      }
    }
  });
}

initSchoolSlider();
var $geographyPopup = $(".js-geography-popup");

function openGeographyPopup(title, content) {
  $geographyPopup.addClass("visible");
  $geographyPopup.find(".section4-popup__title").html(title);
  $geographyPopup.find(".section4-popup__content").html(content);
}

function closeGeographyPopup() {
  $geographyPopup.removeClass("visible");
}

$(".js-geography-popup-close").click(closeGeographyPopup);
$(".js-school-item-show-photos").click(function (e) {
  var $parent = $(this).parents(".schools-item-row");
  var title = $parent.find(".location").clone();
  var content = $("<div>").addClass("gallery").html($parent.find(".schools-item-row-images").clone().children());
  openGeographyPopup(title, content);
});

function onResize(e) {
  var currentDevice = innerWidth > 768 ? "desktop" : "mobile";
  var parent = document.querySelector(".schools");

  if (!parent.dataset.device) {
    parent.dataset.device = currentDevice;
  }

  if (e == null || currentDevice != parent.dataset.device) {
    parent.dataset.device = currentDevice; // destroy carousel

    $schoolSlider.trigger('destroy.owl.carousel').removeClass('owl-carousel owl-loaded');
    $schoolSlider.find('.owl-stage-outer').children().unwrap();
    var rows = Array.from(document.querySelectorAll(".schools-item-row"));
    var chunkSize = 4; // Desktop

    if (innerWidth > 768) {
      chunkSize = 10;
    } // Mobile
    else {}

    var results = [];

    while (rows.length) {
      results.push(rows.splice(0, chunkSize));
    }

    parent.textContent = "";

    for (var _i = 0, _results = results; _i < _results.length; _i++) {
      var group = _results[_i];
      var wrapper = document.createElement("div");
      wrapper.classList.add("schools-item");

      var _iterator = _createForOfIteratorHelper(group),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var row = _step.value;
          wrapper.appendChild(row);
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      parent.appendChild(wrapper);
    } // rebuild carousel


    initSchoolSlider();
  }
}

onResize();
window.addEventListener("resize", onResize);
$(".js-loc-btn").click(function (e) {
  var ids = $(this).attr("data-referto").replace(/\s+/g, "").split(","); // string in format "id1, id2, id3"

  var title = "";
  var content = $("<div>").addClass("stack");

  var _iterator2 = _createForOfIteratorHelper(ids),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var id = _step2.value;
      var $refer = $("#" + id);
      title = $refer.find(".city").clone();
      content.append($refer.clone().addClass("standalone"));
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  openGeographyPopup(title, content);
});