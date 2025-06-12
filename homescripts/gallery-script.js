const gallery = document.getElementById("gallery");
const allItems = Array.from(gallery.children);
let position = 0;
let isDragging = false;
let startX = 0;
let startY = 0;
let currentTranslate = 0;
let draggingDirectionLocked = false;
let isHorizontalDrag = false;

function updateGallery() {
  const total = allItems.length;

  allItems.forEach((item) => {
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

// Arrows
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
  draggingDirectionLocked = false;
  isHorizontalDrag = false;
  startX = e.touches ? e.touches[0].clientX : e.clientX;
  startY = e.touches ? e.touches[0].clientY : e.clientY;
  gallery.style.transition = "none";
}

function onDragMove(e) {
  if (!isDragging) return;

  const currentX = e.touches ? e.touches[0].clientX : e.clientX;
  const currentY = e.touches ? e.touches[0].clientY : e.clientY;
  const deltaX = currentX - startX;
  const deltaY = currentY - startY;

  if (!draggingDirectionLocked) {
    // Lock dragging direction after small threshold to avoid jitter
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      draggingDirectionLocked = true;
      isHorizontalDrag = Math.abs(deltaX) > Math.abs(deltaY);
    }
  }

  if (isHorizontalDrag) {
    e.preventDefault(); // Prevent vertical scroll on horizontal drag
    currentTranslate = deltaX;
    gallery.style.transform = `translateX(${currentTranslate}px)`;
  }
}

function onDragEnd(e) {
  if (!isDragging) return;
  isDragging = false;

  if (isHorizontalDrag && Math.abs(currentTranslate) > 50) {
    moveSlide(currentTranslate > 0 ? -1 : 1);
  } else {
    gallery.style.transition = "transform 0.5s cubic-bezier(0.25, 1.5, 0.5, 1)";
    gallery.style.transform = "translateX(0)";
  }

  currentTranslate = 0;
  draggingDirectionLocked = false;
  isHorizontalDrag = false;
}

// Event listeners
gallery.addEventListener("mousedown", onDragStart);
gallery.addEventListener("mousemove", onDragMove);
gallery.addEventListener("mouseup", onDragEnd);
gallery.addEventListener("mouseleave", () => {
  if (isDragging) onDragEnd();
});

gallery.addEventListener("touchstart", onDragStart, { passive: false });
gallery.addEventListener("touchmove", onDragMove, { passive: false });
gallery.addEventListener("touchend", onDragEnd);

updateGallery();
