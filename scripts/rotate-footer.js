var coll = document.getElementsByClassName("column-section");
var i;

for (i=0; i < coll.length; i++){
    coll[i].addEventListener("click", function() {
        var content = this.childNodes;
        if (content[3].style.maxHeight){
            content[3].style.maxHeight = null;
          } 
        else {
            content[3].style.maxHeight = content[3].scrollHeight + "px";
        }
  });
}

for (i=0; i < coll.length; i++){
    coll[i].addEventListener("click", function(){
        var activeIcon = this.querySelector('.column-section-title');
        if (activeIcon.classList.contains("active")){
            activeIcon.classList.remove("active");
        }
        else {
            activeIcon.classList.add("active");
        }
    });
}
