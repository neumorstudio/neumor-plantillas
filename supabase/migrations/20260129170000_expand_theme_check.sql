-- Migración para expandir los temas disponibles en websites
-- Añade soporte para temas estacionales, de estilo y de industria

-- Eliminar la restricción CHECK existente
ALTER TABLE websites DROP CONSTRAINT IF EXISTS websites_theme_check;

-- Crear nueva restricción con todos los temas disponibles
ALTER TABLE websites ADD CONSTRAINT websites_theme_check CHECK (
  theme IN (
    -- Base
    'light',
    'dark',
    'colorful',
    'rustic',
    'elegant',
    -- Premium NeuGlass
    'neuglass',
    'neuglass-dark',
    -- Seasonal
    'christmas',
    'summer',
    'autumn',
    'spring',
    -- Mood/Style
    'ocean',
    'sunset',
    'forest',
    'midnight',
    'rose',
    'lavender',
    'coral',
    'minimal',
    -- Industry
    'wellness',
    'vintage'
  )
);

-- Comentario para documentación
COMMENT ON CONSTRAINT websites_theme_check ON websites IS 'Restricción de temas válidos: base (5), premium (2), estacionales (4), estilo (8), industria (2) = 21 total';
