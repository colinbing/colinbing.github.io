var navheight = document.querySelector('.navbar').offsetHeight;
console.log(navheight);

document.querySelector("main").style.paddingTop = navheight + 'px';