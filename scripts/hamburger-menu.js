var menuIcon = document.querySelector('.icon');
var body = document.querySelector('body');
var menu = document.querySelector('menu-clicked');

menuIcon.addEventListener("click", function() {
    menuIcon.classList.toggle('menu-active');
    console.log(menuIcon);
});

menuIcon.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        body.classList.add('lock-scroll');
        menu.classList.add('menu-visible');
    }
    else {
        body.classList.remove('lock-scroll');
    }
});

