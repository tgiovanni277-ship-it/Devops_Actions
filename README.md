# STRIDE · tienda de tenis

Tienda académica de tenis con marca e imágenes originales. Frontend React/Vite en Vercel, API Flask en Docker/Render y PostgreSQL en Supabase. Incluye catálogo, filtros, carrito local y registro de pedidos de demostración. **No procesa pagos.**

```text
Navegador → React (Vercel) → API Flask (Render / Docker) → PostgreSQL (Supabase)
                      │
                      └── GitHub Actions valida Python, React y Docker en cada PR
```

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

