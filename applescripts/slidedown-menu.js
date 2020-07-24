var menuIcon = document.querySelector('.icon');
var menu = document.querySelector('.menu-clicked');
var menuContents = document.querySelectorAll('.menu-clicked div');
var navMenu = document.querySelector('#navbar-mobile');
var dropDownList = Array.from (document.querySelectorAll('.dropdown-options li'));
var index=0;
var dropDownSearch = document.querySelector('.search-container');
console.log(dropDownSearch);

menuIcon.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        menu.classList.add('menu-visible');
        navMenu.classList.add('nav-active');
        dropDownSearch.classList.add('dropdown-anim');
        /* [].forEach.call(dropDown, function(el) {
            el.classList.add('dropdown-anim');
        }); */
        dropDownList.forEach((arrayElement, index) => {
        setTimeout(function(){
            dropDownList[index].className  += " dropdown-anim";
        }, 30*(index+1));
        });
        
    }
    else {
        menu.classList.remove('menu-visible');
        navMenu.classList.remove('nav-active');
        dropDownSearch.classList.remove('dropdown-anim');
       [].forEach.call(dropDownList, function(el) {
            el.classList.remove('dropdown-anim');
        }); 
        
    }
});
