async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    document.getElementById('records-list').innerHTML = '<tr><td colspan="5">Missing patient id</td></tr>';
    return;
  }
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const pRes = await fetch(`/api/patients/${id}`, { headers });
    const patient = await pRes.json();
    document.getElementById('patient-info').innerHTML = `<strong>${patient.name}</strong> — ${patient.national_id || ''}`;
    const recRes = await fetch(`/api/records/patient/${id}`, { headers });
    const recs = await recRes.json();
    const body = document.getElementById('records-list');
    if (!recs || recs.length === 0) return body.innerHTML = '<tr><td colspan="5">No records</td></tr>';
    body.innerHTML = recs.map(r => `<tr>
      <td>${r.record_id}</td>
      <td>${r.diagnosis || ''}</td>
      <td>${r.treatment_plan || ''}</td>
      <td><pre style="white-space:pre-wrap">${escapeHtml(r.clinical_notes || '')}</pre></td>
      <td>${r.created_at}</td>
    </tr>`).join('');
  } catch (err) {
    console.error(err);
    document.getElementById('records-list').innerHTML = '<tr><td colspan="5">Error loading records</td></tr>';
  }
}

function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

init();
