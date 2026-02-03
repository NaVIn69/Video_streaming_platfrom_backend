<<<<<<< HEAD
# 🎥 Video Streaming Platform - Backend

> **Enterprise-Grade, Multi-Tenant Video Streaming API**
>
> built with Node.js, Express, MongoDB, and AWS.

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Layered-orange)
![Multi-Tenant](https://img.shields.io/badge/Tenancy-Multi--Tenant-blueviolet)
![AI-Powered](https://img.shields.io/badge/AI-Gemini%20Integrated-FFD700)
![License](https://img.shields.io/badge/License-ISC-grey)

## 📖 Overview

This backend powers a sophisticated **Multi-Tenant Video Streaming Platform**. It is designed to act as a SaaS foundation where distinct organizations (tenants) can manage their own video assets, users, and permissions in complete isolation.

The system features a **Clean Architecture** (Controller-Service-Repository) with **Dependency Injection**, ensuring scalability, testability, and maintainability. It goes beyond simple CRUD by implementing a complex video processing pipeline that includes **AI-based sensitivity analysis** to automatically flag unsafe content.

## 🌟 Key Features & Capabilities

### 🏗️ Advanced Architecture
-   **Clean Layered Design**: strictly separates concerns into Controllers (HTTP), Services (Business Logic), and Repositories (Data Access).
-   **Dependency Injection**: All dependencies are explicitly injected (configured in `src/config/dependencies.js`), avoiding tight coupling.
-   **Centralized Error Handling**: Unified error responses and logging.

### 🏢 Deep Multi-Tenancy
-   **Data Isolation**: All database queries are scoped by `tenantId`.
-   **Tenant-Scoped RBAC**: Roles (Admin, Editor, Viewer) are defined *within* a tenant. A user can be an Admin in one tenant and a Viewer in another.
-   **SuperAdmin Control**: A dedicated layer for platform administrators to manage tenants and global settings.

### 📹 Video Pipeline & AI
1.  **High-Performance Uploads**: Validated multipart uploads (via `multer`) directly to AWS S3.
2.  **Automated Processing**:
    -   **Frame Extraction**: `ffmpeg` extracts keyframes for analysis.
    -   **AI Analysis**: Google **Gemini AI** analyzes frames for Nudity, Violence, and other sensitive content.
    -   **Classification**: Videos are automatically marked as `SAFE`, `FLAGGED`, or `PENDING_REVIEW`.
3.  **Adaptive Streaming**: Supports **HTTP Range Requests** for smooth playback and seeking.

### ⚡ Real-Time & Security
-   **WebSocket Updates**: `Socket.io` integration pushes real-time video processing progress to the client.
-   **Security First**:
    -   `helmet` for secure HTTP headers.
    -   `express-validator` for strict input sanitization.
    -   `bcrypt` & `JWT` for robust authentication.

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js v5 |
| **Database** | MongoDB (Mongoose ODMs) |
| **Storage** | AWS S3 |
| **Processing** | FFmpeg, Fluent-FFmpeg |
| **AI / ML** | Google Generative AI (Gemini) |
| **Real-Time** | Socket.io |
| **Architecture** | Repository Pattern, Dependency Injection |
| **DevOps** | Docker, Husky, ESLint, Prettier |

## 📂 Project Structure

A detailed look at the codebase organization:

```
backend/
├── .husky/                 # Git hooks (pre-commit linting)
├── Docker/                 # Dockerfile and compose configs
├── src/
│   ├── config/             # Configuration & DI Container
│   │   ├── dependencies.js # Central Dependency Injection wiring
│   │   ├── s3.js           # AWS S3 Client setup
│   │   └── logger.js       # Winston logger config
│   ├── controllers/        # HTTP Request Handlers
│   │   └── processing...   # Orchestrate Service calls, handle responses
│   ├── middleware/         # Express Middleware
│   │   ├── auth.middleware.js   # JWT verification
│   │   ├── tenant.middleware.js # Enforces tenant isolation
│   │   └── upload.middleware.js # Multer config
│   ├── models/             # Mongoose Schemas (Data Layer)
│   │   ├── video.model.js  # Video metadata & analysis results
│   │   └── ...
│   ├── repositories/       # DBMS abstraction layer
│   │   └── ...             # Direct DB operations (Find, Save, Update)
│   ├── routes/             # API Route Definitions
│   ├── services/           # CORE Business Logic
│   │   ├── processing.service.js # Orchestrates Video -> AI pipeline
│   │   ├── sensitivity...js      # Google Gemini integration
│   │   └── ...
│   ├── socket/             # WebSocket handlers
│   ├── utils/              # Helper functions (Time, Strings)
│   ├── validators/         # Input Validation Rules (express-validator)
│   ├── app.js              # Express App setup
│   └── server.js           # Server entry point
├── .env.example            # Template for environment variables
├── API_QUICK_REFERENCE.md  # Handy API lookup
└── REFLECTION.md           # Developer notes & architectural decisions
```

## 🚀 Getting Started Guide

### 1️⃣ Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)
*   AWS Account (S3 Bucket & Access Keys)
*   Google AI Studio Key (for sensitivity analysis)

### 2️⃣ Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/NaVIn69/Video_streaming_platfrom_backend.git
cd backend
npm install
```

### 3️⃣ Environment Setup

Create a `.env.dev` file. You can base it on `.env.example`:

```bash
cp .env.example .env.dev
```

**Required Variables**:

```env
# Server
PORT=3000
NODE_ENV=dev

# Database
MONGO_URI=mongodb://localhost:27017/video_streaming

# Auth
JWT_SECRET=your_super_secure_secret
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Google AI
GEMINI_API_KEY=your_gemini_api_key

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173
```

### 4️⃣ Running the Server

**Development Mode** (Hot Reloading):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

## 🔄 Core Workflows

### 📤 Video Upload & Analysis Pipeline
1.  **Upload**: Client POSTs video to `/api/videos`. User must have `videos.upload` permission.
2.  **Storage**: `StorageService` streams file to AWS S3.
3.  **Queuing**: `VideoService` creates a database record (status: `uploading` -> `processing`).
4.  **Processing**:
    -   `ProcessingService` triggers.
    -   `ffmpeg` extracts frames.
    -   `SensitivityAnalysisService` sends frames to Gemini.
    -   Result is computed (Safe/Unsafe).
5.  **Notification**: `Socket.io` emits `video:processed` event to the tenant room.

### 🛡️ Tenant Access Control
1.  **Request**: Incoming Request contains Bearer Token.
2.  **Auth Middleware**: Decodes token, identifying `userId` and `tenantId`.
3.  **Tenant Middleware**: Verifies tenant exists and user is active within it.
4.  **RBAC Check**: usage of `checkPermission('videos.delete')` checks specific role permissions for that tenant.

## 📚 Documentation
*   **[API Quick Reference](./API_QUICK_REFERENCE.md)**: List of available endpoints and usage.
*   **[Environment Setup](./ENV_SETUP.md)**: Detailed guide on configuring external services.

## 🤝 Contributing
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
Distributed under the **ISC License**.
=======
# 🎥 Video Streaming Platform With Content Sensitivity Analysis - Backend

> **Enterprise-Grade, Multi-Tenant Video Streaming API**
>
> built with Node.js, Express, MongoDB, and AWS,FFmpeg.

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Layered-orange)
![Multi-Tenant](https://img.shields.io/badge/Tenancy-Multi--Tenant-blueviolet)
![AI-Powered](https://img.shields.io/badge/AI-Gemini%20Integrated-FFD700)
![License](https://img.shields.io/badge/License-ISC-grey)

## 📖 Overview

This backend powers a sophisticated **Multi-Tenant Video Streaming Platform**. It is designed to act as a SaaS foundation where distinct organizations (tenants) can manage their own video assets, users, and permissions in complete isolation.

The system features a **Clean Architecture** (Controller-Service-Repository) with **Dependency Injection**, ensuring scalability, testability, and maintainability. It goes beyond simple CRUD by implementing a complex video processing pipeline that includes **AI-based sensitivity analysis** to automatically flag unsafe content.

## 🌟 Key Features & Capabilities

### 🏗️ Advanced Architecture
-   **Clean Layered Design**: strictly separates concerns into Controllers (HTTP), Services (Business Logic), and Repositories (Data Access).
-   **Dependency Injection**: All dependencies are explicitly injected (configured in `src/config/dependencies.js`), avoiding tight coupling.
-   **Centralized Error Handling**: Unified error responses and logging.

### 🏢 Deep Multi-Tenancy
-   **Data Isolation**: All database queries are scoped by `tenantId`.
-   **Tenant-Scoped RBAC**: Roles (Admin, Editor, Viewer) are defined *within* a tenant. A user can be an Admin in one tenant and a Viewer in another.
-   **SuperAdmin Control**: A dedicated layer for platform administrators to manage tenants and global settings.

### 📹 Video Pipeline & AI
1.  **High-Performance Uploads**: Validated multipart uploads (via `multer`) directly to AWS S3.
2.  **Automated Processing**:
    -   **Frame Extraction**: `ffmpeg` extracts keyframes for analysis.
    -   **AI Analysis**: Google **Gemini AI** analyzes frames for Nudity, Violence, and other sensitive content.
    -   **Classification**: Videos are automatically marked as `SAFE`, `FLAGGED`, or `PENDING_REVIEW`.
3.  **Adaptive Streaming**: Supports **HTTP Range Requests** for smooth playback and seeking.

### ⚡ Real-Time & Security
-   **WebSocket Updates**: `Socket.io` integration pushes real-time video processing progress to the client.
-   **Security First**:
    -   `helmet` for secure HTTP headers.
    -   `express-validator` for strict input sanitization.
    -   `bcrypt` & `JWT` for robust authentication.

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Runtime** | Node.js (v18+) |
| **Framework** | Express.js v5 |
| **Database** | MongoDB (Mongoose ODMs) |
| **Storage** | AWS S3 |
| **Processing** | FFmpeg, Fluent-FFmpeg |
| **AI / ML** | Google Generative AI (Gemini) |
| **Real-Time** | Socket.io |
| **Architecture** | Repository Pattern, Dependency Injection |
| **DevOps** | Docker, Husky, ESLint, Prettier |

## 📂 Project Structure

A detailed look at the codebase organization:

```
backend/
├── .husky/                 # Git hooks (pre-commit linting)
├── Docker/                 # Dockerfile and compose configs
├── src/
│   ├── config/             # Configuration & DI Container
|   |   ├── index.js        # Central Config file
│   |   ├── dependencies.js # Central Dependency Injection wiring
│   |   ├── s3.js           # AWS S3 Client setup
│   |   └── logger.js       # Winston logger config
│   ├── controllers/        # HTTP Request Handlers
│   │   └── processing...   # Orchestrate Service calls, handle responses
│   ├── middleware/         # Express Middleware
│   │   ├── auth.middleware.js   # JWT verification
│   │   ├── tenant.middleware.js # Enforces tenant isolation
│   │   └── upload.middleware.js # Multer config
│   ├── models/             # Mongoose Schemas (Data Layer)
│   │   ├── video.model.js  # Video metadata & analysis results
│   │   └── ...
│   ├── repositories/       # DBMS abstraction layer
│   │   └── ...             # Direct DB operations (Find, Save, Update)
│   ├── routes/             # API Route Definitions
│   ├── services/           # CORE Business Logic
│   │   ├── processing.service.js # Orchestrates Video -> AI pipeline
│   │   ├── sensitivity...js      # Google Gemini integration
│   │   └── ...
│   ├── socket/             # WebSocket handlers
│   ├── utils/              # Helper functions (Time, Strings)
│   ├── validators/         # Input Validation Rules (express-validator)
│   ├── app.js              # Express App setup
│   └── server.js           # Server entry point
├── .env.example            # Template for environment variables
├── API_QUICK_REFERENCE.md  # Handy API lookup
└── REFLECTION.md           # Developer notes & architectural decisions
```

## 🚀 Getting Started Guide

### 1️⃣ Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)
*   AWS Account (S3 Bucket & Access Keys)
*   Google AI Studio Key (for sensitivity analysis)

### 2️⃣ Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/NaVIn69/Video_streaming_platfrom_backend.git
cd backend
npm install
```

### 3️⃣ Environment Setup

Create a `.env.dev` file. You can base it on `.env.example`:

```bash
cp .env.example .env.dev
```

**Required Variables**:

```env
# Server
PORT=3000
NODE_ENV=dev

# Database
MONGO_URI=mongodb://localhost:27017/video_streaming

# Auth
JWT_SECRET=your_super_secure_secret
JWT_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name

# Google AI
GEMINI_API_KEY=your_gemini_api_key

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173
```

### 4️⃣ Running the Server

**Development Mode** (Hot Reloading):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

## 🔄 Core Workflows

### 📤 Video Upload & Analysis Pipeline
1.  **Upload**: Client POSTs video to `/api/videos`. User must have `videos.upload` permission.
2.  **Storage**: `StorageService` streams file to AWS S3.
3.  **Queuing**: `VideoService` creates a database record (status: `uploading` -> `processing`).
4.  **Processing**:
    -   `ProcessingService` triggers.
    -   `ffmpeg` extracts frames.
    -   `SensitivityAnalysisService` sends frames to Gemini.
    -   Result is computed (Safe/Unsafe).
5.  **Notification**: `Socket.io` emits `video:processed` event to the tenant room.

### 🛡️ Tenant Access Control
1.  **Request**: Incoming Request contains Bearer Token.
2.  **Auth Middleware**: Decodes token, identifying `userId` and `tenantId`.
3.  **Tenant Middleware**: Verifies tenant exists and user is active within it.
4.  **RBAC Check**: usage of `checkPermission('videos.delete')` checks specific role permissions for that tenant.


## 🤝 Contributing
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License
Distributed under the **MIT License**.
>>>>>>> 609a766af6a9650b3e0c1ca9b6b589377f155289
