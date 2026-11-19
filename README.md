<h1 align="center">👟 STRIDE · tienda de tenis</h1>

<p align="center">
  Tienda académica de tenis con marca e imágenes originales.<br>
  Catálogo, filtros, carrito local y pedidos de demostración. <strong>No procesa pagos.</strong>
</p>

<p align="center">
  <a href="https://frontend-b5wt.vercel.app/">Ver demo</a> ·
  <a href="#desarrollo-local">Desarrollo local</a> ·
  <a href="#despliegue">Guía de despliegue</a> ·
  <a href="https://github.com/tgiovanni277-ship-it/Devops_Actions/actions/workflows/ci.yml">Ver CI</a>
</p>

<p align="center">
  <img alt="Python 3.12" src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white">
  <img alt="Flask 3" src="https://img.shields.io/badge/Flask-3-000000?logo=flask&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="Vite 6" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white">
  <img alt="PostgreSQL en Supabase" src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white">
  <img alt="Docker para la API" src="https://img.shields.io/badge/Docker-API-2496ED?logo=docker&logoColor=white">
  <img alt="Render para la API" src="https://img.shields.io/badge/Render-API-000000?logo=render&logoColor=white">
  <img alt="Vercel para el frontend" src="https://img.shields.io/badge/Vercel-Frontend-000000?logo=vercel&logoColor=white">
</p>

<p align="center">
  <a href="https://github.com/tgiovanni277-ship-it/Devops_Actions/actions/workflows/ci.yml">
    <img alt="Estado del workflow CI" src="https://github.com/tgiovanni277-ship-it/Devops_Actions/actions/workflows/ci.yml/badge.svg">
  </a>
</p>

## Qué incluye

- Catálogo de tenis con búsqueda, filtros y detalle de producto.
- Carrito guardado en el navegador y registro de pedidos de demostración.
- API que valida productos, tallas y stock; calcula el total y descuenta inventario.
- Pruebas de API y builds de frontend y Docker en GitHub Actions.

## Arquitectura

```text
Navegador → React/Vite (Vercel) → API Flask (Render, Docker) → PostgreSQL (Supabase)
```

GitHub Actions valida Python, React y Docker en cada pull request y al subir cambios a `main`.

## Estructura

| Ruta | Función |
| --- | --- |
| `frontend/` | Interfaz React, estilos e imágenes originales |
| `api/` | API Flask, modelos, Dockerfile y pruebas pytest |
| `.github/workflows/ci.yml` | Pipeline de integración continua |
| `render.yaml` | Blueprint del servicio de Render |

## Desarrollo local

Requisitos: Python 3.12 y Node.js 22.

1. API (terminal 1):

   ```powershell
   cd api
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements-dev.txt
   python -m app.seed
   flask --app app:create_app run --port 8000
   ```

   Sin `DATABASE_URL`, la API usa SQLite local. `python -m app.seed` crea tablas y los tres productos de ejemplo de forma idempotente.

2. Frontend (terminal 2):

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

3. Abre `http://localhost:5173`. El catálogo muestra una vista de demostración si la API está apagada; los pedidos requieren la API activa.

## Pruebas y build

```powershell
cd api
pytest -q

cd ..\frontend
npm run build

cd ..
docker build -t stride-api:local .\api
```

El workflow ejecuta esas verificaciones en GitHub Actions al abrir un PR o subir cambios a `main`. Las pruebas usan SQLite en memoria y no requieren credenciales de Supabase.

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del servidor |
| GET | `/api/products` | Catálogo; filtros `category` y `q` |
| GET | `/api/products/<slug>` | Detalle de un producto |
| POST | `/api/orders` | Registra un pedido de demostración |

Ejemplo de pedido:

```json
{
  "customer_name": "Ana Torres",
  "customer_email": "ana@example.com",
  "items": [{ "product_id": 1, "size": 39, "quantity": 1 }]
}
```

El servidor valida productos, tallas y stock, calcula el precio desde la base de datos y descuenta inventario en la misma transacción.

## Despliegue

### Supabase

1. Crea un proyecto PostgreSQL.
2. Obtén la cadena de conexión desde **Connect** en Supabase. Para Render puede ser necesaria la conexión **Session pooler** si no hay conectividad IPv6.
3. Guarda la cadena completa como `DATABASE_URL` en Render. No la subas al repositorio ni la pongas en Vercel.

Las tablas se crean y el catálogo se inicializa al iniciar el contenedor. Para evolucionar el esquema en un proyecto real, incorpora migraciones versionadas antes de cambiar columnas.

### Render

1. Conecta este repositorio mediante el Blueprint `render.yaml` o crea un Web Service con `api/Dockerfile`.
2. Configura `DATABASE_URL` y `CORS_ORIGINS` (la URL exacta de tu frontend Vercel, sin `/` al final).
3. Comprueba `https://TU-API.onrender.com/health` y `/api/products`.

### Vercel

1. Importa el mismo repositorio y selecciona `frontend` como **Root Directory**.
2. Define `VITE_API_URL=https://TU-API.onrender.com`.
3. Despliega y actualiza `CORS_ORIGINS` en Render con la URL final de Vercel.

Vercel y Render pueden desplegar cambios desde GitHub. Configura la protección de `main` para exigir el check `CI` antes de fusionar PRs si quieres que el despliegue ocurra solo después de las verificaciones.

## Alcance y conceptos DevOps

- **Arquitectura cliente-servidor:** React consume una API HTTP; solo el servidor accede a PostgreSQL.
- **Pruebas unitarias:** pytest cubre catálogo, cálculo de precios, tallas y stock.
- **CI y YAML:** `.github/workflows/ci.yml` automatiza pruebas, build y construcción Docker.
- **Contenedores y despliegue:** Docker empaqueta la API; Render la ejecuta y Vercel publica React.
- **Variables de entorno:** URL de API pública en Vercel; conexión privada a PostgreSQL en Render.
- **Serverless/Lambda:** tema conceptual del curso; la API implementada es un servicio web persistente.

Las imágenes del proyecto fueron generadas para STRIDE y no usan logos de otras marcas.
