var menuIcon = document.querySelector('.icon');
var menu = document.querySelector('.menu-clicked');
var menuContents = document.querySelectorAll('.menu-clicked div');
var navMenu = document.querySelector('#navbar-mobile');
var dropDown = document.querySelectorAll('.dropdown-options li')
console.log(dropDown);

menuIcon.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        menu.classList.add('menu-visible');
        navMenu.classList.add('nav-active');
        [].forEach.call(dropDown, function(el) {
            el.classList.remove('dropdown-hide');
            el.classList.add('dropdown-anim');
        });
        
    }
    else {
        menu.classList.remove('menu-visible');
        navMenu.classList.remove('nav-active');
        [].forEach.call(dropDown, function(el) {
            el.classList.add('dropdown-hide');
            el.classList.remove('dropdown-anim');
        });
        
    }
});
