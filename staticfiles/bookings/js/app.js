document.addEventListener('DOMContentLoaded', function() {
    // 0. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
    }
    
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        let theme = 'dark';
        if (document.body.classList.contains('light-theme')) {
            theme = 'light';
            themeIcon.classList.replace('fa-sun', 'fa-moon');
        } else {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
        }
        localStorage.setItem('theme', theme);
    });

    // 1. Initialize Map
    // Center around Central Asia/Kazakhstan/Uzbekistan to focus on primary service region, zoom level 3
    const defaultCenter = [43.25, 69.05]; 
    const defaultZoom = 3;

    const map = L.map('map', {
        center: defaultCenter,
        zoom: defaultZoom,
        minZoom: 2,
        maxZoom: 18
    });

    // Dark styled map tiles (CartoDB Dark Matter) matching the premium dark theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    let marker = null;

    // 2. Map Elements & Form controls
    const indicator = document.getElementById('map-selection-indicator');
    const statusDot = indicator.querySelector('.status-dot');
    
    const inputLat = document.getElementById('dest-lat');
    const inputLng = document.getElementById('dest-lng');
    const inputAddress = document.getElementById('destination-address');
    
    const form = document.getElementById('booking-form');
    const submitBtn = document.getElementById('submit-btn');
    const inputName = document.getElementById('client-name');
    const inputPhone = document.getElementById('client-phone');
    const inputDate = document.getElementById('booking-date');
    
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    inputDate.setAttribute('min', today);

    // 3. Map Click Event Handler
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Update hidden coordinates inputs
        inputLat.value = lat.toFixed(6);
        inputLng.value = lng.toFixed(6);

        // Update Map Marker
        if (marker) {
            marker.setLatLng(e.latlng);
        } else {
            // Customize marker icon to a sleek cyan pin
            const cyanIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="
                    background-color: #38bdf8;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 0 10px #38bdf8;
                "></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });
            marker = L.marker(e.latlng, { icon: cyanIcon }).addTo(map);
        }

        // Update UI Indicator to selected
        indicator.innerHTML = '<span class="status-dot selected"></span> Точка выбрана';
        
        // Temporarily display coordinates while address resolves
        inputAddress.value = `Поиск адреса... (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        validateForm();

        // Perform reverse geocoding via Nominatim API
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru`)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    // Extract a clean address instead of full long text if possible
                    const addressParts = data.address;
                    let cleanAddress = '';
                    
                    if (addressParts) {
                        const city = addressParts.city || addressParts.town || addressParts.village || addressParts.hamlet || '';
                        const country = addressParts.country || '';
                        const road = addressParts.road || '';
                        const state = addressParts.state || addressParts.region || '';
                        
                        const parts = [];
                        if (road) parts.push(road);
                        if (city) parts.push(city);
                        else if (state) parts.push(state);
                        if (country) parts.push(country);
                        
                        cleanAddress = parts.join(', ');
                    }
                    
                    inputAddress.value = cleanAddress || data.display_name;
                } else {
                    inputAddress.value = `Координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                }
                validateForm();
            })
            .catch(error => {
                console.error("Reverse geocoding failed:", error);
                inputAddress.value = `Координаты: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
                validateForm();
            });
    });

    // 4. Form Validation
    function validateForm() {
        const isNameValid = inputName.value.trim().length > 0;
        const isPhoneValid = inputPhone.value.trim().length > 0;
        const isDateValid = inputDate.value !== "";
        const isDestValid = inputLat.value !== "" && inputLng.value !== "";

        if (isNameValid && isPhoneValid && isDateValid && isDestValid) {
            submitBtn.removeAttribute('disabled');
        } else {
            submitBtn.setAttribute('disabled', 'true');
        }
    }

    [inputName, inputPhone, inputDate].forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('change', validateForm);
    });

    // 5. Submit Form via AJAX
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Double check validation
        if (submitBtn.hasAttribute('disabled')) return;

        // Show loading state
        submitBtn.setAttribute('disabled', 'true');
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        // Extract CSRF Token
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        const payload = {
            name: inputName.value.trim(),
            phone: inputPhone.value.trim(),
            booking_date: inputDate.value,
            destination_name: inputAddress.value,
            destination_lat: parseFloat(inputLat.value),
            destination_lng: parseFloat(inputLng.value)
        };

        fetch('/api/booking/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(res => {
            if (res.status === 200 && res.body.status === 'success') {
                // Success! Create WhatsApp message and redirect
                const textMsg = `*Yangi buyurtma!* 🚗\n\n*Ism:* ${payload.name}\n*Telefon:* ${payload.phone}\n*Sana:* ${payload.booking_date}\n*Manzil:* ${payload.destination_name}`;
                const waUrl = `https://api.whatsapp.com/send?phone=77026448344&text=${encodeURIComponent(textMsg)}`;
                window.open(waUrl, '_blank');

                showModal(res.body.message);
                
                // Reset form values, keeping the default contact number
                form.reset();
                inputPhone.value = "87026448344";
                inputLat.value = "";
                inputLng.value = "";
                
                // Clear map marker
                if (marker) {
                    map.removeLayer(marker);
                    marker = null;
                }

                // Reset map status indicator
                indicator.innerHTML = '<span class="status-dot"></span> Точка не выбрана';
            } else {
                // Server validation error
                showToast(res.body.message || "Ошибка при отправке заказа.");
            }
        })
        .catch(error => {
            console.error("Booking error:", error);
            showToast("Не удалось отправить запрос. Проверьте интернет-соединение.");
        })
        .finally(() => {
            // Restore button state
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            validateForm();
        });
    });
});

// Modal Actions
function showModal(message) {
    const modal = document.getElementById('success-modal');
    document.getElementById('success-message').innerText = message;
    modal.classList.remove('hidden');
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.add('hidden');
}

// Toast Actions
function showToast(message) {
    const toast = document.getElementById('error-toast');
    document.getElementById('toast-message').innerText = message;
    toast.classList.remove('hidden');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
