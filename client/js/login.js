document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>({message:'Login failed'}));
      alert(err.message || 'Login failed');
      return;
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    window.location = 'dashboard.html';
  } catch (err) {
    console.error(err);
    alert('Login error');
  }
});
