document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  initLayout(page);

  const homeServicesGrid = document.getElementById('homeServicesGrid');
  if (homeServicesGrid) {
    loadHomeServices();
  }
});

const loadHomeServices = async () => {
  const grid = document.getElementById('homeServicesGrid');
  if (!grid) return;

  try {
    const { data } = await apiRequest('/services');
    const preview = data.slice(0, 6);

    grid.innerHTML = preview
      .map(
        (service) => `
      <div class="card service-card">
        <div class="service-image">
          ${service.image ? `<img src="http://localhost:5000${service.image}" alt="${service.title}">` : getServiceIcon(service.title)}
        </div>
        <div class="card-body">
          <h3>${service.title}</h3>
          <p>${service.description}</p>
          <div class="service-meta">
            <span class="price">${service.priceRange}</span>
            <span class="duration">${service.duration} min</span>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  } catch {
    grid.innerHTML = '<p class="page-loader">Services will appear once the server is connected.</p>';
  }
};
