var coll = document.getElementsByClassName("column-section");
var activeIcon = window.getComputedStyle(document.querySelector('.column-section-title'), ':after').getPropertyValue('content');
var i;

for (i=0; i < coll.length; i++){
    coll[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.childNodes;
        console.log(activeIcon);
        if (content[3].style.maxHeight){
            content[3].style.maxHeight = null;
          } 
        else {
            content[3].style.maxHeight = content[3].scrollHeight + "px";
        }
  });
}


