let currentStep = 1;
let selectedTime = '';
let servicesList = [];

document.addEventListener('DOMContentLoaded', () => {
  initLayout('booking.html');
  initBooking();
});

const initBooking = async () => {
  await loadServicesForBooking();
  setupStepNavigation();
  setupDateListener();
  preselectServiceFromURL();
};

const loadServicesForBooking = async () => {
  const select = document.getElementById('service');
  if (!select) return;

  try {
    const { data } = await apiRequest('/services');
    servicesList = data;
    select.innerHTML =
      '<option value="">Select a service</option>' +
      data.map((s) => `<option value="${s.title}">${s.title} (${s.duration} min)</option>`).join('');
  } catch {
    select.innerHTML = `
      <option value="">Select a service</option>
      <option value="General Dentistry">General Dentistry</option>
      <option value="Teeth Cleaning">Teeth Cleaning</option>
      <option value="Teeth Whitening">Teeth Whitening</option>
      <option value="Dental Fillings">Dental Fillings</option>
      <option value="Root Canal Treatment">Root Canal Treatment</option>
      <option value="Dental Crowns">Dental Crowns</option>
      <option value="Dental Implants">Dental Implants</option>
      <option value="Orthodontics">Orthodontics</option>
      <option value="Pediatric Dentistry">Pediatric Dentistry</option>
      <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
    `;
  }
};

const preselectServiceFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const service = params.get('service');
  if (service) {
    const select = document.getElementById('service');
    if (select) select.value = service;
  }
};

const setupDateListener = () => {
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate());
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.addEventListener('change', loadTimeSlots);
  }
};

const setupStepNavigation = () => {
  document.getElementById('btnStep1Next')?.addEventListener('click', () => {
    if (validateStep1()) goToStep(2);
  });

  document.getElementById('btnStep2Back')?.addEventListener('click', () => goToStep(1));
  document.getElementById('btnStep2Next')?.addEventListener('click', () => {
    if (validateStep2()) goToStep(3);
  });

  document.getElementById('btnStep3Back')?.addEventListener('click', () => goToStep(2));
  document.getElementById('bookingForm')?.addEventListener('submit', handleBookingSubmit);
  document.getElementById('btnBookAnother')?.addEventListener('click', resetBooking);
};

const goToStep = (step) => {
  currentStep = step;
  document.querySelectorAll('.booking-panel').forEach((p) => p.classList.remove('active'));
  document.getElementById(`step${step}`)?.classList.add('active');

  document.querySelectorAll('.booking-step').forEach((s, i) => {
    s.classList.remove('active', 'completed');
    if (i + 1 < step) s.classList.add('completed');
    if (i + 1 === step) s.classList.add('active');
  });

  if (step === 3) populateReview();
};

const validateStep1 = () => {
  const form = document.getElementById('bookingForm');
  clearAllErrors(form);
  let valid = true;

  const fields = [
    { el: form.fullName, check: (v) => v.length > 0, msg: 'Full name is required' },
    { el: form.phone, check: validatePhone, msg: 'Valid phone number is required' },
    { el: form.email, check: validateEmail, msg: 'Valid email is required' },
    { el: form.age, check: (v) => v >= 1 && v <= 120, msg: 'Valid age is required (1-120)' },
    { el: form.gender, check: (v) => v.length > 0, msg: 'Please select gender' },
    { el: form.service, check: (v) => v.length > 0, msg: 'Please select a service' },
  ];

  fields.forEach(({ el, check, msg }) => {
    const val = el.type === 'number' ? Number(el.value) : el.value.trim();
    if (!check(val)) {
      setFormError(el, msg);
      valid = false;
    }
  });

  return valid;
};

const validateStep2 = () => {
  const form = document.getElementById('bookingForm');
  clearAllErrors(form);
  let valid = true;

  if (!form.appointmentDate.value) {
    setFormError(form.appointmentDate, 'Please select a date');
    valid = false;
  } else if (!validateFutureDate(form.appointmentDate.value)) {
    setFormError(form.appointmentDate, 'Date must be today or in the future');
    valid = false;
  }

  if (!selectedTime) {
    showToast('Please select a time slot', 'warning');
    valid = false;
  }

  return valid;
};

const loadTimeSlots = async () => {
  const date = document.getElementById('appointmentDate').value;
  const container = document.getElementById('timeSlots');
  if (!date || !container) return;

  selectedTime = '';
  container.innerHTML = '<div class="page-loader">Loading available slots...</div>';

  try {
    const { available } = await apiRequest(`/appointments/slots/available?date=${date}`);

    if (available.length === 0) {
      container.innerHTML = '<p style="color:var(--gray-500);grid-column:1/-1">No slots available for this date. Please choose another date.</p>';
      return;
    }

    container.innerHTML = available
      .map(
        (slot) =>
          `<button type="button" class="time-slot" data-time="${slot}">${slot}</button>`
      )
      .join('');

    container.querySelectorAll('.time-slot').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.time-slot').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTime = btn.dataset.time;
      });
    });
  } catch (error) {
    container.innerHTML = '<p style="color:var(--danger)">Failed to load time slots.</p>';
    showToast(error.message, 'error');
  }
};

const populateReview = () => {
  const form = document.getElementById('bookingForm');
  const review = document.getElementById('bookingReview');
  if (!review) return;

  review.innerHTML = `
    <div style="background:var(--gray-50);padding:1.5rem;border-radius:var(--radius);margin-bottom:1.5rem">
      <h4 style="margin-bottom:1rem;color:var(--gray-800)">Appointment Summary</h4>
      <p><strong>Name:</strong> ${form.fullName.value}</p>
      <p><strong>Phone:</strong> ${form.phone.value}</p>
      <p><strong>Email:</strong> ${form.email.value}</p>
      <p><strong>Service:</strong> ${form.service.value}</p>
      <p><strong>Date:</strong> ${formatDate(form.appointmentDate.value)}</p>
      <p><strong>Time:</strong> ${selectedTime}</p>
      ${form.notes.value ? `<p><strong>Notes:</strong> ${form.notes.value}</p>` : ''}
    </div>
  `;
};

const handleBookingSubmit = async (e) => {
  e.preventDefault();
  const form = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('btnSubmit');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="loading-spinner"></span> Booking...';

  try {
    const payload = {
      fullName: form.fullName.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      age: Number(form.age.value),
      gender: form.gender.value,
      service: form.service.value,
      appointmentDate: form.appointmentDate.value,
      appointmentTime: selectedTime,
      notes: form.notes.value.trim(),
    };

    const { data, message } = await apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    document.getElementById('confirmationId').textContent = data.appointmentId;
    document.getElementById('confirmationDetails').innerHTML = `
      <p><strong>Service:</strong> ${data.service}</p>
      <p><strong>Date:</strong> ${formatDate(data.appointmentDate)}</p>
      <p><strong>Time:</strong> ${data.appointmentTime}</p>
      <p><strong>Status:</strong> ${data.status}</p>
    `;

    goToStep(4);
    document.querySelector('.booking-steps').style.display = 'none';
    showToast(message, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm Booking';
  }
};

const resetBooking = () => {
  document.getElementById('bookingForm').reset();
  selectedTime = '';
  document.querySelector('.booking-steps').style.display = 'flex';
  document.getElementById('timeSlots').innerHTML = '';
  goToStep(1);
};
