# NeumorStudio - Documentación

> Índice de documentación del proyecto neumor-plantillas

## Estructura de Documentación

```
docs/
├── README.md                          # Este archivo (índice)
├── index.md                           # Home de la documentación
├── getting-started.md                 # Primeros pasos
├── architecture.md                    # Arquitectura y flujos
├── api.md                             # Endpoints internos
├── authentication.md                  # Auth y sesiones
├── configuration.md                   # Configuración del sistema
├── deployment.md                      # Deploy y CI/CD
├── troubleshooting.md                 # Errores comunes
├── DATABASE.md                        # Esquema de base de datos
├── GUIA_COMPLETA.md                   # Guía completa del proyecto
├── GUIA-SIMULACION-CLIENTES.md       # Testing y QA
├── provisioning/
│   └── vercel-domain-assignment.md    # Dominios en Vercel
├── security/
│   ├── SECURITY_CHANGELOG.md          # Auditoría de seguridad
│   └── public-api-verification.md     # Checklist de verificación
├── plans/                             # Planes de trabajo y diseño
├── setup/                             # Setup local y tooling
└── PROMPS IA/                          # Prompts internos para IA
```

---

## Documentos Principales

### Puesta en marcha

| Documento | Descripción |
|-----------|-------------|
| [README-dev.md](README-dev.md) | Onboarding rápido y comandos de checks. |
| [getting-started.md](getting-started.md) | Primeros pasos para desarrollo local. |
| [architecture.md](architecture.md) | Vista general de la arquitectura y flujos. |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura resumida para contributors. |
| [api.md](api.md) | Endpoints internos usados por templates y admin. |

### Base de Datos

| Documento | Descripción |
|-----------|-------------|
| [DATABASE.md](DATABASE.md) | Esquema completo: tablas, relaciones, RLS, triggers, índices. |

### Testing y QA

| Documento | Descripción |
|-----------|-------------|
| [GUIA-SIMULACION-CLIENTES.md](GUIA-SIMULACION-CLIENTES.md) | Guía profesional para simular creación de clientes y testing end-to-end del sistema. |
| [TESTING.md](TESTING.md) | Guía de tests y patrones mínimos. |

### Provisioning

| Documento | Descripción |
|-----------|-------------|
| [vercel-domain-assignment.md](provisioning/vercel-domain-assignment.md) | Asignación automática de dominios `*.neumorstudio.com` a proyectos Vercel. |

### Seguridad

| Documento | Descripción |
|-----------|-------------|
| [SECURITY.md](SECURITY.md) | Checklist de seguridad para contribuciones. |
| [SECURITY_CHANGELOG.md](security/SECURITY_CHANGELOG.md) | Log de auditoría de seguridad con hallazgos (H-01 a H-07) y fixes aplicados. |
| [public-api-verification.md](security/public-api-verification.md) | Checklist ejecutable para verificar hardening de APIs públicas y RLS. |

---

## Por Categoría

### Para Desarrolladores

1. [getting-started.md](getting-started.md) - Primeros pasos
2. [architecture.md](architecture.md) - Componentes y flujos
3. [api.md](api.md) - Endpoints internos
4. [DATABASE.md](DATABASE.md) - Modelo de datos
5. [GUIA-SIMULACION-CLIENTES.md](GUIA-SIMULACION-CLIENTES.md) - Testing local

### Para DevOps

1. [deployment.md](deployment.md) - Deploy y CI/CD
2. [configuration.md](configuration.md) - Variables y configuración
3. [vercel-domain-assignment.md](provisioning/vercel-domain-assignment.md) - Provisioning de dominios

### Para Seguridad

1. [SECURITY_CHANGELOG.md](security/SECURITY_CHANGELOG.md) - Historial de auditoría
2. [public-api-verification.md](security/public-api-verification.md) - Verificación de controles

---

## Quick Reference

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `clients` | Clientes de NeumorStudio |
| `websites` | Sitios web de cada cliente |
| `bookings` | Reservas |
| `leads` | Contactos y presupuestos |
| `menu_items` | Items del menú (restaurant) |

Ver [DATABASE.md](DATABASE.md) para esquema completo.

### Verticales

| Vertical | Tipos de Negocio | Vercel Project |
|----------|------------------|----------------|
| restaurant | restaurant, clinic, fitness | web-restaurants |
| salon | salon | web-peluquerias |
| repairs | repairs, realestate | web-reformas |

### CLI de Provisioning

```bash
# Crear cliente
pnpm create-client

# Con vertical específico
pnpm create-client -- --vertical=restaurant
```

Ver [GUIA-SIMULACION-CLIENTES.md](GUIA-SIMULACION-CLIENTES.md) para flujo completo.

---

## Convenciones

### Nomenclatura

- Archivos en MAYÚSCULAS: Documentos principales (README.md, DATABASE.md)
- Archivos en minúsculas: Documentos secundarios
- Carpetas en minúsculas: Agrupación por tema

### Formato

- Markdown con CommonMark
- Diagramas en ASCII art o Mermaid
- Tablas para datos estructurados
- Código con syntax highlighting

### Actualización

Actualizar documentación cuando:
- Se añaden/modifican tablas de base de datos
- Se cambian políticas RLS
- Se añaden nuevos endpoints
- Se implementan features de seguridad

---

## Contribuir a la Documentación

1. Mantener documentación cerca del código
2. Actualizar DATABASE.md con cada migración
3. Documentar decisiones de seguridad en SECURITY_CHANGELOG.md
4. Añadir tests a la guía de simulación

---

> **Última actualización:** Enero 2026
