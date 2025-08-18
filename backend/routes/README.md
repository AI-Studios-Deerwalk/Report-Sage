# API Routes Documentation

This document describes all available API endpoints for user authentication and management.

## Base URL
All API endpoints are prefixed with `/api/v1`

## Authentication

Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Authentication Endpoints (`/api/v1/auth`)

### POST `/api/v1/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "college_name": "Example University",
  "role": "student"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "uid": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "college_name": "Example University",
    "role": "student",
    "is_email_verified": false,
    "created_at": "2024-01-01T12:00:00"
  },
  "message": "User registered successfully. Please verify your email."
}
```

### POST `/api/v1/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "uid": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "name": "John Doe",
    "college_name": "Example University",
    "role": "student",
    "is_email_verified": true,
    "created_at": "2024-01-01T12:00:00"
  },
  "message": "Login successful"
}
```

### POST `/api/v1/auth/change-password`
Change user password (requires authentication).

**Request Body:**
```json
{
  "current_password": "OldPassword123",
  "new_password": "NewSecurePass456"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### POST `/api/v1/auth/verify-email`
Verify user email (requires authentication).

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

### GET `/api/v1/auth/me`
Get current user information (requires authentication).

**Response:**
```json
{
  "uid": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "college_name": "Example University",
  "role": "student",
  "is_email_verified": true,
  "created_at": "2024-01-01T12:00:00",
  "is_active": true
}
```

### GET `/api/v1/auth/check-email/{email}`
Check if email is available for registration.

**Response:**
```json
{
  "email": "user@example.com",
  "available": false,
  "message": "Email is already taken"
}
```

## User Management Endpoints (`/api/v1/users`)

### GET `/api/v1/users/profile`
Get current user's detailed profile (requires authentication).

**Response:**
```json
{
  "uid": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "name": "John Doe",
  "college_name": "Example University",
  "role": "student",
  "is_email_verified": true,
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00",
  "is_active": true
}
```

### PUT `/api/v1/users/profile`
Update current user's profile (requires authentication).

**Request Body:**
```json
{
  "name": "John Smith",
  "college_name": "Updated University"
}
```

### GET `/api/v1/users/` (Teachers Only)
Get list of users with filtering and pagination.

**Query Parameters:**
- `skip`: Number of users to skip (default: 0)
- `limit`: Maximum users to return (default: 100, max: 1000)
- `role`: Filter by role (`student` or `teacher`)
- `is_active`: Filter by active status (`true` or `false`)
- `search`: Search in name, email, or college

**Example:** `/api/v1/users/?role=student&is_active=true&search=john&limit=50`

### GET `/api/v1/users/count` (Teachers Only)
Get user count with filtering.

**Response:**
```json
{
  "total_users": 150,
  "filters": {
    "role": "student",
    "is_active": true
  }
}
```

### GET `/api/v1/users/stats/dashboard` (Teachers Only)
Get dashboard statistics.

**Response:**
```json
{
  "total_users": 150,
  "active_users": 145,
  "inactive_users": 5,
  "students": 120,
  "teachers": 30,
  "college_stats": {
    "college_name": "Example University",
    "total_users": 80,
    "students": 70,
    "teachers": 10
  }
}
```

### GET `/api/v1/users/my/students` (Teachers Only)
Get students from the same college as the teacher.

### GET `/api/v1/users/{user_id}` (Teachers Only)
Get user by ID.

### PUT `/api/v1/users/{user_id}` (Teachers Only)
Update user by ID.

### DELETE `/api/v1/users/{user_id}` (Teachers Only)
Deactivate user (soft delete).

### DELETE `/api/v1/users/{user_id}/permanent` (Teachers Only)
Permanently delete user.

## Error Responses

All endpoints may return these common error responses:

### 400 Bad Request
```json
{
  "detail": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials",
  "headers": {
    "WWW-Authenticate": "Bearer"
  }
}
```

### 403 Forbidden
```json
{
  "detail": "Teacher access required"
}
```

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Usage Examples

### JavaScript/Frontend Example

```javascript
// Register a new user
const registerUser = async (userData) => {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }
  return data;
};

// Login user
const loginUser = async (email, password) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }
  return data;
};

// Make authenticated request
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/v1/users/profile', {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  return response.json();
};

// Get users (teachers only)
const getUsers = async (filters = {}) => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams(filters);
  
  const response = await fetch(`/api/v1/users/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  return response.json();
};
```

### Python/Backend Example

```python
import httpx

class APIClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
    
    async def register(self, user_data):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/register",
                json=user_data
            )
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
            return data
    
    async def login(self, email, password):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/auth/login",
                json={"email": email, "password": password}
            )
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
            return data
    
    async def get_profile(self):
        headers = {"Authorization": f"Bearer {self.token}"}
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/users/profile",
                headers=headers
            )
            return response.json()
```

## Security Notes

1. **JWT Tokens**: Tokens expire in 30 minutes by default (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` environment variable)

2. **Password Requirements**: Passwords must be at least 8 characters with uppercase, lowercase, and digit

3. **Role-Based Access**: Some endpoints require specific roles (teacher/student)

4. **Environment Variables**: Set these in your `.env` file:
   ```
   JWT_SECRET_KEY=your-secret-key-change-this-in-production
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **CORS**: Configure `CORS_ORIGINS` environment variable for allowed origins
