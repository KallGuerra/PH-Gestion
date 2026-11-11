# PH Gestión — Aplicación 
# Mucha Suerte chicos, ustedes son un éxito

Aplicación web de gestión administrativa y financiera para **propiedad horizontal**
(copropiedades): inmuebles, propietarios, facturación, cartera, recaudos y reportes.

> **Obejtivo**.
> El objetivo del examen es que ejecutar la aplicación, **identificar los defectos**, posteriormente, 
> **reportarlos** (Mantis o GitHub Issues) y proponer/implementar la **corrección o fix**.


## Arquitectura

| Componente | Tecnología | Puerto |
|---|---|---|
| Frontend | React (Vite) | 5173 |
| API | Node.js + Express | 4000 |
| Base de datos | PostgreSQL 16 | 5432 |

```
frontend (React)  ──HTTP──►  api (Express)  ──SQL──►  PostgreSQL
```

## Puesta en marcha con Docker (recomendado)

Requisito: Docker y Docker Compose.

```bash
docker compose up --build
```

Esto levanta la base de datos (con el esquema y los datos de prueba ya cargados),
la API y el frontend. Luego abre:

- Aplicación web: http://localhost:5173
- API (health check): http://localhost:4000/health

Para reiniciar la base de datos desde cero:

```bash
docker compose down -v && docker compose up --build
```

## Puesta en marcha manual (sin Docker)

1. **Base de datos**

   ```bash
   createdb ph_gestion
   psql -d ph_gestion -f db/schema.sql
   psql -d ph_gestion -f db/seed.sql
   ```

2. **API**

   ```bash
   cd backend
   cp .env.example .env     # ajusta DATABASE_URL si hace falta
   npm install
   npm start                # http://localhost:4000
   ```

3. **Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev              # http://localhost:5173
   ```

## Usuarios de prueba

Clave para todos los usuarios: **`Examen2026*`**

| Correo | Rol | Copropiedad |
|---|---|---|
| admin@ph.co | Superadministrador | (todas) |
| admin1@laspalmas.co | Administrador | Las Palmas |
| contador1@laspalmas.co | Contador | Las Palmas |
| juan.perez@correo.co | Propietario | Las Palmas |
| admin2@miradordelrio.co | Administrador | Mirador del Río |

## Módulos disponibles

- **Dashboard**: indicadores (inmuebles, cartera, facturación, recaudo, % de recuperación).
- **Inmuebles**: listado paginado y estado de cuenta por inmueble (con interés de mora).
- **Cartera**: cartera por inmueble, por edades e inmuebles en mora.
- **Facturación**: facturas del periodo y facturación masiva de cuotas extraordinarias.
- **Recaudos**: registro y anulación de pagos (con derrame sobre las facturas).
- **Reportes**: totales de facturación y recaudo, balance por concepto y valores mensuales.

## Datos de referencia

- Dos copropiedades cargadas (para poder verificar el aislamiento de información).
- Fecha de referencia del escenario: **2026-11-10**.
- Tasa de mora: 2% mensual (Las Palmas), con 5 días de gracia.

## Cómo reportar los defectos

Usa la plantilla `.github/ISSUE_TEMPLATE/reporte_defecto.md` (GitHub Issues) o los campos
equivalentes en Mantis: módulo, severidad, pasos para reproducir, resultado esperado vs.
obtenido, evidencia y asignación. Finalmente, recuerden realizar la corrección.
