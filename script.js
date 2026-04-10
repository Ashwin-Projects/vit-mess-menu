// --- AUTH & STATE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();

    // Basic redirect guard
    if (window.location.pathname.includes('index.html') || window.location.pathname.includes('home.html') || window.location.pathname.includes('weekly.html') || window.location.pathname.includes('favorites.html')) {
        if (!isAuthenticated()) {
            clearUserSession();
            window.location.href = 'login.html';
            return;
        }
    }

    // Attach logout logic to navbar buttons
    document.querySelectorAll('a[href="login.html"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (btn.innerText.toLowerCase() === 'logout') {
                e.preventDefault();
                clearUserSession();
                window.location.href = 'login.html';
            }
        });
    });

    const userMessType = localStorage.getItem('userMessType') || "Veg";

    // Init Auth Page
    if (document.getElementById('authForm')) {
        initAuthPage();
        injectThemeToggle();
    }

    // Init shared controls for logged-in pages
    if (isAuthenticated()) {
        injectThemeToggle();
    }

    // Init Home Page
    if (document.getElementById('todayMenuContainer')) {
        syncMessToggle(userMessType);
        initTodayMenu();
    }

    // Init Weekly Page
    if (document.getElementById('weeklyMenuContainer')) {
        syncMessToggle(userMessType);
        // Default to Monday
        loadTabMenu("Monday");
    }

    // Init Dashboard Page
    if (document.getElementById('dashMessNameBadge')) {
        initDashboard();
    }

    // Init Favorites Page
    if (document.getElementById('favoritesPageGrid')) {
        renderFavoritesPage();
    }
});

function handleLogin(event) {
    event.preventDefault();
    const form = document.getElementById('authForm');

    if (!form.checkValidity()) {
        event.stopPropagation();
        form.classList.add('was-validated');
        return false;
    }

    const regNo = document.getElementById('regNo').value.trim().toUpperCase();
    const password = document.getElementById('password').value;
    const users = getStoredUsers();
    const user = users[regNo];

    if (!user || user.password !== password) {
        showAuthMessage('Registration number or password is incorrect.');
        return false;
    }

    startUserSession(regNo, user);
    window.location.href = 'index.html';
    return false;
}

function handleRegister(event) {
    event.preventDefault();
    const form = document.getElementById('registerForm');

    if (!form.checkValidity()) {
        event.stopPropagation();
        form.classList.add('was-validated');
        return false;
    }

    const name = document.getElementById('registerName').value.trim();
    const regNo = document.getElementById('registerRegNo').value.trim().toUpperCase();
    const password = document.getElementById('registerPassword').value;
    const users = getStoredUsers();

    if (!name) {
        showAuthMessage('Enter your name to create an account.');
        return false;
    }

    if (users[regNo]) {
        showAuthMessage('An account already exists for this registration number.');
        return false;
    }

    users[regNo] = { name, password };
    localStorage.setItem('messUsers', JSON.stringify(users));
    startUserSession(regNo, users[regNo]);
    window.location.href = 'index.html';
    return false;
}

function showAuthForm(mode) {
    const isLogin = mode === 'login';
    const loginForm = document.getElementById('authForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginModeBtn');
    const registerBtn = document.getElementById('registerModeBtn');
    const title = document.querySelector('.card-body h4');
    const subtitle = document.querySelector('.card-body .text-muted.small');

    hideAuthMessage();
    loginForm?.classList.toggle('d-none', !isLogin);
    registerForm?.classList.toggle('d-none', isLogin);
    loginBtn?.classList.toggle('btn-primary', isLogin);
    loginBtn?.classList.toggle('btn-outline-primary', !isLogin);
    registerBtn?.classList.toggle('btn-primary', !isLogin);
    registerBtn?.classList.toggle('btn-outline-primary', isLogin);

    if (title) title.innerText = isLogin ? 'Welcome back' : 'Create your account';
    if (subtitle) subtitle.innerText = isLogin ? 'Sign in to view your mess menu.' : 'Register once, then log in with the same password.';
}

function getStoredUsers() {
    try {
        return JSON.parse(localStorage.getItem('messUsers')) || {};
    } catch {
        return {};
    }
}

function isAuthenticated() {
    const regNo = localStorage.getItem('currentUserRegNo');
    const users = getStoredUsers();
    return localStorage.getItem('messLoggedIn') === 'true' && Boolean(regNo && users[regNo]);
}

function startUserSession(regNo, user) {
    if (!localStorage.getItem('userMessType')) {
        localStorage.setItem('userMessType', 'Veg');
    }

    localStorage.setItem('messLoggedIn', 'true');
    localStorage.setItem('currentUserRegNo', regNo);
    localStorage.setItem('currentUserName', user.name);
}

function clearUserSession() {
    localStorage.removeItem('messLoggedIn');
    localStorage.removeItem('currentUserRegNo');
    localStorage.removeItem('currentUserName');
}

function showAuthMessage(message) {
    const messageBox = document.getElementById('authMessage');
    if (!messageBox) return;

    messageBox.innerText = message;
    messageBox.classList.remove('d-none');
}

function hideAuthMessage() {
    const messageBox = document.getElementById('authMessage');
    if (messageBox) messageBox.classList.add('d-none');
}

function initAuthPage() {
    const brandTitle = document.querySelector('.text-center.mb-5 h2');
    const title = document.querySelector('.card-body h4');
    const footer = document.querySelector('.text-center.mt-4');
    const password = document.getElementById('password');

    if (brandTitle) brandTitle.innerText = 'VIT MessIt';
    if (title) title.innerText = 'Welcome back';
    if (footer) footer.innerText = 'Built for VIT Students';
    if (password) password.placeholder = 'Minimum 6 characters';
}

function applySavedTheme() {
    const theme = localStorage.getItem('messTheme') || 'light';
    document.body.classList.toggle('dark-theme', theme === 'dark');

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.innerText = theme === 'dark' ? 'Light mode' : 'Dark mode';
    });
}

function injectThemeToggle() {
    if (document.querySelector('.theme-toggle-btn')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle-btn';
    button.onclick = window.toggleTheme;

    const nav = document.querySelector('.nav-links');
    if (nav) {
        nav.appendChild(button);
    } else {
        const container = document.querySelector('.container');
        const wrapper = document.createElement('div');
        wrapper.className = 'auth-top-controls';
        wrapper.appendChild(button);
        if (container) container.prepend(wrapper);
    }

    applySavedTheme();
}

function getFavoritesStorageKey() {
    return `favoriteFoods:${localStorage.getItem('currentUserRegNo') || 'guest'}`;
}

function getFavoriteFoods() {
    try {
        return JSON.parse(localStorage.getItem(getFavoritesStorageKey())) || [];
    } catch {
        return [];
    }
}

function setFavoriteFoods(favorites) {
    localStorage.setItem(getFavoritesStorageKey(), JSON.stringify(favorites));
}

function getFavoriteKey(item) {
    return [item.messType, item.meal, item.type, item.name].map(part => encodeURIComponent(part || '')).join('|');
}

function isFavoriteFood(item) {
    const key = getFavoriteKey(item);
    return getFavoriteFoods().some(food => getFavoriteKey(food) === key);
}

function renderFavoritesPage() {
    const grid = document.getElementById('favoritesPageGrid');
    const empty = document.getElementById('favoritesEmptyState');
    const count = document.getElementById('favoritesCount');
    const name = document.getElementById('favoritesUserName');
    if (!grid) return;

    const favorites = getFavoriteFoods();
    if (count) count.innerText = `${favorites.length} saved`;
    if (name) name.innerText = getCurrentUserName() || 'Your';

    grid.innerHTML = '';
    if (empty) empty.classList.toggle('d-none', favorites.length > 0);

    favorites.forEach(food => {
        const config = mealConfig[food.meal] || mealConfig.Lunch;
        const card = document.createElement('article');
        card.className = 'favorite-page-card';
        card.innerHTML = `
            <div class="favorite-page-image" style="background-image: url('${config.img}')">
                <span class="badge bg-white text-dark">${escapeHtml(food.meal)}</span>
            </div>
            <div class="favorite-page-body">
                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <h3>${escapeHtml(food.name)}</h3>
                    ${getBadgeHtml(food.type)}
                </div>
                <p>${escapeHtml(food.messType)} Mess</p>
                <button type="button" class="favorite-page-remove" data-fav-key="${escapeAttr(getFavoriteKey(food))}" onclick="removeFavoriteFood(this.dataset.favKey)">Remove from favorites</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function refreshFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(button => {
        const item = {
            name: button.dataset.foodName,
            type: button.dataset.foodType,
            meal: button.dataset.foodMeal,
            messType: button.dataset.foodMessType
        };
        const active = isFavoriteFood(item);
        button.classList.toggle('active', active);
        button.title = active ? 'Remove from favorites' : 'Add to favorites';
        button.setAttribute('aria-label', button.title);
    });
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value);
}

// --- MASSIVE MESS MENU DATA ---
const messMenu = {
    "Veg": {
        "Monday": { 
            Breakfast: [{ name: "Kanda Poha", type: "veg" }, { name: "Cornflakes w/ Milk", type: "veg" }, { name: "Sprouts Salad", type: "veg" }], 
            Lunch: [{ name: "Paneer Pasanda", type: "veg" }, { name: "Kashmiri Pulao", type: "veg" }, { name: "Dal Maharani", type: "veg" }, { name: "Boondi Raita", type: "veg" }], 
            Snacks: [{ name: "Paneer Bread Pakora", type: "veg" }, { name: "Green Tea", type: "veg" }], 
            Dinner: [{ name: "Kadai Paneer", type: "veg" }, { name: "Garlic Naan", type: "veg" }, { name: "Veg Jalfrezi", type: "veg" }, { name: "Moong Dal Halwa", type: "veg" }] 
        },
        "Tuesday": { 
            Breakfast: [{ name: "Stuffed Aloo Paratha", type: "veg" }, { name: "Amul Butter", type: "veg" }, { name: "Fresh Curd", type: "veg" }], 
            Lunch: [{ name: "Gobi Manchurian Dry", type: "veg" }, { name: "Schezwan Veg Fried Rice", type: "veg" }, { name: "Veg Clear Soup", type: "veg" }], 
            Snacks: [{ name: "Crispy Corn Masala", type: "veg" }, { name: "Cold Coffee", type: "veg" }], 
            Dinner: [{ name: "Malai Kofta", type: "veg" }, { name: "Missi Roti", type: "veg" }, { name: "Yellow Dal Fry", type: "veg" }, { name: "Angoori Jamun", type: "veg" }] 
        },
        "Wednesday": { 
            Breakfast: [{ name: "Rava Idli", type: "veg" }, { name: "Ghee Roast Dosa", type: "veg" }, { name: "Ginger Tea", type: "veg" }], 
            Lunch: [{ name: "Veg Hyderabadi Biryani", type: "veg" }, { name: "Mirchi Baingan ka Salan", type: "veg" }, { name: "Onion Raita", type: "veg" }], 
            Snacks: [{ name: "Dahi Vada", type: "veg" }, { name: "Sweet Lassi", type: "veg" }], 
            Dinner: [{ name: "Mushroom Matar Masala", type: "veg" }, { name: "Lachha Paratha", type: "veg" }, { name: "Dal Makhani", type: "veg" }, { name: "Fruit Cream", type: "veg" }] 
        },
        "Thursday": { 
            Breakfast: [{ name: "Bread Butter Jam", type: "veg" }, { name: "Veg Cutlet", type: "veg" }, { name: "Milk w/ Bournvita", type: "veg" }], 
            Lunch: [{ name: "Rajma Masala (Punjabi)", type: "veg" }, { name: "Steamed Basmati Rice", type: "veg" }, { name: "Aloo Jeera", type: "veg" }, { name: "Buttermilk", type: "veg" }], 
            Snacks: [{ name: "Papdi Chaat", type: "veg" }, { name: "Jaljeera", type: "veg" }], 
            Dinner: [{ name: "Shahi Paneer", type: "veg" }, { name: "Rumali Roti", type: "veg" }, { name: "Panchmel Dal", type: "veg" }, { name: "Semiyan Kheer", type: "veg" }] 
        },
        "Friday": { 
            Breakfast: [{ name: "Chole Bhature", type: "veg" }, { name: "Sweet Lassi", type: "veg" }, { name: "Pickle", type: "veg" }], 
            Lunch: [{ name: "Dum Aloo Kashmiri", type: "veg" }, { name: "Peas Pulao", type: "veg" }, { name: "Mix Veg Raita", type: "veg" }, { name: "Papad", type: "veg" }], 
            Snacks: [{ name: "Veg Momos", type: "veg" }, { name: "Spicy Red Sauce", type: "veg" }], 
            Dinner: [{ name: "Paneer Tikka Masala", type: "special" }, { name: "Butter Naan", type: "veg" }, { name: "Moong Dal", type: "veg" }, { name: "Carrot Halwa", type: "veg" }] 
        },
        "Saturday": { 
            Breakfast: [{ name: "Mixed Veg Paratha", type: "veg" }, { name: "Green Chutney", type: "veg" }, { name: "Masala Tea", type: "veg" }], 
            Lunch: [{ name: "Dal Baati Churma", type: "veg" }, { name: "Gatte ki Sabzi", type: "veg" }, { name: "Lasun Chutney", type: "veg" }], 
            Snacks: [{ name: "Aloo Tikki Chaat", type: "veg" }, { name: "Imli Chutney", type: "veg" }], 
            Dinner: [{ name: "Tawa Veg Masala", type: "veg" }, { name: "Phulka w/ Ghee", type: "veg" }, { name: "Dal Fry", type: "veg" }, { name: "Malpua", type: "veg" }] 
        },
        "Sunday": { 
            Breakfast: [{ name: "Mysore Masala Dosa", type: "veg" }, { name: "Filter Coffee", type: "veg" }, { name: "Fruit Salad", type: "veg" }], 
            Lunch: [{ name: "Navratan Korma", type: "veg" }, { name: "Tandoori Roti", type: "veg" }, { name: "Jeera Rice", type: "veg" }, { name: "Rasmalai", type: "veg" }], 
            Snacks: [{ name: "Pani Puri (6 pcs)", type: "veg" }, { name: "Masala Chai", type: "veg" }], 
            Dinner: [{ name: "Veg Manchurian Gravy", type: "veg" }, { name: "Veg Hakka Noodles", type: "veg" }, { name: "Spring Rolls", type: "veg" }, { name: "Vanilla Ice Cream", type: "veg" }] 
        }
    },
    "NonVeg": {
        "Monday": { 
            Breakfast: [{ name: "Chicken Sausage Omelette", type: "nonveg" }, { name: "Boiled Egg", type: "nonveg" }], 
            Lunch: [{ name: "Andhra Chicken Curry", type: "nonveg" }, { name: "Egg Masala Fry", type: "nonveg" }], 
            Snacks: [{ name: "Egg Puff", type: "nonveg" }], 
            Dinner: [{ name: "Chicken Keema", type: "nonveg" }, { name: "Egg Bhurji", type: "nonveg" }] 
        },
        "Tuesday": { 
            Breakfast: [{ name: "Egg Mayo Sandwich", type: "nonveg" }], 
            Lunch: [{ name: "Goan Fish Fry", type: "nonveg" }, { name: "Chicken Tikka", type: "nonveg" }], 
            Snacks: [{ name: "Chicken Bread Roll", type: "nonveg" }], 
            Dinner: [{ name: "Chilli Chicken Dry", type: "nonveg" }, { name: "Chicken Fried Rice", type: "nonveg" }] 
        },
        "Wednesday": { 
            Breakfast: [{ name: "Masala Omelette", type: "nonveg" }], 
            Lunch: [{ name: "Chicken Dum Biryani", type: "nonveg" }, { name: "Chicken 65", type: "nonveg" }], 
            Snacks: [{ name: "Chicken Poppers", type: "nonveg" }], 
            Dinner: [{ name: "Black Pepper Chicken", type: "nonveg" }, { name: "Egg Fried Rice", type: "nonveg" }] 
        },
        "Thursday": { 
            Breakfast: [{ name: "Egg Dosa", type: "nonveg" }], 
            Lunch: [{ name: "Egg Masala", type: "nonveg" }, { name: "Spicy Chicken Roast", type: "nonveg" }], 
            Snacks: [{ name: "Chicken Tikka (1 pc)", type: "nonveg" }], 
            Dinner: [{ name: "Mutton Rogan Josh", type: "nonveg" }, { name: "Chicken Pulao", type: "nonveg" }] 
        },
        "Friday": { 
            Breakfast: [{ name: "Poached Eggs on Toast", type: "nonveg" }], 
            Lunch: [{ name: "Fish Curry", type: "nonveg" }, { name: "Chicken 65", type: "nonveg" }], 
            Snacks: [{ name: "Chicken Nuggets", type: "nonveg" }], 
            Dinner: [{ name: "Butter Chicken", type: "nonveg" }, { name: "Chicken Korma", type: "nonveg" }] 
        },
        "Saturday": { 
            Breakfast: [{ name: "Egg Bhurji Pao", type: "nonveg" }], 
            Lunch: [{ name: "Prawns Masala Fry", type: "nonveg" }, { name: "Fish Fingers", type: "nonveg" }], 
            Snacks: [{ name: "Chicken Momos", type: "nonveg" }], 
            Dinner: [{ name: "Egg Fried Rice", type: "nonveg" }, { name: "Chicken Manchurian", type: "nonveg" }] 
        },
        "Sunday": { 
            Breakfast: [{ name: "Egg Paratha", type: "nonveg" }], 
            Lunch: [{ name: "Classic Mutton Biryani", type: "nonveg" }, { name: "Chicken 65", type: "nonveg" }], 
            Snacks: [{ name: "Chicken Lollipop", type: "nonveg" }], 
            Dinner: [{ name: "Tandoori Chicken Quarter", type: "nonveg" }, { name: "Chicken Roast", type: "nonveg" }] 
        }
    },
    "Special": {
        "Monday": { 
            Breakfast: [{ name: "Fresh Strawberry Shake", type: "special" }, { name: "Cheese & Mushroom Omelette", type: "special" }], 
            Lunch: [{ name: "Paneer Lababdar", type: "special" }, { name: "Stuffed Butter Naan", type: "special" }, { name: "Dry Fruit Pulao", type: "special" }], 
            Snacks: [{ name: "Red Sauce Penne Pasta", type: "special" }, { name: "Cheese Garlic Bread", type: "special" }], 
            Dinner: [{ name: "Cottage Cheese Steak", type: "special" }, { name: "Creamy Tomato Soup", type: "special" }, { name: "Death by Chocolate Cake", type: "special" }] 
        },
        "Tuesday": { 
            Breakfast: [{ name: "Nutella Waffles", type: "special" }, { name: "Hot Chocolate w/ Marshmallows", type: "special" }], 
            Lunch: [{ name: "Shahi Mushroom Curry", type: "special" }, { name: "Kashmiri Naan", type: "special" }, { name: "Veg Pulao (Premium)", type: "special" }], 
            Snacks: [{ name: "Loaded Cheese Nachos", type: "special" }, { name: "Coke w/ Lemon", type: "special" }], 
            Dinner: [{ name: "Creamy Chicken Alfredo", type: "special" }, { name: "Garlic Toast", type: "special" }, { name: "Blueberry Cheesecake", type: "special" }] 
        },
        "Wednesday": { 
            Breakfast: [{ name: "Avocado & Egg on Sourdough", type: "special" }, { name: "Greek Yogurt w/ Berries", type: "special" }], 
            Lunch: [{ name: "Tandoori Paneer Tikka Masala", type: "special" }, { name: "Garlic Butter Naan", type: "special" }, { name: "Mexican Rice Bowl", type: "special" }], 
            Snacks: [{ name: "Barbecue Chicken Wings", type: "special" }, { name: "Virgin Mojito", type: "special" }], 
            Dinner: [{ name: "Special Lucknawi Mutton Biryani", type: "special" }, { name: "Burani Raita", type: "special" }, { name: "Roasted Papad (Masala)", type: "special" }, { name: "Rabdi w/ Gulab Jamun", type: "special" }] 
        },
        "Thursday": { 
            Breakfast: [{ name: "Classic Benedict Eggs", type: "special" }, { name: "Smoked Salmon (Opt)", type: "special" }, { name: "Fresh Coffee", type: "special" }], 
            Lunch: [{ name: "Malai Kofta (Premium)", type: "special" }, { name: "Missi Roti w/ Ghee", type: "special" }, { name: "Veg Galauti Kebab", type: "special" }], 
            Snacks: [{ name: "Chicken Tikka Pizza Slice", type: "special" }, { name: "Cold Coffee w/ Ice Cream", type: "special" }], 
            Dinner: [{ name: "Teriyaki Chicken Bowl", type: "special" }, { name: "Sticky Rice", type: "special" }, { name: "Miso Soup", type: "special" }, { name: "Matcha Pudding", type: "special" }] 
        },
        "Friday": { 
            Breakfast: [{ name: "English Breakfast Set", type: "special" }, { name: "Baked Beans & Grilled Tomato", type: "special" }], 
            Lunch: [{ name: "Afghani Paneer Gravy", type: "special" }, { name: "Khurmi Naan", type: "special" }, { name: "Dal Maharani", type: "special" }], 
            Snacks: [{ name: "Double Cheese Chicken Burger", type: "special" }, { name: "Crinkle Cut Fries", type: "special" }], 
            Dinner: [{ name: "Chicken Sizzler w/ Veggies", type: "special" }, { name: "Herb Butter Rice", type: "special" }, { name: "Tiramisu", type: "special" }] 
        },
        "Saturday": { 
            Breakfast: [{ name: "Acai Smoothie Bowl", type: "special" }, { name: "Chia Seed Pudding", type: "special" }], 
            Lunch: [{ name: "Italian Vegetable Lasagna", type: "special" }, { name: "Rocket & Pear Salad", type: "special" }, { name: "Garlic Focaccia", type: "special" }], 
            Snacks: [{ name: "Hummus w/ Pita Bread", type: "special" }, { name: "Falafel Balls", type: "special" }], 
            Dinner: [{ name: "Paneer Steak w/ Mushroom Sauce", type: "special" }, { name: "Mashed Potatoes", type: "special" }, { name: "Warm Apple Pie", type: "special" }] 
        },
        "Sunday": { 
            Breakfast: [{ name: "Breakfast Tacos", type: "special" }, { name: "Fresh Mango Juice", type: "special" }], 
            Lunch: [{ name: "Paneer Lababdar (Special)", type: "special" }, { name: "Butter Kulcha", type: "special" }, { name: "Kashmiri Pulao", type: "special" }, { name: "Kulfi w/ Falooda", type: "special" }], 
            Snacks: [{ name: "Gourmet Margherita Pizza", type: "special" }, { name: "Choco Lava Cake", type: "special" }], 
            Dinner: [{ name: "Signature Mutton Biryani", type: "special" }, { name: "Double Ka Meetha", type: "special" }, { name: "Boondi Raita", type: "special" }] 
        }
    }
};

// Meal metadata (colors and images)
const mealConfig = {
    "Breakfast": { color: "#fd7e14", img: "images/breakfast.jpg", emoji: "🍳" },
    "Lunch": { color: "#2f9e44", img: "images/lunch.jpg", emoji: "🍛" },
    "Snacks": { color: "#e67700", img: "images/snacks.jpg", emoji: "🍪" },
    "Dinner": { color: "#3b5bdb", img: "images/dinner.jpg", emoji: "🍲" }
};

const mealTimings = {
    "Breakfast": "07:30 AM - 09:30 AM",
    "Lunch": "12:00 PM - 02:30 PM",
    "Snacks": "04:30 PM - 06:00 PM",
    "Dinner": "07:30 PM - 09:30 PM"
};

const messNames = {
    "Veg": "Vegetarian Mess",
    "NonVeg": "Non-Veg Mess",
    "Special": "Special Mess"
};

const messTypeMeta = {
    "veg": { label: "Veg", className: "item-veg", badgeClass: "bg-success text-white" },
    "nonveg": { label: "Non-Veg", className: "item-nonveg", badgeClass: "bg-danger text-white" },
    "special": { label: "Special", className: "item-special", badgeClass: "bg-warning text-dark" }
};

// UI Toggles
window.changeMessType = function (val) {
    localStorage.setItem('userMessType', val);
    if (document.getElementById('todayMenuContainer')) initTodayMenu();
    if (document.getElementById('weeklyMenuContainer')) loadTabMenu(window.currentWeeklyDay || "Monday");
    if (document.getElementById('dashMessNameBadge')) initDashboard();
}

window.selectDashboardMeal = function (meal) {
    window.currentDashboardMeal = meal;
    const mt = getSelectedMessType();
    const todayName = getTodayName();

    syncDashboardMealButtons(meal);
    renderDashboardSpecial(mt, todayName, meal);
    renderDashboardMealPreview(mt, todayName, meal);
    activateCurrentMeal(meal);
}

window.toggleTheme = function () {
    const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('messTheme', nextTheme);
    applySavedTheme();
}

window.toggleFavoriteFood = function (button) {
    const item = {
        name: button.dataset.foodName,
        type: button.dataset.foodType,
        meal: button.dataset.foodMeal,
        messType: button.dataset.foodMessType
    };
    const favorites = getFavoriteFoods();
    const key = getFavoriteKey(item);
    const exists = favorites.some(food => getFavoriteKey(food) === key);
    const nextFavorites = exists ? favorites.filter(food => getFavoriteKey(food) !== key) : [...favorites, item];

    setFavoriteFoods(nextFavorites);
    refreshFavoriteButtons();
    renderFavoritesPage();
}

window.removeFavoriteFood = function (key) {
    setFavoriteFoods(getFavoriteFoods().filter(food => getFavoriteKey(food) !== key));
    refreshFavoriteButtons();
    renderFavoritesPage();
}

function syncMessToggle(val) {
    const radio = document.getElementById("mess" + val);
    if (radio) radio.checked = true;
}

// Global UI renderer for menus
function renderMenu(dayData, containerId, messType) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!dayData) {
        container.innerHTML = "<div class='col-12'><div class='alert alert-danger'>Menu not currently available.</div></div>";
        return;
    }

    ["Breakfast", "Lunch", "Snacks", "Dinner"].forEach(meal => {
        const allItems = dayData[meal] || [];
        const items = allItems;
        
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-3';

        let listHtml = '<ul class="menu-list">';
        if (items.length === 0) {
            listHtml += '<li class="text-muted small">No ' + messType + ' items listed for this meal</li>';
        } else {
            items.forEach(item => {
                listHtml += `<li class="${getItemClass(item.type)}"><span class="item-name">${item.name}</span><span class="menu-actions">${getBadgeHtml(item.type)}${getFavoriteButtonHtml(item, meal, messType)}</span></li>`;
            });
        }
        listHtml += '</ul>';

        const config = mealConfig[meal];
        const backgroundStyle = `background-image: url('${config.img}');`;

        col.innerHTML = `
            <div class="card menu-card">
                <div class="meal-title-card" style="${backgroundStyle}">
                    <h3>${meal}</h3>
                    <span class="badge bg-white text-dark shadow-sm">🕰️ ${mealTimings[meal]}</span>
                </div>
                ${listHtml}
            </div>
        `;
        const timeBadge = col.querySelector('.meal-title-card .badge');
        if (timeBadge) timeBadge.innerText = `Time: ${mealTimings[meal]}`;
        container.appendChild(col);
    });
}

function getLegacyBadgeHtml(type) {
    if (type === 'nonveg') return '<span class="badge bg-danger text-white">Non-Veg</span>';
    if (type === 'special') return '<span class="badge bg-warning text-dark">⭐ Special</span>';
    return '';
}

function getItemClass(type) {
    return messTypeMeta[type]?.className || "item-veg";
}

function getBadgeHtml(type) {
    const meta = messTypeMeta[type] || messTypeMeta.veg;
    return `<span class="badge ${meta.badgeClass}">${meta.label}</span>`;
}

function getFavoriteButtonHtml(item, meal, messType) {
    const favoriteItem = { name: item.name, type: item.type, meal, messType };
    const isFavorite = isFavoriteFood(favoriteItem);
    const title = isFavorite ? 'Remove from favorites' : 'Add to favorites';

    return `
        <button type="button"
            class="favorite-btn ${isFavorite ? 'active' : ''}"
            title="${title}"
            aria-label="${title}"
            data-food-name="${escapeAttr(item.name)}"
            data-food-type="${escapeAttr(item.type)}"
            data-food-meal="${escapeAttr(meal)}"
            data-food-mess-type="${escapeAttr(messType)}"
            onclick="toggleFavoriteFood(this)">&#9733;</button>
    `;
}

function initTodayMenu() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date();
    const dayName = days[today.getDay()];

    const display = document.getElementById('todayDateDisplay');
    if (display) {
        display.innerText = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    const mt = localStorage.getItem('userMessType') || "Veg";
    renderMenu(messMenu[mt][dayName], 'todayMenuContainer', mt);
}

window.loadTabMenu = function (day, btnObj) {
    window.currentWeeklyDay = day;

    if (btnObj) {
        document.querySelectorAll('#dayTabs .nav-link').forEach(btn => btn.classList.remove('active'));
        btnObj.classList.add('active');
    } else {
        const targetBtn = document.querySelector(`#dayTabs button[data-day="${day}"]`);
        if (targetBtn) targetBtn.classList.add('active');
    }

    const title = document.getElementById('weeklyMenuTitle');
    if (title) title.innerText = `Menu for ${day}`;

    const mt = localStorage.getItem('userMessType') || "Veg";
    renderMenu(messMenu[mt][day], 'weeklyMenuContainer', mt);
}

function getTodayName() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
}

function getSelectedMessType() {
    return localStorage.getItem('userMessType') || "Veg";
}

function initDashboard() {
    const mt = getSelectedMessType();
    const todayName = getTodayName();
    const selectedMeal = window.currentDashboardMeal || getCurrentMealName();
    const badge = document.getElementById('dashMessNameBadge');
    const heading = document.querySelector('.dash-header h1');
    const greeting = document.getElementById('dashboardGreeting');

    if (badge) badge.innerText = messNames[mt];
    if (heading) heading.innerText = `${todayName} Summary`;
    if (greeting) greeting.innerText = getCurrentUserName() ? `Welcome, ${getCurrentUserName()}.` : 'Welcome back.';

    syncDashboardMessButtons(mt);
    syncDashboardMealButtons(selectedMeal);
    renderDashboardSpecial(mt, todayName, selectedMeal);
    renderDashboardSneakPeek(mt);
    renderDashboardMealPreview(mt, todayName, selectedMeal);
    renderDashboardDetailMenu(mt, todayName);
    activateCurrentMeal(selectedMeal);
}

function syncDashboardMessButtons(mt) {
    document.querySelectorAll('.dashboard-mess-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.messType === mt);
    });
}

function syncDashboardMealButtons(selectedMeal) {
    document.querySelectorAll('[data-dashboard-meal]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.dashboardMeal === selectedMeal);
    });
}

function renderDashboardSpecial(mt, dayName, selectedMeal) {
    const dayData = messMenu[mt]?.[dayName];
    const title = document.getElementById('todaySpecial');
    const description = document.getElementById('specialDescription');
    if (!dayData || !title || !description) return;

    const featuredMeal = selectedMeal || getCurrentMealName();
    const items = dayData[featuredMeal] || [];
    const featuredItem = items.find(item => item.type === "special") || items[0];

    title.innerText = featuredItem ? featuredItem.name : "Menu coming soon";
    description.innerText = featuredItem ? `${messNames[mt]} - ${featuredMeal}` : "Check back later for today's update.";
}

function renderDashboardSneakPeek(mt) {
    const body = document.getElementById('sneakPeekBody');
    if (!body) return;

    const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    body.innerHTML = dayOrder.map(day => {
        const dayData = messMenu[mt]?.[day];
        return `
            <tr class="border-bottom">
                <td class="fw-bold py-3 text-primary">${day.slice(0, 3).toUpperCase()}</td>
                <td class="small">${formatPreviewItems(dayData?.Breakfast)}</td>
                <td class="small">${formatPreviewItems(dayData?.Lunch)}</td>
                <td class="small text-end px-0">${formatPreviewItems(dayData?.Dinner)}</td>
            </tr>
        `;
    }).join('');
}

function formatPreviewItems(items = []) {
    if (!items.length) return '<span class="text-muted">Not listed</span>';

    return items.slice(0, 2).map(item => `
        <span class="sneak-item ${getItemClass(item.type)}">
            <span>${item.name}</span>
            ${getBadgeHtml(item.type)}
        </span>
    `).join('');
}

function renderDashboardMealPreview(mt, dayName, selectedMeal) {
    const container = document.getElementById('dashboardMealPreview');
    if (!container) return;

    const items = messMenu[mt]?.[dayName]?.[selectedMeal] || [];
    const listHtml = items.length
        ? items.map(item => `<li class="${getItemClass(item.type)}"><span class="item-name">${item.name}</span><span class="menu-actions">${getBadgeHtml(item.type)}${getFavoriteButtonHtml(item, selectedMeal, mt)}</span></li>`).join('')
        : '<li class="text-muted small">No items listed for this meal.</li>';

    container.innerHTML = `
        <div class="dashboard-meal-preview">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong class="small">${selectedMeal} Menu</strong>
                <span class="badge bg-light text-dark">${mealTimings[selectedMeal]}</span>
            </div>
            <ul class="menu-list compact-menu-list">${listHtml}</ul>
        </div>
    `;
}

function renderDashboardDetailMenu(mt, dayName) {
    const container = document.getElementById('completeMenuContainer');
    if (!container) return;

    container.innerHTML = '<div id="dashboardDetailMenu" class="row g-4"></div>';
    renderMenu(messMenu[mt]?.[dayName], 'dashboardDetailMenu', mt);
}

function getCurrentUserName() {
    return localStorage.getItem('currentUserName') || '';
}

function getMealRanges() {
    return {
        "Breakfast": [7, 9.5],
        "Lunch": [12, 14.5],
        "Snacks": [16.5, 18],
        "Dinner": [19, 21.5]
    };
}

function getCurrentMealName() {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const ranges = getMealRanges();
    const activeMeal = Object.entries(ranges).find(([, [start, end]]) => currentHour >= start && currentHour <= end);

    if (activeMeal) return activeMeal[0];
    if (currentHour < ranges.Breakfast[0]) return "Breakfast";
    if (currentHour < ranges.Lunch[0]) return "Lunch";
    if (currentHour < ranges.Snacks[0]) return "Snacks";
    if (currentHour < ranges.Dinner[0]) return "Dinner";
    return "Breakfast";
}

function activateCurrentMeal(selectedMeal) {
    const currentMeal = getCurrentMealName();

    document.querySelectorAll('[data-dashboard-meal]').forEach(el => {
        const meal = el.dataset.dashboardMeal;
        el.classList.toggle('active', meal === selectedMeal);
        el.classList.toggle('current-meal', meal === currentMeal);
    });
}
