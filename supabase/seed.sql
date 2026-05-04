-- iCurs@ Seed — ~40 cursos iniciales
-- Execute in Supabase Dashboard → SQL Editor after schema.sql

INSERT INTO courses (name, category, instructor, total_hours, norm_reference) VALUES

-- Seguridad e Higiene (CESAR)
('Trabajos en Alturas', 'Seguridad e Higiene', 'CESAR', 8, 'NOM-009-STPS-2011'),
('Espacios Confinados', 'Seguridad e Higiene', 'CESAR', 8, 'NOM-033-STPS-2015'),
('Corte y Soldadura', 'Seguridad e Higiene', 'CESAR', 6, 'NOM-027-STPS-2008'),
('Seguridad Eléctrica y LOTO', 'Seguridad e Higiene', 'CESAR', 8, 'NOM-029-STPS-2011'),
('Manejo de Sustancias Químicas', 'Seguridad e Higiene', 'CESAR', 6, 'NOM-018-STPS-2015'),
('Operación de Montacargas', 'Seguridad e Higiene', 'CESAR', 16, 'NOM-010-STPS / NOM-006'),
('Herramientas de Poder, Izaje y Grúa', 'Seguridad e Higiene', 'CESAR', 8, 'NOM-004-STPS-1999'),
('Equipo de Protección Personal (EPP)', 'Seguridad e Higiene', 'CESAR', 4, 'NOM-017-STPS-2001'),
('Uso y Manejo de Extintores', 'Seguridad e Higiene', 'CESAR', 4, 'NOM-002-STPS-2010'),
('Factores de Riesgo Ergonómico', 'Seguridad e Higiene', 'CESAR', 8, 'NOM-030-STPS-2009'),
('Seguridad en la Construcción', 'Seguridad e Higiene', 'CESAR', 8, 'NOM-031-STPS-2011'),

-- Ergonomía (CESAR)
('Taller de Ergonomía: Estrés Ambiental', 'Ergonomía', 'CESAR', 8, NULL),

-- Recursos Humanos (MARIBEL)
('NOM-035: Factores de Riesgo Psicosocial', 'Recursos Humanos', 'MARIBEL', 8, 'NOM-035-STPS-2018'),
('Reclutamiento y Selección de Personal', 'Recursos Humanos', 'MARIBEL', 16, NULL),
('Planes de Capacitación y Desarrollo', 'Recursos Humanos', 'MARIBEL', 12, NULL),
('Comisión Mixta de Capacitación', 'Recursos Humanos', 'MARIBEL', 8, NULL),
('Instructor Interno de Empresa', 'Recursos Humanos', 'MARIBEL', 40, 'EC0301'),
('Diplomado Nacional en Recursos Humanos', 'Recursos Humanos', 'MARIBEL', 120, 'EC0301'),

-- Liderazgo (MARIBEL / AMBOS)
('Desarrollo de Mandos Medios', 'Liderazgo', 'MARIBEL', 20, NULL),
('Comunicación Efectiva para Líderes', 'Liderazgo', 'AMBOS', 8, NULL),
('Inteligencia Emocional en el Trabajo', 'Liderazgo', 'AMBOS', 8, NULL),
('Gestión del Cambio Organizacional', 'Liderazgo', 'AMBOS', 12, NULL),
('Desarrollo Directivo y Alta Gerencia', 'Liderazgo', 'MARIBEL', 20, NULL),

-- Habilidades Blandas (AMBOS)
('Comunicación Asertiva', 'Habilidades Blandas', 'AMBOS', 8, NULL),
('Administración del Tiempo y Productividad', 'Habilidades Blandas', 'AMBOS', 8, NULL),
('Trabajo Colaborativo y Equipos de Alto Desempeño', 'Habilidades Blandas', 'AMBOS', 12, NULL),
('Storytelling para Presentaciones Profesionales', 'Habilidades Blandas', 'AMBOS', 8, NULL),

-- Inteligencia Artificial (MARIBEL)
('ChatGPT Aplicado a los Negocios', 'Inteligencia Artificial', 'MARIBEL', 8, NULL),
('Automatización de Procesos con IA', 'Inteligencia Artificial', 'MARIBEL', 12, NULL),
('Machine Learning Básico para No Técnicos', 'Inteligencia Artificial', 'MARIBEL', 16, NULL),

-- Atención al Cliente (AMBOS)
('Protocolo de Servicios y Atención al Cliente', 'Atención al Cliente', 'AMBOS', 8, NULL),
('Manejo de Quejas y Situaciones Difíciles', 'Atención al Cliente', 'AMBOS', 6, NULL),
('Fidelización y Experiencia del Cliente', 'Atención al Cliente', 'AMBOS', 8, NULL);
