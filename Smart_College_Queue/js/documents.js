/**
 * Smart College Queue Management System
 * documents.js - Document Verification Workflow, Upload Simulation, Status Tracking
 */

document.addEventListener('DOMContentLoaded', () => {
    initDocumentsPage();
});

let selectedCategoryFilter = 'all';

function initDocumentsPage() {
    renderCategoryFilter();
    renderDocumentsList();
    setupDocumentEvents();
}

function renderCategoryFilter() {
    const filterSelect = document.getElementById('docCategoryFilter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', (e) => {
        selectedCategoryFilter = e.target.value;
        renderDocumentsList();
    });
}

function renderDocumentsList() {
    const listContainer = document.getElementById('documentsListContainer');
    if (!listContainer) return;

    const allDocs = SCQStorage.getDocuments();
    const filteredDocs = selectedCategoryFilter === 'all' 
        ? allDocs 
        : allDocs.filter(d => d.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()));

    // 1. Calculate overall progress stats based on strict college logic rules
    const categoryForAppStatus = selectedCategoryFilter === 'all' ? null : selectedCategoryFilter;
    const overallAppStatus = SCQStorage.calculateApplicationStatus(categoryForAppStatus);

    const totalCount = filteredDocs.length;
    const verifiedCount = filteredDocs.filter(d => d.status === 'Verified').length;
    const pendingCount = filteredDocs.filter(d => d.status === 'Pending Verification').length;
    const rejectedCount = filteredDocs.filter(d => d.status === 'Rejected').length;
    const notSubmittedCount = filteredDocs.filter(d => d.status === 'Not Submitted').length;

    const completionRate = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

    // Update progress summary if elements exist
    const verifiedCountEl = document.getElementById('statVerifiedCount');
    const pendingCountEl = document.getElementById('statPendingCount');
    const rejectedCountEl = document.getElementById('statRejectedCount');
    const completionPctEl = document.getElementById('statCompletionPct');
    const overallProgressBar = document.getElementById('overallDocProgressBar');

    if (verifiedCountEl) verifiedCountEl.textContent = `${verifiedCount}/${totalCount}`;
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (rejectedCountEl) rejectedCountEl.textContent = rejectedCount;

    if (completionPctEl) {
        let pillClass = 'status-waiting';
        if (overallAppStatus === 'Verified') pillClass = 'status-serving';
        else if (overallAppStatus === 'Rejected') pillClass = 'status-cancelled';
        else if (overallAppStatus === 'Pending Verification') pillClass = 'status-almost';

        completionPctEl.className = `status-pill ${pillClass}`;
        completionPctEl.innerHTML = `<span>●</span> <span>Application Status: ${overallAppStatus}</span>`;
    }

    if (overallProgressBar) {
        overallProgressBar.style.width = `${completionRate}%`;
        overallProgressBar.className = 'progress-bar-fill';
        if (overallAppStatus === 'Verified') overallProgressBar.classList.add('success');
        else if (overallAppStatus === 'Rejected') overallProgressBar.classList.add('warning');
    }

    // 2. Render Document Cards
    listContainer.innerHTML = '';

    if (filteredDocs.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: #64748b; background: #ffffff; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <p>No documents found matching the selected category.</p>
            </div>
        `;
        return;
    }

    filteredDocs.forEach(doc => {
        const card = createDocumentCardElement(doc);
        listContainer.appendChild(card);
    });
}

function createDocumentCardElement(doc) {
    const card = document.createElement('div');
    
    // Status class mapping
    let statusClass = '';
    let statusPillClass = 'status-waiting';
    let statusText = doc.status;

    switch (doc.status) {
        case 'Verified':
            statusClass = 'is-verified';
            statusPillClass = 'status-serving';
            break;
        case 'Pending Verification':
            statusClass = 'is-pending';
            statusPillClass = 'status-almost';
            break;
        case 'Rejected':
            statusClass = 'is-rejected';
            statusPillClass = 'status-cancelled';
            break;
        default:
            statusClass = '';
            statusPillClass = 'status-completed';
            statusText = 'Not Submitted';
    }

    card.className = `doc-item-card ${statusClass}`;

    // Has uploaded file?
    let fileInfoMarkup = '';
    if (doc.fileName) {
        fileInfoMarkup = `
            <div class="doc-file-info-row">
                <span class="doc-file-name">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    ${doc.fileName} (${doc.fileSize || '1.2 MB'})
                </span>
                <span style="font-size: 0.775rem; color: #64748b;">
                    Uploaded ${formatTimeAgo(doc.uploadedAt)}
                </span>
            </div>
        `;
    }

    // Rejection callout with explicit instructions
    let rejectionMarkup = '';
    if (doc.status === 'Rejected') {
        rejectionMarkup = `
            <div class="rejection-reason-box">
                <div class="rejection-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Rejection Feedback from Admin Officer
                </div>
                <div class="rejection-text">"${doc.rejectionReason || 'Document does not meet administrative standards.'}"</div>
                <div class="rejection-instructions"><strong>Next Action:</strong> ${doc.instructions || 'Please re-upload a clear and valid document copy.'}</div>
            </div>
        `;
    }

    // Action button based on state
    let actionButtonsMarkup = '';
    if (doc.status === 'Not Submitted') {
        actionButtonsMarkup = `
            <label class="btn btn-primary btn-sm" style="cursor: pointer;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Upload Document
                <input type="file" class="custom-file-input" data-doc-id="${doc.id}" accept=".pdf,.jpg,.jpeg,.png">
            </label>
        `;
    } else if (doc.status === 'Rejected') {
        actionButtonsMarkup = `
            <label class="btn btn-danger btn-sm" style="cursor: pointer;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Re-upload Corrected File
                <input type="file" class="custom-file-input" data-doc-id="${doc.id}" accept=".pdf,.jpg,.jpeg,.png">
            </label>
        `;
    } else {
        // Pending or Verified - option to replace or re-select
        actionButtonsMarkup = `
            <label class="btn btn-secondary btn-sm" style="cursor: pointer;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Replace Uploaded File
                <input type="file" class="custom-file-input" data-doc-id="${doc.id}" accept=".pdf,.jpg,.jpeg,.png">
            </label>
        `;
    }

    card.innerHTML = `
        <div class="doc-item-header">
            <div>
                <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #0284c7;">
                    ${doc.category}
                </span>
                <div class="doc-item-title">
                    ${doc.title}
                    ${doc.required ? '<span class="doc-required-tag">Required</span>' : '<span style="font-size: 0.7rem; color: #64748b; margin-left: 0.5rem;">Optional</span>'}
                </div>
            </div>
            <div class="status-pill ${statusPillClass}">
                <span>●</span> <span>${statusText}</span>
            </div>
        </div>

        <div class="doc-item-desc">${doc.requirementText}</div>

        ${fileInfoMarkup}
        ${rejectionMarkup}

        <div class="doc-upload-controls" style="margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid #f1f5f9;">
            ${actionButtonsMarkup}
        </div>
    `;

    return card;
}

function setupDocumentEvents() {
    const listContainer = document.getElementById('documentsListContainer');
    if (!listContainer) return;

    // Delegate change event for file inputs
    listContainer.addEventListener('change', (e) => {
        if (e.target && e.target.classList.contains('custom-file-input')) {
            const docId = e.target.getAttribute('data-doc-id');
            const file = e.target.files[0];
            if (file && docId) {
                // File format validation
                const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
                    showToast('Invalid file format! Please upload a PDF, JPG, or PNG document.', 'error');
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    showToast('File size exceeds 5 MB limit. Please compress or select a smaller file.', 'error');
                    return;
                }

                // Store metadata only (no raw binary in localStorage to avoid storage quota errors)
                const fileSizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                SCQStorage.updateDocumentFile(docId, file.name, fileSizeFormatted, file.type || 'application/pdf');
                showToast(`"${file.name}" uploaded. Status: Pending Verification.`, 'success');
                renderDocumentsList();
            }
        }
    });
}
