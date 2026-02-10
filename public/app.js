const API_BASE = 'http://localhost:3000/api';

function switchView(viewId) {
    document.querySelectorAll('.full-screen-view').forEach(el => {
        el.classList.remove('active-view');
        el.classList.add('hidden-view');
    });
    const target = document.getElementById(viewId);
    target.classList.remove('hidden-view');
    target.classList.add('active-view');
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.style.borderBottom = isError ? '3px solid #ff5555' : '3px solid #4deeea';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}


document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-pass').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', data.username);
            initApp();
            showToast('Welcome back, Commander.');
        } else {
            showToast(data.message || 'Login failed', true);
        }
    } catch (err) { showToast('Server connection failed', true); }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-user').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-pass').value;

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        if (res.ok) {
            showToast('Identity created. Please login.');
            switchView('login-view');
        } else {
            const data = await res.json();
            showToast(data.message || 'Registration failed', true);
        }
    } catch (err) { showToast('Server error', true); }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    switchView('login-view');
    showToast('Logged out successfully.');
}

function initApp() {
    const token = localStorage.getItem('token');
    if (!token) return switchView('login-view');

    document.getElementById('welcome-msg').innerText = `User: ${localStorage.getItem('user')}`;
    switchView('dashboard-view');
    loadFavorites();
}

async function getWeather() {
    const city = document.getElementById('city-input').value;
    if (!city) return;

    try {
        const res = await fetch(`${API_BASE}/weather/data/${city}`);
        const data = await res.json();

        if (res.ok) {
            const display = document.getElementById('weather-display');
            display.classList.remove('hidden');
            
            document.getElementById('city-name').innerText = `${data.name}, ${data.sys.country}`;
            document.getElementById('temp-val').innerText = Math.round(data.main.temp);
            document.getElementById('w-desc').innerText = data.weather[0].description;
            document.getElementById('w-wind').innerText = `${data.wind.speed} km/h`;
            document.getElementById('w-humidity').innerText = `${data.main.humidity}%`;
            
    
            const desc = data.weather[0].description.toLowerCase();
            const icon = document.getElementById('w-icon');
            icon.className = 'fas'; // reset
            if(desc.includes('rain')) icon.classList.add('fa-cloud-showers-heavy');
            else if(desc.includes('cloud')) icon.classList.add('fa-cloud');
            else if(desc.includes('snow')) icon.classList.add('fa-snowflake');
            else icon.classList.add('fa-sun');

        } else {
            showToast('City not found in sector database.', true);
        }
    } catch (err) { console.error(err); }
}

async function addToFavorites() {
    const token = localStorage.getItem('token');
    const cityName = document.getElementById('city-name').innerText.split(',')[0]; // Extract just city name

    const res = await fetch(`${API_BASE}/weather/favorites`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ cityName })
    });

    if (res.ok) {
        showToast('Sector saved to database.');
        loadFavorites();
    }
}

async function loadFavorites() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/weather/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    const list = document.getElementById('favorites-list');
    list.innerHTML = '';

    if (data.length === 0) {
        list.innerHTML = '<p class="empty-msg">No data saved.</p>';
        return;
    }

    data.forEach(fav => {
        const div = document.createElement('div');
        div.className = 'fav-item';
        div.innerHTML = `
            <span>${fav.cityName}</span>
            <button class="del-btn" onclick="deleteFav('${fav._id}')"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });
}

async function deleteFav(id) {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/weather/favorites/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    loadFavorites();
    showToast('Sector removed.');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initApp);