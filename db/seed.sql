-- ============================================================
--  PH Gestión — Datos de prueba (seed)
--  Dos copropiedades para poder probar el aislamiento de datos.
--  "Hoy" de referencia del examen: 2026-11-10
--  Clave de todos los usuarios: Examen2026*
-- ============================================================

-- ---------- Copropiedades ----------
INSERT INTO condominio (id, nombre, nit, ciudad, departamento, direccion, telefono, email, tasa_mora_mensual, dias_gracia) VALUES
 (1,'Conjunto Residencial Las Palmas','901234567-1','Medellín','Antioquia','Calle 10 # 20-30','6041112233','admin@laspalmas.co',0.0200,5),
 (2,'Edificio Mirador del Río','901888777-2','Bogotá','Cundinamarca','Carrera 7 # 80-15','6017778899','admin@miradordelrio.co',0.0250,0);
SELECT setval('condominio_id_seq',2);

-- ---------- Personas ----------
INSERT INTO persona (id, condominio_id, tipo_persona, nombres, documento, email, telefono) VALUES
 (1,1,'natural','Juan Pérez Gómez','71234567','juan.perez@correo.co','3001112201'),
 (2,1,'natural','María López Ruiz','43222111','maria.lopez@correo.co','3001112202'),
 (3,1,'natural','Carlos Ramírez Díaz','98111222','carlos.ramirez@correo.co','3001112203'),
 (4,1,'juridica','Inversiones Andes S.A.S.','900555444','contacto@inversionesandes.co','3001112204'),
 (5,1,'natural','Ana Torres Marín','32444555','ana.torres@correo.co','3001112205'),
 (6,1,'natural','Pedro Gaviria Soto','15666777','pedro.gaviria@correo.co','3001112206'),
 (7,1,'natural','Luisa Mejía (arrendataria)','1020304050','luisa.mejia@correo.co','3001112207'),
 (8,1,'natural','Jorge Niño (arrendatario)','1030405060','jorge.nino@correo.co','3001112208'),
 (9,2,'natural','Sandra Gil Vera','52777888','sandra.gil@correo.co','3002223301'),
 (10,2,'natural','Ricardo Peña Luna','79888999','ricardo.pena@correo.co','3002223302'),
 (11,2,'juridica','Comercial del Río Ltda.','830111222','gerencia@comercialdelrio.co','3002223303');
SELECT setval('persona_id_seq',11);

-- ---------- Inmuebles ----------
-- Copropiedad 1: coeficientes suman 1.00
INSERT INTO inmueble (id, condominio_id, identificacion, torre, piso, tipo, area, coeficiente, propietario_id, residente_id, estado) VALUES
 (1,1,'101','1','1','Apartamento',62.50,0.15547,1,1,'activo'),
 (2,1,'102','1','1','Apartamento',62.50,0.15547,2,NULL,'activo'),
 (3,1,'201','1','2','Apartamento',78.00,0.19403,3,7,'activo'),
 (4,1,'202','1','2','Apartamento',74.00,0.18408,4,8,'activo'),
 (5,1,'301','1','3','Apartamento',85.00,0.21144,5,5,'activo'),
 (6,1,'Local-01','1','1','Local',40.00,0.09951,6,NULL,'activo'),
-- Copropiedad 2
 (7,2,'A-501','A','5','Apartamento',90.00,0.33000,9,9,'activo'),
 (8,2,'A-502','A','5','Apartamento',90.00,0.33000,10,NULL,'activo'),
 (9,2,'L-100','A','1','Local',55.00,0.34000,11,NULL,'activo');
SELECT setval('inmueble_id_seq',9);

-- ---------- Conceptos ----------
INSERT INTO concepto (id, condominio_id, nombre, valor_base, periodicidad, aplica_coeficiente, genera_interes) VALUES
 (1,1,'Cuota de administración',250000,'mensual',FALSE,TRUE),
 (2,1,'Parqueadero',60000,'mensual',FALSE,TRUE),
 (3,1,'Cuota extraordinaria - Pintura de fachada',12345678,'unico',TRUE,FALSE),
 (4,2,'Cuota de administración',320000,'mensual',FALSE,TRUE);
SELECT setval('concepto_id_seq',4);

-- ---------- Facturas ----------
-- Vencimiento: día 10 del mes siguiente al periodo.
INSERT INTO factura (id, condominio_id, inmueble_id, periodo, fecha_emision, fecha_vencimiento, subtotal, descuento, interes, total, saldo, estado) VALUES
-- Inmueble 1 (admin + parqueadero = 310000) — al día
 (1 ,1,1,'2026-08','2026-08-01','2026-09-10',310000,0,0,310000,0     ,'Pagada'),
 (2 ,1,1,'2026-09','2026-09-01','2026-10-10',310000,0,0,310000,0     ,'Pagada'),
 (3 ,1,1,'2026-10','2026-10-01','2026-11-10',310000,0,0,310000,0     ,'Pagada'),
-- Inmueble 2 (admin 250000) — mora severa, incluye >90 días
 (4 ,1,2,'2026-07','2026-07-01','2026-08-10',250000,0,0,250000,250000,'Vencida'),
 (5 ,1,2,'2026-08','2026-08-01','2026-09-10',250000,0,0,250000,250000,'Vencida'),
 (6 ,1,2,'2026-09','2026-09-01','2026-10-10',250000,0,0,250000,250000,'Vencida'),
 (7 ,1,2,'2026-10','2026-10-01','2026-11-10',250000,0,0,250000,250000,'Pendiente'),
-- Inmueble 3 (admin + parqueadero = 310000) — parcial
 (8 ,1,3,'2026-08','2026-08-01','2026-09-10',310000,0,0,310000,0     ,'Pagada'),
 (9 ,1,3,'2026-09','2026-09-01','2026-10-10',310000,0,0,310000,150000,'Parcialmente pagada'),
 (10,1,3,'2026-10','2026-10-01','2026-11-10',310000,0,0,310000,310000,'Pendiente'),
-- Inmueble 4 (admin 250000) — mora
 (11,1,4,'2026-08','2026-08-01','2026-09-10',250000,0,0,250000,250000,'Vencida'),
 (12,1,4,'2026-09','2026-09-01','2026-10-10',250000,0,0,250000,250000,'Vencida'),
 (13,1,4,'2026-10','2026-10-01','2026-11-10',250000,0,0,250000,250000,'Pendiente'),
-- Inmueble 5 (admin 250000) — al día + una factura ANULADA
 (14,1,5,'2026-08','2026-08-01','2026-09-10',250000,0,0,250000,0     ,'Pagada'),
 (15,1,5,'2026-09','2026-09-01','2026-10-10',250000,0,0,250000,0     ,'Pagada'),
 (16,1,5,'2026-10','2026-10-01','2026-11-10',250000,0,0,250000,0     ,'Pagada'),
 (17,1,5,'2026-10','2026-10-01','2026-11-10',60000 ,0,0,60000 ,0     ,'Anulada'),
-- Inmueble 6 (admin 250000) — mora
 (18,1,6,'2026-08','2026-08-01','2026-09-10',250000,0,0,250000,250000,'Vencida'),
 (19,1,6,'2026-09','2026-09-01','2026-10-10',250000,0,0,250000,250000,'Vencida'),
 (20,1,6,'2026-10','2026-10-01','2026-11-10',250000,0,0,250000,250000,'Pendiente'),
-- Copropiedad 2
 (21,2,7,'2026-10','2026-10-01','2026-11-10',320000,0,0,320000,320000,'Pendiente'),
 (22,2,8,'2026-10','2026-10-01','2026-11-10',320000,0,0,320000,320000,'Pendiente'),
 (23,2,9,'2026-10','2026-10-01','2026-11-10',320000,0,0,320000,320000,'Pendiente');
SELECT setval('factura_id_seq',23);

-- ---------- Detalle de facturas ----------
INSERT INTO factura_detalle (factura_id, concepto_id, descripcion, valor) VALUES
 (1,1,'Cuota de administración',250000),(1,2,'Parqueadero',60000),
 (2,1,'Cuota de administración',250000),(2,2,'Parqueadero',60000),
 (3,1,'Cuota de administración',250000),(3,2,'Parqueadero',60000),
 (4,1,'Cuota de administración',250000),
 (5,1,'Cuota de administración',250000),
 (6,1,'Cuota de administración',250000),
 (7,1,'Cuota de administración',250000),
 (8,1,'Cuota de administración',250000),(8,2,'Parqueadero',60000),
 (9,1,'Cuota de administración',250000),(9,2,'Parqueadero',60000),
 (10,1,'Cuota de administración',250000),(10,2,'Parqueadero',60000),
 (11,1,'Cuota de administración',250000),
 (12,1,'Cuota de administración',250000),
 (13,1,'Cuota de administración',250000),
 (14,1,'Cuota de administración',250000),
 (15,1,'Cuota de administración',250000),
 (16,1,'Cuota de administración',250000),
 (17,2,'Parqueadero (facturado por error)',60000),
 (18,1,'Cuota de administración',250000),
 (19,1,'Cuota de administración',250000),
 (20,1,'Cuota de administración',250000),
 (21,4,'Cuota de administración',320000),
 (22,4,'Cuota de administración',320000),
 (23,4,'Cuota de administración',320000);

-- ---------- Pagos y aplicaciones (derrame) ----------
INSERT INTO pago (id, condominio_id, inmueble_id, fecha, medio, valor, no_aplicado, anulado) VALUES
 (1,1,1,'2026-09-08','Transferencia',310000,0,FALSE),
 (2,1,1,'2026-10-07','PSE'          ,310000,0,FALSE),
 (3,1,1,'2026-11-05','Transferencia',310000,0,FALSE),
 (4,1,3,'2026-09-09','Efectivo'     ,310000,0,FALSE),
 (5,1,3,'2026-10-20','Transferencia',160000,0,FALSE),
 (6,1,5,'2026-09-06','PSE'          ,250000,0,FALSE),
 (7,1,5,'2026-10-06','PSE'          ,250000,0,FALSE),
 (8,1,5,'2026-11-04','PSE'          ,250000,0,FALSE);
SELECT setval('pago_id_seq',8);

INSERT INTO pago_aplicacion (pago_id, factura_id, valor_aplicado) VALUES
 (1,1,310000),
 (2,2,310000),
 (3,3,310000),
 (4,8,310000),
 (5,9,160000),
 (6,14,250000),
 (7,15,250000),
 (8,16,250000);

-- ---------- Usuarios ----------
-- password_hash corresponde a la clave: Examen2026*
INSERT INTO usuario (condominio_id, nombres, email, password_hash, rol, persona_id) VALUES
 (NULL,'Super Administrador','admin@ph.co','$2a$10$sJ/Yzdy0HXau4hCKvEUjaOuVyHp8t9qgUuT.RxkKeUZHlPBrWXckm','superadmin',NULL),
 (1,'Administrador Las Palmas','admin1@laspalmas.co','$2a$10$sJ/Yzdy0HXau4hCKvEUjaOuVyHp8t9qgUuT.RxkKeUZHlPBrWXckm','admin_copropiedad',NULL),
 (1,'Contadora Las Palmas','contador1@laspalmas.co','$2a$10$sJ/Yzdy0HXau4hCKvEUjaOuVyHp8t9qgUuT.RxkKeUZHlPBrWXckm','contador',NULL),
 (1,'Juan Pérez (propietario 101)','juan.perez@correo.co','$2a$10$sJ/Yzdy0HXau4hCKvEUjaOuVyHp8t9qgUuT.RxkKeUZHlPBrWXckm','propietario',1),
 (2,'Administrador Mirador','admin2@miradordelrio.co','$2a$10$sJ/Yzdy0HXau4hCKvEUjaOuVyHp8t9qgUuT.RxkKeUZHlPBrWXckm','admin_copropiedad',NULL);
