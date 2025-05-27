const covers = document.querySelectorAll('.cover');
const container = document.querySelector('.coverflow');

covers.forEach((cover, index) => {
  cover.addEventListener('click', () => {
    if (cover.classList.contains('active')) {
      // Reset view
      container.classList.remove('active');
      covers.forEach(c => c.classList.remove('active', 'left', 'right'));
    } else {
      // Set selected
      container.classList.add('active');
      covers.forEach((c, i) => {
        c.classList.remove('active', 'left', 'right');
        if (i < index) {
          c.classList.add('left');
        } else if (i > index) {
          c.classList.add('right');
        }
      });
      cover.classList.add('active');
    }
  });
});
