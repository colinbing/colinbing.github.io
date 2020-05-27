var menuIcon = document.querySelector('.icon');
var menu = document.querySelector('.menu-clicked');

menuIcon.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        menu.classList.add('menu-visible');
    }
    else {
        menu.classList.remove('menu-visible');
    }
});
