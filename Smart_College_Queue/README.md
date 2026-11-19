# Smart College Queue Management System — Queue Logic & Admin Workflow

A modern, responsive web application built with **HTML5, CSS3, and Vanilla JavaScript** addressing:
1. Long waiting times at administrative counters.
2. Poor visibility into queue positions and expected waiting times.
3. Delays caused by incomplete or incorrectly submitted documents.

---

## 🔐 User Authentication & Roles

The system features real role authentication with session management via [`login.html`](file:///c:/Users/khokh/OneDrive/Desktop/Smart_College_Queue/login.html):

| Role | Access Portal | Credentials | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **🎓 Student** | [`login.html`](file:///c:/Users/khokh/OneDrive/Desktop/Smart_College_Queue/login.html) → [`index.html`](file:///c:/Users/khokh/OneDrive/Desktop/Smart_College_Queue/index.html) | **Enrollment No**: `21CS042` (or any custom enrollment)<br>**Password**: `Password123` | Generate digital tokens, track live queue positions, view estimated wait times, submit documents, review rejection reasons, and resubmit corrected files. |
| **⚙️ College Admin** | [`login.html`](file:///c:/Users/khokh/OneDrive/Desktop/Smart_College_Queue/login.html) → [`admin.html`](file:///c:/Users/khokh/OneDrive/Desktop/Smart_College_Queue/admin.html) | **Username**: `admin`<br>**Password**: `admin123` (or `Password123`) | Multi-desk queue dispatch (Call Next, Complete, Cancel), Pause/Resume service counters, configure average service durations, review submitted documents with mandatory rejection feedback, and inspect real-time audit logs. |

> **Clean Zero State**: All test and duplicate data have been cleared. All counters, active queues, and serving numbers start cleanly at **zero (`0`)**, and all documents start in **"Not Submitted" (0% verified)** state. Users can register new students or sign in using their enrollment number and `Password123`.
>
> **Strict Role Isolation**: Students are strictly restricted to student portal pages and blocked from `admin.html`. Administrators are strictly restricted to `admin.html` and blocked from student portal pages. Unauthorized cross-portal navigation attempts are automatically intercepted and redirected to the user's authorized portal.

---

## ⏱️ Queue Management & Waiting-Time Logic

### 1. Separate Service Queues
Four independent administrative queues:
- **Fees Department** (Counter 1 & 2)
- **Examination Cell** (Counter 3)
- **Document Verification** (Counter 4 & 5)
- **Scholarship & Financial Aid Desk** (Counter 6)

### 2. Token Data Structure
Every token persists in `localStorage` with:
- `id`: Unique identifier (e.g., `tok_171092...`)
- `tokenNumber`: Sequential integer within that service
- `tokenCode`: Display number (e.g., `D-27`, `F-21`)
- `studentId` & `studentName`: Student identifier (e.g., `SCQ-2024-8842` / `Namasvi Patel`)
- `serviceId`: Target service counter
- `createdAt`, `servedAt`, `completedAt`, `cancelledAt`: Real ISO timestamps
- `status`: `Waiting` | `Almost Your Turn` | `Being Served` | `Completed` | `Cancelled`

### 3. Business & Dispatch Rules
- **One Active Token per Service**: A student may hold only one active token per service queue at any time. A student can join different service queues independently.
- **Single Active Turn at Desk**: A counter cannot call a new student if a student is already actively `Being Served` at that desk. The admin must first mark the consultation as `Completed` or `Cancelled`.
- **Pause Protection**: If a counter is `Paused` (e.g., for lunch break or maintenance), the "Call Next" action is disabled with an explanatory notice.
- **Recalculation on Cancellation**: Cancelled tokens immediately vacate their waiting spot, and all remaining students in that queue have their waiting times and positions dynamically recomputed.

### 4. Transparent Waiting-Time Formula
Rather than displaying arbitrary fixed numbers, waiting time is calculated dynamically as:
$$\text{Estimated Waiting Time} = \text{Number of Eligible Students Ahead} \times \text{Average Service Duration}$$
- Formatted in clean units (e.g., `18 min`, `1 hr 10 min`, `0 min`).
- Admin can adjust the average service duration per counter directly from the Admin Dashboard.
- When a counter is paused, the estimate is replaced with `Paused` to avoid misleading waiting guarantees.

---

## 📑 Document Verification Module

### Student Workflow
1. Select the required document service (Bonafide, Scholarship, Transcript).
2. Review the checklist of required certificates.
3. Upload PDF, JPG, or PNG files (up to 5 MB).
4. Files immediately transition to `Pending Verification`.
5. If rejected by the admin, review the specific rejection reason provided and click **"Re-upload Corrected File"** to resubmit.

### Admin Review Workflow
- Admin reviews pending submissions in [`admin.html`](file:///c:/Users/khokh/OneDrive/Desktop/Smart_College_Queue/admin.html).
- **Verify**: One-click approval changes status to `Verified`.
- **Reject**: Opens a modal where entering a specific rejection reason is **mandatory** (enforced by validation).
- **Overall Application Status Rules**:
  - `Pending Verification`: If one or more submitted documents await review.
  - `Rejected`: If any required document is rejected.
  - `Verified`: Only when all required documents have been verified.

> **Storage Constraint:** As required for a frontend-only prototype, file metadata (filename, size, timestamps, review notes) is stored in `localStorage`. Raw binary file streams are not saved into browser memory to prevent quota overflow errors.

---

## 🧪 Testing the 15 End-to-End Scenarios

| Step | Scenario | How to Test | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **1** | Student generates a Fees token | Click "Generate Digital Token" on dashboard, pick "Fees Department" | Token `#F-24` created and added to queue. |
| **2** | Refresh page | Refresh browser window | Token persists in localStorage and remains active on dashboard and `queue.html`. |
| **3** | Prevent duplicate active token | Try generating another Fees token for Namasvi | Error banner: *"You already have an active token for Fees Department."* |
| **4** | Another student joins queue | In `admin.html`, click "+ Add Student" on Fees card | Adds "Rohan Deshmukh" to the queue behind existing students. |
| **5** | Admin calls next student | In `admin.html`, click "Call Next Student" on Fees card | If current student is served, completes turn and calls `#F-22`. |
| **6** | Dynamic waiting times update | View `queue.html` | People ahead decreases and wait time updates dynamically. |
| **7** | Complete current token | In `admin.html`, click "✓ Mark Completed" | Frees counter; status becomes `Completed` and archived in history. |
| **8** | Student cancels waiting token | Click "Cancel Token" in `queue.html` with confirmation dialog | Token cancelled; all waiting positions behind it advance by 1. |
| **9** | Student submits document | Go to `documents.html`, click "Upload Document" | File selected; status becomes `Pending Verification`. |
| **10** | Admin rejects with reason | Go to `admin.html`, click "✕ Reject" | Requires feedback; rejection appears on student's `documents.html`. |
| **11** | Mandatory reason validation | Try submitting rejection modal with empty text | Validation error: *"A rejection reason is required."* |
| **12** | Student resubmits document | Click "Re-upload Corrected File" on `documents.html` | Status transitions from `Rejected` back to `Pending Verification`. |
| **13** | Admin approves all documents | In `admin.html`, click "✓ Verify" on remaining documents | Overall application status transitions to `Verified`. |
| **14** | Pause counter | In `admin.html`, click "⏸ Pause Counter" | Counter displays `Paused`; student queue shows estimates suspended. |
| **15** | Demo Reset | Click "↺ Reset Demo Data" on admin header or profile page | Restores default demo state (`#D-27` waiting, `#D-21` serving). |

---

## 📁 Project Structure

```
Smart_College_Queue/
├── index.html            # Student dashboard
├── admin.html            # College Admin Operations Desk
├── queue.html            # Live queue tracking & token screen
├── documents.html        # Document verification workflow
├── services.html         # Administrative service counter catalog
├── my-tokens.html        # Token history and active token list
├── notifications.html    # Queue notifications and updates
├── profile.html          # Student profile & ID card
├── test-logic.js         # Automated Node.js test suite for queue & verification logic
├── README.md             # Documentation
├── css/
│   ├── style.css         # Design system, cards, tables & modal styling
│   └── responsive.css    # Responsive media queries (desktop, tablet, mobile)
└── js/
    ├── storage.js        # localStorage state, queue logic, pause rules, and calculations
    ├── admin.js          # Admin dashboard controller (dispatch, pause, duration, review)
    ├── app.js            # Global navbar, modals, toasts, student info
    ├── queue.js          # Live queue tracking, dynamic wait duration, turn alerts
    └── documents.js      # Student document upload & application status tracking
```

---

## 🚀 Running the Application

A local development server is running on port 8000:
- **Student Portal**: [http://localhost:8000/index.html](http://localhost:8000/index.html)
- **Admin Operations Desk**: [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

To restart the server manually:
```powershell
python -m http.server 8000
```
To run the automated verification test suite:
```powershell
node test-logic.js
```
