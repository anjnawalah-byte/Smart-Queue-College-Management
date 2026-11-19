/**
 * Smart College Queue Management System
 * admin.js - College Administration Operations Dashboard Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    initAdminDashboard();
});

let rejectingDocId = null;

function initAdminDashboard() {
    renderKPIStatistics();
    renderServiceCounters();
    renderDocumentReviewTable();
    renderActivityLogs();
    setupAdminEventListeners();
}

/**
 * 1. Top KPI Summary Cards
 */
function renderKPIStatistics() {
    const tokens = SCQStorage.getTokens();
    const services = SCQStorage.getServices();

    const waitingTokens = tokens.filter(t => t.status === 'Waiting' || t.status === 'Almost Your Turn');
    const beingServedTokens = tokens.filter(t => t.status === 'Being Served');
    const completedTokens = tokens.filter(t => t.status === 'Completed');

    // Calculate system average wait time across waiting tokens
    let totalWaitMins = 0;
    waitingTokens.forEach(t => {
        const s = services.find(srv => srv.id === t.serviceId);
        if (s) totalWaitMins += s.avgWaitPerPersonMinutes;
    });
    const avgWaitMins = waitingTokens.length > 0 ? Math.round(totalWaitMins / waitingTokens.length) : 0;

    // Populate DOM elements
    const totalWaitingEl = document.getElementById('kpiTotalWaiting');
    const beingServedEl = document.getElementById('kpiBeingServed');
    const completedTodayEl = document.getElementById('kpiCompletedToday');
    const avgWaitTimeEl = document.getElementById('kpiAvgWaitTime');

    if (totalWaitingEl) totalWaitingEl.textContent = waitingTokens.length;
    if (beingServedEl) beingServedEl.textContent = beingServedTokens.length;
    if (completedTodayEl) completedTodayEl.textContent = completedTokens.length;
    if (avgWaitTimeEl) avgWaitTimeEl.textContent = `${avgWaitMins} min`;
}

/**
 * 2. Service Counters Grid / Management Cards
 */
function renderServiceCounters() {
    const container = document.getElementById('adminCountersContainer');
    if (!container) return;

    const services = SCQStorage.getServices();
    const tokens = SCQStorage.getTokens();

    container.innerHTML = '';

    services.forEach(service => {
        // Find active tokens for this service
        const serviceTokens = tokens.filter(t => t.serviceId === service.id);
        const currentlyServed = serviceTokens.find(t => t.status === 'Being Served');
        const waitingTokens = serviceTokens
            .filter(t => t.status === 'Waiting' || t.status === 'Almost Your Turn')
            .sort((a, b) => a.tokenNumber - b.tokenNumber);

        const card = document.createElement('div');
        card.className = `service-card admin-counter-card ${service.isPaused ? 'is-paused' : ''}`;
        card.style.padding = '1.5rem';

        // Currently served markup
        let servingMarkup = '';
        if (currentlyServed) {
            servingMarkup = `
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                        <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: #1d4ed8;">Currently Serving</span>
                        <span class="status-pill status-serving" style="font-size: 0.75rem;">Being Served</span>
                    </div>
                    <div style="display: flex; align-items: baseline; gap: 0.6rem; margin-bottom: 0.25rem;">
                        <strong style="font-size: 1.5rem; color: #0d233a;">#${currentlyServed.tokenCode}</strong>
                        <span style="font-size: 0.9rem; font-weight: 600; color: #334155;">${currentlyServed.studentName}</span>
                        <span style="font-size: 0.75rem; color: #64748b;">(${currentlyServed.studentId})</span>
                    </div>
                    <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.75rem;">
                        ${currentlyServed.category} • Started ${formatTimeAgo(currentlyServed.servedAt)}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary btn-sm" onclick="handleAdminComplete('${currentlyServed.id}')" style="font-size: 0.8rem;">
                            ✓ Mark Completed
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="handleAdminCancel('${currentlyServed.id}')" style="font-size: 0.8rem;">
                            ✕ Cancel
                        </button>
                    </div>
                </div>
            `;
        } else {
            servingMarkup = `
                <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: center; color: #64748b;">
                    <span style="font-size: 0.85rem; font-weight: 600;">Counter Idle / Ready</span>
                    <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.2rem;">Click "Call Next Student" to admit the next waiting token.</p>
                </div>
            `;
        }

        // Waiting queue pills
        let waitingMarkup = '';
        if (waitingTokens.length > 0) {
            const listPills = waitingTokens.map((t, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.5rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.8rem;">
                    <div>
                        <strong style="color: #0d233a;">#${t.tokenCode}</strong>
                        <span style="color: #475569; margin-left: 0.35rem;">${t.studentName}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <span style="color: #64748b; font-size: 0.75rem;">~${idx * service.avgWaitPerPersonMinutes} min</span>
                        <button onclick="handleAdminCancel('${t.id}')" title="Cancel Token" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem;">✕</button>
                    </div>
                </div>
            `).join('');

            waitingMarkup = `
                <div style="margin-bottom: 1rem;">
                    <span style="font-size: 0.8rem; font-weight: 600; color: #475569; display: block; margin-bottom: 0.35rem;">
                        Waiting in Line (${waitingTokens.length}):
                    </span>
                    <div style="display: flex; flex-direction: column; gap: 0.3rem; max-height: 140px; overflow-y: auto;">
                        ${listPills}
                    </div>
                </div>
            `;
        } else {
            waitingMarkup = `
                <div style="margin-bottom: 1rem; font-size: 0.8rem; color: #94a3b8; text-align: center; padding: 0.5rem;">
                    No students currently waiting.
                </div>
            `;
        }

        // Counter Pause Warning Banner if Paused
        let pauseBanner = '';
        if (service.isPaused) {
            pauseBanner = `
                <div style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Counter Paused (${service.pausedReason || 'Break'}). Calling is disabled.
                </div>
            `;
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <h3 style="font-size: 1.15rem; font-weight: 700; color: #0d233a;">${service.name}</h3>
                        <span class="status-pill ${service.isPaused ? 'status-almost' : 'status-serving'}" style="font-size: 0.7rem; padding: 0.15rem 0.5rem;">
                            ● ${service.isPaused ? 'Paused' : 'Active'}
                        </span>
                    </div>
                    <span style="font-size: 0.8rem; color: #64748b;">${service.location}</span>
                </div>

                <!-- Pause / Resume Button -->
                <button class="btn btn-secondary btn-sm" onclick="handleTogglePause('${service.id}')" style="font-size: 0.775rem; padding: 0.3rem 0.65rem;">
                    ${service.isPaused ? '▶ Resume Counter' : '⏸ Pause Counter'}
                </button>
            </div>

            ${pauseBanner}

            <!-- Duration Config Row -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.5rem 0.75rem; margin-bottom: 1rem; font-size: 0.825rem;">
                <span style="color: #475569; font-weight: 500;">Avg. Service Duration:</span>
                <div style="display: flex; align-items: center; gap: 0.35rem;">
                    <input type="number" min="1" max="60" value="${service.avgWaitPerPersonMinutes}" id="duration_input_${service.id}" style="width: 54px; padding: 0.2rem 0.4rem; font-size: 0.825rem; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center;">
                    <span style="color: #64748b;">min</span>
                    <button class="btn btn-secondary btn-sm" onclick="handleSaveDuration('${service.id}')" style="font-size: 0.725rem; padding: 0.2rem 0.5rem;">
                        Save
                    </button>
                </div>
            </div>

            <!-- Serving Section -->
            ${servingMarkup}

            <!-- Waiting Section -->
            ${waitingMarkup}

            <!-- Primary Action: Call Next Student -->
            <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid #e2e8f0;">
                <button class="btn btn-primary btn-block" onclick="handleAdminCallNext('${service.id}')" ${service.isPaused ? 'disabled style="opacity: 0.6; cursor: not-allowed;"' : ''}>
                    ➔ Call Next Student
                </button>
                <button class="btn btn-secondary btn-sm" onclick="openAddStudentModal('${service.id}')" title="Simulate another student joining this queue">
                    + Add Student
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

/**
 * 3. Document Verification Review Table
 */
function renderDocumentReviewTable() {
    const tbody = document.getElementById('adminDocReviewTableBody');
    if (!tbody) return;

    const docs = SCQStorage.getDocuments();

    if (docs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #64748b;">No submitted documents to review.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';

    docs.forEach(doc => {
        const tr = document.createElement('tr');

        let statusClass = 'status-waiting';
        if (doc.status === 'Verified') statusClass = 'status-serving';
        else if (doc.status === 'Pending Verification') statusClass = 'status-almost';
        else if (doc.status === 'Rejected') statusClass = 'status-cancelled';
        else statusClass = 'status-completed';

        const uploadedFormatted = doc.uploadedAt 
            ? formatTimeAgo(doc.uploadedAt) 
            : '<span style="color: #94a3b8;">Not uploaded</span>';

        const fileSnippet = doc.fileName 
            ? `<span style="font-weight: 600; color: #0d233a;">${doc.fileName}</span> <span style="font-size: 0.75rem; color: #64748b;">(${doc.fileSize || '1.2 MB'})</span>`
            : '<span style="color: #94a3b8;">None</span>';

        let actionButtons = '';
        if (doc.status === 'Pending Verification' || doc.status === 'Rejected') {
            actionButtons = `
                <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
                    <button class="btn btn-primary btn-sm" onclick="handleVerifyDoc('${doc.id}')" style="font-size: 0.75rem; padding: 0.25rem 0.55rem; background-color: #15803d; border-color: #15803d;">
                        ✓ Verify
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="openRejectModal('${doc.id}')" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;">
                        ✕ Reject
                    </button>
                </div>
            `;
        } else if (doc.status === 'Verified') {
            actionButtons = `
                <div style="display: flex; gap: 0.35rem; justify-content: flex-end;">
                    <span style="font-size: 0.775rem; color: #15803d; font-weight: 600; margin-right: 0.3rem;">✓ Approved</span>
                    <button class="btn btn-secondary btn-sm" onclick="openRejectModal('${doc.id}')" title="Change to Rejected" style="font-size: 0.7rem; padding: 0.2rem 0.4rem; color: #b91c1c;">
                        Revoke
                    </button>
                </div>
            `;
        } else {
            actionButtons = `<span style="color: #94a3b8; font-size: 0.775rem;">Awaiting upload</span>`;
        }

        tr.innerHTML = `
            <td><strong style="color: #0d233a;">${doc.applicationId || 'APP-2024'}</strong></td>
            <td>
                <div style="font-weight: 600; color: #0d233a;">${doc.studentName || 'Namasvi Patel'}</div>
                <div style="font-size: 0.75rem; color: #64748b;">${doc.studentId || 'SCQ-2024-8842'}</div>
            </td>
            <td>
                <div style="font-weight: 600; color: #0d233a;">${doc.title}</div>
                <div style="font-size: 0.75rem; color: #0284c7;">${doc.category}</div>
            </td>
            <td>${fileSnippet}</td>
            <td>${uploadedFormatted}</td>
            <td>
                <span class="status-pill ${statusClass}" style="font-size: 0.75rem;">
                    ● ${doc.status}
                </span>
                ${doc.status === 'Rejected' && doc.rejectionReason ? `<div style="font-size: 0.725rem; color: #dc2626; margin-top: 0.2rem; max-width: 180px;">Reason: ${doc.rejectionReason}</div>` : ''}
            </td>
            <td style="text-align: right;">${actionButtons}</td>
        `;

        tbody.appendChild(tr);
    });
}

/**
 * 4. Activity Logs
 */
function renderActivityLogs() {
    const container = document.getElementById('adminActivityLogsList');
    if (!container) return;

    const logs = SCQStorage.getActivityLogs();
    if (logs.length === 0) {
        container.innerHTML = `<div style="color: #94a3b8; font-size: 0.85rem; padding: 1rem;">No recent activities logged.</div>`;
        return;
    }

    container.innerHTML = '';
    logs.slice(0, 10).forEach(log => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 0.65rem 0.85rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; font-size: 0.825rem;';
        item.innerHTML = `
            <div>
                <strong style="color: #0d233a;">${log.action}</strong>
                <span style="color: #475569; margin-left: 0.5rem;">${log.details}</span>
            </div>
            <span style="color: #94a3b8; font-size: 0.75rem; flex-shrink: 0; margin-left: 1rem;">
                ${formatTimeAgo(log.timestamp)}
            </span>
        `;
        container.appendChild(item);
    });
}

/**
 * 5. Admin Controller Actions
 */

// Call Next Student
window.handleAdminCallNext = function(serviceId) {
    try {
        const token = SCQStorage.callNextStudent(serviceId);
        showToast(`Now Serving Token #${token.tokenCode} (${token.studentName}) at ${token.counterNumber}!`, 'success');
        refreshAdminView();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Complete Token
window.handleAdminComplete = function(tokenId) {
    try {
        const token = SCQStorage.completeToken(tokenId);
        showToast(`Token #${token.tokenCode} marked as Completed.`, 'success');
        refreshAdminView();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Cancel Token
window.handleAdminCancel = function(tokenId) {
    if (confirm('Are you sure you want to cancel this student token?')) {
        try {
            const token = SCQStorage.cancelToken(tokenId, 'Admin Officer');
            showToast(`Token #${token.tokenCode} has been cancelled.`, 'info');
            refreshAdminView();
        } catch (err) {
            showToast(err.message, 'error');
        }
    }
};

// Pause / Resume Counter
window.handleTogglePause = function(serviceId) {
    try {
        const service = SCQStorage.getServiceById(serviceId);
        let reason = '';
        if (!service.isPaused) {
            reason = prompt(`Enter reason for pausing ${service.name} counter:`, 'Staff Lunch Break / System Maintenance') || 'Administrative Break';
        }
        const updated = SCQStorage.toggleServicePause(serviceId, reason);
        showToast(`${updated.name} counter is now ${updated.isPaused ? 'PAUSED' : 'RESUMED'}.`, updated.isPaused ? 'error' : 'success');
        refreshAdminView();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Save Service Duration
window.handleSaveDuration = function(serviceId) {
    const input = document.getElementById(`duration_input_${serviceId}`);
    if (!input) return;
    try {
        const updated = SCQStorage.updateServiceDuration(serviceId, input.value);
        showToast(`${updated.name} average duration updated to ${updated.avgWaitPerPersonMinutes} mins.`, 'success');
        refreshAdminView();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Verify Document
window.handleVerifyDoc = function(docId) {
    try {
        SCQStorage.reviewDocument(docId, true);
        showToast('Document marked as Verified successfully.', 'success');
        refreshAdminView();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Open Rejection Modal
window.openRejectModal = function(docId) {
    rejectingDocId = docId;
    const modal = document.getElementById('adminRejectDocModal');
    const input = document.getElementById('rejectReasonInput');
    const alertBox = document.getElementById('rejectModalAlert');

    if (alertBox) alertBox.style.display = 'none';
    if (input) input.value = '';

    if (modal) modal.classList.add('active');
};

// Confirm Rejection
window.confirmDocRejection = function() {
    const input = document.getElementById('rejectReasonInput');
    const alertBox = document.getElementById('rejectModalAlert');
    const reason = input ? input.value.trim() : '';

    if (!reason) {
        if (alertBox) {
            alertBox.textContent = 'Error: A rejection reason is required so the student knows how to resubmit.';
            alertBox.style.display = 'block';
        } else {
            alert('A rejection reason is required.');
        }
        return;
    }

    try {
        SCQStorage.reviewDocument(rejectingDocId, false, reason);
        closeRejectModal();
        showToast('Document marked as Rejected with provided feedback.', 'info');
        refreshAdminView();
    } catch (err) {
        if (alertBox) {
            alertBox.textContent = err.message;
            alertBox.style.display = 'block';
        }
    }
};

window.closeRejectModal = function() {
    const modal = document.getElementById('adminRejectDocModal');
    if (modal) modal.classList.remove('active');
    rejectingDocId = null;
};

// Add simulated student modal
window.openAddStudentModal = function(serviceId) {
    const select = document.getElementById('simStudentServiceSelect');
    if (select) select.value = serviceId;
    const modal = document.getElementById('adminAddStudentModal');
    if (modal) modal.classList.add('active');
};

window.closeAddStudentModal = function() {
    const modal = document.getElementById('adminAddStudentModal');
    if (modal) modal.classList.remove('active');
};

window.confirmAddStudent = function() {
    const serviceSelect = document.getElementById('simStudentServiceSelect');
    const nameInput = document.getElementById('simStudentNameInput');
    const purposeInput = document.getElementById('simStudentPurposeInput');

    const serviceId = serviceSelect.value;
    const studentName = nameInput.value.trim() || 'Demo Student';
    const purpose = purposeInput.value.trim() || 'Service Request';

    try {
        const studentObj = {
            id: 'SCQ-2024-' + Math.floor(1000 + Math.random() * 9000),
            name: studentName,
            email: `${studentName.toLowerCase().replace(/\s+/g, '.')}@college.edu`
        };

        const token = SCQStorage.generateToken(serviceId, purpose, 'Added via Admin desk demo simulation', studentObj);
        closeAddStudentModal();
        showToast(`Token #${token.tokenCode} generated for ${studentName}!`, 'success');
        refreshAdminView();
    } catch (err) {
        alert(err.message);
    }
};

function refreshAdminView() {
    renderKPIStatistics();
    renderServiceCounters();
    renderDocumentReviewTable();
    renderActivityLogs();
}

function setupAdminEventListeners() {
    // Demo Reset Button
    const resetBtn = document.getElementById('btnAdminResetDemo');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Reset all queues, documents, and service counters to initial demo data (#27 / #21)?')) {
                SCQStorage.resetAllToDefault();
                showToast('System data reset to initial demo state.', 'success');
                setTimeout(() => window.location.reload(), 400);
            }
        });
    }
}
