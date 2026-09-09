# Student Gateway - Student Certificate Attestations (تصاديق الشهادات)

A modern, production-grade full-stack web application to automate and manage **Student Certificate Attestations (تصاديق الشهادات)**, replacing manual Excel sheets with an indexed relational database, instant search, and strict input validation.

---

## 1. Features
- **Relational Database with B-Tree Indexing**: Instant lookups by `security_number` (barcode/token) and `student_name`.
- **Strict 4-Part Name Validation (الاسم الرباعي الكامل)**: Real-time word counter and validation preventing incomplete names.
- **Academic Year Format Enforcement**: Standardized `YYYY/YYYY` consecutive year validation.
- **Duplicate Prevention**: Rejects duplicate security numbers with clear HTTP 409 responses.
- **Instant Live Search**: Debounced search across security numbers, student names, and schools without page reload.
- **Bilingual Arabic/English UI**: Built for educational ministries and school administrations.
- **Excel & CSV Export**: 1-click export to download up-to-date attestation lists for administrative auditing.
- **Official Attestation Slip Preview**: Digital attestation card with printable view.

---

## 2. Database Schema (`certificate_requests`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` / `BIGINT` | Primary Key, Auto-increment |
| `student_name` | `VARCHAR(255)` | Student 4-part full name (الاسم الرباعي) |
| `school_name` | `VARCHAR(255)` | Issuing school or institution |
| `grade_level` | `VARCHAR(50)` | e.g., 'Grade 12', 'الثالث الثانوي' |
| `security_number` | `VARCHAR(100)` | Unique security / barcode attestation code (**INDEXED**) |
| `request_date` | `DATE` | Submission date (default: today) |
| `academic_year` | `VARCHAR(9)` | e.g., '2025/2026' (Format: `YYYY/YYYY`) |
| `status` | `VARCHAR(30)` | `'PENDING'`, `'VERIFIED'`, `'REJECTED'` |
| `notes` | `TEXT` | Internal administrative remarks |
| `created_at` | `TIMESTAMP` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | Record modification timestamp |

### Indexes
- `CREATE UNIQUE INDEX idx_cert_security_number ON certificate_requests (security_number);`
- `CREATE INDEX idx_cert_student_name ON certificate_requests (student_name);`
- `CREATE INDEX idx_cert_academic_year_school ON certificate_requests (academic_year, school_name);`
- `CREATE INDEX idx_cert_status ON certificate_requests (status);`

---

## 3. RESTful API Endpoints

### 1. Retrieve Paginated Certificates
```http
GET /api/certificates?page=1&limit=10&search=SEC-2025&status=VERIFIED&academic_year=2025/2026
```
**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_name": "أحمد محمد عبد الله السعيد",
      "school_name": "ثانوية القدس النموذجية للبنين",
      "grade_level": "Grade 12",
      "security_number": "SEC-2025-00101",
      "request_date": "2026-09-08",
      "academic_year": "2025/2026",
      "status": "VERIFIED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 2. Create Certificate Request
```http
POST /api/certificates
Content-Type: application/json

{
  "student_name": "سارة خالد إبراهيم المنصور",
  "school_name": "ثانوية اليرموك للبنات",
  "grade_level": "Grade 12",
  "security_number": "SEC-2025-00199",
  "academic_year": "2025/2026",
  "request_date": "2026-09-09",
  "status": "PENDING",
  "notes": "Original graduation certificate verified"
}
```

### 3. Quick Verification by Security Number
```http
GET /api/certificates/verify/:securityNumber
```

### 4. Update Status
```http
PATCH /api/certificates/:id/status
Content-Type: application/json

{
  "status": "VERIFIED"
}
```

### 5. Export to Excel/CSV
```http
GET /api/certificates/export
```

---

## 4. How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Application**:
   ```bash
   npm start
   ```

3. **Open in Browser**:
   Visit [http://localhost:3000](http://localhost:3000)
