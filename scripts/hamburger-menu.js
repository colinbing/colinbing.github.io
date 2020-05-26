var menuIcon = document.querySelector('.icon');
var body = document.querySelector('body');

document.addEventListener("click", function() {
    menuIcon.classList.toggle('menu-active');
    console.log(menuIcon);
});

document.addEventListener("click", function() {
    if (menuIcon.classList.contains('menu-active')){
        console.log("Body is locked")
        body.classList.add('lock-scroll');
    }
    else {
        body.classList.remove('lock-scroll');
        console.log("Body is free")
    }
});

