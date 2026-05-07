# ACTIA ERP — Gestión de Proyectos de Construcción en Madera

ERP ligero para empresa de construcción industrializada en entramado ligero (DfMA). Gestiona proyectos con flujos de 47 tareas, Gantt, calendario, KPIs y exportación Excel.

## Stack tecnológico

- **Next.js 16** (App Router, Turbopack) + TypeScript
- **Prisma 6** + SQLite (migrable a PostgreSQL)
- **NextAuth v4** + bcrypt — autenticación por credenciales
- **Tailwind CSS v4** — diseño ACTIA: #F5C400 / #1F1F1F / #F5F5F2
- **Recharts** — gráficos de dashboard
- **FullCalendar v6** — vistas calendario proyecto y global
- **ExcelJS** — exportación Excel multicolumna
- **xlsx** — importación de plantillas desde Excel

## Requisitos previos

- Node.js 18+ instalado
- El proyecto debe estar en una unidad **NTFS** (C:, D:...). **No funcionará en FAT32 ni en unidades de red.**

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos + seed (47 tareas + 3 proyectos demo)
npm run db:setup

# 3. Arrancar servidor de desarrollo
npm run dev
```

Acceder a: **http://localhost:3000**

## Credenciales demo

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@actia.tech | actia2026 | Administrador |
| arquitectura@actia.tech | actia2026 | Arquitectura |
| ingenieria@actia.tech | actia2026 | Ingeniería |
| produccion@actia.tech | actia2026 | Producción |

## Scripts disponibles

```bash
npm run dev          # Servidor desarrollo (http://localhost:3000)
npm run build        # Build de producción
npm run start        # Servidor producción
npm run db:generate  # Generar Prisma Client
npm run db:migrate   # Aplicar migraciones SQL
npm run db:seed      # Poblar con datos demo
npm run db:setup     # generate + migrate + seed (todo en uno)
npm run db:reset     # Resetear BD y re-sembrar
npm run db:studio    # Prisma Studio (explorador visual de BD)
```

## Estructura del proyecto

```
actia-erp/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (app)/
│   │   ├── dashboard/         # Dashboard con KPIs y gráficos
│   │   ├── projects/          # Lista + detalle de proyectos
│   │   │   ├── new/           # Crear nuevo proyecto
│   │   │   └── [id]/          # Detalle: Resumen, Tareas, Gantt, Calendario, Riesgos, Historial
│   │   ├── gantt/             # Gantt global (todos los proyectos)
│   │   └── calendar/          # Calendario global
│   └── api/
│       ├── auth/              # NextAuth endpoints
│       ├── projects/          # CRUD proyectos
│       │   └── [id]/
│       │       ├── tasks/     # Actualizar tareas
│       │       ├── recalculate/ # Recalcular fechas por dependencias
│       │       └── export/    # Exportar Excel (.xlsx)
│       ├── import/            # Importar plantillas desde Excel
│       ├── templates/         # Plantillas de tareas
│       ├── tasks/             # API global de tareas
│       └── users/             # Gestión de usuarios
├── components/
│   ├── layout/                # Sidebar + Header
│   ├── gantt/                 # ProjectGantt + GlobalGantt
│   ├── tasks/                 # TasksTable + FullCalendarWrapper + ProjectCalendar
│   ├── dashboard/             # DashboardCharts + RisksTable + UpcomingMilestones
│   └── ui/                    # Badge, KpiCard, Modal, PageHeader, ProgressBar
├── lib/
│   ├── auth.ts                # Configuración NextAuth
│   ├── prisma.ts              # Cliente Prisma singleton
│   ├── constants.ts           # Estados, prioridades, colores, tipos
│   └── date-utils.ts          # Cálculo de fechas por dependencias
├── prisma/
│   ├── schema.prisma          # Modelos: User, Project, ProjectTask, TaskTemplate, Risk, Milestone
│   ├── seed.ts                # Seed con 47 tareas + usuarios + 3 proyectos
│   └── migrations/            # Migraciones SQL
├── .env                       # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
├── tsconfig.seed.json         # tsconfig especial para ts-node (CommonJS)
└── next.config.ts             # serverExternalPackages para Prisma/bcrypt/ExcelJS
```

## Flujo de 47 tareas (6 macrofases)

| Macrofase | Tareas | Color |
|-----------|--------|-------|
| 01 · Comercial | COM-01..COM-05 | Índigo |
| 02 · Diseño y Proyecto | DIS-01..DIS-10 | Amarillo ACTIA |
| 03 · Compras y Contratación | COM-01..COM-08 | Naranja |
| 04 · Obra Civil y Cimentación | OBR-01..OBR-05 | Verde |
| 05 · Montaje y Estructura | MON-01..MON-12 | Azul |
| 06 · Acabados y QA | QA-01..QA-04 | Rojo |

Cada tarea tiene: predecesora, tipo (Secuencial/Paralelo/Crítico/Hito/Control), duración por defecto, responsable sugerido, entregables y criterios de aceptación.

## Variables de entorno (.env)

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="actia-erp-secret-2026-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

## Notas de despliegue

- Para producción: cambiar `DATABASE_URL` a PostgreSQL y `NEXTAUTH_SECRET` por un valor seguro
- El schema de Prisma está preparado para migración directa a PostgreSQL (cambiar provider en `schema.prisma`)
- `serverExternalPackages` en `next.config.ts` incluye `@prisma/client`, `bcryptjs` y `exceljs` para compatibilidad con el runtime de Next.js
