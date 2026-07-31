-- ==========================================
-- YakuSabor — Script de base de datos (PostgreSQL)
-- Para desplegar en Render Postgres o PostgreSQL local
-- ==========================================

-- Limpiar tablas si existen
DROP TABLE IF EXISTS facturas CASCADE;
DROP TABLE IF EXISTS pedido_detalle CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS mesas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ==========================================
-- 1. TABLAS
-- ==========================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    turno VARCHAR(20) DEFAULT 'Tarde',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

CREATE TABLE mesas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    ubicacion VARCHAR(20) NOT NULL CHECK (ubicacion IN ('interior', 'exterior')),
    estado VARCHAR(20) DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'reservada', 'fuera_servicio'))
);

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    disponible BOOLEAN DEFAULT TRUE,
    categoria_id INT NOT NULL,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Soporta pedidos presenciales y delivery
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    mesa_id INT NULL, -- NULL para delivery
    mesero_id INT NULL,
    tipo VARCHAR(20) NOT NULL DEFAULT 'presencial' CHECK (tipo IN ('presencial', 'delivery')),
    direccion_delivery VARCHAR(255) NULL,
    estado VARCHAR(20) DEFAULT 'nuevo' CHECK (estado IN ('nuevo', 'en_preparacion', 'listo', 'entregado', 'facturado', 'cancelado')),
    total DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mesa_id) REFERENCES mesas(id),
    FOREIGN KEY (mesero_id) REFERENCES usuarios(id)
);

-- estado_detalle permite marcar cada plato individualmente en cocina
CREATE TABLE pedido_detalle (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    notas VARCHAR(255),
    estado_detalle VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('boleta', 'factura')),
    ruc VARCHAR(20),
    razon_social VARCHAR(150),
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- ==========================================
-- 2. DATOS MAESTROS
-- ==========================================

INSERT INTO roles (id, nombre) VALUES
    (1, 'Administrador'),
    (2, 'Cocinero'),
    (3, 'Mesero'),
    (4, 'Cliente');

-- Contraseñas (BCrypt strength 12):
--   juan.perez@mail.com     → admin123
--   maria.lopez@mail.com    → cocinero123
--   carlos.ramirez@mail.com → mesero123
--   ana.torres@mail.com     → cliente123
INSERT INTO usuarios (id, nombre, email, password_hash, rol_id, activo, turno) VALUES
    (1, 'Juan Pérez', 'juan.perez@mail.com', '$2a$12$vBRY6MCQkShYZEsIXWotIeEhBUBffuoYdu/lGGvkcxQBzr0VC6YmS', 1, TRUE, 'Mañana'),
    (2, 'María López', 'maria.lopez@mail.com', '$2a$12$unWgIrDrXr/Np.A5KfGCZO78jhgAcjYOP4G4PllrLMcmRAII7ooz6', 2, TRUE, 'Tarde'),
    (3, 'Carlos Ramírez', 'carlos.ramirez@mail.com', '$2a$12$/V2TLBWgDIiuJDbtioitp.0m6Tti5M/TfP8s3Kehhq0tvxDm/g5.O', 3, TRUE, 'Tarde'),
    (4, 'Ana Torres', 'ana.torres@mail.com', '$2a$12$CoNnAFg2SLQ..3dgoQr4qOQG9INbL.ZPNz4ZKMAMb/hZmT6O.EOyy', 4, TRUE, 'Noche');

INSERT INTO mesas (codigo, ubicacion, estado) VALUES
    ('M01', 'interior', 'libre'),
    ('M02', 'interior', 'ocupada'),
    ('M03', 'exterior', 'reservada'),
    ('M04', 'exterior', 'fuera_servicio');

INSERT INTO categorias (id, nombre) VALUES
    (1, 'Piqueos & Entradas'),
    (2, 'Sándwiches'),
    (3, 'Platos de Fondo'),
    (4, 'Postres'),
    (5, 'Bebidas');

INSERT INTO productos (nombre, descripcion, precio, disponible, categoria_id) VALUES
    -- Piqueos & Entradas
    ('Ceviche Clásico de Pescado', 'Pesca del día con limón de Chulucanas, ají limo y camote glaseado.', 35.00, TRUE, 1),
    ('Ceviche Carretillero', 'Ceviche mixto con chicharrón de pota súper crocante.', 42.00, TRUE, 1),
    ('Leche de Tigre', 'El extracto de nuestro ceviche servido en copa con chicharrón.', 18.00, TRUE, 1),
    -- Sándwiches
    ('Pan con Pejerrey Arrebozado', 'Pan francés con pejerrey arrebozado, lechuga y sarsa criolla.', 16.00, TRUE, 2),
    ('Pan con Chicharrón de Pescado', 'Trozos de pesca del día fritos al panko con salsa tártara.', 18.00, TRUE, 2),
    -- Platos de Fondo
    ('Arroz con Mariscos', 'Arroz graneado al wok con base de ají panca y mixtura de mariscos.', 45.00, TRUE, 3),
    ('Jalea Mixta', 'Montaña de mariscos y pescado frito sobre yucas fritas.', 55.00, TRUE, 3),
    ('Chupe de Camarones', 'Cremoso caldo con coral de camarón, queso fresco y huevo escalfado.', 52.00, TRUE, 3),
    -- Postres
    ('Suspiro a la Limeña', 'Clásico manjar blanco coronado con merengue al oporto.', 15.00, TRUE, 4),
    ('Picarones (Porción)', 'Aros crujientes de zapallo y camote bañados en miel de higo.', 14.00, TRUE, 4),
    -- Bebidas
    ('Chicha Morada (Jarra 1L)', 'Nuestra chicha tradicional hervida con piña y especias.', 18.00, TRUE, 5),
    ('Inka Cola (1 Litro)', 'La bebida de sabor nacional.', 12.00, TRUE, 5),
    ('Limonada Frozen (Jarra 1L)', 'Refrescante limonada licuada con hielo.', 15.00, TRUE, 5);

-- ==========================================
-- 3. DATOS DE PRUEBA
-- ==========================================

-- Pedido presencial en Mesa M01, atendido por Carlos (mesero)
INSERT INTO pedidos (mesa_id, mesero_id, tipo, direccion_delivery, estado, total) VALUES
    (1, 3, 'presencial', NULL, 'nuevo', 35.00);

-- Pedido delivery sin mesa ni mesero
INSERT INTO pedidos (mesa_id, mesero_id, tipo, direccion_delivery, estado, total) VALUES
    (NULL, NULL, 'delivery', 'Av. La Marina 456, Callao', 'en_preparacion', 46.00);

-- Detalles del pedido 1
INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario, notas, estado_detalle) VALUES
    (1, 1, 1, 35.00, 'Sin cebolla', 'pendiente');

-- Detalles del pedido 2
INSERT INTO pedido_detalle (pedido_id, producto_id, cantidad, precio_unitario, notas, estado_detalle) VALUES
    (2, 4, 1, 16.00, 'Sarsa criolla aparte', 'en_preparacion'),
    (2, 11, 1, 15.00, NULL, 'pendiente'),
    (2, 12, 1, 15.00, 'Helada', 'pendiente');

-- Facturas de prueba
INSERT INTO facturas (pedido_id, tipo, ruc, razon_social, total) VALUES
    (1, 'boleta', NULL, 'Cliente Final', 35.00),
    (2, 'factura', '20123456789', 'Empresa Naviera SAC', 46.00);

-- ==========================================
-- 4. REAJUSTE DE SECUENCIAS (SERIAL)
-- Evita conflictos de IDs al insertar nuevos registros desde JPA
-- ==========================================
SELECT setval(pg_get_serial_sequence('roles', 'id'), COALESCE((SELECT MAX(id) FROM roles), 1));
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), COALESCE((SELECT MAX(id) FROM usuarios), 1));
SELECT setval(pg_get_serial_sequence('mesas', 'id'), COALESCE((SELECT MAX(id) FROM mesas), 1));
SELECT setval(pg_get_serial_sequence('categorias', 'id'), COALESCE((SELECT MAX(id) FROM categorias), 1));
SELECT setval(pg_get_serial_sequence('productos', 'id'), COALESCE((SELECT MAX(id) FROM productos), 1));
SELECT setval(pg_get_serial_sequence('pedidos', 'id'), COALESCE((SELECT MAX(id) FROM pedidos), 1));
SELECT setval(pg_get_serial_sequence('pedido_detalle', 'id'), COALESCE((SELECT MAX(id) FROM pedido_detalle), 1));
SELECT setval(pg_get_serial_sequence('facturas', 'id'), COALESCE((SELECT MAX(id) FROM facturas), 1));
