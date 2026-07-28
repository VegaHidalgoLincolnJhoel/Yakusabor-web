# 🐟 Yaku Sabor — Sistema de Gestión para Restaurante Marino

> **Yaku Sabor** es una aplicación web fullstack para la gestión integral de un restaurante de comida marina peruana.  
> Permite administrar mesas, pedidos, cocina, productos, mozos y ventas desde un dashboard centralizado con control de acceso por roles.

---

## 🛠 Tecnologías utilizadas

### Backend
| Tecnología | Uso |
|---|---|
| Java 17 + Spring Boot 3 | API REST principal |
| Spring Security + JWT | Autenticación y autorización |
| Spring Data JPA / Hibernate | Persistencia de datos |
| MySQL 8 | Base de datos relacional |
| Lombok | Reducción de código boilerplate |
| BCrypt | Encriptación de contraseñas |

### Frontend
| Tecnología | Uso |
|---|---|
| HTML5 + CSS3 + JavaScript (Vanilla) | Interfaz de usuario |
| Bootstrap 5.3 | Componentes y diseño responsivo |
| Chart.js 4 | Gráficas en el reporte de ventas |
| Google Fonts | Tipografías (Plus Jakarta Sans) |

---

## 🏗 Arquitectura del proyecto

```
YakuSabor/
├── backend/                        # API REST (Spring Boot)
│   └── src/main/java/com/yakusabor/backend/
│       ├── controllers/            # Endpoints REST
│       ├── models/                 # Entidades JPA
│       ├── repositories/           # Interfaces Spring Data
│       ├── dto/                    # Objetos de transferencia de datos
│       ├── security/               # JWT (filtro, util, config)
│       └── BackendApplication.java
│
├── Frontend/
│   ├── Principal/                  # Páginas públicas (clientes)
│   │   ├── HTML/                   # index, menú, reservas, contacto
│   │   ├── CSS/
│   │   └── JS/                     # login, menu, reservas, nav
│   └── Dashboard/                  # Panel de administración (staff)
│       ├── HTML/                   # Dashboard, Sala, Cocina, Productos...
│       ├── CSS/
│       └── JS/                     # GestionCocina, GestionProducto, ReporteVentas
│
└── YakuSaboresscript.sql           # Script completo de base de datos
```

---

## ✅ Requisitos previos

- **JDK 17** o superior
- **MySQL 8.0** o superior
- **Maven** (incluido en el proyecto o instalado globalmente)
- Navegador web moderno (Chrome, Edge, Firefox)
- *(Opcional)* IntelliJ IDEA o VS Code para desarrollo

---

## ⚙️ Configuración de la base de datos

1. Abre MySQL Workbench o tu cliente favorito.
2. Ejecuta el script completo:

```sql
-- Desde la raíz del proyecto
SOURCE YakuSaboresscript.sql;
```

Esto creará la base de datos `yaku_sabores` con todas las tablas, roles, usuarios de prueba y productos del menú marino.

---

## ⚙️ Configuración del backend

Edita el archivo `backend/src/main/resources/application.properties`:

```properties
# Base de datos
spring.datasource.url=jdbc:mysql://localhost:3306/yaku_sabores?useSSL=false&serverTimezone=UTC
spring.datasource.username=TU_USUARIO_MYSQL
spring.datasource.password=TU_PASSWORD_MYSQL

# JWT — mínimo 64 caracteres para HS512
jwt.secret=yakusabor-clave-secreta-muy-larga-para-hs512-necesita-minimo-64-caracteres-aqui
jwt.expiration=86400000
```

### Alternativa: variables de entorno

```bash
# Linux / macOS
export DB_USER="root"
export DB_PASSWORD="tu_password"

# Windows (PowerShell)
$env:DB_USER = "root"
$env:DB_PASSWORD = "tu_password"
```

---

## 🚀 Cómo ejecutar el proyecto

### 1. Iniciar el backend

```bash
cd backend
./mvnw spring-boot:run
```

> El servidor arranca en `http://localhost:8080`

### 2. Abrir el frontend

Abre directamente en el navegador:

```
Frontend/Principal/HTML/index.html
```

> No requiere servidor adicional. El frontend se comunica con el backend en `localhost:8080`.

### Ejecución en GitHub Codespaces

El proyecto detecta automáticamente si está corriendo en Codespaces y ajusta la URL del backend al puerto `8080` del entorno remoto. No se necesita configuración extra.

---

## 👤 Usuarios de prueba

| Nombre | Correo | Contraseña | Rol |
|---|---|---|---|
| Juan Pérez | juan.perez@mail.com | admin123 | Administrador |
| María López | maria.lopez@mail.com | cocinero123 | Cocinero |
| Carlos Ramírez | carlos.ramirez@mail.com | mesero123 | Mesero |
| Ana Torres | ana.torres@mail.com | cliente123 | Cliente |

---

## 🗺 Módulos del sistema

### 🌐 Página pública (clientes)
- **Inicio** — presentación del restaurante y promociones
- **Menú** — carta completa con carrito de pedidos online
- **Reservas** — selección visual de mesas disponibles
- **Contacto** — formulario e información del local

### 🔐 Dashboard (staff — requiere autenticación)

| Módulo | Roles con acceso | Descripción |
|---|---|---|
| Gestión de Sala | Administrador, Mesero | Estado de mesas en tiempo real, añadir/liberar/marcar fuera de servicio |
| Mesa Detalle | Administrador, Mesero | Tomar pedidos por mesa, enviar a cocina |
| Gestión Cocina | Administrador, Cocinero | Ver pedidos activos, actualizar estado por plato (pendiente → preparando → listo → entregado) |
| Gestión de Productos | Administrador, Cocinero | CRUD completo de productos y disponibilidad en tiempo real |
| Factura | Administrador, Mesero | Generación de boletas y facturas |
| Reporte de Ventas | Administrador | KPIs, gráfica de ventas por día, ranking de meseros y top de productos |
| Gestión de Mozos | Administrador | Alta, baja, activar/desactivar mozos con estadísticas de venta |

---

## 🔑 Endpoints principales de la API

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | ❌ |
| POST | `/api/auth/registro` | Registrar cliente | ❌ |
| GET | `/api/auth/me` | Datos del usuario autenticado | ✅ |
| GET | `/api/productos` | Listar productos | ❌ |
| POST | `/api/productos` | Crear producto | ✅ |
| GET | `/api/mesas/estado` | Estado actual de todas las mesas | ✅ |
| PUT | `/api/mesas/{id}/estado` | Cambiar estado de una mesa | ✅ |
| POST | `/api/pedidos` | Crear nuevo pedido | ✅ |
| GET | `/api/pedidos` | Listar pedidos activos | ✅ |
| PUT | `/api/pedidos/{id}/detalles/{detalleId}/estado` | Actualizar estado de un plato en cocina | ✅ |
| POST | `/api/reservas` | Reservar una mesa | ✅ |
| GET | `/api/usuarios/meseros` | Listar mozos con estadísticas | ✅ |
| POST | `/api/usuarios/meseros` | Crear nuevo mozo | ✅ |

---

## 🛠 Problemas comunes

**El backend no inicia:**
- Verifica que MySQL esté corriendo y la base de datos `yaku_sabores` exista.
- Revisa usuario y contraseña en `application.properties`.

**Error 401 al llamar a la API:**
- El token JWT expiró o no se está enviando en el header `Authorization: Bearer <token>`.

**El frontend no conecta con el backend:**
- Verifica que el backend esté corriendo en el puerto `8080`.
- Si usas Codespaces, asegúrate de que el puerto `8080` esté expuesto como público.

**Login failed / credenciales incorrectas:**
- Usa exactamente los correos y contraseñas de la tabla de usuarios de prueba.
- Las contraseñas están encriptadas con BCrypt; no modifiques `password_hash` manualmente.

---

## 📋 Base de datos — Estructura principal

```
roles          → Administrador, Cocinero, Mesero, Cliente
usuarios       → Autenticación con BCrypt + JWT
mesas          → Estado: libre | ocupada | reservada | fuera_servicio
categorias     → Agrupación del menú
productos      → Carta del restaurante con disponibilidad por plato
pedidos        → Presencial (con mesa) o Delivery (con dirección)
pedido_detalle → Ítems del pedido con estado individual por plato
facturas       → Boletas y facturas vinculadas a pedidos
```

---

## 👨‍💻 Autor

- **Lincoln Vega**
- **Sofia Delgado**
- **William Oliva**
- **Jeremy Espinoza**
- **Roy Ramirez**

> Estudiantes de Ingeniería de Sistemas e Informática — UTP  
> [lincolvegahidalgo@gmail.com](mailto:lincolvegahidalgo@gmail.com)

---

> Proyecto desarrollado como sistema de gestión integral para restaurante, aplicando arquitectura REST, autenticación JWT, control de acceso por roles y frontend multi-módulo.

Comandos para "pushear" archivo desde la terminal
- git status
- git add . (añade todos los cambios al área de preparación)
- git commit -m "(mensaje)"
- git branch -M main
- git push -u origin main
