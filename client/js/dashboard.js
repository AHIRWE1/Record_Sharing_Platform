document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const api = (path, opts = {}) => {
    opts.headers = opts.headers || {};
    opts.headers['Content-Type'] = 'application/json';
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    return fetch(path, opts).then(async res => {
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      if (!res.ok) {
        const msg = (data && data.message) ? data.message : `Request failed (${res.status})`;
        const err = new Error(msg);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data;
    });
  };

  const el = id => document.getElementById(id);
  const patientList = el('patient-list');
  const searchInput = el('search-input');
  const searchBtn = el('search-btn');
  const refreshBtn = el('refresh-btn');

  async function loadPatients() {
    patientList.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    try {
      const data = await api('/api/patients');
      renderPatients(data);
    } catch (err) {
      const msg = (err && err.message) ? err.message : 'Error loading patients';
      patientList.innerHTML = `<tr><td colspan="5">${escapeHtml(msg)}</td></tr>`;
      console.error(err);
    }
  }

  function renderPatients(rows) {
    if (!rows || rows.length === 0) {
      patientList.innerHTML = '<tr><td colspan="5">No patients found</td></tr>';
      return;
    }
    patientList.innerHTML = rows.map(p => `
      <tr>
        <td>${p.patient_id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${p.date_of_birth || ''}</td>
        <td>${p.gender || ''}</td>
        <td class="actions">
          <button class="btn" data-action="view" data-id="${p.patient_id}">View</button>
          <button class="btn" data-action="update" data-id="${p.patient_id}">Update</button>
          <button class="btn" data-action="notes" data-id="${p.patient_id}">Add Notes</button>
        </td>
      </tr>
    `).join('');
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  patientList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'view') return viewPatient(id);
    if (action === 'update') return openUpdateModal(id);
    if (action === 'notes') return openNotesModal(id);
  });

  searchBtn.addEventListener('click', async () => {
    const q = searchInput.value.trim();
    if (!q) return loadPatients();
    patientList.innerHTML = '<tr><td colspan="5">Searching...</td></tr>';
    try {
      const rows = await api(`/api/patients/search?q=${encodeURIComponent(q)}`);
      renderPatients(rows);
    } catch (err) {
      patientList.innerHTML = '<tr><td colspan="5">Search error</td></tr>';
    }
  });

  refreshBtn.addEventListener('click', loadPatients);

  // View modal
  function openModal() {
    el('view-modal').classList.add('open');
  }

  // View patient
  async function viewPatient(id) {
    try {
      const p = await api(`/api/patients/${id}`);
      el('modal-title').textContent = `Patient: ${p.name}`;
      el('modal-body').innerHTML = `
        <p><strong>Patient ID:</strong> ${p.patient_id}</p>
        <p><strong>DOB:</strong> ${p.date_of_birth || ''}</p>
        <p><strong>Gender:</strong> ${p.gender || ''}</p>
        <p><strong>National ID:</strong> ${p.national_id || ''}</p>
      `;
      openModal();
    } catch (err) { console.error(err); }
  }

  // Update patient modal
  async function openUpdateModal(id) {
    try {
      const p = await api(`/api/patients/${id}`);
      el('update-id').value = p.patient_id;
      el('update-name').value = p.name || '';
      el('update-dob').value = p.date_of_birth || '';
      el('update-gender').value = p.gender || '';
      el('update-national').value = p.national_id || '';
      el('update-modal-title').textContent = `Update: ${p.name}`;
      el('update-modal').classList.add('open');
    } catch (err) { console.error(err); }
  }

  el('update-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = el('update-id').value;
    const payload = {
      name: el('update-name').value,
      date_of_birth: el('update-dob').value,
      gender: el('update-gender').value,
      national_id: el('update-national').value
    };
    try {
      await api(`/api/patients/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      el('update-modal').classList.remove('open');
      loadPatients();
    } catch (err) { console.error(err); }
  });

  // Notes modal
  function openNotesModal(id) {
    el('notes-patient-id').value = id;
    el('notes-text').value = '';
    el('notes-modal').classList.add('open');
  }

  el('notes-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const patientId = el('notes-patient-id').value;
    const note = el('notes-text').value.trim();
    if (!note) return;
    try {
      // create a medical record entry as a clinical note
      await api('/api/records', { method: 'POST', body: JSON.stringify({ patient_id: patientId, diagnosis: null, treatment_plan: null, clinical_notes: note }) });
      el('notes-modal').classList.remove('open');
    } catch (err) { console.error(err); }
  });

  // Simple modal handlers
  document.querySelectorAll('.modal .close').forEach(b => b.addEventListener('click', (e) => e.target.closest('.modal').classList.remove('open')));

  // initial load
  loadPatients();
});

// keep the file small: utility fetch wrapper already defined above
