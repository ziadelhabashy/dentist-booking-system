const showToast = (message, type = 'info') => {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, 5000);
};

const showLoading = (show = true) => {
  let overlay = document.querySelector('.loading-overlay');
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(overlay);
    }
  } else if (overlay) {
    overlay.remove();
  }
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePhone = (phone) => {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^\+?[0-9]{10,15}$/.test(cleaned);
};

const validateFutureDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const getServiceIcon = (title) => {
  const icons = {
    'General Dentistry': '🦷',
    'Teeth Cleaning': '✨',
    'Teeth Whitening': '💎',
    'Dental Fillings': '🔧',
    'Root Canal Treatment': '🏥',
    'Dental Crowns': '👑',
    'Dental Implants': '⚙️',
    Orthodontics: '📐',
    'Pediatric Dentistry': '👶',
    'Cosmetic Dentistry': '💫',
  };
  return icons[title] || '🦷';
};

const setFormError = (input, message) => {
  input.classList.add('error');
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
};

const clearFormError = (input) => {
  input.classList.remove('error');
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) {
    errorEl.classList.remove('show');
  }
};

const clearAllErrors = (form) => {
  form.querySelectorAll('.form-control.error').forEach(clearFormError);
};

const getNavbarHTML = (activePage = '') => {
  const pages = [
    { href: 'index.html', label: 'Home' },
    { href: 'about.html', label: 'About' },
    { href: 'services.html', label: 'Services' },
    { href: 'gallery.html', label: 'Gallery' },
    { href: 'contact.html', label: 'Contact' },
  ];

  const links = pages
    .map((p) => `<a href="${p.href}" class="${activePage === p.href ? 'active' : ''}">${p.label}</a>`)
    .join('');

  return `
    <nav class="navbar" id="navbar">
      <div class="container">
        <a href="index.html" class="navbar-brand">
          <div class="brand-icon">🦷</div>
          <div class="brand-text">
            <h1>Dr. Sara Galal</h1>
            <span>Dental Clinic</span>
          </div>
        </a>
        <div class="nav-links" id="navLinks">${links}</div>
        <div class="nav-actions">
          <a href="contact.html" class="btn btn-outline btn-sm">Contact Us</a>
          <a href="booking.html" class="btn btn-primary btn-sm">Book Appointment</a>
          <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>
  `;
};

const getFooterHTML = () => {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="navbar-brand">
              <div class="brand-icon">🦷</div>
              <div class="brand-text">
                <h1>Dr. Sara Galal</h1>
                <span>Dental Clinic</span>
              </div>
            </a>
            <p>Providing exceptional dental care with compassion and expertise. Your smile is our priority.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="about.html">About</a></li>
              <li><a href="services.html">Services</a></li>
              <li><a href="gallery.html">Gallery</a></li>
              <li><a href="booking.html">Book Appointment</a></li>
            </ul>
          </div>
          <div>
            <h4>Services</h4>
            <ul class="footer-links">
              <li><a href="services.html">General Dentistry</a></li>
              <li><a href="services.html">Teeth Whitening</a></li>
              <li><a href="services.html">Dental Implants</a></li>
              <li><a href="services.html">Orthodontics</a></li>
              <li><a href="services.html">Cosmetic Dentistry</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact Info</h4>
            <ul class="footer-contact">
              <li><span>📍</span> 123 Smile Avenue, Cairo, Egypt</li>
              <li><span>📞</span> +20 100 123 4567</li>
              <li><span>✉️</span> info@drsaragalal.com</li>
              <li><span>🕐</span> Mon–Sat: 9:00 AM – 6:00 PM</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Dr. Sara Galal Dental Clinic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
};

const initLayout = (activePage = '') => {
  const navPlaceholder = document.getElementById('navbar-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');

  if (navPlaceholder) navPlaceholder.innerHTML = getNavbarHTML(activePage);
  if (footerPlaceholder) footerPlaceholder.innerHTML = getFooterHTML();

  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const navbar = document.getElementById('navbar');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      menuToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
};
