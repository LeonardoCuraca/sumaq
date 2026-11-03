-- Configuracion persistente de pasarela en base de datos para entornos serverless (Vercel)
CREATE TABLE IF NOT EXISTS gateway_config (
  provider VARCHAR(50) PRIMARY KEY,
  access_token TEXT NOT NULL,
  public_key TEXT,
  webhook_secret TEXT,
  site_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
