document.addEventListener('DOMContentLoaded', () => {
    const placeholder = {
      headline: 'Discover Shows Near You!',
      description: 'Live Talent Weekly - Rock, Jazz, Rap',
      cta: 'Buy Tickets',
      url: 'https://www.colinbing.com/',
      image: '/my-images/my-img-1-600x600.jpg',
    };
  
    const previewArea = document.getElementById('previewArea');
  
    const ad = document.createElement('div');
    ad.id = 'ad';
    ad.innerHTML = `
      <img src="${placeholder.image}" alt="Ad Image" />
      <div class="ad-content">
        <h2>${placeholder.headline}</h2>
        <p>${placeholder.description}</p>
        <a href="${placeholder.url}" target="_blank">${placeholder.cta}</a>
      </div>
    `;
  
    previewArea.appendChild(ad);
  });
  