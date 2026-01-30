# NeumorStudio - Documentación

> Índice de documentación del proyecto neumor-plantillas

## Estructura de Documentación

```
docs/
├── README.md                          # Este archivo (índice)
├── DATABASE.md                        # Esquema de base de datos
├── GUIA-SIMULACION-CLIENTES.md       # Testing y QA
├── provisioning/
│   └── vercel-domain-assignment.md   # Dominios en Vercel
└── security/
    ├── SECURITY_CHANGELOG.md         # Auditoría de seguridad
    └── public-api-verification.md    # Checklist de verificación
```

---

## Documentos Principales

### Base de Datos

| Documento | Descripción |
|-----------|-------------|
| [DATABASE.md](DATABASE.md) | Esquema completo: 18 tablas, relaciones, RLS, triggers, índices. Referencia técnica para desarrollo. |

### Testing y QA

| Documento | Descripción |
|-----------|-------------|
| [GUIA-SIMULACION-CLIENTES.md](GUIA-SIMULACION-CLIENTES.md) | Guía profesional para simular creación de clientes y testing end-to-end del sistema. |

### Provisioning

| Documento | Descripción |
|-----------|-------------|
| [vercel-domain-assignment.md](provisioning/vercel-domain-assignment.md) | Asignación automática de dominios `*.neumorstudio.com` a proyectos Vercel. |

### Seguridad

| Documento | Descripción |
|-----------|-------------|
| [SECURITY_CHANGELOG.md](security/SECURITY_CHANGELOG.md) | Log de auditoría de seguridad con hallazgos (H-01 a H-07) y fixes aplicados. |
| [public-api-verification.md](security/public-api-verification.md) | Checklist ejecutable para verificar hardening de APIs públicas y RLS. |

---

## Por Categoría

### Para Desarrolladores

1. [DATABASE.md](DATABASE.md) - Entender el modelo de datos
2. [GUIA-SIMULACION-CLIENTES.md](GUIA-SIMULACION-CLIENTES.md) - Testing local

### Para DevOps

1. [vercel-domain-assignment.md](provisioning/vercel-domain-assignment.md) - Provisioning de dominios
2. [GUIA-SIMULACION-CLIENTES.md](GUIA-SIMULACION-CLIENTES.md) - Verificación de deployment

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
