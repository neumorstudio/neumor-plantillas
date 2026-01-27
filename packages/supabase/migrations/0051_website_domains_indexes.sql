-- Indices para busqueda rapida de websites por subdominio y dominio custom
-- Nota: Las columnas subdomain y custom_domain ya deben existir en la tabla websites

-- Indice para subdominios
CREATE INDEX IF NOT EXISTS idx_websites_subdomain
  ON websites(subdomain)
  WHERE subdomain IS NOT NULL;

-- Indice para dominios personalizados
CREATE INDEX IF NOT EXISTS idx_websites_custom_domain
  ON websites(custom_domain)
  WHERE custom_domain IS NOT NULL;

-- Comentarios
COMMENT ON INDEX idx_websites_subdomain IS 'Indice para busqueda rapida por subdominio (ej: reformasgarcia.neumorstudio.com)';
COMMENT ON INDEX idx_websites_custom_domain IS 'Indice para busqueda rapida por dominio personalizado (ej: reformasgarcia.com)';
