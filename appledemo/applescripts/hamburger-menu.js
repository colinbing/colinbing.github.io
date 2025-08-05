var menuIcon = document.querySelector('.icon');
var body = document.querySelector('body');

menuIcon.addEventListener("click", function() {
    menuIcon.classList.toggle('menu-active');
});

menuIcon.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        body.classList.add('lock-scroll');
    }
    else {
        body.classList.remove('lock-scroll');
    }
});

