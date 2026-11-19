/**
 * Smart College Queue Management System
 * app.js - Universal Application Logic, Authentication Guards, UI Modals, Toast, and Global Nav
 */

document.addEventListener('DOMContentLoaded', () => {
    // Ensure storage is initialized
    if (typeof SCQStorage !== 'undefined') {
        SCQStorage.init();
    }

    checkAuthGuards();
    initNavbar();
    initNotificationBadges();
    initTokenModal();
    initUserProfileUI();
});

/**
 * Normalized page name helper (handles both file.html and clean URLs like /login, /admin, /)
 */
function getNormalizedPageName() {
    let p = (window.location.pathname.split('/').pop() || '').toLowerCase();
    if (!p || p === 'index' || p === 'index.html') return 'index.html';
    if (p === 'login' || p === 'login.html') return 'login.html';
    if (p === 'admin' || p === 'admin.html') return 'admin.html';
    if (!p.endsWith('.html')) return p + '.html';
    return p;
}

/**
 * 0. Authentication Guard & Strict Role Enforcement
 */
function checkAuthGuards() {
    if (typeof SCQStorage === 'undefined') return;
    const currentPath = getNormalizedPageName();
    if (currentPath === 'login.html') return; // Allow login page

    const currentUser = SCQStorage.getCurrentUser();
    if (!currentUser) {
        // Redirect to login if unauthenticated
        window.location.replace('login.html');
        return;
    }

    // Strict Role Separation:
    // 1. Admin CANNOT go to student portal pages
    if (currentUser.role === 'admin' && currentPath !== 'admin.html') {
        window.location.replace('admin.html');
        return;
    }

    // 2. Student CANNOT go to admin portal
    if (currentUser.role !== 'admin' && currentPath === 'admin.html') {
        window.location.replace('index.html');
        return;
    }
}

/**
 * 1. Navigation & Mobile Drawer
 */
function initNavbar() {
    const mobileToggle = document.getElementById('mobileNavToggle');
    const mainNav = document.getElementById('mainNav');

    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const isOpen = mainNav.classList.contains('open');
            mobileToggle.setAttribute('aria-expanded', isOpen);
        });
    }

    // Highlight current page link
    const currentPath = getNormalizedPageName();
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        let href = (link.getAttribute('href') || '').split('/').pop().toLowerCase();
        if (href && !href.endsWith('.html') && !href.startsWith('#')) href += '.html';
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Logout action handlers
    const logoutBtns = document.querySelectorAll('[data-action-logout]');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            SCQStorage.logout();
        });
    });
}

/**
 * 2. Header Notification Badges
 */
function initNotificationBadges() {
    if (typeof SCQStorage === 'undefined') return;
    const unreadCount = SCQStorage.getUnreadNotificationsCount();
    const badges = document.querySelectorAll('.unread-count-badge');
    badges.forEach(b => {
        if (unreadCount > 0) {
            b.textContent = unreadCount;
            b.style.display = 'inline-block';
        } else {
            b.style.display = 'none';
        }
    });
}

/**
 * 3. User Profile Info in Header & Meta
 */
function initUserProfileUI() {
    if (typeof SCQStorage === 'undefined') return;
    const user = SCQStorage.getCurrentUser();
    if (!user) return;

    const nameElements = document.querySelectorAll('.display-student-name');
    nameElements.forEach(el => el.textContent = user.name);

    const idElements = document.querySelectorAll('.display-student-id');
    idElements.forEach(el => el.textContent = user.enrollmentNo || user.id || 'SCQ-2024');

    const avatarElements = document.querySelectorAll('.display-student-avatar');
    avatarElements.forEach(el => el.textContent = user.avatar || (user.name ? user.name.substring(0, 2).toUpperCase() : 'ST'));
}

/**
 * 4. Digital Token Generation Modal Controller
 */
function initTokenModal() {
    const modal = document.getElementById('tokenModal');
    const openBtns = document.querySelectorAll('[data-open-token-modal]');
    const closeBtns = document.querySelectorAll('[data-close-token-modal]');
    const form = document.getElementById('tokenGenerateForm');

    if (!modal) return;

    // Open handlers
    openBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const preselectedService = btn.getAttribute('data-service-id');
            openTokenModal(preselectedService);
        });
    });

    // Close handlers
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeTokenModal();
        });
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeTokenModal();
        }
    });

    // Handle form submit
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleTokenSubmission();
        });
    }
}

function openTokenModal(preselectedServiceId = null) {
    const modal = document.getElementById('tokenModal');
    const serviceSelect = document.getElementById('modalServiceSelect');
    const modalAlert = document.getElementById('modalAlertBox');

    if (!modal) return;

    if (modalAlert) {
        modalAlert.style.display = 'none';
        modalAlert.textContent = '';
    }

    // Populate service options dynamically
    if (serviceSelect && typeof SCQStorage !== 'undefined') {
        const services = SCQStorage.getServices();
        serviceSelect.innerHTML = '<option value="">-- Choose an Administrative Service --</option>';
        services.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.location.split('-')[0].trim()})`;
            if (preselectedServiceId && s.id === preselectedServiceId) {
                opt.selected = true;
            }
            serviceSelect.appendChild(opt);
        });
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeTokenModal() {
    const modal = document.getElementById('tokenModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function handleTokenSubmission() {
    const serviceSelect = document.getElementById('modalServiceSelect');
    const categorySelect = document.getElementById('modalCategoryInput');
    const noteInput = document.getElementById('modalNoteInput');
    const modalAlert = document.getElementById('modalAlertBox');

    const serviceId = serviceSelect ? serviceSelect.value : '';
    const category = categorySelect ? categorySelect.value : '';
    const note = noteInput ? noteInput.value.trim() : '';

    if (!serviceId) {
        showModalError('Please select a valid administrative service to proceed.');
        return;
    }

    try {
        const student = SCQStorage.getStudent();
        const newToken = SCQStorage.generateToken(serviceId, category, note, student);
        closeTokenModal();
        showToast(`Token #${newToken.tokenCode} generated successfully!`, 'success');

        setTimeout(() => {
            window.location.href = `queue.html?token=${newToken.id}`;
        }, 600);

    } catch (err) {
        showModalError(err.message || 'Unable to generate token at this time.');
    }
}

function showModalError(msg) {
    const modalAlert = document.getElementById('modalAlertBox');
    if (modalAlert) {
        modalAlert.textContent = msg;
        modalAlert.style.display = 'block';
    } else {
        alert(msg);
    }
}

/**
 * 5. Toast Notification System
 */
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : (type === 'success' ? 'toast-success' : '')}`;
    
    let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    if (type === 'success') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    }

    toast.innerHTML = `<span>${iconSvg}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/**
 * Helper: Format date
 */
function formatTimeAgo(isoString) {
    if (!isoString) return '--';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
