// ============================================================
//  X-PERT Detailing | Booking Dashboard — app.js
// ============================================================

// ------------------------------------------------------------------
// 1. Lucide Icons (CDN loader — injected before DOM is ready)
// ------------------------------------------------------------------
(function loadLucide() {
    if (document.querySelector('script[src*="lucide"]')) return;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
    s.onload = () => typeof lucide !== 'undefined' && lucide.createIcons();
    document.head.appendChild(s);
})();

// ------------------------------------------------------------------
// 2. App State
// ------------------------------------------------------------------
const STATE = {
    currentPage: 'dashboard',
    currentUser: null,
    vehicles: [
        { no: 1, id: 'VH001001', model: 'Toyota Camry', phone: '0123456787', progress: 'in-progress', datetime: '19/01/2026 , 10:00:00 am' },
        { no: 2, id: 'VH000890', model: 'Toyota Camry', phone: '0123456787', progress: 'completed', datetime: '10/01/2026 , 09:30:00 am' },
        { no: 3, id: 'VH000875', model: 'Toyota Camry', phone: '0123456787', progress: 'completed', datetime: '28/12/2025 , 11:00:00 am' },
        { no: 4, id: 'VH000860', model: 'Honda Civic', phone: '0198765432', progress: 'pending', datetime: '15/12/2025 , 02:00:00 pm' },
        { no: 5, id: 'VH000845', model: 'BMW M4', phone: '0112233445', progress: 'completed', datetime: '02/12/2025 , 09:00:00 am' },
    ],
    editingVehicleId: null,
};

// ------------------------------------------------------------------
// 3. Auth — Credentials (demo)
// ------------------------------------------------------------------
const USERS = [
    { email: 'admin@xpertdetailing.com', password: 'admin123', role: 'staff', name: 'Ab Rahman bin Ahmat' },
    { email: 'customer@gmail.com', password: 'cust123', role: 'customer', name: 'Mike Davis' },
];

// ------------------------------------------------------------------
// 4. Utility helpers
// ------------------------------------------------------------------
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        Object.assign(toast.style, {
            position: 'fixed', top: '2rem', left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.85rem 1.4rem', borderRadius: '10px',
            fontWeight: '600', fontSize: '0.9rem',
            zIndex: '9999', opacity: '0',
            transition: 'opacity 0.3s ease',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        });
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.background = type === 'success' ? 'rgba(57,255,20,0.15)' : 'rgba(255,0,60,0.15)';
    toast.style.color = type === 'success' ? '#39ff14' : '#ff003c';
    toast.style.border = `1px solid ${type === 'success' ? '#39ff14' : '#ff003c'}`;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function renderIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ------------------------------------------------------------------
// 5. View switcher
// ------------------------------------------------------------------
function showView(viewId) {
    $$('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    const target = document.getElementById(viewId);
    if (target) {
        target.style.display = (viewId === 'app-view' || viewId === 'auth-view') ? 'flex' : 'block';
        target.classList.add('active');
        renderIcons();
    }
}

// ------------------------------------------------------------------
// 6. Role Permissions
// ------------------------------------------------------------------
function applyRolePermissions() {
    const role = STATE.currentUser.role;

    // Update sidebar profile
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    if (nameEl) nameEl.textContent = STATE.currentUser.name || 'User';
    if (roleEl) roleEl.textContent = STATE.currentUser.email || role;

    // Update navbar profile icon
    const avatarImg = document.querySelector('.user-profile-menu .avatar');
    if (avatarImg && STATE.currentUser.name) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(STATE.currentUser.name)}&background=0D8BFF&color=fff`;
        avatarImg.alt = STATE.currentUser.name;
    }

    // Staff-only menu items
    document.querySelectorAll('.role-staff').forEach(el => {
        el.style.display = role === 'customer' ? 'none' : '';
    });

    // Customer-only menu items
    document.querySelectorAll('.role-customer').forEach(el => {
        el.style.display = role === 'staff' ? 'none' : '';
    });

    // Hide New Vehicle button for staff
    if (role === 'staff') {
        const newBtn = document.getElementById('vm-new-btn');
        if (newBtn) newBtn.style.display = 'none';
    }

    // Welcome banner — show for customers only
    const banner = document.getElementById('welcome-banner');
    const wname = document.getElementById('welcome-name');
    if (banner) {
        if (role === 'customer') {
            banner.style.display = 'block';
            if (wname) wname.textContent = 'Welcome, ' + (STATE.currentUser.name || 'Guest') + '!';
        } else {
            banner.style.display = 'none';
        }
    }

    renderDashboardByRole();
}

// ------------------------------------------------------------------
// 6b. Render dashboard content based on role
// ------------------------------------------------------------------
function renderDashboardByRole() {
    const staffDash = document.getElementById('staff-dashboard');
    const custDash = document.getElementById('customer-dashboard');
    if (!staffDash && !custDash) return; // elements not on this page

    const role = STATE.currentUser ? STATE.currentUser.role : 'staff';
    if (staffDash) staffDash.style.display = role === 'customer' ? 'none' : 'block';
    if (custDash) custDash.style.display = role === 'customer' ? 'block' : 'none';
}

// ------------------------------------------------------------------
// 7. Login / Logout
// ------------------------------------------------------------------
function initAuth() {
    const form = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = form.querySelector('button[type="submit"]');

            const user = USERS.find(u => u.email === email && u.password === password);
            if (user) {
                STATE.currentUser = user;
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                btn.textContent = 'Signing in…';
                btn.disabled = true;
                setTimeout(() => {
                    applyRolePermissions();
                    showView('app-view');
                    navigateTo('dashboard');
                    btn.textContent = 'Sign In';
                    btn.disabled = false;
                    form.reset();
                    showToast('Signed in successfully.');
                }, 800);
            } else {
                showToast('Invalid email or password.', 'error');
                document.getElementById('password').value = '';
            }
        });
    }

    // FIX: logoutBtn is now correctly outside the form block
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            STATE.currentUser = null;
            sessionStorage.removeItem('currentUser');
            const targetPage =
                window.location.hash.replace('#', '');

            if (targetPage) {
                showView('app-view');
                navigateTo(targetPage);
            } else {
                showView('auth-view');
            }
            showToast('Signed out successfully.');
        });
    }
}

// ------------------------------------------------------------------
// 8. Sidebar Navigation & Page Routing
// ------------------------------------------------------------------
const PAGE_TITLES = {
    dashboard: 'Dashboard',
    profile: 'Profile',
    booking: 'Booking',
    package: 'Package',
    vehicle: 'Vehicle Management',
    report: 'Report',
    invoice: 'Invoice',
};

const DEDICATED_PAGES = ['dashboard', 'vehicle'];

function navigateTo(target) {
    STATE.currentPage = target;

    $$('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.target === target);
    });

    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = PAGE_TITLES[target] || target;

    $$('.page').forEach(p => p.classList.remove('active'));

    if (DEDICATED_PAGES.includes(target)) {
        const page = document.getElementById(`page-${target}`);
        if (page) page.classList.add('active');
    } else {
        const placeholder = document.getElementById('page-placeholder');
        const placeholderTitle = document.getElementById('placeholder-title');
        if (placeholder) placeholder.classList.add('active');
        if (placeholderTitle) placeholderTitle.textContent = PAGE_TITLES[target] || target;
    }

    renderIcons();
}

function initNavigation() {
    $$('.nav-item[data-target]').forEach(item => {
        item.addEventListener('click', e => {
            if (item.dataset.target === 'vehicle') return; // let browser navigate
            e.preventDefault();
            navigateTo(item.dataset.target);
            closeMobileSidebar();
        });
    });
}

// ------------------------------------------------------------------
// 9. Mobile Sidebar Toggle
// ------------------------------------------------------------------
function initMobileSidebar() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (!menuBtn || !sidebar) return;

    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });

    document.addEventListener('click', e => {
        if (sidebar.classList.contains('mobile-open') &&
            !sidebar.contains(e.target) &&
            e.target !== menuBtn) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

// FIX: applyRolePermissions is no longer accidentally nested inside here
function closeMobileSidebar() {
    document.querySelector('.sidebar')?.classList.remove('mobile-open');
}

// ------------------------------------------------------------------
// 10. Vehicle Management
// ------------------------------------------------------------------

const savedVehicles = sessionStorage.getItem('vehicles');
if (savedVehicles) {
    STATE.vehicles = JSON.parse(savedVehicles);
} else {
    STATE.vehicles = [
        {
            no: 1,
            id: 'PPD5449',
            model: 'Toyota Camry',
            year: '2020'
        },
        {
            no: 2,
            id: 'JQW8891',
            model: 'Honda Civic',
            year: '2022'
        }
    ];
}

function renderVehicleTable(list = STATE.vehicles) {
    const tbody = document.getElementById('vm-tbody');

    if (!tbody) return;

    if (!list.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:2rem">
                    No vehicles found.
                </td>
            </tr>
        `;
        return;
    }

    const isStaff = STATE.currentUser?.role === 'staff';

    tbody.innerHTML = list.map((vehicle, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${vehicle.id}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.year}</td>
            <td class="vm-actions">

                <button
                    class="vm-btn-view"
                    data-action="view"
                    data-id="${vehicle.id}">
                    View
                </button>
                ${!isStaff ? `
                <button
                    class="vm-btn-icon"
                    data-action="edit"
                    data-id="${vehicle.id}">
                    <i data-lucide="pencil"></i>
                </button>
                ` : ''}

                <button
                    class="vm-btn-delete"
                    data-action="delete"
                    data-id="${vehicle.id}">
                    Delete
                </button>

            </td>
        </tr>
    `).join('');

    renderIcons();

    tbody.querySelectorAll('[data-action]').forEach(btn => {

        btn.addEventListener('click', () => {

            const action = btn.dataset.action;
            const id = btn.dataset.id;

            if (action === 'view') {
                viewVehicle(id);
            }

            if (action === 'edit') {
                openVehicleModal('edit', id);
            }

            if (action === 'delete') {
                openDeleteModal(id);
            }

        });

    });
}

function createVehicleModal() {

    if (document.getElementById('vehicle-modal')) return;

    const modal = document.createElement('div');

    modal.id = 'vehicle-modal';

    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.7);
        display:none;
        align-items:center;
        justify-content:center;
        z-index:9999;
    `;

    modal.innerHTML = `
        <div class="glass-panel"
            style="
                width:min(500px,90vw);
                padding:2rem;
                border-radius:16px;
            ">

            <h2 id="vehicle-modal-title"
                style="margin-bottom:1.5rem">
            </h2>

            <div class="form-group">
                <label>Plate Number</label>

                <input
                    type="text"
                    id="vm-plate"
                    class="vm-inline-input">
            </div>

            <div class="form-group">
                <label>Vehicle Model</label>

                <input
                    type="text"
                    id="vm-model"
                    class="vm-inline-input">
            </div>

            <div class="form-group">
                <label>Year Model</label>

                <input
                    type="text"
                    id="vm-year"
                    class="vm-inline-input">
            </div>

            <div
                style="
                    display:flex;
                    justify-content:flex-end;
                    gap:1rem;
                    margin-top:2rem;
                ">

                <button
                    id="vm-cancel-btn"
                    class="btn">
                    Cancel
                </button>

                <button
                    id="vm-save-btn"
                    class="btn btn-primary">
                    Confirm
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', e => {

        if (e.target === modal) {
            closeVehicleModal();
        }

    });

    document
        .getElementById('vm-cancel-btn')
        .addEventListener('click', closeVehicleModal);

    document
        .getElementById('vm-save-btn')
        .addEventListener('click', saveVehicle);
}

function openVehicleModal(mode, vehicleId = null) {

    createVehicleModal();

    const modal = document.getElementById('vehicle-modal');

    modal.style.display = 'flex';

    modal.dataset.mode = mode;
    modal.dataset.id = vehicleId || '';

    const title = document.getElementById('vehicle-modal-title');

    const plate = document.getElementById('vm-plate');
    const model = document.getElementById('vm-model');
    const year = document.getElementById('vm-year');

    plate.disabled = false;

    if (mode === 'add') {

        title.textContent = 'Add Vehicle';

        plate.value = '';
        model.value = '';
        year.value = '';

    }

    if (mode === 'edit') {

        title.textContent = 'Edit Vehicle';

        const vehicle = STATE.vehicles.find(v => v.id === vehicleId);

        plate.value = vehicle.id;
        model.value = vehicle.model;
        year.value = vehicle.year;

        plate.disabled = false;

    }

}

function closeVehicleModal() {

    const modal = document.getElementById('vehicle-modal');

    if (modal) {
        modal.style.display = 'none';
    }

}

function saveVehicle() {

    const modal = document.getElementById('vehicle-modal');

    const mode = modal.dataset.mode;

    const plate = document.getElementById('vm-plate').value.trim();
    const model = document.getElementById('vm-model').value.trim();
    const year = document.getElementById('vm-year').value.trim();

    if (!plate || !model || !year) {

        showToast('Please fill all fields.', 'error');

        return;
    }

    if (mode === 'add') {

        const exists = STATE.vehicles.find(v => v.id === plate);

        if (exists) {

            showToast('Plate number already exists.', 'error');

            return;
        }

        STATE.vehicles.push({
            no: STATE.vehicles.length + 1,
            id: plate,
            model,
            year
        });

        showToast('Vehicle added successfully.');

    }

    if (mode === 'edit') {

        const originalId = modal.dataset.id;

        const existingVehicle = STATE.vehicles.find(
            v => v.id === originalId
        );

        const duplicateVehicle = STATE.vehicles.find(
            v => v.id === plate && v.id !== originalId
        );

        if (duplicateVehicle) {

            showToast(
                'Plate number already exists.',
                'error'
            );

            return;
        }

        if (existingVehicle) {

            existingVehicle.id = plate;
            existingVehicle.model = model;
            existingVehicle.year = year;

            showToast(
                'Vehicle updated successfully.'
            );

        }

    }

    renderVehicleTable();

    sessionStorage.setItem('vehicles', JSON.stringify(STATE.vehicles));

    closeVehicleModal();
}

function viewVehicle(id) {

    const vehicle = STATE.vehicles.find(v => v.id === id);

    if (!vehicle) return;

    const popup = document.createElement('div');

    popup.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.7);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:9999;
    `;

    popup.innerHTML = `
        <div class="glass-panel"
            style="
                width:min(450px,90vw);
                padding:2rem;
                border-radius:16px;
            ">

            <h2 style="margin-bottom:1.5rem">
                Vehicle Details
            </h2>

            <div style="margin-bottom:1rem">
                <strong>Plate Number:</strong>
                <p>${vehicle.id}</p>
            </div>

            <div style="margin-bottom:1rem">
                <strong>Model:</strong>
                <p>${vehicle.model}</p>
            </div>

            <div style="margin-bottom:1rem">
                <strong>Year Model:</strong>
                <p>${vehicle.year}</p>
            </div>

            <button
                id="close-view-popup"
                class="btn btn-primary"
                style="margin-top:1rem">
                Close
            </button>

        </div>
    `;

    document.body.appendChild(popup);

    document
        .getElementById('close-view-popup')
        .addEventListener('click', () => {
            popup.remove();
        });

    popup.addEventListener('click', e => {

        if (e.target === popup) {
            popup.remove();
        }

    });
}

function openDeleteModal(id) {

    const vehicle = STATE.vehicles.find(v => v.id === id);

    if (!vehicle) return;

    const popup = document.createElement('div');

    popup.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.7);
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:9999;
    `;

    popup.innerHTML = `
        <div class="glass-panel"
            style="
                width:min(400px,90vw);
                padding:2rem;
                border-radius:16px;
                text-align:center;
            ">

            <h2 style="margin-bottom:1rem">
                Delete Vehicle
            </h2>

            <p style="margin-bottom:2rem">
                Are you sure you want to delete
                <strong>${vehicle.id}</strong>?
            </p>

            <div
                style="
                    display:flex;
                    justify-content:center;
                    gap:1rem;
                ">

                <button
                    id="delete-cancel-btn"
                    class="btn">
                    Cancel
                </button>

                <button
                    id="delete-confirm-btn"
                    class="btn btn-primary">
                    Confirm
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(popup);

    document
        .getElementById('delete-cancel-btn')
        .addEventListener('click', () => {
            popup.remove();
        });

    document
        .getElementById('delete-confirm-btn')
        .addEventListener('click', () => {

            STATE.vehicles = STATE.vehicles.filter(v => v.id !== id);

            sessionStorage.setItem('vehicles', JSON.stringify(STATE.vehicles));

            renderVehicleTable();

            popup.remove();

            showToast('Vehicle deleted successfully.');

        });

    popup.addEventListener('click', e => {

        if (e.target === popup) {
            popup.remove();
        }

    });
}

function filterVehicles(query) {

    const q = query.toLowerCase();

    return STATE.vehicles.filter(vehicle =>
        vehicle.id.toLowerCase().includes(q) ||
        vehicle.model.toLowerCase().includes(q) ||
        vehicle.year.toLowerCase().includes(q)
    );
}

function initVehicleSearch() {

    const topSearch =
        document.getElementById('vm-top-search');

    const inlineSearch =
        document.getElementById('vm-inline-search');

    function handleSearch(e) {

        const results =
            filterVehicles(e.target.value);

        renderVehicleTable(results);

    }

    topSearch?.addEventListener('input', handleSearch);

    inlineSearch?.addEventListener('input', handleSearch);
}

function initVehicleManagement() {

    renderVehicleTable();

    initVehicleSearch();

    document
        .getElementById('vm-new-btn')
        ?.addEventListener('click', () => {

            openVehicleModal('add');

        });
}

// ------------------------------------------------------------------
// 11. Dashboard by Role
// ------------------------------------------------------------------
function renderDashboardByRole() {
    const dashboard = document.getElementById('page-dashboard');
    if (!dashboard || !STATE.currentUser) return;

    if (STATE.currentUser.role === 'customer') {
        const customerName = STATE.currentUser.name || 'Guest';
        dashboard.innerHTML = `
            <div id="welcome-banner" style="background:linear-gradient(135deg,#0e4b5c,#1aa3bd); border-radius:16px; padding:1.25rem 1.5rem; margin-bottom:1.5rem; color:#fff;">
                <p style="font-size:.8rem;opacity:.85;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Welcome back 👋</p>
                <h2 id="welcome-name" style="font-size:1.5rem;font-weight:700;margin:0;">Welcome, ${customerName}!</h2>
                <p style="font-size:.875rem;opacity:.8;margin-top:4px;">What should we do today?</p>
            </div>
            <div class="glass-panel" style="padding:2rem">
                <h2 style="margin-bottom:1.5rem">My Recent Services</h2>
                <div class="table-responsive">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Package</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>BMW M4</td>
                                <td>Ceramic Coating</td>
                                <td><span class="status-badge completed">Completed</span></td>
                                <td>01/05/2026</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        // Staff dashboard stays as-is from the HTML
    }

    renderIcons();
}

// ------------------------------------------------------------------
// 12. Topbar Search
// ------------------------------------------------------------------
function initTopbarSearch() {
    const input = $('.topbar .search-bar input');
    if (!input) return;
    input.addEventListener('input', e => {
        const q = e.target.value.toLowerCase().trim();
        $$('#page-dashboard tbody tr').forEach(row => {
            row.style.display = q === '' || row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
}

// ------------------------------------------------------------------
// 13. Notifications
// ------------------------------------------------------------------
function initNotifications() {
    const bellBtn = $('.topbar .icon-btn .badge')?.closest('button');
    if (!bellBtn) return;
    bellBtn.addEventListener('click', () => {
        const badge = bellBtn.querySelector('.badge');
        if (badge) {
            badge.style.display = badge.style.display === 'none' ? '' : 'none';
            showToast('Notifications cleared.');
        }
    });
}

// ------------------------------------------------------------------
// 14. Bootstrap
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    function init() {
        renderIcons();
        initAuth();
        initNavigation();
        initMobileSidebar();
        initVehicleManagement();
        initTopbarSearch();
        initNotifications();

        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
            STATE.currentUser = JSON.parse(savedUser);
            applyRolePermissions();
            showView('app-view');
            const hashTarget = window.location.hash.replace('#', '');
            navigateTo(hashTarget || (STATE.currentUser.role === 'customer' ? 'booking' : 'dashboard'));
        } else {
            showView('auth-view');
        }
    }

    if (typeof lucide !== 'undefined') {
        init();
    } else {
        const check = setInterval(() => {
            if (typeof lucide !== 'undefined') {
                clearInterval(check);
                init();
            }
        }, 50);
        setTimeout(() => { clearInterval(check); init(); }, 1500);
    }
});