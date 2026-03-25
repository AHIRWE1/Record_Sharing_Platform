document.getElementById('register-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');

  const payload = {
    username: document.getElementById('username').value.trim(),
    password: document.getElementById('password').value,
    role: document.getElementById('role').value
  };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    if (!res.ok) {
      alert((data && data.message) ? data.message : `Request failed (${res.status})`);
      return;
    }

    alert('Account created: ' + (data && data.username ? data.username : payload.username));
    window.location = 'dashboard.html';
  } catch (err) {
    console.error(err);
    alert('Error creating account');
  }
});

