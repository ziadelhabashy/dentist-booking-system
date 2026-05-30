document.addEventListener('DOMContentLoaded', () => {
  initLayout('services.html');
  loadServices();
});

const loadServices = async () => {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="page-loader"><div class="loading-spinner"></div><p>Loading services...</p></div>';

  try {
    const { data } = await apiRequest('/services');

    grid.innerHTML = data
      .map(
        (service) => `
      <div class="card service-card">
        <div class="service-image">
          ${
            service.image
              ? `<img src="http://localhost:5000${service.image}" alt="${service.title}">`
              : getServiceIcon(service.title)
          }
        </div>
        <div class="card-body">
          <h3>${service.title}</h3>
          <p>${service.description}</p>
          <div class="service-meta">
            <span class="price">${service.priceRange}</span>
            <span class="duration">${service.duration} min</span>
          </div>
          <a href="booking.html?service=${encodeURIComponent(service.title)}" class="btn btn-primary btn-sm" style="margin-top:1rem;width:100%">Book Now</a>
        </div>
      </div>
    `
      )
      .join('');
  } catch (error) {
    grid.innerHTML = `<p class="page-loader">Unable to load services. Please ensure the backend server is running.</p>`;
    showToast(error.message, 'error');
  }
};
