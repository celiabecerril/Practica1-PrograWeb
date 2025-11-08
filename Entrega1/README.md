# PRÁCTICA 1 — PORTAL DE PRODUCTOS CON AUTENTICACIÓN Y CHAT

Este repositorio contiene la implementación de la Práctica 1 solicitada: un portal de productos con autenticación (JWT), roles (user/admin), CRUD de productos, chat en tiempo real con persistencia en MongoDB y un frontend sencillo en HTML/CSS/JS.


---

## Objetivo de la práctica

Implementar una aplicación completa que integre:
- CRUD de productos.
- Sistema de usuarios con registro y login.
- Roles y autorización (user / admin).
- Autenticación con JWT para proteger rutas privadas y sockets.
- Chat en tiempo real integrado (Socket.IO) con persistencia en MongoDB.

---

## Requisitos funcionales implementados

1) Autenticación y autorización
- Registro y login con JWT (`/api/auth/register`, `/api/auth/login`).
- Middleware `authenticateJWT` protege las rutas privadas y expone `req.user`.
- Rol `user` / `admin`. `isAdmin` middleware protege las rutas de administración.

2) Gestión de productos
- Listado y detalle de productos.
- CRUD completo para administradores (crear, ver, editar, eliminar).

3) Chat en tiempo real
- Chat implementado con Socket.IO.
- Solo usuarios autenticados pueden conectar al socket (se valida JWT en la handshake).
- Mensajes persistidos en MongoDB (modelo `Message`) y chats en `Chat`.

4) Persistencia
- Usuarios, productos, chats y mensajes almacenados en MongoDB.

---



## Requisitos del entorno (para la evaluación)

- Node.js (recomendado >= 16)
- npm
- MongoDB accesible (local o remoto)

No se requiere Docker ni servicios externos para la práctica.

---

## Variables de entorno (crear `.env` en la raíz)

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/peluqueria_pereda41
JWT_SECRET=tu_secreto_jwt
```

Explicación:
- `MONGODB_URI`: cadena de conexión a tu MongoDB.
- `JWT_SECRET`: clave secreta usada para firmar tokens JWT.

---

## Instalación y ejecución

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar la aplicación en modo desarrollo:

```bash
npm run dev
```

o en producción:

```bash
npm start
```

3. Abrir `http://localhost:3000/` en tu navegador.

Nota: al arrancar el servidor por primera vez se crean usuarios de ejemplo:
- Admin: `admin@example.com` / `admin123`
- Usuario: `celia@example.com` / `celia123`

---
