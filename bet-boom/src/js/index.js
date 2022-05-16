console.log('It works!');

function scrollToElement(selector, callback) {
  $('html').animate({
    scrollTop: $(selector).offset().top + 'px'
  }, 500, callback);
}

$('a[href^="#"]').click(function (e) {
  e.preventDefault();
  scrollToElement($(this).attr('href'));
});

// Подать заявку

const fileinputs = document.querySelectorAll('input[type="file"]');
Array.prototype.forEach.call(fileinputs, function (input) {
  var label = input.nextElementSibling;
  var labelVal = label.innerHTML;

  input.addEventListener('change', function (e) {
    var fileName = '';
    if (this.files && this.files.length > 1) {
      fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
    }
    else {
      fileName = e.target.value.split('\\').pop();
    }

    let text = labelVal;
    if (fileName) {
      text = fileName;
    }

    label.innerHTML = text;
  });
});

const $formSlider = $(".form-steps");

function onFormSubmit() {
  console.log('Submit!');
  $formSlider.trigger("next.owl.carousel");
}

function onFromSliderChanged(event) {
  var current = event.item.index + 1;
  var total = event.item.count - 3;

  const $step = $formSlider.find(`.form-step`)[current - 1];
  const title = $step.dataset.title;

  $(".js-form-current").text(current);
  $(".js-form-total").text(total);

  $formSlider.find(".owl-dots").attr("hidden", current > 2);

  $(".form__title-prefix").attr("hidden", current > 2);
  if (title) {
    $(".js-form-title").text(title);
  }
}

$formSlider
  .addClass("owl-carousel")
  .owlCarousel({
    loop:   false,
    nav:    false,
    dots:   true,
    items:  1,
    margin: 10,
    mouseDrag: false,
    touchDrag: false,
    onInitialized: onFromSliderChanged,
    responsive: {
      0: {
        autoHeight: true,
      },
      768: {
        autoHeight: false,
      }
    }
  })
  .on("changed.owl.carousel", onFromSliderChanged);

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
});

// Галерея

const $gallery = $('.gallery');

$gallery.children().each(function (index) {
  $(this).attr('data-position', index);
});

$gallery
  .addClass("owl-carousel")
  .owlCarousel({
    loop: true,
    nav: false,
    dots: true,
    items: 4,
    margin: 10,

    responsive: {
      0: {
        items: 1,
        mouseDrag: true,
        touchDrag: true,
      },
      768: {
        items: 4,
        mouseDrag: false,
        touchDrag: false,
      }
    }
  });

let prevPosition = 0;
$(document).on('click', '.gallery .owl-item > *', function () {

  // BUG: решить, что делать, когда position < prevPosition

  let position = $(this).data('position');
  let len = position - prevPosition;
  // console.warn(prevPosition, position, len);
  if (len <= 0) {
    len = 7 % (7 - position) + 1;
  }
  if (prevPosition == position) {
    len = 0;
  }
  console.log(prevPosition, position, len);

  prevPosition = position;

  for (let i = 0; i < len; i++) {
    $gallery.trigger('next.owl.carousel', [300]);
  }
});


// секция слайдер начало

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
      margin: 1,
    },
    768: {
      margin: 225,
      items: 3,
      mouseDrag: false,
      touchDrag: false
    }
  }

});

// секция слайдер конец

// Школы

const $schoolSlider = $(".schools");

function initSchoolSlider() {
  $schoolSlider
    .addClass("owl-carousel")
    .owlCarousel({
      loop:   false,
      nav:    true,
      dots:   true,
      items:  1,
      margin: 1,
      // autoHeight: true,

      responsive: {
        0: {
          mouseDrag: true,
          touchDrag: true,
        },
        768: {
          mouseDrag: false,
          touchDrag: false,
        }
      }
    });
}

initSchoolSlider();

const $geographyPopup = $(".js-geography-popup");
function openGeographyPopup(title, content) {
  $geographyPopup.addClass("visible");
  $geographyPopup.find(".section4-popup__title").html(title);
  $geographyPopup.find(".section4-popup__content").html(content);
}

function closeGeographyPopup() {
  $geographyPopup.removeClass("visible")
}

$(".js-geography-popup-close").click(closeGeographyPopup);

$(".js-school-item-show-photos").click(function (e) {
  const $parent = $(this).parents(".schools-item-row");
  const title = $parent.find(".location").clone();
  const content = $("<div>")
    .addClass("gallery")
    .html(
      $parent.find(".schools-item-row-images").clone().children()
    );

  openGeographyPopup(title, content);
});

function onResize (e) {
  const currentDevice = innerWidth > 768 ? "desktop" : "mobile";

  const parent = document.querySelector(".schools");
  if (!parent.dataset.device) {
    parent.dataset.device = currentDevice;
  }

  if (e == null || currentDevice != parent.dataset.device) {
    parent.dataset.device = currentDevice;
    
    // destroy carousel
    $schoolSlider.trigger('destroy.owl.carousel').removeClass('owl-carousel owl-loaded');
    $schoolSlider.find('.owl-stage-outer').children().unwrap();

    const rows = Array.from(document.querySelectorAll(".schools-item-row"));
    let chunkSize = 4;
  
    // Desktop
    if (innerWidth > 768) {
      chunkSize = 10;
    }
    // Mobile
    else {
  
    }
  
    const results = [];
  
    while (rows.length) {
      results.push(rows.splice(0, chunkSize));
    }
  
    parent.textContent = "";
  
    for (let group of results) {
      const wrapper = document.createElement("div");
      wrapper.classList.add("schools-item");
      for (let row of group) {
        wrapper.appendChild(row);
      }
      parent.appendChild(wrapper);
    }


    // rebuild carousel
    initSchoolSlider();
  }
}
onResize();
window.addEventListener("resize", onResize);


$(".js-loc-btn").click(function (e) {
  const ids = $(this).attr("data-referto").replace(/\s+/g, "").split(","); // string in format "id1, id2, id3"

  let title = "";
  let content = $("<div>").addClass("stack");
  for (let id of ids) {
    const $refer = $("#" + id);

    title = $refer.find(".city").clone();
    content.append(
      $refer.clone().addClass("standalone")
    );
  }

  openGeographyPopup(title, content);
});
