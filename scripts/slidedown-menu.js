var menuIcon = document.querySelector('.icon');
var menu = document.querySelector('.menu-clicked');
var menuContents = document.querySelectorAll('.menu-clicked div');
var navMenu = document.querySelector('#navbar-mobile');

menuIcon.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        menu.classList.add('menu-visible');
        navMenu.classList.add('nav-active')
    }
    else {
        menu.classList.remove('menu-visible');
        navMenu.classList.remove('nav-active')
    }
});
