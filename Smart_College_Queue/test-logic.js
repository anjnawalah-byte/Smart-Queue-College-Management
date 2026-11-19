/**
 * Comprehensive Test Suite for Smart College Queue Management System
 * Tests:
 * 1. Clean Zero State (0 tokens, 0 serving counters, Not Submitted docs)
 * 2. Fixed Admin Credentials (admin / admin123 or Password123)
 * 3. Student Enrollment & Sign-In (Enrollment No + Password123)
 * 4. Token Generation & Queue Progression Workflow
 * 5. Document Upload, Verification, and Rejection Validations
 */

// Mock browser localStorage for Node testing
const mockLocalStorage = {
    data: {},
    getItem(key) { return Object.prototype.hasOwnProperty.call(this.data, key) ? this.data[key] : null; },
    setItem(key, val) { this.data[key] = String(val); },
    removeItem(key) { delete this.data[key]; },
    clear() { this.data = {}; }
};
global.localStorage = mockLocalStorage;

// Load storage.js
const fs = require('fs');
let storageCode = fs.readFileSync('js/storage.js', 'utf-8');
storageCode = storageCode.replace('const SCQStorage =', 'global.SCQStorage =');
eval(storageCode);

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
    if (condition) {
        console.log(`✓ PASS: ${testName}`);
        passedCount++;
    } else {
        console.error(`✗ FAIL: ${testName} - ${details}`);
        failedCount++;
    }
}

console.log('====================================================');
console.log('SMART COLLEGE QUEUE — LOGIC & AUTHENTICATION TESTS');
console.log('====================================================\n');

// ----------------------------------------------------
// TEST 1: Initial Clean Zero State Check
// ----------------------------------------------------
console.log('--- TEST GROUP 1: Clean Zero State ---');
SCQStorage.resetAllToDefault();

const initialTokens = SCQStorage.getTokens();
assert(initialTokens.length === 0, 'Tokens list is empty at start (0 tokens)');

const initialActiveTokens = SCQStorage.getActiveTokens();
assert(initialActiveTokens.length === 0, 'Active tokens count is 0');

const initialServices = SCQStorage.getServices();
assert(initialServices.length === 4, 'All 4 administrative service counters configured');

const allCountersZero = initialServices.every(s => s.currentServingNumber === 0 && s.totalInQueue === 0);
assert(allCountersZero, 'All counter serving numbers and queue sizes are set to 0');

const initialDocs = SCQStorage.getDocuments();
const allDocsNotSubmitted = initialDocs.every(d => d.status === 'Not Submitted');
assert(allDocsNotSubmitted, 'All documents start in "Not Submitted" state (0% verified)');


// ----------------------------------------------------
// TEST 2: Admin Authentication with Fixed Credentials
// ----------------------------------------------------
console.log('\n--- TEST GROUP 2: Admin Authentication ---');

// Test wrong password
try {
    SCQStorage.loginAdmin('admin', 'wrong_pass');
    assert(false, 'Admin login with wrong password should fail');
} catch (e) {
    assert(true, 'Admin login rejected with wrong password');
}

// Test wrong username
try {
    SCQStorage.loginAdmin('unknown_admin', 'admin123');
    assert(false, 'Admin login with unknown username should fail');
} catch (e) {
    assert(true, 'Admin login rejected with unknown username');
}

// Test correct credentials (admin / admin123)
const adminUser1 = SCQStorage.loginAdmin('admin', 'admin123');
assert(adminUser1 && adminUser1.role === 'admin' && adminUser1.username === 'admin', 'Admin login successful with admin / admin123');

// Test standard credentials (admin / Password123)
const adminUser2 = SCQStorage.loginAdmin('admin', 'Password123');
assert(adminUser2 && adminUser2.role === 'admin', 'Admin login successful with admin / Password123');

// Test session retrieval
const sessionAdmin = SCQStorage.getCurrentUser();
assert(sessionAdmin && sessionAdmin.role === 'admin', 'Current user session set to Admin');


// ----------------------------------------------------
// TEST 3: Student Enrollment & Authentication
// ----------------------------------------------------
console.log('\n--- TEST GROUP 3: Student Enrollment & Authentication ---');

// Test default student (21CS042 / Password123)
const defaultStudent = SCQStorage.loginStudent('21CS042', 'Password123');
assert(defaultStudent && defaultStudent.role === 'student' && defaultStudent.enrollmentNumber === '21CS042', 'Default student 21CS042 signs in with Password123');

// Test wrong password for default student
try {
    SCQStorage.loginStudent('21CS042', 'WrongPassword');
    assert(false, 'Student login with wrong password should fail');
} catch (e) {
    assert(true, 'Student login rejected with incorrect password');
}

// Test new student enrollment
const newStudent = SCQStorage.enrollStudent({
    enrollmentNumber: '24IT105',
    password: 'Password123',
    name: 'Aarav Mehta',
    department: 'B.Tech — Information Technology',
    semester: 2,
    email: 'aarav.mehta@college.edu',
    phone: '+91 91234 56789'
});
assert(newStudent && newStudent.enrollmentNumber === '24IT105', 'New student 24IT105 enrolled successfully with Password123');

// Test duplicate enrollment
try {
    SCQStorage.enrollStudent({
        enrollmentNumber: '24IT105',
        password: 'Password123',
        name: 'Aarav Mehta'
    });
    assert(false, 'Duplicate enrollment should fail');
} catch (e) {
    assert(true, 'Duplicate enrollment prevented with clear error message');
}

// Test sign-in with newly enrolled student
const aaravLoggedIn = SCQStorage.loginStudent('24IT105', 'Password123');
assert(aaravLoggedIn && aaravLoggedIn.name === 'Aarav Mehta', 'Newly enrolled student signs in successfully');

// Check current user session
const sessionStudent = SCQStorage.getCurrentUser();
assert(sessionStudent && sessionStudent.enrollmentNumber === '24IT105', 'Current user session updated to enrolled student');


// ----------------------------------------------------
// TEST 4: Token Generation & Queue Progression from Zero
// ----------------------------------------------------
console.log('\n--- TEST GROUP 4: Queue Progression from Zero ---');

// Generate Token for Aarav Mehta at Fee Counter (Counter 1)
const token1 = SCQStorage.generateToken('fees', 'Semester Fee Receipt', 'Urgent receipt for bank loan', sessionStudent);
assert(token1 && token1.tokenCode === 'F-1', 'First generated token is F-1');
assert(token1.status === 'Waiting', 'Initial token status is Waiting');

// Check queue metrics for Aarav
const queuePos = SCQStorage.calculateQueuePosition(token1);
assert(queuePos.peopleAhead === 0, 'People ahead is 0 (first in queue)');
assert(queuePos.servingCode === 'None (Idle)', 'Display reads None (Idle) when serving counter is idle/0');

// Generate Token for second student at Fee Counter
const secondStudent = SCQStorage.loginStudent('21CS042', 'Password123');
const token2 = SCQStorage.generateToken('fees', 'Hostel Fee Challan', 'Annual hostel payment', secondStudent);
assert(token2 && token2.tokenCode === 'F-2', 'Second generated token is F-2');

const queuePos2 = SCQStorage.calculateQueuePosition(token2);
assert(queuePos2.peopleAhead === 1, 'Second student has exactly 1 person ahead');

// Admin logs in and calls next student
SCQStorage.loginAdmin('admin', 'admin123');
const calledToken = SCQStorage.callNextStudent('fees');
assert(calledToken && calledToken.id === token1.id, 'Counter 1 calls the first student (F-1)');
assert(calledToken.status === 'Being Served', 'Token 1 status changed to Being Served');

// Now check token 2's position when token 1 is Being Served
const queuePos2AfterCall = SCQStorage.calculateQueuePosition(SCQStorage.getTokenById(token2.id));
assert(queuePos2AfterCall.servingCode === 'F-1', 'Live serving code now shows F-1');
assert(queuePos2AfterCall.peopleAhead === 1, 'People ahead for token 2 is 1 (the student currently being served)');

// Complete Token 1
SCQStorage.completeToken(token1.id);
assert(SCQStorage.getTokenById(token1.id).status === 'Completed', 'Token 1 marked Completed');

// Call Token 2
const calledToken2 = SCQStorage.callNextStudent('fees');
assert(calledToken2 && calledToken2.id === token2.id, 'Counter 1 calls the second student (F-2)');
SCQStorage.completeToken(token2.id);
assert(SCQStorage.getTokenById(token2.id).status === 'Completed', 'Token 2 marked Completed');

// Verify active queue is empty again
assert(SCQStorage.getActiveTokens().length === 0, 'Queue is back to 0 active tokens');


// ----------------------------------------------------
// TEST 5: Document Upload & Verification
// ----------------------------------------------------
console.log('\n--- TEST GROUP 5: Document Verification Workflow ---');

// Student uploads a file
SCQStorage.updateDocumentFile('doc_01', '10th_Marksheet_Scanned.pdf', '1.8 MB');
const doc1 = SCQStorage.getDocumentById('doc_01');
assert(doc1.status === 'Pending Verification', 'Uploaded document changes status to Pending Verification');

// Rejection requires reason
try {
    SCQStorage.reviewDocument('doc_01', false, '');
    assert(false, 'Rejecting document without reason should throw error');
} catch (e) {
    assert(true, 'Empty rejection reason correctly blocked');
}

// Admin rejects with clear reason
SCQStorage.reviewDocument('doc_01', false, 'Resolution is too low, please upload clear 300 DPI scan');
const doc1Rejected = SCQStorage.getDocumentById('doc_01');
assert(doc1Rejected.status === 'Rejected' && doc1Rejected.rejectionReason.includes('300 DPI'), 'Document marked Rejected with rejection reason stored');

// Student re-uploads
SCQStorage.updateDocumentFile('doc_01', '10th_Marksheet_HighRes.pdf', '3.4 MB');
assert(SCQStorage.getDocumentById('doc_01').status === 'Pending Verification', 'Re-uploaded document resets to Pending Verification');

// Admin approves
SCQStorage.reviewDocument('doc_01', true);
assert(SCQStorage.getDocumentById('doc_01').status === 'Verified', 'Document successfully verified by Admin');


// ----------------------------------------------------
// TEST 6: Strict Role Separation & Route Guards
// ----------------------------------------------------
console.log('\n--- TEST GROUP 6: Strict Role Separation & Guards ---');

// Load app.js checkAuthGuards
global.document = { addEventListener: () => {} };
let appCode = fs.readFileSync('js/app.js', 'utf-8');
eval(appCode);

function testGuard(user, targetPath) {
    if (user) {
        SCQStorage.setCurrentUser(user);
    } else {
        localStorage.removeItem('scq_current_user');
    }
    let redirectedTo = null;
    global.window = {
        location: {
            pathname: targetPath.startsWith('/') ? targetPath : '/' + targetPath,
            set href(val) { redirectedTo = val; },
            get href() { return redirectedTo; },
            replace(val) { redirectedTo = val; }
        }
    };
    checkAuthGuards();
    return redirectedTo;
}

// 1. Unauthenticated user accessing index.html or root -> redirects to login.html
assert(testGuard(null, 'index.html') === 'login.html', 'Unauthenticated user on index.html redirected to login.html');
assert(testGuard(null, '') === 'login.html', 'Unauthenticated user on root / redirected to login.html');
assert(testGuard(null, 'login.html') === null, 'Unauthenticated user on login.html stays on login.html (no redirect)');
assert(testGuard(null, 'login') === null, 'Unauthenticated user on clean /login stays on login (no redirect)');

// 2. Student accessing admin.html or clean /admin -> blocked and redirected to index.html
const studentUser = { role: 'student', enrollmentNumber: '21CS042', name: 'Namasvi' };
assert(testGuard(studentUser, 'admin.html') === 'index.html', 'Student blocked from admin.html and redirected to index.html');
assert(testGuard(studentUser, 'admin') === 'index.html', 'Student blocked from clean /admin and redirected to index.html');

// 3. Student accessing student pages -> allowed (no redirect)
assert(testGuard(studentUser, 'index.html') === null, 'Student allowed on index.html');
assert(testGuard(studentUser, '') === null, 'Student allowed on root /');
assert(testGuard(studentUser, 'queue.html') === null, 'Student allowed on queue.html');
assert(testGuard(studentUser, 'documents.html') === null, 'Student allowed on documents.html');

// 4. Admin accessing student pages -> blocked and redirected to admin.html
const adminUser = { role: 'admin', username: 'admin', name: 'Officer' };
assert(testGuard(adminUser, 'index.html') === 'admin.html', 'Admin blocked from index.html and redirected to admin.html');
assert(testGuard(adminUser, '') === 'admin.html', 'Admin blocked from root / and redirected to admin.html');
assert(testGuard(adminUser, 'queue.html') === 'admin.html', 'Admin blocked from queue.html and redirected to admin.html');
assert(testGuard(adminUser, 'documents.html') === 'admin.html', 'Admin blocked from documents.html and redirected to admin.html');
assert(testGuard(adminUser, 'services.html') === 'admin.html', 'Admin blocked from services.html and redirected to admin.html');

// 5. Admin accessing admin.html or clean /admin -> allowed (no redirect)
assert(testGuard(adminUser, 'admin.html') === null, 'Admin allowed on admin.html');
assert(testGuard(adminUser, 'admin') === null, 'Admin allowed on clean /admin');


// ----------------------------------------------------
// TEST 7: Sign Out & Re-initialization Check
// ----------------------------------------------------
console.log('\n--- TEST GROUP 7: Session Management & Logout ---');
SCQStorage.setCurrentUser(studentUser);
SCQStorage.logout();
assert(SCQStorage.getCurrentUser() === null, 'Logout clears user session');

// Crucial: init() should NEVER re-create a default user session!
SCQStorage.init();
assert(SCQStorage.getCurrentUser() === null, 'SCQStorage.init() does NOT re-create user session after logout');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('====================================================\n');

if (failedCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
