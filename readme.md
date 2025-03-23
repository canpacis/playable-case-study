# TaskPilot

A case study by me for [Playable](https://playable.com/).

> This project uses docker compose.

Running the project locally.

```bash
docker compose up
```

TaskPilot uses [express](https://expressjs.com/) and [Node.JS](https://nodejs.org/en) for the backend and [React](https://react.dev/) and [Vite](https://vite.dev/) for the frontend. [MongoDB](https://www.mongodb.com/) is used as the main database and [Minio](https://min.io/) as the storage solution.

> Running compose up should automatically generate an admin user for the mongodb and minio storage. For both of them `root` is the username and `password` is the password.
