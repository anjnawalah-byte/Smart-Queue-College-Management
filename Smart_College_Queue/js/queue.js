/**
 * Smart College Queue Management System
 * queue.js - Real-time Queue Tracking, Turn Approaching Detection, and Dynamic Wait Calculation
 */

document.addEventListener('DOMContentLoaded', () => {
    initQueuePage();
});

let currentTrackingToken = null;

function initQueuePage() {
    // 1. Determine which token to display:
    // Look in URL param: ?token=<id>
    const urlParams = new URLSearchParams(window.location.search);
    const tokenIdParam = urlParams.get('token');

    const allTokens = SCQStorage.getTokens();
    const student = SCQStorage.getStudent();
    const studentTokens = allTokens.filter(t => t.studentId === student.id);
    const studentActiveTokens = studentTokens.filter(t => t.status === 'Waiting' || t.status === 'Almost Your Turn' || t.status === 'Being Served');

    if (tokenIdParam) {
        currentTrackingToken = SCQStorage.getTokenById(tokenIdParam);
    }

    // Fallback: Pick student's active token (e.g. #D-27) or latest token
    if (!currentTrackingToken) {
        currentTrackingToken = studentActiveTokens.length > 0 
            ? studentActiveTokens[0] 
            : (studentTokens[0] || allTokens[0] || null);
    }

    renderQueueView();
    setupEventListeners();
}

function renderQueueView() {
    const queueContainer = document.getElementById('queueTrackingContent');
    const emptyState = document.getElementById('queueEmptyState');

    if (!currentTrackingToken) {
        if (queueContainer) queueContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (queueContainer) queueContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    // Refresh token data from storage in case it updated via Admin action
    currentTrackingToken = SCQStorage.getTokenById(currentTrackingToken.id) || currentTrackingToken;

    const position = SCQStorage.calculateQueuePosition(currentTrackingToken);
    const service = SCQStorage.getServiceById(currentTrackingToken.serviceId);

    // 1. Service and Location Header
    const serviceTitleEl = document.getElementById('queueServiceName');
    const serviceLocEl = document.getElementById('queueServiceLocation');
    if (serviceTitleEl) serviceTitleEl.textContent = currentTrackingToken.serviceName;
    if (serviceLocEl) {
        const pausedBadge = service?.isPaused ? ' <span class="status-pill status-almost" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">● Counter Paused</span>' : '';
        serviceLocEl.innerHTML = `${currentTrackingToken.serviceLocation} • Avg. ${service?.avgWaitPerPersonMinutes || 4} mins/student${pausedBadge}`;
    }

    // 2. Token Numbers Display (Your Token vs Currently Serving)
    const myTokenNumEl = document.getElementById('myTokenNumber');
    const servingTokenNumEl = document.getElementById('servingTokenNumber');
    if (myTokenNumEl) myTokenNumEl.textContent = `#${currentTrackingToken.tokenCode}`;
    if (servingTokenNumEl) servingTokenNumEl.textContent = `#${position.servingCode}`;

    // 3. Queue Metrics
    const peopleAheadEl = document.getElementById('peopleAheadVal');
    const waitTimeEl = document.getElementById('estimatedWaitVal');
    const assignedCounterEl = document.getElementById('assignedCounterVal');

    if (peopleAheadEl) {
        if (currentTrackingToken.status === 'Completed' || currentTrackingToken.status === 'Cancelled') {
            peopleAheadEl.textContent = '0';
        } else {
            peopleAheadEl.textContent = position.peopleAhead;
        }
    }

    if (waitTimeEl) {
        if (currentTrackingToken.status === 'Completed' || currentTrackingToken.status === 'Cancelled') {
            waitTimeEl.textContent = '0 min';
        } else if (position.isPaused) {
            waitTimeEl.textContent = 'Paused';
        } else if (currentTrackingToken.status === 'Being Served') {
            waitTimeEl.textContent = 'Now Calling!';
        } else {
            waitTimeEl.textContent = position.waitDurationFormatted;
        }
    }

    if (assignedCounterEl) {
        assignedCounterEl.textContent = currentTrackingToken.counterNumber || 'Counter 1';
    }

    // 4. Status Badge
    const statusBadgeContainer = document.getElementById('queueStatusBadge');
    renderStatusBadge(statusBadgeContainer, currentTrackingToken.status);

    // 5. Approaching Turn Alert Banner & Paused Banner
    const alertBanner = document.getElementById('turnApproachingAlert');
    const alertMessage = document.getElementById('turnAlertMessage');

    if (alertBanner && alertMessage) {
        if (position.isPaused) {
            alertBanner.className = 'queue-alert-banner warning';
            alertBanner.style.display = 'flex';
            alertMessage.innerHTML = `<strong>Counter Notice:</strong> ${currentTrackingToken.serviceName} is temporarily paused (${position.pausedReason || 'Break'}). Waiting time estimates are suspended until desk resumes.`;
        } else if (currentTrackingToken.status === 'Almost Your Turn') {
            alertBanner.className = 'queue-alert-banner warning';
            alertBanner.style.display = 'flex';
            alertMessage.innerHTML = `<strong>Approaching Alert:</strong> Only ${position.peopleAhead} student ahead of you! Please proceed to ${currentTrackingToken.serviceLocation}.`;
        } else if (currentTrackingToken.status === 'Being Served') {
            alertBanner.className = 'queue-alert-banner success';
            alertBanner.style.display = 'flex';
            alertMessage.innerHTML = `<strong>Now Calling!</strong> Token #${currentTrackingToken.tokenCode} is currently being served at ${currentTrackingToken.counterNumber}. Please present yourself at the desk.`;
        } else if (currentTrackingToken.status === 'Completed') {
            alertBanner.className = 'queue-alert-banner success';
            alertBanner.style.display = 'flex';
            alertMessage.innerHTML = `<strong>Completed:</strong> Your administrative visit for ${currentTrackingToken.serviceName} has concluded.`;
        } else if (currentTrackingToken.status === 'Cancelled') {
            alertBanner.className = 'queue-alert-banner';
            alertBanner.style.display = 'flex';
            alertMessage.innerHTML = `<strong>Cancelled:</strong> This token was cancelled. You can generate a new token anytime.`;
        } else {
            alertBanner.style.display = 'none';
        }
    }

    // 6. Progress Bar
    const progressBarFill = document.getElementById('queueProgressBarFill');
    const progressPercentText = document.getElementById('queueProgressPct');

    if (progressBarFill && progressPercentText) {
        let pct = position.progressPercent;
        if (currentTrackingToken.status === 'Completed') pct = 100;
        if (currentTrackingToken.status === 'Cancelled') pct = 0;

        progressBarFill.style.width = `${pct}%`;
        progressPercentText.textContent = `${pct}% completed`;

        progressBarFill.classList.remove('warning', 'success');
        if (currentTrackingToken.status === 'Almost Your Turn') {
            progressBarFill.classList.add('warning');
        } else if (currentTrackingToken.status === 'Being Served' || currentTrackingToken.status === 'Completed') {
            progressBarFill.classList.add('success');
        }
    }

    // 7. Action Buttons (Cancel button visible only if not completed/cancelled)
    const cancelBtn = document.getElementById('cancelTokenBtn');
    const completeBtn = document.getElementById('completeTurnBtn');

    if (cancelBtn) {
        if (currentTrackingToken.status === 'Waiting' || currentTrackingToken.status === 'Almost Your Turn') {
            cancelBtn.style.display = 'inline-flex';
        } else {
            cancelBtn.style.display = 'none';
        }
    }

    if (completeBtn) {
        if (currentTrackingToken.status === 'Being Served') {
            completeBtn.style.display = 'inline-flex';
        } else {
            completeBtn.style.display = 'none';
        }
    }

    // Multi-token switcher
    renderTokenSwitcher();
}

function renderStatusBadge(container, status) {
    if (!container) return;
    let pillClass = 'status-waiting';
    let label = 'Waiting';

    switch (status) {
        case 'Almost Your Turn':
            pillClass = 'status-almost';
            label = 'Almost Your Turn';
            break;
        case 'Being Served':
            pillClass = 'status-serving';
            label = 'Being Served';
            break;
        case 'Completed':
            pillClass = 'status-completed';
            label = 'Completed';
            break;
        case 'Cancelled':
            pillClass = 'status-cancelled';
            label = 'Cancelled';
            break;
        default:
            pillClass = 'status-waiting';
            label = 'Waiting';
    }

    container.className = `status-pill ${pillClass}`;
    container.innerHTML = `<span>●</span> <span>${label}</span>`;
}

function renderTokenSwitcher() {
    const switcherContainer = document.getElementById('tokenSwitcherSelect');
    if (!switcherContainer) return;

    const student = SCQStorage.getStudent();
    const studentTokens = SCQStorage.getTokens().filter(t => t.studentId === student.id);

    if (studentTokens.length <= 1) {
        const switcherWrapper = document.getElementById('tokenSwitcherWrapper');
        if (switcherWrapper) switcherWrapper.style.display = 'none';
        return;
    }

    const switcherWrapper = document.getElementById('tokenSwitcherWrapper');
    if (switcherWrapper) switcherWrapper.style.display = 'block';

    switcherContainer.innerHTML = '';
    studentTokens.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `Token #${t.tokenCode} — ${t.serviceName} (${t.status})`;
        if (currentTrackingToken && t.id === currentTrackingToken.id) {
            opt.selected = true;
        }
        switcherContainer.appendChild(opt);
    });
}

function setupEventListeners() {
    // 1. Cancel Token Button & Dialog
    const cancelBtn = document.getElementById('cancelTokenBtn');
    const cancelModal = document.getElementById('cancelConfirmModal');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const dismissCancelBtns = document.querySelectorAll('[data-close-cancel-modal]');

    if (cancelBtn && cancelModal) {
        cancelBtn.addEventListener('click', () => {
            const tokenCodeSpan = document.getElementById('cancelModalTokenCode');
            if (tokenCodeSpan && currentTrackingToken) {
                tokenCodeSpan.textContent = `#${currentTrackingToken.tokenCode}`;
            }
            cancelModal.classList.add('active');
        });
    }

    dismissCancelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (cancelModal) cancelModal.classList.remove('active');
        });
    });

    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            if (currentTrackingToken) {
                try {
                    SCQStorage.cancelToken(currentTrackingToken.id, 'Student');
                    if (cancelModal) cancelModal.classList.remove('active');
                    showToast(`Token #${currentTrackingToken.tokenCode} has been cancelled.`, 'info');
                    renderQueueView();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });
    }

    // 2. Complete Turn (Student acknowledging finish)
    const completeBtn = document.getElementById('completeTurnBtn');
    if (completeBtn) {
        completeBtn.addEventListener('click', () => {
            if (currentTrackingToken) {
                try {
                    SCQStorage.completeToken(currentTrackingToken.id);
                    showToast(`Token #${currentTrackingToken.tokenCode} marked as completed!`, 'success');
                    renderQueueView();
                } catch (err) {
                    showToast(err.message, 'error');
                }
            }
        });
    }

    // 3. Switch token selector
    const switcherContainer = document.getElementById('tokenSwitcherSelect');
    if (switcherContainer) {
        switcherContainer.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            currentTrackingToken = SCQStorage.getTokenById(selectedId);
            renderQueueView();
        });
    }

    // 4. Advance queue button (calls next student using the logical admin callNextStudent)
    const advanceBtn = document.getElementById('advanceQueueBtn');
    if (advanceBtn) {
        advanceBtn.addEventListener('click', () => {
            if (!currentTrackingToken) return;
            try {
                // If desk is currently serving someone, complete that person first to free counter
                const serviceTokens = SCQStorage.getActiveTokens().filter(t => t.serviceId === currentTrackingToken.serviceId);
                const currentServing = serviceTokens.find(t => t.status === 'Being Served');
                if (currentServing) {
                    SCQStorage.completeToken(currentServing.id);
                }

                const calledToken = SCQStorage.callNextStudent(currentTrackingToken.serviceId);
                showToast(`Counter called Token #${calledToken.tokenCode} (${calledToken.studentName})!`, 'success');
                renderQueueView();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    // 5. Reset demo queue
    const resetQueueBtn = document.getElementById('resetQueueBtn');
    if (resetQueueBtn) {
        resetQueueBtn.addEventListener('click', () => {
            SCQStorage.resetAllToDefault();
            showToast('Reset sample queue to default demo data (#27 / #21)', 'info');
            setTimeout(() => {
                window.location.href = 'queue.html';
            }, 400);
        });
    }
}
