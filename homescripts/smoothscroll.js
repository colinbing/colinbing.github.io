function scrollToItemId(containerId, srollToId) {

    var scrollContainer = document.getElementById(containerId);
    var item = document.getElementById(scrollToId);

    //with animation
    var from = scrollContainer.scrollTop;
    var by = item.offsetTop - scrollContainer.scrollTop;
    if (from < item.offsetTop) {
        if (item.offsetTop > scrollContainer.scrollHeight - scrollContainer.clientHeight) {
            by = (scrollContainer.scrollHeight - scrollContainer.clientHeight) - scrollContainer.scrollTop;
        }
    }

    var currentIteration = 0;

    /**
     * get total iterations
     * 60 -> requestAnimationFrame 60/second
     * second parameter -> time in seconds for the animation
     **/
    var animIterations = Math.round(60 * 0.5); 

    (function scroll() {
        var value = easeOutCubic(currentIteration, from, by, animIterations);
        scrollContainer.scrollTop = value;
        currentIteration++;
        if (currentIteration < animIterations) {
            requestAnimationFrame(scroll);
        }    
    })();

    //without animation
    //scrollContainer.scrollTop = item.offsetTop;

}

//example easing functions
function linearEase(currentIteration, startValue, changeInValue, totalIterations) {
    return changeInValue * currentIteration / totalIterations + startValue;
}
function easeOutCubic(currentIteration, startValue, changeInValue, totalIterations) {
    return changeInValue * (Math.pow(currentIteration / totalIterations - 1, 3) + 1) + startValue;
}