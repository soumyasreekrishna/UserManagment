# User Management System (Django + DRF + JWT)

## Features
- User registration + JWT login/refresh
- Logout (refresh token blacklisting)
- Profile view/update
- Change password
- Notes CRUD (per-user), with file attachment
- Swagger UI docs

## Setup (Windows)

1. Create/activate venv (you already have `venv/` in this repo)

2. Install dependencies
```bash
.\venv\Scripts\python -m pip install -r requirements.txt
```

3. Run migrations
```bash
.\venv\Scripts\python manage.py makemigrations
.\venv\Scripts\python manage.py migrate
```

4. Start server
```bash
.\venv\Scripts\python manage.py runserver
```

## URLs
- Frontend: `http://127.0.0.1:8000/`
- Swagger UI: `http://127.0.0.1:8000/api/docs/`

## API Endpoints
### Auth
- `POST /api/auth/register/`
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `POST /api/auth/logout/` (body: `{ "refresh": "..." }`)

### Profile
- `GET /api/auth/profile/`
- `PATCH /api/auth/profile/`
- `POST /api/auth/change-password/`

### Notes
- `GET /api/notes/` (paginated)
- `POST /api/notes/` (multipart for attachment)
- `PATCH /api/notes/{id}/`
- `DELETE /api/notes/{id}/`

## Notes
- Attachments are served under `/media/` in `DEBUG` mode.
