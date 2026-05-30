let statusChart = null;
let monthlyChart = null;
let allAppointments = [];
let allPatients = [];
let allServices = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('adminToken')) {
    window.location.href = 'admin-login.html';
    return;
  }

  initDashboard();
});

const initDashboard = () => {
  loadAdminInfo();
  setupNavigation();
  setupSidebar();
  setupModals();
  setupEventListeners();
  loadDashboardData();
};

const loadAdminInfo = () => {
  const admin = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  document.getElementById('adminName').textContent = admin.name || 'Admin';
  document.getElementById('adminEmail').textContent = admin.email || '';
  document.getElementById('adminAvatar').textContent = (admin.name || 'A').charAt(0).toUpperCase();
};

const setupNavigation = () => {
  document.querySelectorAll('.sidebar-nav a[data-section]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);
      document.querySelectorAll('.sidebar-nav a').forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      document.getElementById('sidebar')?.classList.remove('open');
    });
  });
};

const showSection = (sectionId) => {
  document.querySelectorAll('.dashboard-section').forEach((s) => s.classList.remove('active'));
  document.getElementById(sectionId)?.classList.add('active');

  const titles = {
    overview: ['Dashboard', 'Welcome back! Here is your clinic overview.'],
    appointments: ['Appointments', 'Manage all patient appointments.'],
    patients: ['Patients', 'View and manage patient records.'],
    services: ['Services', 'Manage clinic services and pricing.'],
  };

  const [title, subtitle] = titles[sectionId] || ['Dashboard', ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = subtitle;
};

const setupSidebar = () => {
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    window.location.href = 'admin-login.html';
  });
};

const setupModals = () => {
  document.querySelectorAll('.modal-close, .modal-cancel').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
};

const openModal = (id) => document.getElementById(id)?.classList.add('active');
const closeModal = (el) => el?.classList.remove('active');

const setupEventListeners = () => {
  document.getElementById('appointmentSearch')?.addEventListener('input', filterAppointments);
  document.getElementById('appointmentFilter')?.addEventListener('change', filterAppointments);
  document.getElementById('patientSearch')?.addEventListener('input', filterPatients);
  document.getElementById('addServiceBtn')?.addEventListener('click', () => openServiceModal());
  document.getElementById('serviceForm')?.addEventListener('submit', handleServiceSubmit);
  document.getElementById('patientForm')?.addEventListener('submit', handlePatientSubmit);
};

const loadDashboardData = async () => {
  showLoading(true);
  try {
    await Promise.all([loadStats(), loadAppointments(), loadPatients(), loadServices()]);
  } catch (error) {
    if (error.message.includes('token') || error.message.includes('authorized')) {
      localStorage.removeItem('adminToken');
      window.location.href = 'admin-login.html';
    } else {
      showToast(error.message, 'error');
    }
  } finally {
    showLoading(false);
  }
};

const loadStats = async () => {
  const { data } = await apiRequest('/appointments/stats');

  document.getElementById('statPatients').textContent = data.totalPatients;
  document.getElementById('statAppointments').textContent = data.totalAppointments;
  document.getElementById('statToday').textContent = data.todayAppointments;
  document.getElementById('statCompleted').textContent = data.completedTreatments;
  document.getElementById('statPending').textContent = data.pendingAppointments;

  renderStatusChart(data.statusBreakdown);
  renderMonthlyChart(data.monthlyData);
};

const renderStatusChart = (breakdown) => {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;

  const labels = breakdown.map((b) => b._id);
  const values = breakdown.map((b) => b.count);
  const colors = {
    Pending: '#f59e0b',
    Confirmed: '#0d6efd',
    Completed: '#10b981',
    Cancelled: '#ef4444',
  };

  if (statusChart) statusChart.destroy();

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((l) => colors[l] || '#94a3b8'),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
    },
  });
};

const renderMonthlyChart = (monthlyData) => {
  const ctx = document.getElementById('monthlyChart');
  if (!ctx) return;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels = monthlyData.map((d) => `${months[d._id.month - 1]} ${d._id.year}`);
  const values = monthlyData.map((d) => d.count);

  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Appointments',
          data: values,
          backgroundColor: 'rgba(13, 110, 253, 0.7)',
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
    },
  });
};

const loadAppointments = async () => {
  const { data } = await apiRequest('/appointments');
  allAppointments = data;
  renderAppointments(data);
};

const renderAppointments = (appointments) => {
  const tbody = document.getElementById('appointmentsTable');
  if (!tbody) return;

  if (appointments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No appointments found</td></tr>';
    return;
  }

  tbody.innerHTML = appointments
    .map((a) => {
      const patient = a.patientId || {};
      return `
    <tr>
      <td><strong>${a.appointmentId}</strong></td>
      <td>${patient.fullName || 'N/A'}</td>
      <td>${a.service}</td>
      <td>${formatDate(a.appointmentDate)}</td>
      <td>${a.appointmentTime}</td>
      <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
      <td>${patient.phone || ''}</td>
      <td>
        <div class="action-buttons">
          ${a.status === 'Pending' ? `<button class="action-btn confirm" title="Confirm" onclick="updateAppointmentStatus('${a._id}', 'Confirmed')">✓</button>` : ''}
          ${a.status === 'Confirmed' ? `<button class="action-btn complete" title="Complete" onclick="updateAppointmentStatus('${a._id}', 'Completed')">✓</button>` : ''}
          ${a.status !== 'Cancelled' && a.status !== 'Completed' ? `<button class="action-btn cancel" title="Cancel" onclick="updateAppointmentStatus('${a._id}', 'Cancelled')">✕</button>` : ''}
          <button class="action-btn delete" title="Delete" onclick="deleteAppointment('${a._id}')">🗑</button>
        </div>
      </td>
    </tr>
  `;
    })
    .join('');
};

const filterAppointments = () => {
  const search = document.getElementById('appointmentSearch').value.toLowerCase();
  const status = document.getElementById('appointmentFilter').value;

  let filtered = allAppointments;

  if (status) filtered = filtered.filter((a) => a.status === status);
  if (search) {
    filtered = filtered.filter(
      (a) =>
        a.appointmentId.toLowerCase().includes(search) ||
        a.service.toLowerCase().includes(search) ||
        (a.patientId?.fullName || '').toLowerCase().includes(search)
    );
  }

  renderAppointments(filtered);
};

window.updateAppointmentStatus = async (id, status) => {
  try {
    await apiRequest(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    showToast(`Appointment ${status.toLowerCase()} successfully`, 'success');
    await loadAppointments();
    await loadStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.deleteAppointment = async (id) => {
  if (!confirm('Are you sure you want to delete this appointment?')) return;

  try {
    await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
    showToast('Appointment deleted', 'success');
    await loadAppointments();
    await loadStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const loadPatients = async () => {
  const { data } = await apiRequest('/patients');
  allPatients = data;
  renderPatients(data);
};

const renderPatients = (patients) => {
  const tbody = document.getElementById('patientsTable');
  if (!tbody) return;

  if (patients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No patients found</td></tr>';
    return;
  }

  tbody.innerHTML = patients
    .map(
      (p) => `
    <tr>
      <td><strong>${p.fullName}</strong></td>
      <td>${p.email}</td>
      <td>${p.phone}</td>
      <td>${p.age}</td>
      <td>${p.gender}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit" title="Edit" onclick="editPatient('${p._id}')">✎</button>
          <button class="action-btn delete" title="Delete" onclick="deletePatient('${p._id}')">🗑</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
};

const filterPatients = () => {
  const search = document.getElementById('patientSearch').value.toLowerCase();
  const filtered = allPatients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search) ||
      p.email.toLowerCase().includes(search) ||
      p.phone.includes(search)
  );
  renderPatients(filtered);
};

window.editPatient = (id) => {
  const patient = allPatients.find((p) => p._id === id);
  if (!patient) return;

  const form = document.getElementById('patientForm');
  form.dataset.id = id;
  form.fullName.value = patient.fullName;
  form.email.value = patient.email;
  form.phone.value = patient.phone;
  form.age.value = patient.age;
  form.gender.value = patient.gender;
  document.getElementById('patientModalTitle').textContent = 'Edit Patient';
  openModal('patientModal');
};

const handlePatientSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.id;

  try {
    await apiRequest(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        age: Number(form.age.value),
        gender: form.gender.value,
      }),
    });

    showToast('Patient updated successfully', 'success');
    closeModal(document.getElementById('patientModal'));
    form.reset();
    delete form.dataset.id;
    await loadPatients();
    await loadStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.deletePatient = async (id) => {
  if (!confirm('Delete this patient and all their appointments?')) return;

  try {
    await apiRequest(`/patients/${id}`, { method: 'DELETE' });
    showToast('Patient deleted', 'success');
    await loadPatients();
    await loadAppointments();
    await loadStats();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

const loadServices = async () => {
  const { data } = await apiRequest('/services');
  allServices = data;
  renderServices(data);
};

const renderServices = (services) => {
  const tbody = document.getElementById('servicesTable');
  if (!tbody) return;

  if (services.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No services found</td></tr>';
    return;
  }

  tbody.innerHTML = services
    .map(
      (s) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:0.75rem">
          <span style="font-size:1.5rem">${s.image ? `<img src="http://localhost:5000${s.image}" style="width:40px;height:40px;border-radius:8px;object-fit:cover">` : getServiceIcon(s.title)}</span>
          <strong>${s.title}</strong>
        </div>
      </td>
      <td>${s.duration} min</td>
      <td>${s.priceRange}</td>
      <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.description}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn edit" title="Edit" onclick="editService('${s._id}')">✎</button>
          <button class="action-btn delete" title="Delete" onclick="deleteService('${s._id}')">🗑</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
};

const openServiceModal = (service = null) => {
  const form = document.getElementById('serviceForm');
  form.reset();
  delete form.dataset.id;
  document.getElementById('serviceImagePreview').innerHTML = '';

  if (service) {
    form.dataset.id = service._id;
    form.title.value = service.title;
    form.description.value = service.description;
    form.duration.value = service.duration;
    form.priceRange.value = service.priceRange;
    document.getElementById('serviceModalTitle').textContent = 'Edit Service';
    if (service.image) {
      document.getElementById('serviceImagePreview').innerHTML = `<img src="http://localhost:5000${service.image}" alt="${service.title}">`;
    }
  } else {
    document.getElementById('serviceModalTitle').textContent = 'Add Service';
  }

  openModal('serviceModal');
};

window.editService = (id) => {
  const service = allServices.find((s) => s._id === id);
  if (service) openServiceModal(service);
};

const handleServiceSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.dataset.id;

  const formData = new FormData();
  formData.append('title', form.title.value.trim());
  formData.append('description', form.description.value.trim());
  formData.append('duration', form.duration.value);
  formData.append('priceRange', form.priceRange.value.trim());

  const imageFile = form.image.files[0];
  if (imageFile) formData.append('image', imageFile);

  try {
    const token = localStorage.getItem('adminToken');
    const url = id
      ? `http://localhost:5000/api/services/${id}`
      : 'http://localhost:5000/api/services';

    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    showToast(id ? 'Service updated' : 'Service created', 'success');
    closeModal(document.getElementById('serviceModal'));
    await loadServices();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.deleteService = async (id) => {
  if (!confirm('Delete this service?')) return;

  try {
    await apiRequest(`/services/${id}`, { method: 'DELETE' });
    showToast('Service deleted', 'success');
    await loadServices();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

document.getElementById('serviceImage')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  const preview = document.getElementById('serviceImagePreview');
  if (file && preview) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
    };
    reader.readAsDataURL(file);
  }
});
