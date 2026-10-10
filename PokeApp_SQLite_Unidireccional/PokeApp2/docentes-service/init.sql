CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    cargo VARCHAR(120),
    programa VARCHAR(160),
    descripcion TEXT,
    imagen TEXT
);