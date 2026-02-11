
const API_BASE = 'https://nightfall-weather-backend.onrender.com/api';

function switchView(viewId) {
    document.querySelectorAll('.full-screen-view').forEach(el => {
        el.classList.remove('active-view');
        el.classList.add('hidden-view');
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden-view');
        target.classList.add('active-view');
    }
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
            showToast('Authorization successful.');
        } else {
            showToast(data.message || 'Access Denied', true);
        }
    } catch (err) { showToast('Server offline', true); }
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
    } catch (err) { showToast('Connection failed', true); }
});

function logout() {
    localStorage.clear();
    switchView('login-view');
    showToast('Session terminated.');
}

function initApp() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token) return switchView('login-view');

    document.getElementById('welcome-msg').innerText = `User: ${user}`;
    switchView('dashboard-view');
    loadFavorites();
}

async function getWeather() {
    const cityInput = document.getElementById('city-input');
    const city = cityInput.value.trim();
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
            icon.className = 'fas';
            if(desc.includes('rain')) icon.classList.add('fa-cloud-showers-heavy');
            else if(desc.includes('cloud')) icon.classList.add('fa-cloud');
            else if(desc.includes('snow')) icon.classList.add('fa-snowflake');
            else icon.classList.add('fa-sun');
        } else {
            showToast('Sector not found.', true);
        }
    } catch (err) { showToast('Scan failed', true); }
}

async function updateUserProfile() {
    const token = localStorage.getItem('token');
    const newUsername = document.getElementById('edit-username').value;
    const newEmail = document.getElementById('edit-email').value;

    if (!newUsername || !newEmail) return showToast('Entries incomplete', true);

    try {
        const res = await fetch(`${API_BASE}/users/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ username: newUsername, email: newEmail })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('user', data.username);
            document.getElementById('welcome-msg').innerText = `User: ${data.username}`;
            showToast('Identity updated.');
            setTimeout(() => switchView('dashboard-view'), 1000);
        } else {
            showToast(data.message || 'Update failed', true);
        }
    } catch (err) { showToast('Server error', true); }
}

async function addToFavorites() {
    const token = localStorage.getItem('token');
    const cityNameText = document.getElementById('city-name').innerText;
    
    if (cityNameText === "Sector Unknown" || cityNameText === "Scanning...") {
        return showToast("Please search a city first", true);
    }

    const cityName = cityNameText.split(',')[0].trim(); 

    try {
        const res = await fetch(`${API_BASE}/weather/favorites`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ cityName })
        });

        if (res.ok) {
            showToast(`Sector ${cityName} saved.`);
            loadFavorites();
        } else {
            showToast('Save failed', true);
        }
    } catch (err) { showToast('Connection error', true); }
}

async function loadFavorites() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
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
                <span onclick="quickSearch('${fav.cityName}')" style="cursor:pointer">${fav.cityName}</span>
                <button class="del-btn" onclick="deleteFav('${fav._id}')"><i class="fas fa-trash"></i></button>
            `;
            list.appendChild(div);
        });
    } catch (err) { console.error(err); }
}

async function deleteFav(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE}/weather/favorites/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            showToast('Sector removed.');
            loadFavorites();
        }
    } catch (err) { showToast('Delete failed', true); }
}

function quickSearch(city) {
    document.getElementById('city-input').value = city;
    getWeather();
}

// Global Initialization
document.addEventListener('DOMContentLoaded', initApp);