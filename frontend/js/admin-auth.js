document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('adminToken')) {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  form?.addEventListener('submit', handleLogin);
});

const handleLogin = async (e) => {
  e.preventDefault();
  const form = e.target;
  clearAllErrors(form);

  const email = form.email.value.trim();
  const password = form.password.value;
  const submitBtn = form.querySelector('[type="submit"]');

  if (!email || !validateEmail(email)) {
    setFormError(form.email, 'Valid email is required');
    return;
  }
  if (!password) {
    setFormError(form.password, 'Password is required');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Signing in...';

  try {
    const { token, admin, message } = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminInfo', JSON.stringify(admin));
    showToast(message, 'success');

    setTimeout(() => {
      window.location.href = 'admin-dashboard.html';
    }, 500);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
};
