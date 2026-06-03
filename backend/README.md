# QRDocument Backend API

Complete production-ready Node.js backend for Offline QR Code PDF Management and Access System.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

Server runs on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── db/
│   │   └── init.js           # Database initialization & schema
│   ├── middleware/
│   │   └── auth.js           # JWT & role-based access control
│   ├── routes/
│   │   ├── auth.js           # Authentication (login/register)
│   │   ├── users.js          # User management
│   │   ├── categories.js     # Category management
│   │   ├── documents.js      # Document management & uploads
│   │   └── dashboard.js      # Dashboard stats & logs
│   └── index.js              # Main app server
├── uploads/
│   ├── pdfs/                 # Uploaded PDF files
│   └── qrcodes/              # Generated QR code images
├── package.json
├── .env                      # Environment variables
└── data.db                   # SQLite database
```

## 🔐 Authentication

### Register

```
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: { token, user }
```

### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: { token, user }
```

**All subsequent requests require:**

```
Authorization: Bearer <token>
```

## 👥 User Management

### Create User (ADMIN/SUPER_ADMIN)

```
POST /api/users
Authorization: Bearer <token>

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "VIEWER"  // VIEWER | ADMIN | SUPER_ADMIN
}
```

### Get All Users (ADMIN/SUPER_ADMIN)

```
GET /api/users
Authorization: Bearer <token>
```

### Get User Profile

```
GET /api/users/profile/:userId
Authorization: Bearer <token>
```

### Delete User (SUPER_ADMIN)

```
DELETE /api/users/:userId
Authorization: Bearer <token>
```

## 📂 Category Management

### Create Category (ADMIN/SUPER_ADMIN)

```
POST /api/categories
Authorization: Bearer <token>

{
  "name": "Financial Documents",
  "description": "All financial records"
}
```

### Get All Categories

```
GET /api/categories
Authorization: Bearer <token>
```

### Get Single Category

```
GET /api/categories/:categoryId
Authorization: Bearer <token>
```

### Delete Category (ADMIN/SUPER_ADMIN)

```
DELETE /api/categories/:categoryId
Authorization: Bearer <token>
```

## 📄 Document Management

### Upload Document (ADMIN/SUPER_ADMIN)

```
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Fields:
- file: <PDF file>
- title: "Document Title"
- description: "Document description"
- categoryId: 1 (optional)
```

**Auto-generated response:**

- Document ID: PDF000001 format
- QR Code: Automatically generated and stored

### Get All Documents

```
GET /api/documents?search=title&categoryId=1&limit=50&offset=0
Authorization: Bearer <token>
```

### Get Single Document

```
GET /api/documents/:documentId
Authorization: Bearer <token>
```

### Download Document

```
GET /api/documents/:documentId/download
Authorization: Bearer <token>
```

### Get QR Code

```
GET /api/documents/:documentId/qr
Authorization: Bearer <token>
```

### Search Documents

```
GET /api/documents/search?query=text&type=all
Authorization: Bearer <token>

type: 'all' | 'title' | 'document_id'
```

### Delete Document (ADMIN/SUPER_ADMIN)

```
DELETE /api/documents/:documentId
Authorization: Bearer <token>
```

## 📊 Dashboard

### Get Stats

```
GET /api/dashboard/stats
Authorization: Bearer <token>

Response: {
  stats: {
    totalDocuments,
    totalUsers,
    totalCategories
  },
  recentDocuments: [...],
  categoryStats: [...]
}
```

### Get Access Logs

```
GET /api/dashboard/logs?limit=100&offset=0
Authorization: Bearer <token>
```

### Get User Activity

```
GET /api/dashboard/user-activity/:userId?limit=50&offset=0
Authorization: Bearer <token>
```

## 🔑 Role-Based Access Control

| Role        | Users              | Categories    | Documents     | Dashboard   |
| ----------- | ------------------ | ------------- | ------------- | ----------- |
| SUPER_ADMIN | Create/View/Delete | Create/Delete | Upload/Delete | Full Access |
| ADMIN       | View/Create        | Create/Delete | Upload/Delete | Full Access |
| VIEWER      | View Profile       | View          | View/Download | View Stats  |

## 📋 Database Schema

### users

- id (INTEGER PRIMARY KEY)
- first_name, last_name (TEXT)
- email (TEXT UNIQUE)
- password (TEXT)
- role (TEXT) - SUPER_ADMIN | ADMIN | VIEWER
- created_at (TEXT)

### categories

- id (INTEGER PRIMARY KEY)
- name (TEXT UNIQUE)
- description (TEXT)
- created_at (TEXT)

### documents

- id (INTEGER PRIMARY KEY)
- document_id (TEXT UNIQUE) - Format: PDF000001
- title, description (TEXT)
- category_id (INTEGER FK)
- file_path, file_name (TEXT)
- file_size (INTEGER)
- status (TEXT) - ACTIVE | DELETED
- uploaded_by (INTEGER FK)
- uploaded_at (TEXT)
- deleted_at (TEXT)

### qr_codes

- id (INTEGER PRIMARY KEY)
- document_id (TEXT UNIQUE FK)
- qr_code_path (TEXT)
- qr_data (TEXT)
- created_at (TEXT)

### access_logs

- id (INTEGER PRIMARY KEY)
- user_id, document_id (FK)
- action (TEXT) - VIEW | DOWNLOAD | UPLOAD | DELETE
- ip_address (TEXT)
- accessed_at (TEXT)

## 🛡️ Security Features

- JWT authentication (7-day expiry)
- bcrypt password hashing (salt rounds: 10)
- Role-based access control
- Input validation with Zod
- SQL injection prevention (prepared statements)
- CORS enabled
- Rate limiting ready
- Access logging for all operations
- Soft delete for documents

## 🌍 Environment Variables

```env
PORT=3000                                    # Server port
NODE_ENV=development                         # Environment
JWT_SECRET=kyoku-secret-key-change-in...    # JWT signing secret
DATABASE_URL=./data.db                      # SQLite path
CORS_ORIGIN=http://localhost:8081           # CORS allowed origin
MAX_FILE_SIZE=52428800                      # Max upload: 50MB
UPLOAD_DIR=./uploads                        # Upload directory
```

## 📦 Dependencies

- express - Web framework
- cors - CORS handling
- jsonwebtoken - JWT auth
- bcryptjs - Password hashing
- multer - File uploads
- qrcode - QR code generation
- better-sqlite3 - SQLite database
- dotenv - Environment variables
- helmet - Security headers
- zod - Input validation

## ✅ Testing the API

### 1. Register & Login

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"password123"}'
```

### 2. Create Category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Finance","description":"Financial docs"}'
```

### 3. Upload Document

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "title=My Document" \
  -F "categoryId=1"
```

## 🐛 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description"
}
```

HTTP Status Codes:

- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## 📝 License

ISC
