document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('name').value.trim(),
    date_of_birth: document.getElementById('dob').value || null,
    gender: document.getElementById('gender').value.trim() || null,
    national_id: document.getElementById('national_id').value.trim() || null,
  };
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/patients/register', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json().catch(()=>({message:'Failed'}));
      alert(err.message || 'Registration failed');
      return;
    }
    const patient = await res.json();
    alert('Patient registered: ' + patient.patient_id);
    window.location = 'dashboard.html';
  } catch (err) {
    console.error(err); alert('Error');
  }
});
