const gallery = document.getElementById("gallery");
const allItems = Array.from(gallery.children);
let position = 0;
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let dragOffsetSinceLastMove = 0;
let dragSlideQueued = false;
const dragThreshold = 100;

function updateGallery() {
  const total = allItems.length;

  allItems.forEach((item, index) => {
    item.style.display = "none";
    item.removeAttribute("data-offset");
  });

  for (let offset = -3; offset <= 3; offset++) {
    const index = (position + offset + total) % total;
    const item = allItems[index];
    item.style.display = "block";
    item.setAttribute("data-offset", offset.toString());
  }

  gallery.style.transition = "transform 0.6s ease";
  gallery.style.transform = "translateX(0)";
}

function moveSlide(direction) {
  const total = allItems.length;
  position = (position + direction + total) % total;
  updateGallery();
}

const leftBtn = document.createElement("button");
leftBtn.className = "nav left";
leftBtn.innerHTML = "&#10094;";
leftBtn.onclick = () => moveSlide(-1);

const rightBtn = document.createElement("button");
rightBtn.className = "nav right";
rightBtn.innerHTML = "&#10095;";
rightBtn.onclick = () => moveSlide(1);

document.querySelector(".gallery-container").append(leftBtn, rightBtn);

// --- Real-time Drag Logic ---
function onDragStart(e) {
  isDragging = true;
  startX = e.touches ? e.touches[0].clientX : e.clientX;
  currentTranslate = 0;
  dragOffsetSinceLastMove = 0;
  dragSlideQueued = false;
  gallery.style.transition = "none";
}

function onDragMove(e) {
  if (!isDragging) return;
  const x = e.touches ? e.touches[0].clientX : e.clientX;
  currentTranslate = x - startX;

  gallery.style.transform = `translateX(${currentTranslate}px)`;

  // Only trigger once per threshold in direction
  const netDrag = currentTranslate - dragOffsetSinceLastMove;
  if (!dragSlideQueued && Math.abs(netDrag) > dragThreshold) {
    const direction = netDrag < 0 ? 1 : -1;
    moveSlide(direction);
    dragSlideQueued = true;
    dragOffsetSinceLastMove += direction * dragThreshold;
  }

  // If user reverses direction, allow another trigger
  if (dragSlideQueued && Math.sign(netDrag) !== Math.sign(currentTranslate)) {
    dragSlideQueued = false;
  }
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  gallery.style.transition = "transform 0.5s cubic-bezier(0.25, 1.5, 0.5, 1)";
  gallery.style.transform = "translateX(0)";
  currentTranslate = 0;
}

gallery.addEventListener("mousedown", onDragStart);
gallery.addEventListener("mousemove", onDragMove);
gallery.addEventListener("mouseup", onDragEnd);
gallery.addEventListener("mouseleave", () => {
  if (isDragging) onDragEnd();
});

gallery.addEventListener("touchstart", onDragStart);
gallery.addEventListener("touchmove", onDragMove);
gallery.addEventListener("touchend", onDragEnd);

updateGallery();
