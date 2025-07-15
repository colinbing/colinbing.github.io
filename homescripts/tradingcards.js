const card = document.querySelector(".card");
const raritySelect = document.getElementById("raritySelect");
const toggleLight = document.getElementById("toggleLight");

card.addEventListener("mousemove", (e) => {
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const px = x / rect.width;
  const py = y / rect.height;

  const rx = (py - 0.5) * 45;
  const ry = (px - 0.5) * -45;

  card.style.setProperty("--rx", `${rx}deg`);
  card.style.setProperty("--ry", `${ry}deg`);

  card.style.setProperty("--grad-x", `${px * 100}%`);
  card.style.setProperty("--grad-y", `${py * 100}%`);
  card.style.setProperty("--spark-x", `${px * 100}%`);
  card.style.setProperty("--spark-y", `${py * 100}%`);
  card.style.setProperty("--spark-opacity", `0.3`);
});

card.addEventListener("mouseleave", () => {
  card.style.setProperty("--rx", `0deg`);
  card.style.setProperty("--ry", `0deg`);
  card.style.setProperty("--grad-x", `50%`);
  card.style.setProperty("--grad-y", `50%`);
  card.style.setProperty("--spark-x", `50%`);
  card.style.setProperty("--spark-y", `50%`);
  card.style.setProperty("--spark-opacity", `0.15`);
});

raritySelect.addEventListener("change", (e) => {
  const selectedRarity = e.target.value;
  card.setAttribute("data-rarity", selectedRarity);
});

toggleLight.addEventListener("change", (e) => {
  const isOn = e.target.checked;
  card.classList.toggle("light-off", !isOn);
});
