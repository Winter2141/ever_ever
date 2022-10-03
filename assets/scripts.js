"use strict";

var resizeTimeout;

function initAccordions(scope) {
  var accordions = scope.getElementsByClassName('accordion');

  for (var a = 0; a < accordions.length; a++) {
    prepareAccordion(accordions[a]);
  }
}

function prepareAccordion(acc) {
  if (acc) {
    setTimeout(function () {
      sizeAccordion(acc);
    }, 2000);
    sizeAccordion(acc);
    var label = acc.getElementsByClassName('accordion__label')[0];

    if (label) {
      label.addEventListener('click', function (e) {
        acc.classList.toggle('close');
      });
    }

    acc.classList.add('close');
    acc.classList.add('ready');
  }
}

function sizeAccordion(acc) {
  var content = acc.getElementsByClassName('accordion__content')[0];

  if (content && content.children[0]) {
    content.style.height = content.children[0].getBoundingClientRect().height + "px";
  }
}

window.addEventListener('resize', function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(resizeAccordions, 500);
});

function resizeAccordions() {
  var accordions = document.getElementsByClassName('accordion');

  for (var a = 0; a < accordions.length; a++) {
    sizeAccordion(accordions[a]);
  }
}

var cart;

function initCart() {
  cart = document.getElementById("cart");
  addCartListeners();
  updateCartGlobals();
}

function addCartListeners() {
  const cartToggle = document.getElementById("cart-toggle");
  if (cartToggle) cartToggle.addEventListener("click", toggleCart);
  const cartClose = document.getElementById("close-cart");
  if (cartClose) cartClose.addEventListener("click", closeCart);
  var cartItems = document.getElementsByClassName('cart__item');

  for (var i = 0; i < cartItems.length; i++) {
    initItemListeners(cartItems[i]);
  }
}

function initItemListeners(item) {
  var remove = item.getElementsByClassName("cart-remove")[0];
  if (remove) remove.addEventListener('click', removeItemFromCart.bind(item));
  var decrease = item.getElementsByClassName("cart-decrease")[0];
  if (decrease) decrease.addEventListener('click', decreaseItemQuantity.bind(item));
  var increase = item.getElementsByClassName("cart-increase")[0];
  if (increase) increase.addEventListener('click', increaseItemQuantity.bind(item)); //initNumbers(item);
}

function openCart() {
  document.documentElement.classList.add('cart-open');
}

function closeCart() {
  document.documentElement.classList.remove('cart-open');
}

function toggleCart() {
  document.documentElement.classList.toggle('cart-open');
}

function addToCart(data, callback) {
  postAjax('/cart/add.js', data, function (response) {
    handleAddProductResponse(response);
    if (callback) callback();
  });
}

function handleAddProductResponse(response) {
  var json = JSON.parse(response); //console.log(json);

  var inCart = false;
  var cartItems = document.getElementsByClassName('cart__item');

  for (var i = 0; i < cartItems.length; i++) {
    if (cartItems[i].getAttribute('data-cart-key') == json.key) {
      inCart = true;
      displayItemQuantity(cartItems[i], json.quantity);
    }
  }

  if (!inCart) {
    createNewItem(json);
  }
}

function displayItemQuantity(item, quantity) {
  var number = item.getElementsByClassName('number__input')[0];
  if (number) number.value = quantity;
  item.setAttribute('data-cart-quantity', quantity);
  updateCartGlobals();
}

function updateItemQuantity(key, quantity, item, callback) {
  var requestData = {
    quantity: quantity,
    id: key
  };
  forMatchingItems(key, function (el) {
    //console.log(el);
    el.setAttribute('data-cart-quantity', quantity);
    var number = el.getElementsByClassName('number__input')[0];
    if (number) number.value = quantity;
  });
  postAjax('/cart/change.js', requestData, function (response) {
    if (callback) callback();
  });
  updateCartGlobals();
}

function removeItemFromCart(e) {
  var item = this;
  var key = e.target.getAttribute('data-cart-remove');

  if (key) {
    forMatchingItems(key, function (el) {
      el.style.display = "none";
    });
    updateItemQuantity(key, 0, item, function () {
      forMatchingItems(key, function (el) {
        el.remove();
      });
      updateCartGlobals();
    });
  }
}

function increaseItemQuantity(e) {
  var key = e.target.getAttribute('data-cart-increase');
  var quantity = Number(this.getAttribute('data-cart-quantity'));
  if (key && quantity) updateItemQuantity(key, quantity + 1, this);
}

function decreaseItemQuantity(e) {
  var key = e.target.getAttribute('data-cart-decrease');
  var quantity = Number(this.getAttribute('data-cart-quantity'));
  if (key && quantity) updateItemQuantity(key, Math.max(1, quantity - 1), this);
}

function forMatchingItems(key, callback) {
  var cartItems = document.getElementsByClassName('cart__item');

  for (var i = 0; i < cartItems.length; i++) {
    if (cartItems[i].getAttribute('data-cart-key') == key) {
      callback(cartItems[i]);
    }
  }
}

function updateCartGlobals() {
  //console.log('UPDATE GLOBALS');
  setTimeout(function () {
    // Get count
    var cartCount = 0;
    var cartSubtotal = 0;
    var recurringFound = false;
    var cartItems = cart.getElementsByClassName('cart__item');

    for (var i = 0; i < cartItems.length; i++) {
      var number = cartItems[i].getElementsByClassName('number__input')[0];

      if (number) {
        console.log(number);
        cartCount += Number(number.value);
        cartSubtotal += Number(number.value) * Number(number.getAttribute('data-price'));
      }

      if (cartItems[i].classList.contains('recurring')) recurringFound = true;
    } // Update Indicator


    var indicator = document.getElementById('cart-indicator');
    indicator.innerHTML = cartCount;

    if (cartCount <= 0) {
      indicator.classList.remove('show');
    } else {
      indicator.classList.add('show');
    } // Update Subtotal


    var info = document.getElementById('cart-info');
    var subtotal = document.getElementsByClassName('cart-subtotal');

    for (var i = 0; i < subtotal.length; i++) {
      subtotal[i].innerHTML = formatPrice(cartSubtotal / 100);
    }

    if (cartCount <= 0) {
      info.classList.remove('show');
    } else {
      info.classList.add('show');
    } // Update CTA Link


    var cta = document.getElementById('cart-cta');

    if (cartCount <= 0) {
      cta.href = "/collections/sparkling";
      cta.innerHTML = "Shop all products";
      cta.classList.remove('no-barba');
    } else {
      if (recurringFound) {
        cta.href = reChargeBuildCheckoutURL();
      } else {
        cta.href = "/checkout";
      }

      cta.innerHTML = "Check Out";
      cta.classList.add('no-barba');
    } //Empty message


    var cartInner = document.getElementsByClassName('cart__inner')[0];

    if (cartCount <= 0) {
      cartInner.classList.add('cart__inner--empty');
    } else {
      cartInner.classList.remove('cart__inner--empty');
    } //console.log(cartCount, cartSubtotal, recurringFound);

  }, 10);
}

function createNewItem(json) {
  console.log('CREATE ITEM', json);
  var item = document.createElement('div');
  item.classList.add('cart__item');
  item.setAttribute('data-cart-key', json.key);
  item.setAttribute('data-cart-quantity', json.quantity);

  if (json.properties) {
    item.classList.add('recurring');
  }

  var itemImage = document.createElement('div');
  itemImage.classList.add('cart__itemImage');
  var itemImg = new Image();
  itemImg.classList.add('cart__itemImg');
  itemImg.src = json.image;
  var itemInfo = document.createElement('div');
  itemInfo.classList.add('cart__itemInfo');
  var itemTitle = document.createElement('p');
  itemTitle.classList.add('cart__itemTitle');
  itemTitle.innerHTML = json.title;
  var itemSubtext = document.createElement('p');
  itemSubtext.classList.add('cart__itemSubtext');
  itemSubtext.innerHTML = "12 Bottles / Case (16 oz each)";
  var itemDescription = document.createElement('p');
  itemDescription.classList.add('cart__itemSubtext');
  var price = formatPrice(json.final_line_price / 100 / json.quantity);

  if (json.properties) {
    itemDescription.innerHTML = "Deliver every " + json.properties.shipping_interval_frequency + " " + json.properties.shipping_interval_unit_type + " - " + price;
  } else {
    if (json.selling_plan_allocation) {
      console.log(json.selling_plan_allocation)
      itemDescription.innerHTML = "Deliver every " + json.selling_plan_allocation.selling_plan.name + " - " + price;
    } else {
      itemDescription.innerHTML = "One-time purchase - " + price;
    }
  }

  var number = document.createElement('div');
  number.classList.add('number');
  number.classList.add('number--noBorder');
  var numberLabel = document.createElement('span');
  numberLabel.classList.add('number__label');
  numberLabel.innerHTML = "QTY";
  var numberMinus = document.createElement('span');
  numberMinus.classList.add('number__inc');
  numberMinus.classList.add('number__minus');
  numberMinus.classList.add('cart-decrease');
  numberMinus.setAttribute('data-cart-decrease', json.key);
  var numberInput = document.createElement('input');
  numberInput.classList.add('number__input');
  numberInput.setAttribute('min', 0);
  numberInput.setAttribute('data-price', json.final_line_price / json.quantity);
  numberInput.type = "number";
  numberInput.value = json.quantity;
  var numberPlus = document.createElement('span');
  numberPlus.classList.add('number__inc');
  numberPlus.classList.add('number__plus');
  numberPlus.classList.add('cart-increase');
  numberPlus.setAttribute('data-cart-increase', json.key);
  var itemRemove = document.createElement('div');
  itemRemove.classList.add('cart__itemRemove');
  itemRemove.classList.add('cart-remove');
  itemRemove.setAttribute('data-cart-remove', json.key);
  item.append(itemImage);
  itemImage.append(itemImg);
  item.append(itemInfo);
  itemInfo.append(itemTitle);
  itemInfo.append(itemSubtext);
  itemInfo.append(itemDescription);
  itemInfo.append(number);
  number.append(numberLabel);
  number.append(numberMinus);
  number.append(numberInput);
  number.append(numberPlus);
  item.append(itemRemove);
  initItemListeners(item);
  var cartInner = document.getElementsByClassName('cart__inner')[0];
  if (cartInner) cartInner.append(item);
  updateCartGlobals();
}

function formatPrice(n) {
  return "$" + n.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

var clickMore, home, home2;

function initEffects(scope) {
  //Infinite scroll effect
  home = scope.getElementsByClassName('homePage')[0];

  if (window.innerWidth > 800) {
    window.addEventListener('scroll', function () {
      if (home) {
        if ((window.pageYOffset + window.innerHeight) / document.body.scrollHeight > 0.9) {
          initInfiniteScroll();
        }

        ;
      }
    });
  }
}

function updateEffects(scope) {
  home = scope.getElementsByClassName('homePage')[0]; //Add more initEffects

  clickMore = document.getElementById('click-more');

  if (clickMore) {
    clickMore.addEventListener('click', function () {
      var addMore = document.getElementById('add-more');
      var close = addMore.getElementsByClassName('close');

      if (close.length > 0) {
        close[0].classList.remove('close');

        if (close.length == 0) {
          clickMore.classList.add('u-fadeOut');
        }
      }
    });
  }
}

function initInfiniteScroll() {
  home2 = home.cloneNode(true);
  var hi = home2.getElementsByClassName('hero__image')[0];

  if (hi) {
    hi.classList.remove('ready');
  }

  home.parentNode.append(home2);
  window.addEventListener('scroll', infiniteScroll);
}

function infiniteScroll() {
  if (home2.getBoundingClientRect().top < 0) {
    window.scrollTo(window.pageYOffset - home.offsetHeight, 0);
  }
}

function detatchEffects() {
  window.removeEventListener('scroll', infiniteScroll);
}

function externaliseLinks(scope) {
  var a = scope.getElementsByTagName('a');

  for (var i = 0; i < a.length; i++) {
    var reg = new RegExp('/' + window.location.host + '/');
    var checkout = /checkout.rechargeapps/;

    if (!reg.test(a[i].href) && !checkout.test(a[i].href)) {
      a[i].setAttribute('target', "_blank");
    }
  }
}

function initFaqs(scope) {
  var categories = scope.getElementsByClassName('faqCategory');

  if (categories.length > 0) {
    for (var i = 0; i < categories.length; i++) {
      categories[i].addEventListener('click', selectCategory);
    }
  }
}

function selectCategory(e) {
  var categoryIndex = e.target.getAttribute('data-category');

  if (categoryIndex) {
    var questions = document.getElementsByClassName('faqQuestion');

    for (var i = 0; i < questions.length; i++) {
      questions[i].style.display = questions[i].getAttribute('data-category') == categoryIndex ? "block" : "none";
    }

    var categories = document.getElementsByClassName('faqCategory');

    for (var i = 0; i < categories.length; i++) {
      if (categories[i].getAttribute('data-category') == categoryIndex) {
        categories[i].classList.add('selected');
      } else {
        categories[i].classList.remove('selected');
      }
    }
  }
}

function globalInit() {
  initPageTransitions();
  initMenu();
  initNav();
  initCart();
  initEffects(document);
  pageInit(document);
  setTimeout(enterSite, 800);
}

function pageInit(scope) {
  initAccordions(scope);
  handleNavForPage();
  updateEffects(scope);
  externaliseLinks(scope);
  initFaqs(scope);
  playVideos(scope);
  initProductPage(scope);
}

function pageDetatch(scope) {
  detatchEffects(scope);
} // in case the document is already rendered


if (document.readyState != 'loading') globalInit(); // modern browsers
else if (document.addEventListener) document.addEventListener('DOMContentLoaded', globalInit); // IE <= 8
  else document.attachEvent('onreadystatechange', function () {
      if (document.readyState == 'complete') globalInit();
    });
var cartRequest = 0;

function initMenu() {
  const toggle = document.getElementById("menu-toggle");
  if (toggle) toggle.addEventListener("click", toggleMenu);
  const shade = document.getElementById("menu-shade");
  if (shade) shade.addEventListener("click", closeMenu);
  if (shade) shade.addEventListener("click", closeCart);
  const announcementClose = document.getElementById("announcement-close");
  if (announcementClose) announcementClose.addEventListener("click", closeAnnouncment);
}

function toggleMenu() {
  if (document.documentElement.classList.contains('menu-open')) {
    closeMenu();
  } else {
    openMenu();
  }
}

function openMenu() {
  if (!document.documentElement.classList.contains('menu-close')) {
    document.documentElement.classList.add('menu-open');
  }

  if (gtag) {
    gtag('event', 'conversion', {
      'allow_custom_scripts': true,
      'send_to': 'DC-8444036/eebutton/burgercl+standard'
    });
  }
}

function closeMenu() {
  if (document.documentElement.classList.contains('menu-open')) {
    document.documentElement.classList.remove('menu-open');
    document.documentElement.classList.add('menu-close');
    setTimeout(function () {
      document.documentElement.classList.remove('menu-close');
    }, 700);
  }
}

function closeAnnouncment() {
  document.documentElement.classList.remove('show-announcement');
}

function initNav() {
  var nav = document.getElementById('nav');
  var scrollTop = window.pageYOffset;
  var scrollDiff = 0;
  var navHidden = false;
  var navTop = true;
  var threshold = 30;
  window.addEventListener('scroll', function () {
    var scrollDelta = window.pageYOffset - scrollTop;
    scrollTop = window.pageYOffset;
    scrollDiff = Math.min(0, Math.max(-threshold, scrollDiff + scrollDelta));

    if (!navHidden && scrollTop > threshold / 2 && scrollDiff > -threshold / 2) {
      nav.classList.add('nav--hide');
      navHidden = true;
    }

    if (navHidden && (scrollDiff <= -threshold || scrollTop == 0)) {
      nav.classList.remove('nav--hide');
      navHidden = false;
    }

    if (navTop && scrollTop > threshold) {
      nav.classList.remove('nav--top');
      navTop = false;
    }

    if (!navTop && scrollTop < threshold) {
      nav.classList.add('nav--top');
      navTop = true;
    }
  });

  function addFeatureListeneres(el) {
    var video = el.querySelector('video');
    features[f].addEventListener('mouseenter', function () {
      var video = el.querySelector('video');

      if (video) {
        video.playbackRate = 0.5;
        video.play();
      }
    });
    features[f].addEventListener('mouseleave', function () {
      var video = el.querySelector('video');
      if (video) video.pause();
    });
  }

  var features = nav.getElementsByClassName('menu__feature');

  for (var f = 0; f < features.length; f++) {
    addFeatureListeneres(features[f]);
  }
}

function handleNavForPage() {
  var nav = document.getElementById('nav');

  if (window.location.pathname == "/" || window.location.pathname == "/cart") {
    nav.classList.remove('nav--white');
  } else {
    nav.classList.add('nav--white');
  }
}

function initNumbers(scope) {
  var numbers = scope.getElementsByClassName('number');

  for (var i = 0; i < numbers.length; i++) {
    initNumber(numbers[i]);
  }
}

function initNumber(num) {
  var minus = num.getElementsByClassName('number__minus')[0];
  var plus = num.getElementsByClassName('number__plus')[0];
  var input = num.getElementsByClassName('number__input')[0];

  if (minus && plus && input) {
    minus.addEventListener("click", function (e) {
      e.stopPropagation();
      input.value = Math.max(input.getAttribute('min') || 0, input.value - 1);
    });
    plus.addEventListener("click", function (e) {
      e.stopPropagation();
      input.value++;
    });
  }
}

function initPageTransitions() {
  var wrapper = document.getElementById('content');

  if (wrapper) {
    barba.init({
      transitions: [{
        leave(_ref) {
          let current = _ref.current,
              next = _ref.next,
              trigger = _ref.trigger;
          const done = this.async();
          document.documentElement.classList.add('exit');
          setTimeout(done, 700);
        },

        afterLeave(_ref2) {
          let current = _ref2.current,
              next = _ref2.next,
              trigger = _ref2.trigger;
          closeMenu();
          closeCart();
          pageDetatch(current.container); // show locading animation (width short timeout)
        },

        beforeEnter(_ref3) {
          let current = _ref3.current,
              next = _ref3.next,
              trigger = _ref3.trigger;
          window.scrollTo(0, 0);
          pageInit(next.container);
          var js = next.container.querySelectorAll("script");

          for (var i = 0; i < js.length; i++) {
            try {
              eval(js[i].innerHTML);
            } catch (err) {
              console.log(err);
            }
          }

          current.container.style.display = "none";
          const done = this.async();
          setTimeout(done, 300); //hide loading animation && remove timeout
        },

        enter(_ref4) {
          let current = _ref4.current,
              next = _ref4.next,
              trigger = _ref4.trigger;
          document.documentElement.classList.add('enter');
          document.documentElement.classList.remove('exit');
          const done = this.async();
          setTimeout(done, 700);
        },

        afterEnter(_ref5) {
          let current = _ref5.current,
              next = _ref5.next,
              trigger = _ref5.trigger;
          document.documentElement.classList.remove('enter');
        }

      }],
      prevent: (_ref6) => {
        let el = _ref6.el;
        var nb = el.classList && el.classList.contains('no-barba');
        var collection = el.href && /collection/.test(el.href);
        return nb || collection;
      }
    });
  }
}

function enterSite() {
  document.documentElement.classList.add('enter');
  document.documentElement.classList.remove('exit');
  setTimeout(function () {
    document.documentElement.classList.remove('enter');
  }, 700);
}

function initProductPage(scope) {
  function openNutrition() {
    document.documentElement.classList.add('nutrition-open');
  }

  function closeNutrition() {
    document.documentElement.classList.remove('nutrition-open');
  }

  function toggleNutrition() {
    document.documentElement.classList.toggle('nutrition-open');
  }

  function prevProduct() {
    var index = active;
    index--;
    if (index < 0) index = count - 1;
    goToProduct(index, -1);
  }

  function nextProduct() {
    var index = active;
    index++;
    if (index >= count) index = 0;
    goToProduct(index, 1);
  }

  function positionBottles(index, dir) {
    dir = -dir;

    for (var i = 0; i < bottles.length; i++) {
      var mve = Number(bottles[i].getAttribute('data-product-index')) - index;
      var adj = mve;

      if (adj > 1) {
        adj -= count;
      }

      if (adj < -1) {
        adj += count;
      }

      if (adj >= 0 && adj <= dir || adj <= 0 && adj >= dir) {
        bottles[i].style.visibility = "visible";
      } else {
        bottles[i].style.visibility = "hidden";
      }

      bottles[i].style.transform = "rotate(90deg) translateY(" + adj * 175 + "%)";
    }
  }

  function navigateToProduct() {
    if (this[0] == collection) {
      if (Number(active) + 1 == Number(this[1]) || Number(active) - Number(count) + 1 == Number(this[1])) {
        var dir = 1;
      } else {
        dir = -1;
      }

      goToProduct(this[1], dir);
    } else {
      window.location = "/collections/" + this[0] + "?i=" + this[1];
    }
  }

  function goToProduct(index, dir) {
    if (!inTransition) {
      slideMove += dir; //POSITION BOTTLES

      positionBottles(index, dir);

      if (index != active) {
        inTransition = true;

        if (dir < 0) {
          document.documentElement.classList.add('products-reverse');
        } else {
          document.documentElement.classList.remove('products-reverse');
        }

        var prodSlides = document.querySelectorAll("[data-product-index]");

        for (var i = 0; i < prodSlides.length; i++) {
          if (prodSlides[i].getAttribute("data-product-index") == index) {
            prodSlides[i].classList.add('is-active');
          } else {
            if (prodSlides[i].getAttribute("data-product-index") == active) {
              prodSlides[i].classList.add('was-active');
            }

            prodSlides[i].classList.remove('is-active');
          }
        }

        setTimeout(function () {
          for (var i = 0; i < prodSlides.length; i++) {
            if (prodSlides[i].getAttribute("data-product-index") == active) {
              prodSlides[i].classList.remove('was-active');
            }
          }

          active = index;
          inTransition = false;
        }, 800);
      }
    }
  }

  function formSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var data = serializeObject(form); //console.log(data);

    if (data.id && data.quantity) {
      addToCart(data, function () {
        form.style.opacity = "1";
        openCart();
      });
      form.style.opacity = "0.5";
    }
  }

  function getPos(e) {
    if (e.touches && e.touches.length > 0) {
      e = e.touches[0];
    }

    return {
      x: e.clientX,
      y: e.clientY
    };
  }

  var dragging = false;
  var prevX = 0;
  var diff = 0;
  var offset = 0;

  function beginDrag(e) {
    if (!inTransition) {
      var pos = getPos(e);
      draggingEquals(true);
      prevX = pos.x;
      diff = 0;
      offset = 0;
    } else {
      draggingEquals(false);
    }
  }

  function moveDrag(e) {
    if (dragging) {
      var pos = getPos(e);
      diff = pos.x - prevX;
      offset += diff;
      prevX = pos.x;
      positionBottles(active + offset / 600, Math.sign(offset));

      if (!inTransition) {
        if (offset > 150) {
          nextProduct();
          draggingEquals(false);
        } else if (offset < -150) {
          prevProduct();
          draggingEquals(false);
        }
      }
    }
  }

  function endDrag(e) {
    if (dragging) {
      if (offset > 50) {
        nextProduct();
      } else if (offset < -50) {
        prevProduct();
      } else {
        goToProduct(active, 0);
      }
    }

    draggingEquals(false);
  }

  function draggingEquals(bool) {
    dragging = bool;

    if (bool) {
      document.documentElement.classList.add('product-drag');
      hideDragCursor();
    } else {
      document.documentElement.classList.remove('product-drag');
      showDragCursor();
    }
  }

  function showDragCursor() {
    dragPos[2] = 1;
  }

  function hideDragCursor() {
    dragPos[2] = 0;
  }

  function returnDragCursor() {
    dragPos = [0.85, 0.1, 1];
  }

  function moveDragCursor(e) {
    var bounds = drag.getBoundingClientRect();
    var x = (e.clientX - bounds.left) / bounds.width;
    var y = (e.clientY - bounds.top) / bounds.height;
    dragPos[0] = x;
    dragPos[1] = y;
  }

  function animateDragCursor() {
    dragLag[0] += (dragPos[0] - dragLag[0]) / 7;
    dragLag[1] += (dragPos[1] - dragLag[1]) / 7;
    dragLag[2] += (dragPos[2] - dragLag[2]) / 5;
    var bounds = drag.getBoundingClientRect();
    var cursorBounds = dragCursor.getBoundingClientRect();
    var x = dragLag[0] * bounds.width - cursorBounds.width * 3 / 4;
    var y = dragLag[1] * bounds.height - cursorBounds.height * 1 / 4; //dragCursor.style.opacity = dragLag[2];

    dragCursor.style.transform = "translate3d(" + x + "px, " + y + "px, 0)";
    requestAnimationFrame(animateDragCursor);
  }

  var product = scope.getElementsByClassName('productPage')[0];

  if (product) {
    var inTransition = false;
    var active = Number(product.getAttribute("data-active"));
    var count = Number(product.getAttribute("data-count"));
    var collection = product.getAttribute("data-collection");
    var slideMove = 0;
    var showNutrition = scope.getElementsByClassName('show-nutrition');

    for (var i = 0; i < showNutrition.length; i++) {
      showNutrition[i].addEventListener('click', openNutrition);
    }

    var hideNutrition = scope.getElementsByClassName('hide-nutrition');

    for (var i = 0; i < hideNutrition.length; i++) {
      hideNutrition[i].addEventListener('click', closeNutrition);
    }

    var next = scope.getElementsByClassName('product-next')[0];

    if (next) {
      next.addEventListener('click', nextProduct);
    }

    var drag = document.getElementById('dragel');

    if (drag) {
      drag.addEventListener('mousedown', beginDrag);
      drag.addEventListener('touchstart', beginDrag);
      product.addEventListener('mousemove', moveDrag);
      product.addEventListener('touchmove', moveDrag);
      product.addEventListener('mouseup', endDrag);
      product.addEventListener('touchend', endDrag);
      var dragCursor = drag.children[0];
      var dragPos = [0.85, 0.1, 1];
      var dragLag = [0.85, 0.1, 1];

      if (dragCursor) {
        drag.addEventListener('mousemove', moveDragCursor); //drag.addEventListener('mouseleave', returnDragCursor);
      }

      requestAnimationFrame(animateDragCursor);
    }

    var bottles = document.getElementsByClassName('productPage__bottleSlide');
    positionBottles(active, 0);
    var forms = scope.getElementsByClassName('add-to-cart');

    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', formSubmit);
    }

    initNumbers(product);
    var navProducts = document.getElementsByClassName('productPage__navProduct');

    for (var i = 0; i < navProducts.length; i++) {
      var ii = navProducts[i].getAttribute('data-index');
      var cc = navProducts[i].getAttribute('data-collection');
      navProducts[i].addEventListener('click', navigateToProduct.bind([cc, ii]));
    }

    var query = getUrlParameter("i");

    if (query) {
      goToProduct(Number(query), 0);
    } //hack for missing prices


    var pricesSet = false;

    function showPrices() {
      if (!pricesSet) {
        var ac = document.getElementsByClassName('add-to-cart');
        var prices = {};

        for (var i = 0; i < ac.length; i++) {
          var id = ac[i].getAttribute('data-productid');
          var ot = ac[i].getElementsByClassName('rc_price__onetime')[0];
          if (ot) var otPrice = ot.innerHTML;
          var at = ac[i].getElementsByClassName('rc_price__autodeliver')[0];
          if (at) var atPrice = at.innerHTML;

          if (atPrice != "" && otPrice != "") {
            prices[id] = {
              ot: otPrice,
              at: atPrice
            };
            pricesSet = true;
          }
        }

        if (pricesSet) {
          for (var i = 0; i < ac.length; i++) {
            var id = ac[i].getAttribute('data-productid');
            ac[i].getElementsByClassName('rc_price__onetime')[0].innerHTML = prices[id].ot;
            ac[i].getElementsByClassName('rc_price__autodeliver')[0].innerHTML = prices[id].at;
          }
        }
      }
    }

    setTimeout(showPrices, 500);
    setTimeout(showPrices, 1000);
    setTimeout(showPrices, 2000);
    setTimeout(showPrices, 5000);
    setTimeout(showPrices, 10000);
  }
}

function initStopMotion(sm, cycle, frames, frameRate, canvasId) {
  var dpi = Math.min(2, window.devicePixelRatio);
  var canvas = document.getElementById(canvasId);
  var ctx = canvas.getContext('2d');
  var cw = canvas.width = canvas.clientWidth * dpi;
  var ch = canvas.height = canvas.clientHeight * dpi;
  var f = 0;
  var c = 0;
  var dir = 1;
  var finished = true;
  var img = sm[cycle[c]].imgs[f];
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, 0, 0, cw, ch);

  function goToNext() {
    var current = sm[cycle[c]];
    var next = sm[cycle[c + 1 == cycle.length ? 0 : c + 1]];

    if (current.ready && next.ready) {
      if (finished) {
        var bound = canvas.getBoundingClientRect();

        if (bound.y > -window.innerHeight) {
          f = 0;
          finished = false;
          advanceFrame();
        } else {
          f = 0;
          c = 0;
          dir = 1;
          var img = sm[cycle[c]].imgs[f];

          if (img) {
            ctx.clearRect(0, 0, cw, ch);
            ctx.drawImage(img, 0, 0, cw, ch);
          }
        }
      }

      setTimeout(goToNext, 2000);
    } else {
      setTimeout(goToNext, 50);
    }
  }

  function advanceFrame() {
    f += dir;

    if (f == frames - 1) {
      dir *= -1;
      c++;
      if (c == cycle.length) c = 0;
    }

    if (f == 0) {
      dir *= -1;
      finished = true;
    }

    var img = sm[cycle[c]].imgs[f];

    if (img) {
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
    }

    if (!finished) {
      var nextFrame = frameRate * (1 - f / 12);
      setTimeout(advanceFrame, nextFrame);
    }
  }

  goToNext();
  canvas.classList.add('ready');
}

function initScrollMotion(sm, canvasId) {
  var dpi = Math.min(2, window.devicePixelRatio);
  var canvas = document.getElementById(canvasId);
  var ctx = canvas.getContext('2d');
  var cw = canvas.width = canvas.clientWidth * dpi;
  var ch = canvas.height = canvas.clientHeight * dpi;
  var f = 0;
  var prevF = null;

  function animate() {
    var bound = canvas.getBoundingClientRect();
    var sa = Math.max(0, Math.min(0.99, (-bound.y + bound.height / 12) / (bound.height * 0.65)));
    f = Math.floor(sm.total * sa);

    if (prevF != f) {
      var img = sm.imgs[f];

      if (img) {
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
      }

      prevF = f;
    }

    requestAnimationFrame(animate);
  }

  animate();
  canvas.classList.add('ready');
}

function getAjax(url, success) {
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
  xhr.open('GET', url);

  xhr.onreadystatechange = function () {
    if (xhr.readyState > 3 && xhr.status == 200) success(xhr.responseText);
  };

  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.send();
  return xhr;
}

function postAjax(url, data, success) {
  var params = typeof data == 'string' ? data : Object.keys(data).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]);
  }).join('&');
  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open('POST', url);

  xhr.onreadystatechange = function () {
    if (xhr.readyState > 3 && xhr.status == 200) {
      success(xhr.responseText);
    }
  };

  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(params);
  return xhr;
}

function serializeObject(form) {
  var field,
      l = [];
  var s = {};

  if (typeof form == 'object' && form.nodeName == "FORM") {
    var len = form.elements.length;

    for (var i = 0; i < len; i++) {
      field = form.elements[i];

      if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
        if (field.type == 'select-multiple') {
          l = form.elements[i].options.length;

          for (j = 0; j < l; j++) {
            if (field.options[j].selected) s[field.name] = field.options[j].value;
          }
        } else if (field.type != 'checkbox' && field.type != 'radio' || field.checked) {
          s[field.name] = field.value;
        }
      }
    }
  }

  return s;
}

function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

;

function playVideos(scope) {
  let video = scope.querySelectorAll('video[muted][autoplay]');

  for (var i = 0; i < video.length; i++) {
    video[i].play();
  }
}

var waters;

function initWater() {
  waters = [];
  var buttons = document.getElementsByClassName('button');

  for (var b = 0; b < buttons.length; b++) {
    waters.push(new Water(buttons[b]));
  }

  animateWater();
}

function Water(el) {
  var canvas = document.createElement('canvas');
  el.prepend(canvas);
  this.el = el;
  this.canvas = canvas;
  this.ctx = canvas.getContext('2d');
  this.ctx.strokeStyle = "rgba(255,255,255,0.5)";
  this.dpi = Math.min(2, window.devicePixelRatio);
  this.canvas.width = this.cw = this.canvas.clientWidth * this.dpi;
  this.canvas.height = this.ch = this.canvas.clientHeight * this.dpi;
  this.needsUpdate = false;
  this.ripples = [];
  var water = this;
  this.el.addEventListener('mousemove', function (e) {
    water.needsUpdate = true;
    var bounds = water.el.getBoundingClientRect();
    var x = (e.clientX - bounds.left) * water.dpi;
    var y = (e.clientY - bounds.top) * water.dpi;
    water.ripples.push(new Ripple(x, y));
  });
}

function Ripple(x, y) {
  this.x = x;
  this.y = y;
  this.rad = 0;
  this.progress = 0;
}

function animateWater() {
  for (var w = 0; w < waters.length; w++) {
    if (waters[w].needsUpdate) {
      drawWater(waters[w]);
    }
  }

  requestAnimationFrame(animateWater);
}

function drawWater(water) {
  water.ctx.clearRect(0, 0, water.cw, water.ch);

  for (var r = 0; r < water.ripples.length; r++) {
    var ripple = water.ripples[r];
    ripple.rad += (1 - ripple.progress) * 2;
    ripple.progress += 0.01;

    if (ripple.progress >= 1) {
      water.ripples.splice(r, 1);
      r--;
    } else {
      water.ctx.lineWidth = ripple.progress * 3;
      water.ctx.strokeStyle = "rgba(255,255,255, " + (1 - ripple.progress) / 3 + ")";
      water.ctx.beginPath();
      water.ctx.arc(ripple.x, ripple.y, ripple.rad, 0, 2 * Math.PI);
      water.ctx.stroke();
    }
  }

  if (water.ripples.length <= 0) {
    water.needsUpdate = false;
  }
}