const links = document.querySelectorAll('.nav-item');
console.log(links)
const sections = document.querySelectorAll('section');
console.log(sections)

function changeLinkState() {
  let index = sections.length;

  while(--index && window.scrollY + 300 < sections[index].offsetTop) {}
  
  links.forEach((link) => link.classList.remove('active'));
  links[index].classList.add('active');
}

changeLinkState();
window.addEventListener('scroll', changeLinkState);