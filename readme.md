# TaskPilot

A case study by me for [Playable](https://playable.com/).

> This project uses docker compose.

Running the project locally.

- Create a .env.production file by copying the .env.example file in the backend directory and populate it.

```bash
cp ./backend/.env.example ./backend/.env.production
```

Populate the neccessary fields.

```.env
APP_URL=
NODE_ENV=production
FRONTEND_URL=http://localhost:5173
MONGO_CONFIG_BASICAUTH=false
MONGO_INITDB_ROOT_USERNAME=
MONGO_INITDB_ROOT_PASSWORD=
MONGO_URL=
MINIO_ROOT_USER=
MINIO_ROOT_PASSWORD=
MINIO_DEFAULT_BUCKETS=
MINIO_SERVER_URL=
MINIO_ROOT_ENDPOINT=
OPENAI_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_CLIENT_CERT_URL=
```

Then run compose.

```bash
docker compose up
```

TaskPilot uses [express](https://expressjs.com/) and [Node.JS](https://nodejs.org/en) for the backend and [React](https://react.dev/) and [Vite](https://vite.dev/) for the frontend. [MongoDB](https://www.mongodb.com/) is used as the main database and [Minio](https://min.io/) as the storage solution.

> Running compose up should automatically generate an admin user for the mongodb and minio storage.
