var $carousel = jQuery('.carousel-onebyone .carousel');
if($carousel.length){
	jQuery('.carousel-onebyone').on('slide.bs.carousel', carousel_onebyone);
	carousel_set($carousel);
	var resizeId;
	jQuery(window).resize(function() {
		clearTimeout(resizeId);
		resizeId = setTimeout(()=>carousel_set($carousel), 500);
	});	
}

function carousel_set($carousel){
	if(!$carousel || !$carousel.length) return;
	
	$carousel.each((i, el)=>{
		var $el = jQuery(el);
		var itemsPerSlide = carousel_itemsPerSlide($el);
		var totalItems = $el.find('.carousel-item').length;

		if(itemsPerSlide < totalItems){
			$el.find('.carousel-control').removeClass('hidden');
		}else{
			$el.find('.carousel-control').addClass('hidden');
		}
	});
}

function carousel_onebyone(e){
	var carouselID = '#'+jQuery(this).find('.carousel').attr('id');
	var $carousel = jQuery(carouselID);
	var $inner = $carousel.find('.carousel-inner');
	var $items = $carousel.find('.carousel-item');

	var idx = jQuery(e.relatedTarget).index();
	var itemsPerSlide = carousel_itemsPerSlide($carousel);
	var totalItems = $items.length;
	
	if (idx >= totalItems-(itemsPerSlide-1)) {
		var it = itemsPerSlide - (totalItems - idx);
		for (var i=0; i<it; i++) {
			if (e.direction == 'left') {
				$items.eq(i).appendTo($inner);
			}else {
				$items.eq(0).appendTo($inner);
			}
		}
	}
}

function carousel_itemsPerSlide($carousel){
	var itemW = $carousel.find('.carousel-item').width();
	var innerW = $carousel.find('.carousel-inner').width();
	
	return Math.floor(innerW/itemW);
}