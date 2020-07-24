var menuIcon = document.querySelector('.icon');
var menu = document.querySelector('.menu-clicked');
var menuContents = document.querySelectorAll('.menu-clicked div');
var navMenu = document.querySelector('#navbar-mobile');
var dropDown = document.querySelectorAll('.dropdown-options li')
var dropDownSearch = document.querySelector('.search-container')
var dropDownHR = document.querySelector('.dropdown-content')

menuIcon.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        menu.classList.add('menu-visible');
        navMenu.classList.add('nav-active');
        dropDownSearch.classList.add('dropdown-anim');
        dropDownHR.classList.add('dropdown-anim');
        [].forEach.call(dropDown, function(el) {
            el.classList.add('dropdown-anim');
        });
        
    }
    else {
        menu.classList.remove('menu-visible');
        navMenu.classList.remove('nav-active');
        dropDownSearch.classList.remove('dropdown-anim');
        dropDownHR.classList.remove('dropdown-anim');
        [].forEach.call(dropDown, function(el) {
            el.classList.remove('dropdown-anim');
        });
        
    }
});
