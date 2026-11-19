/**
 * Smart College Queue Management System
 * storage.js - Centralized localStorage state management, authentication, queue logic, and admin workflow
 */

const STORAGE_KEYS = {
    STUDENTS_REGISTRY: 'scq_students_registry',
    CURRENT_USER: 'scq_current_user',
    SERVICES: 'scq_services_list',
    TOKENS: 'scq_user_tokens',
    NOTIFICATIONS: 'scq_notifications',
    DOCUMENTS: 'scq_documents_data',
    ACTIVITY_LOGS: 'scq_activity_logs'
};

// Fixed Admin Credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
    name: 'College Admin Officer',
    role: 'admin',
    department: 'Central Administration Office',
    email: 'admin@college.edu'
};

// Default registered demo students (Password: Password123)
const DEFAULT_STUDENTS = [
    {
        id: 'SCQ-2024-8842',
        enrollmentNo: '21CS042',
        enrollmentNumber: '21CS042',
        password: 'Password123',
        name: 'Namasvi Patel',
        email: 'namasvi.patel@college.edu',
        phone: '+91 98765 43210',
        department: 'Computer Science & Engineering',
        semester: '6th Semester (Year 3)',
        avatar: 'NP',
        role: 'student'
    }
];

// Clean Service counters - Starting at zero!
const DEFAULT_SERVICES = [
    {
        id: 'fees',
        code: 'F',
        name: 'Fees Department',
        shortDesc: 'Pay fees and view receipts.',
        fullDesc: 'Semester tuition fees, hostel fees, bus pass payments, exam fee clearance, and official fee receipt generation.',
        icon: 'credit-card',
        location: 'Admin Block, Ground Floor - Counter 1 & 2',
        counterName: 'Counter 1',
        operatingHours: '09:30 AM - 04:30 PM',
        currentServingNumber: 0,
        totalInQueue: 0,
        avgWaitPerPersonMinutes: 4,
        isPaused: false,
        pausedReason: ''
    },
    {
        id: 'exam',
        code: 'E',
        name: 'Examination Cell',
        shortDesc: 'Hall tickets, results, and exam-related requests.',
        fullDesc: 'Hall ticket issuance, grade card verification, re-evaluation applications, backlog inquiry, and duplicate marksheet requests.',
        icon: 'book-open',
        location: 'Admin Block, Ground Floor - Counter 3',
        counterName: 'Counter 3',
        operatingHours: '10:00 AM - 04:00 PM',
        currentServingNumber: 0,
        totalInQueue: 0,
        avgWaitPerPersonMinutes: 5,
        isPaused: false,
        pausedReason: ''
    },
    {
        id: 'documents',
        code: 'D',
        name: 'Document Verification',
        shortDesc: 'Certificates, transcripts, bonafide certificates, and other documents.',
        fullDesc: 'Bonafide certificate issuance, transcript verification, transfer/migration certificate, attestation, and document validation.',
        icon: 'file-check',
        location: 'Admin Block, Ground Floor - Counter 4 & 5',
        counterName: 'Counter 4',
        operatingHours: '09:30 AM - 05:00 PM',
        currentServingNumber: 0,
        totalInQueue: 0,
        avgWaitPerPersonMinutes: 4,
        isPaused: false,
        pausedReason: ''
    },
    {
        id: 'scholarship',
        code: 'S',
        name: 'Scholarship Desk',
        shortDesc: 'Scholarship applications and status tracking.',
        fullDesc: 'Post-matric scholarship physical verification, government NSP/SSP portal queries, fee waiver verification, and trust grants.',
        icon: 'award',
        location: 'Admin Block, 1st Floor - Counter 6',
        counterName: 'Counter 6',
        operatingHours: '10:30 AM - 03:30 PM',
        currentServingNumber: 0,
        totalInQueue: 0,
        avgWaitPerPersonMinutes: 6,
        isPaused: false,
        pausedReason: ''
    }
];

// Clean Zero Tokens (No pre-seeded active or test tokens)
const DEFAULT_TOKENS = [];

// Clean Document checklist templates - All starting at Not Submitted (0% verified)
const DEFAULT_DOCUMENTS = [
    {
        id: 'doc_01',
        applicationId: 'APP-BONA-2024',
        category: 'Bonafide Certificate',
        title: 'College ID Card Copy',
        requirementText: 'Clear scanned front and back of current academic year student ID card.',
        required: true,
        fileName: '',
        fileSize: '',
        fileType: '',
        uploadedAt: null,
        status: 'Not Submitted',
        verifiedBy: '',
        verifiedAt: null,
        rejectionReason: '',
        instructions: 'Please upload a clear scan of your college ID card (PDF, JPG, PNG).'
    },
    {
        id: 'doc_02',
        applicationId: 'APP-BONA-2024',
        category: 'Bonafide Certificate',
        title: 'Current Semester Fee Receipt',
        requirementText: 'Official bank deposit slip or college ERP online payment receipt.',
        required: true,
        fileName: '',
        fileSize: '',
        fileType: '',
        uploadedAt: null,
        status: 'Not Submitted',
        verifiedBy: '',
        verifiedAt: null,
        rejectionReason: '',
        instructions: 'Upload bank payment slip or college fees receipt.'
    },
    {
        id: 'doc_03',
        applicationId: 'APP-SCHOL-2024',
        category: 'Scholarship Application',
        title: 'Income Certificate (2023-24)',
        requirementText: 'State revenue authority issued certificate with valid digital signature.',
        required: true,
        fileName: '',
        fileSize: '',
        fileType: '',
        uploadedAt: null,
        status: 'Not Submitted',
        verifiedBy: '',
        verifiedAt: null,
        rejectionReason: '',
        instructions: 'Upload government income certificate with digital verification seal.'
    },
    {
        id: 'doc_04',
        applicationId: 'APP-SCHOL-2024',
        category: 'Scholarship Application',
        title: 'Community / Caste Certificate',
        requirementText: 'Competent revenue officer issued permanent caste certificate.',
        required: true,
        fileName: '',
        fileSize: '',
        fileType: '',
        uploadedAt: null,
        status: 'Not Submitted',
        verifiedBy: '',
        verifiedAt: null,
        rejectionReason: '',
        instructions: 'Upload permanent caste certificate issued by competent authority.'
    },
    {
        id: 'doc_05',
        applicationId: 'APP-TRANS-2024',
        category: 'Transcript & Migration',
        title: 'Previous Semester Marksheets (Sem 1 to 5)',
        requirementText: 'Consolidated PDF of all grade cards with verified seal from Exam Cell.',
        required: true,
        fileName: '',
        fileSize: '',
        fileType: '',
        uploadedAt: null,
        status: 'Not Submitted',
        verifiedBy: '',
        verifiedAt: null,
        rejectionReason: '',
        instructions: 'Upload a single compiled PDF file under 5 MB.'
    },
    {
        id: 'doc_06',
        applicationId: 'APP-TRANS-2024',
        category: 'Transcript & Migration',
        title: 'No Dues Clearance Certificate',
        requirementText: 'Signed clearance from Central Library, Sports Dept, and Hostel Warden.',
        required: false,
        fileName: '',
        fileSize: '',
        fileType: '',
        uploadedAt: null,
        status: 'Not Submitted',
        verifiedBy: '',
        verifiedAt: null,
        rejectionReason: '',
        instructions: 'Obtain signatures on physical form and upload high-res scan.'
    }
];

// Clean Notifications & Activity
const DEFAULT_NOTIFICATIONS = [];
const DEFAULT_ACTIVITY_LOGS = [];

/**
 * Format minutes into clean human-readable wait time
 */
function formatWaitDuration(mins) {
    if (mins <= 0) return '0 min';
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (remMins === 0) return `${hours} hr`;
    return `${hours} hr ${remMins} min`;
}

/**
 * Centralized Storage Controller & Authentication Manager
 */
const SCQStorage = {
    // Initialize storage structures
    init() {
        if (!localStorage.getItem(STORAGE_KEYS.STUDENTS_REGISTRY)) {
            localStorage.setItem(STORAGE_KEYS.STUDENTS_REGISTRY, JSON.stringify(DEFAULT_STUDENTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.SERVICES)) {
            localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
        }
        if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
            localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(DEFAULT_TOKENS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
            localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(DEFAULT_DOCUMENTS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
            localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(DEFAULT_NOTIFICATIONS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
            localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(DEFAULT_ACTIVITY_LOGS));
        }
    },

    // -------------------------------------------------------------
    // Authentication & Enrollment
    // -------------------------------------------------------------
    getRegisteredStudents() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS_REGISTRY)) || DEFAULT_STUDENTS;
        } catch (e) {
            return DEFAULT_STUDENTS;
        }
    },

    saveRegisteredStudents(students) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS_REGISTRY, JSON.stringify(students));
    },

    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) || null;
        } catch (e) {
            return null;
        }
    },

    setCurrentUser(user) {
        if (user) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        } else {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        }
        return user;
    },

    // Student Login by Enrollment Number & Password
    loginStudent(enrollmentNo, password) {
        const enNo = (enrollmentNo || '').trim().toUpperCase();
        const pwd = (password || '').trim();

        if (!enNo || !pwd) {
            throw new Error('Please enter both your Enrollment Number and Password.');
        }

        if (pwd !== 'Password123') {
            throw new Error('Invalid password. Student default password is Password123.');
        }

        const students = this.getRegisteredStudents();
        let student = students.find(s => (s.enrollmentNo || s.enrollmentNumber || '').toUpperCase() === enNo);

        if (!student) {
            // Auto-enroll if student provides valid Password123
            const studentId = 'SCQ-2024-' + Math.floor(1000 + Math.random() * 9000);
            const initials = enNo.substring(0, 2).toUpperCase() || 'ST';
            student = {
                id: studentId,
                enrollmentNo: enNo,
                enrollmentNumber: enNo,
                password: 'Password123',
                name: `Student (${enNo})`,
                email: `${enNo.toLowerCase()}@college.edu`,
                phone: '+91 98000 00000',
                department: 'Engineering & Technology',
                semester: 'Semester 1',
                avatar: initials,
                role: 'student'
            };
            students.push(student);
            this.saveRegisteredStudents(students);
        } else {
            student.enrollmentNumber = student.enrollmentNo || student.enrollmentNumber || enNo;
        }

        this.setCurrentUser(student);
        this.logActivity('Student Login', `Student ${student.name} (${enNo}) logged in.`);
        return student;
    },

    // Student Enrollment / Sign Up
    enrollStudent(studentData) {
        const enNo = (studentData.enrollmentNo || studentData.enrollmentNumber || '').trim().toUpperCase();
        const name = (studentData.name || '').trim();
        const dept = (studentData.department || 'Computer Science & Engineering').trim();
        const pwd = (studentData.password || '').trim() || 'Password123';

        if (!enNo) throw new Error('Enrollment Number is required.');
        if (!name) throw new Error('Student Full Name is required.');
        if (pwd !== 'Password123') {
            throw new Error('Password must be Password123 as specified by college administration policy.');
        }

        const students = this.getRegisteredStudents();
        const existing = students.find(s => (s.enrollmentNo || s.enrollmentNumber || '').toUpperCase() === enNo);
        if (existing) {
            throw new Error(`Enrollment number ${enNo} is already registered. Please sign in directly.`);
        }

        const words = name.split(' ');
        const avatar = (words[0][0] + (words[1] ? words[1][0] : '')).toUpperCase() || 'ST';
        const newStudent = {
            id: 'SCQ-2024-' + Math.floor(1000 + Math.random() * 9000),
            enrollmentNo: enNo,
            enrollmentNumber: enNo,
            password: 'Password123',
            name: name,
            email: `${enNo.toLowerCase()}@college.edu`,
            phone: studentData.phone || '+91 98765 43210',
            department: dept,
            semester: studentData.semester || 'Semester 1',
            avatar: avatar,
            role: 'student'
        };

        students.push(newStudent);
        this.saveRegisteredStudents(students);
        this.setCurrentUser(newStudent);
        this.logActivity('Student Enrolled', `New student enrolled: ${name} (${enNo})`);
        return newStudent;
    },

    // Admin Login with Fixed Credentials (admin / admin123 or Password123)
    loginAdmin(username, password) {
        const u = (username || '').trim().toLowerCase();
        const p = (password || '').trim();

        if (!u || !p) {
            throw new Error('Please enter both Admin Username and Password.');
        }

        if (u !== 'admin' && u !== 'admin@college.edu') {
            throw new Error('Invalid Admin Username. Use "admin" for college admin access.');
        }

        if (p !== 'admin123' && p !== 'Password123') {
            throw new Error('Invalid Admin Password. Fixed admin password is: admin123');
        }

        const adminUser = { ...ADMIN_CREDENTIALS };
        this.setCurrentUser(adminUser);
        this.logActivity('Admin Login', 'College Administration Officer logged into operations desk.');
        return adminUser;
    },

    // Logout
    logout() {
        const user = this.getCurrentUser();
        if (user) {
            this.logActivity('Logout', `${user.name} logged out.`);
        }
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        if (typeof window !== 'undefined') {
            window.location.replace('login.html');
        }
    },

    // Get current student object (alias for backward compatibility)
    getStudent() {
        const user = this.getCurrentUser();
        if (user && user.role === 'student') {
            return user;
        }
        const registry = this.getRegisteredStudents();
        return registry[0] || DEFAULT_STUDENTS[0];
    },

    // -------------------------------------------------------------
    // Services Management
    // -------------------------------------------------------------
    getServices() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES)) || DEFAULT_SERVICES;
        } catch (e) {
            return DEFAULT_SERVICES;
        }
    },

    getServiceById(serviceId) {
        const services = this.getServices();
        return services.find(s => s.id === serviceId) || null;
    },

    updateService(updatedService) {
        const services = this.getServices().map(s => s.id === updatedService.id ? updatedService : s);
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
        return updatedService;
    },

    toggleServicePause(serviceId, reason = '') {
        const service = this.getServiceById(serviceId);
        if (!service) throw new Error('Service counter not found.');

        service.isPaused = !service.isPaused;
        service.pausedReason = service.isPaused ? (reason || 'Staff Break / Maintenance') : '';
        this.updateService(service);

        const statusAction = service.isPaused ? 'Paused' : 'Resumed';
        this.logActivity(`Counter ${statusAction}`, `${service.name} was ${statusAction.toLowerCase()}`);
        this.addNotification({
            title: `Counter Notice: ${service.name} ${statusAction}`,
            message: service.isPaused 
                ? `${service.name} counter is temporarily paused. Waiting times are suspended until the desk resumes.`
                : `${service.name} counter has resumed operations.`,
            type: service.isPaused ? 'alert' : 'info',
            badge: statusAction
        });

        return service;
    },

    updateServiceDuration(serviceId, durationMinutes) {
        const service = this.getServiceById(serviceId);
        if (!service) throw new Error('Service counter not found.');
        const mins = parseInt(durationMinutes, 10);
        if (isNaN(mins) || mins < 1 || mins > 60) {
            throw new Error('Service duration must be between 1 and 60 minutes.');
        }

        service.avgWaitPerPersonMinutes = mins;
        this.updateService(service);
        this.logActivity('Duration Updated', `${service.name} duration set to ${mins} mins`);
        return service;
    },

    // -------------------------------------------------------------
    // Token & Queue Management
    // -------------------------------------------------------------
    getTokens() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.TOKENS)) || [];
        } catch (e) {
            return [];
        }
    },

    getActiveTokens() {
        const tokens = this.getTokens();
        return tokens.filter(t => t.status === 'Waiting' || t.status === 'Almost Your Turn' || t.status === 'Being Served');
    },

    getStudentActiveTokens(studentId) {
        const active = this.getActiveTokens();
        return active.filter(t => t.studentId === studentId);
    },

    getActiveTokenForService(serviceId, studentId = null) {
        const active = this.getActiveTokens();
        return active.find(t => t.serviceId === serviceId && (!studentId || t.studentId === studentId)) || null;
    },

    getTokenById(tokenId) {
        const tokens = this.getTokens();
        return tokens.find(t => t.id === tokenId) || null;
    },

    saveToken(token) {
        const tokens = this.getTokens();
        const existingIdx = tokens.findIndex(t => t.id === token.id);
        if (existingIdx >= 0) {
            tokens[existingIdx] = token;
        } else {
            tokens.unshift(token); // newest first
        }
        localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
        return token;
    },

    // Generate Token
    generateToken(serviceId, category = '', note = '', studentObj = null) {
        const service = this.getServiceById(serviceId);
        if (!service) throw new Error('Invalid service specified.');

        const student = studentObj || this.getStudent();
        if (!student) throw new Error('Please sign in as a student to generate a token.');

        // Rule: Only one active token per student per service
        const existingActive = this.getActiveTokenForService(serviceId, student.id);
        if (existingActive) {
            throw new Error(`You already have an active token (#${existingActive.tokenCode}) for ${service.name}. Please wait or cancel your existing token.`);
        }

        // Sequential token numbering starting from 1
        const allServiceTokens = this.getTokens().filter(t => t.serviceId === serviceId);
        const maxNum = allServiceTokens.reduce((max, t) => Math.max(max, t.tokenNumber || 0), 0);
        const nextTokenNumber = maxNum + 1;
        const tokenCode = `${service.code}-${nextTokenNumber}`;

        const waitingAhead = allServiceTokens.filter(t => t.status === 'Waiting' || t.status === 'Almost Your Turn').length;
        const estWaitMins = waitingAhead * service.avgWaitPerPersonMinutes;

        const newToken = {
            id: 'tok_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            tokenNumber: nextTokenNumber,
            tokenCode: tokenCode,
            studentId: student.id,
            studentName: student.name,
            serviceId: service.id,
            serviceName: service.name,
            serviceLocation: service.location,
            category: category || `${service.name} Request`,
            createdAt: new Date().toISOString(),
            status: 'Waiting',
            counterNumber: service.counterName || 'Counter 1',
            studentNote: note
        };

        this.saveToken(newToken);

        // Update service queue size
        service.totalInQueue = (service.totalInQueue || 0) + 1;
        this.updateService(service);

        this.logActivity('Token Generated', `Token #${tokenCode} generated for ${student.name} (${service.name})`);

        this.addNotification({
            title: `Token Generated: #${tokenCode}`,
            message: `Your token #${tokenCode} for ${service.name} is ready. There are currently ${waitingAhead} students ahead.`,
            type: 'queue',
            badge: 'Token Created'
        });

        return newToken;
    },

    // Call Next Student (Admin Action)
    callNextStudent(serviceId) {
        const service = this.getServiceById(serviceId);
        if (!service) throw new Error('Service counter not found.');

        if (service.isPaused) {
            throw new Error(`Cannot call student: ${service.name} is currently PAUSED (${service.pausedReason || 'Break'}). Please resume the counter first.`);
        }

        // Check if counter is already serving someone
        const activeServiceTokens = this.getActiveTokens().filter(t => t.serviceId === serviceId);
        const currentlyServed = activeServiceTokens.find(t => t.status === 'Being Served');
        if (currentlyServed) {
            throw new Error(`Counter is already serving Token #${currentlyServed.tokenCode} (${currentlyServed.studentName}). Please mark it completed or cancelled before calling the next student.`);
        }

        // Get first waiting student (FIFO)
        const waitingTokens = activeServiceTokens
            .filter(t => t.status === 'Waiting' || t.status === 'Almost Your Turn')
            .sort((a, b) => a.tokenNumber - b.tokenNumber);

        if (waitingTokens.length === 0) {
            throw new Error(`No students are currently waiting in the ${service.name} queue.`);
        }

        const nextToken = waitingTokens[0];
        nextToken.status = 'Being Served';
        nextToken.servedAt = new Date().toISOString();
        this.saveToken(nextToken);

        // Update service currently serving display
        service.currentServingNumber = nextToken.tokenNumber;
        if (service.totalInQueue > 0) {
            service.totalInQueue -= 1;
        }
        this.updateService(service);

        // Recalculate remaining queue
        this.recalculateServiceQueue(serviceId);

        this.logActivity('Token Called', `Counter called Token #${nextToken.tokenCode} (${nextToken.studentName})`);

        this.addNotification({
            title: `Now Serving: Token #${nextToken.tokenCode}!`,
            message: `Please proceed immediately to ${service.location}. Your token is being called at ${nextToken.counterNumber}.`,
            type: 'success',
            badge: 'Calling You!'
        });

        return nextToken;
    },

    // Complete Token
    completeToken(tokenId) {
        const token = this.getTokenById(tokenId);
        if (!token) throw new Error('Token not found.');

        if (token.status !== 'Being Served') {
            throw new Error(`Cannot complete Token #${token.tokenCode} because status is "${token.status}". Only tokens "Being Served" can be completed.`);
        }

        token.status = 'Completed';
        token.completedAt = new Date().toISOString();
        this.saveToken(token);

        this.logActivity('Token Completed', `Token #${token.tokenCode} (${token.studentName}) completed at ${token.counterNumber}`);

        this.addNotification({
            title: `Service Finished: Token #${token.tokenCode}`,
            message: `Your appointment for ${token.serviceName} has concluded. Thank you!`,
            type: 'success',
            badge: 'Completed'
        });

        return token;
    },

    // Cancel Token
    cancelToken(tokenId, cancelledBy = 'Student') {
        const token = this.getTokenById(tokenId);
        if (!token) throw new Error('Token not found.');

        if (token.status === 'Completed') {
            throw new Error('Cannot cancel an already completed token.');
        }
        if (token.status === 'Cancelled') {
            throw new Error('Token is already cancelled.');
        }

        token.status = 'Cancelled';
        token.cancelledAt = new Date().toISOString();
        this.saveToken(token);

        const service = this.getServiceById(token.serviceId);
        if (service && service.totalInQueue > 0) {
            service.totalInQueue -= 1;
            this.updateService(service);
        }

        this.recalculateServiceQueue(token.serviceId);
        this.logActivity('Token Cancelled', `Token #${token.tokenCode} (${token.studentName}) cancelled by ${cancelledBy}`);

        this.addNotification({
            title: `Token #${token.tokenCode} Cancelled`,
            message: `Token #${token.tokenCode} for ${token.serviceName} was cancelled by ${cancelledBy}.`,
            type: 'alert',
            badge: 'Cancelled'
        });

        return token;
    },

    // Recalculate remaining positions in service queue
    recalculateServiceQueue(serviceId) {
        const service = this.getServiceById(serviceId);
        if (!service) return;

        const waitingTokens = this.getActiveTokens()
            .filter(t => t.serviceId === serviceId && (t.status === 'Waiting' || t.status === 'Almost Your Turn'))
            .sort((a, b) => a.tokenNumber - b.tokenNumber);

        waitingTokens.forEach((token, index) => {
            const peopleAhead = index;
            if (peopleAhead <= 1) {
                if (token.status !== 'Almost Your Turn') {
                    token.status = 'Almost Your Turn';
                    this.saveToken(token);
                    this.addNotification({
                        title: `Turn Approaching: Token #${token.tokenCode}`,
                        message: `Only ${peopleAhead} student ahead of you at ${service.name}. Please keep your documents ready.`,
                        type: 'alert',
                        badge: 'Almost Turn'
                    });
                }
            } else {
                if (token.status !== 'Waiting') {
                    token.status = 'Waiting';
                    this.saveToken(token);
                }
            }
        });
    },

    // Dynamic queue position calculation
    calculateQueuePosition(token) {
        if (!token) return null;

        if (token.status === 'Completed' || token.status === 'Cancelled') {
            return {
                servingNumber: '--',
                servingCode: '--',
                peopleAhead: 0,
                estimatedWaitMins: 0,
                waitDurationFormatted: '0 min',
                progressPercent: 100,
                status: token.status,
                isPaused: false
            };
        }

        const service = this.getServiceById(token.serviceId);
        const isPaused = service ? service.isPaused : false;
        const avgMins = service ? service.avgWaitPerPersonMinutes : 4;

        if (token.status === 'Being Served') {
            return {
                servingNumber: token.tokenNumber,
                servingCode: token.tokenCode,
                peopleAhead: 0,
                estimatedWaitMins: 0,
                waitDurationFormatted: 'Now Calling!',
                progressPercent: 100,
                status: 'Being Served',
                isPaused: isPaused
            };
        }

        const allActiveServiceTokens = this.getActiveTokens()
            .filter(t => t.serviceId === token.serviceId)
            .sort((a, b) => a.tokenNumber - b.tokenNumber);

        const myIndex = allActiveServiceTokens.findIndex(t => t.id === token.id);
        const peopleAhead = myIndex >= 0 ? myIndex : 0;
        const estWaitMins = peopleAhead * avgMins;

        const currentlyServed = allActiveServiceTokens.find(t => t.status === 'Being Served');
        const servingCode = currentlyServed ? currentlyServed.tokenCode : (service && service.currentServingNumber > 0 ? `${service.code}-${service.currentServingNumber}` : 'None (Idle)');
        const servingNumber = currentlyServed ? currentlyServed.tokenNumber : (service ? service.currentServingNumber : 0);

        const totalEstimatedSpan = Math.max(1, peopleAhead + 1);
        const progressPercent = Math.min(95, Math.max(15, Math.round(((totalEstimatedSpan - peopleAhead) / totalEstimatedSpan) * 100)));

        return {
            servingNumber: servingNumber,
            servingCode: servingCode,
            peopleAhead: peopleAhead,
            estimatedWaitMins: estWaitMins,
            waitDurationFormatted: isPaused ? 'Paused' : formatWaitDuration(estWaitMins),
            progressPercent: progressPercent,
            status: token.status,
            isPaused: isPaused,
            pausedReason: service?.pausedReason || ''
        };
    },

    // -------------------------------------------------------------
    // Documents Verification
    // -------------------------------------------------------------
    getDocuments() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) || DEFAULT_DOCUMENTS;
        } catch (e) {
            return DEFAULT_DOCUMENTS;
        }
    },

    getDocumentById(docId) {
        const docs = this.getDocuments();
        return docs.find(d => d.id === docId) || null;
    },

    saveDocument(doc) {
        const docs = this.getDocuments();
        const idx = docs.findIndex(d => d.id === doc.id);
        if (idx >= 0) {
            docs[idx] = doc;
        } else {
            docs.push(doc);
        }
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
        return doc;
    },

    updateDocumentFile(docId, fileName, fileSize = '1.4 MB', fileType = 'application/pdf') {
        const doc = this.getDocumentById(docId);
        const student = this.getStudent();
        if (doc) {
            doc.fileName = fileName;
            doc.fileSize = fileSize;
            doc.fileType = fileType;
            doc.uploadedAt = new Date().toISOString();
            doc.status = 'Pending Verification';
            doc.rejectionReason = '';
            doc.instructions = 'Uploaded. Under administrative review.';
            doc.studentName = student?.name || 'Student';
            doc.studentId = student?.enrollmentNo || student?.id || 'Student ID';
            this.saveDocument(doc);

            this.logActivity('Document Submitted', `File "${fileName}" submitted for ${doc.title} (${doc.studentName})`);
            this.addNotification({
                title: `Document Submitted: ${doc.title}`,
                message: `File "${fileName}" was successfully submitted. Status: Pending Verification.`,
                type: 'info',
                badge: 'Upload'
            });
            return doc;
        }
        return null;
    },

    reviewDocument(docId, approve, rejectionReason = '', reviewerName = 'College Admin Officer') {
        const doc = this.getDocumentById(docId);
        if (!doc) throw new Error('Document record not found.');

        if (!approve) {
            const reason = (rejectionReason || '').trim();
            if (!reason) {
                throw new Error('A specific rejection reason must be provided when rejecting a student document.');
            }
            doc.status = 'Rejected';
            doc.verifiedBy = reviewerName;
            doc.verifiedAt = new Date().toISOString();
            doc.rejectionReason = reason;
            doc.instructions = 'Please review rejection reason and re-upload a clear and valid document.';

            this.logActivity('Document Rejected', `"${doc.title}" rejected: ${reason}`);
            this.addNotification({
                title: `Document Rejected: ${doc.title}`,
                message: `Your document "${doc.fileName || doc.title}" was rejected: ${reason}. Please resubmit.`,
                type: 'alert',
                badge: 'Rejected'
            });
        } else {
            doc.status = 'Verified';
            doc.verifiedBy = reviewerName;
            doc.verifiedAt = new Date().toISOString();
            doc.rejectionReason = '';
            doc.instructions = 'Document verified and approved.';

            this.logActivity('Document Verified', `"${doc.title}" verified by ${reviewerName}`);
            this.addNotification({
                title: `Document Verified: ${doc.title}`,
                message: `Your document "${doc.fileName || doc.title}" has been officially verified.`,
                type: 'success',
                badge: 'Verified'
            });
        }

        this.saveDocument(doc);
        return doc;
    },

    calculateApplicationStatus(category = null) {
        const docs = this.getDocuments();
        const filteredDocs = category ? docs.filter(d => d.category === category) : docs;

        if (filteredDocs.length === 0) return 'Not Submitted';

        const requiredDocs = filteredDocs.filter(d => d.required);
        const hasRejected = requiredDocs.some(d => d.status === 'Rejected');
        if (hasRejected) return 'Rejected';

        const hasPending = requiredDocs.some(d => d.status === 'Pending Verification');
        if (hasPending) return 'Pending Verification';

        const hasNotSubmitted = requiredDocs.some(d => d.status === 'Not Submitted');
        if (hasNotSubmitted) return 'Not Submitted';

        const allVerified = requiredDocs.every(d => d.status === 'Verified');
        if (allVerified && requiredDocs.length > 0) return 'Verified';

        return 'Not Submitted';
    },

    // -------------------------------------------------------------
    // Activity Logs & Notifications
    // -------------------------------------------------------------
    getActivityLogs() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) || [];
        } catch (e) {
            return [];
        }
    },

    logActivity(action, details) {
        const logs = this.getActivityLogs();
        logs.unshift({
            id: 'act_' + Date.now(),
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        });
        if (logs.length > 30) logs.pop();
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
    },

    getNotifications() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
        } catch (e) {
            return [];
        }
    },

    addNotification(notif) {
        const list = this.getNotifications();
        const newNotif = {
            id: 'notif_' + Date.now(),
            title: notif.title,
            message: notif.message,
            type: notif.type || 'info',
            timestamp: new Date().toISOString(),
            read: false,
            badge: notif.badge || 'Notification'
        };
        list.unshift(newNotif);
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
        return newNotif;
    },

    markAllNotificationsRead() {
        const list = this.getNotifications().map(n => ({ ...n, read: true }));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
        return list;
    },

    getUnreadNotificationsCount() {
        return this.getNotifications().filter(n => !n.read).length;
    },

    // Clean reset to ZERO
    resetAllToDefault() {
        localStorage.setItem(STORAGE_KEYS.STUDENTS_REGISTRY, JSON.stringify(DEFAULT_STUDENTS));
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
        localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(DEFAULT_DOCUMENTS));
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
    }
};

// Auto initialize on load
SCQStorage.init();
