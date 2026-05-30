document.addEventListener('DOMContentLoaded', () => {
  initLayout('contact.html');

  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', handleContactSubmit);
  }
});

const handleContactSubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  clearAllErrors(form);

  const name = form.fullName.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const message = form.message.value.trim();

  let valid = true;

  if (!name) {
    setFormError(form.fullName, 'Name is required');
    valid = false;
  }
  if (!email || !validateEmail(email)) {
    setFormError(form.email, 'Valid email is required');
    valid = false;
  }
  if (!phone || !validatePhone(phone)) {
    setFormError(form.phone, 'Valid phone number is required');
    valid = false;
  }
  if (!message) {
    setFormError(form.message, 'Message is required');
    valid = false;
  }

  if (!valid) return;

  showToast('Thank you! Your message has been received. We will contact you soon.', 'success');
  form.reset();
};
