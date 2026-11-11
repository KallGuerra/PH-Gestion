-- ============================================================
--  PH Gestión — Esquema de base de datos (PostgreSQL)
--  Examen final de Pruebas de Software
-- ============================================================
DROP TABLE IF EXISTS pago_aplicacion CASCADE;
DROP TABLE IF EXISTS pago CASCADE;
DROP TABLE IF EXISTS factura_detalle CASCADE;
DROP TABLE IF EXISTS factura CASCADE;
DROP TABLE IF EXISTS concepto CASCADE;
DROP TABLE IF EXISTS inmueble CASCADE;
DROP TABLE IF EXISTS persona CASCADE;
DROP TABLE IF EXISTS usuario CASCADE;
DROP TABLE IF EXISTS condominio CASCADE;

-- Copropiedades (tenant)
CREATE TABLE condominio (
  id                 SERIAL PRIMARY KEY,
  nombre             VARCHAR(160) NOT NULL,
  nit                VARCHAR(40),
  ciudad             VARCHAR(80),
  departamento       VARCHAR(80),
  direccion          VARCHAR(200),
  telefono           VARCHAR(40),
  email              VARCHAR(160),
  tasa_mora_mensual  NUMERIC(6,4) NOT NULL DEFAULT 0.0200, -- 2% mensual
  dias_gracia        INT NOT NULL DEFAULT 0,
  activo             BOOLEAN NOT NULL DEFAULT TRUE
);

-- Usuarios de la plataforma
CREATE TABLE usuario (
  id             SERIAL PRIMARY KEY,
  condominio_id  INT REFERENCES condominio(id),      -- NULL para superadmin
  nombres        VARCHAR(160) NOT NULL,
  email          VARCHAR(160) NOT NULL UNIQUE,
  password_hash  VARCHAR(200) NOT NULL,
  rol            VARCHAR(40) NOT NULL,                -- superadmin, admin_copropiedad, contador, propietario, residente
  persona_id     INT,                                -- enlace a persona (para propietarios/residentes)
  activo         BOOLEAN NOT NULL DEFAULT TRUE
);

-- Personas naturales o jurídicas (propietarios / residentes / contactos)
CREATE TABLE persona (
  id             SERIAL PRIMARY KEY,
  condominio_id  INT NOT NULL REFERENCES condominio(id),
  tipo_persona   VARCHAR(20) NOT NULL DEFAULT 'natural',  -- natural | juridica
  nombres        VARCHAR(160) NOT NULL,
  documento      VARCHAR(40),
  email          VARCHAR(160),
  telefono       VARCHAR(40)
);

-- Inmuebles (unidades privadas)
CREATE TABLE inmueble (
  id             SERIAL PRIMARY KEY,
  condominio_id  INT NOT NULL REFERENCES condominio(id),
  identificacion VARCHAR(40) NOT NULL,
  torre          VARCHAR(20),
  piso           VARCHAR(20),
  tipo           VARCHAR(40),                 -- Apartamento, Local, Parqueadero...
  area           NUMERIC(10,2),
  coeficiente    NUMERIC(8,5) NOT NULL,       -- fracción; la suma por copropiedad = 1
  propietario_id INT REFERENCES persona(id),
  residente_id   INT REFERENCES persona(id),
  estado         VARCHAR(20) NOT NULL DEFAULT 'activo'
);

-- Conceptos de facturación configurables
CREATE TABLE concepto (
  id                 SERIAL PRIMARY KEY,
  condominio_id      INT NOT NULL REFERENCES condominio(id),
  nombre             VARCHAR(120) NOT NULL,
  valor_base         NUMERIC(14,2) NOT NULL DEFAULT 0,
  periodicidad       VARCHAR(20) NOT NULL DEFAULT 'mensual',  -- mensual | unico
  aplica_coeficiente BOOLEAN NOT NULL DEFAULT FALSE,          -- si true, valor_base es el total a repartir
  genera_interes     BOOLEAN NOT NULL DEFAULT TRUE
);

-- Facturas / cuentas de cobro
CREATE TABLE factura (
  id                SERIAL PRIMARY KEY,
  condominio_id     INT NOT NULL REFERENCES condominio(id),
  inmueble_id       INT NOT NULL REFERENCES inmueble(id),
  periodo           CHAR(7) NOT NULL,          -- YYYY-MM
  fecha_emision     DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  subtotal          NUMERIC(14,2) NOT NULL DEFAULT 0,
  descuento         NUMERIC(14,2) NOT NULL DEFAULT 0,
  interes           NUMERIC(14,2) NOT NULL DEFAULT 0,
  total             NUMERIC(14,2) NOT NULL DEFAULT 0,
  saldo             NUMERIC(14,2) NOT NULL DEFAULT 0,
  estado            VARCHAR(30) NOT NULL DEFAULT 'Pendiente'
);

CREATE TABLE factura_detalle (
  id          SERIAL PRIMARY KEY,
  factura_id  INT NOT NULL REFERENCES factura(id) ON DELETE CASCADE,
  concepto_id INT REFERENCES concepto(id),
  descripcion VARCHAR(160) NOT NULL,
  valor       NUMERIC(14,2) NOT NULL DEFAULT 0
);

-- Recaudos / pagos
CREATE TABLE pago (
  id            SERIAL PRIMARY KEY,
  condominio_id INT NOT NULL REFERENCES condominio(id),
  inmueble_id   INT NOT NULL REFERENCES inmueble(id),
  fecha         DATE NOT NULL,
  medio         VARCHAR(40) NOT NULL DEFAULT 'Transferencia',
  valor         NUMERIC(14,2) NOT NULL,
  no_aplicado   NUMERIC(14,2) NOT NULL DEFAULT 0,
  anulado       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Aplicación (derrame) de un pago sobre una o varias facturas
CREATE TABLE pago_aplicacion (
  id             SERIAL PRIMARY KEY,
  pago_id        INT NOT NULL REFERENCES pago(id) ON DELETE CASCADE,
  factura_id     INT NOT NULL REFERENCES factura(id),
  valor_aplicado NUMERIC(14,2) NOT NULL
);

CREATE INDEX idx_inmueble_condo ON inmueble(condominio_id);
CREATE INDEX idx_factura_condo ON factura(condominio_id);
CREATE INDEX idx_factura_inmueble ON factura(inmueble_id);
CREATE INDEX idx_pago_condo ON pago(condominio_id);
