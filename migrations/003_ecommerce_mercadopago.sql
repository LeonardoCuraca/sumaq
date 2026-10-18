-- Evolución E-Commerce Transaccional + Integración Mercado Pago

-- 1. Inventario y control de stock en products
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 25;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 3;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Ampliación financiera y logística en orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(30) DEFAULT 'boleta';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PEN';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'manual_whatsapp';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_preference_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_committed BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_released BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_reserved_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

-- 3. Tabla de transacciones e intentos de pago (Mercado Pago y Manuales)
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL DEFAULT 'mercadopago',
  external_payment_id VARCHAR(100) UNIQUE,
  external_preference_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  status_detail VARCHAR(150),
  payment_type VARCHAR(80),
  payment_method_id VARCHAR(80),
  installments INTEGER DEFAULT 1,
  amount NUMERIC(10, 2) NOT NULL,
  fee_amount NUMERIC(10, 2) DEFAULT 0,
  net_amount NUMERIC(10, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'PEN',
  payer_email VARCHAR(255),
  payer_doc_type VARCHAR(30),
  payer_doc_number VARCHAR(50),
  raw_response JSONB,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);

-- 4. Registro e idempotencia de Webhooks
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'mercadopago',
  event_id VARCHAR(150),
  topic VARCHAR(80) NOT NULL,
  resource_id VARCHAR(150) NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'received',
  attempts INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  payload JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_resource ON webhook_events (provider, topic, resource_id);

-- 5. Kardex de Movimientos de Inventario
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id VARCHAR(100) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  movement_type VARCHAR(50) NOT NULL,
  quantity_delta INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reserved_after INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  actor VARCHAR(150) DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements (product_id, created_at DESC);

-- 6. Historial auditable de eventos de la orden
CREATE TABLE IF NOT EXISTS order_events (
  id BIGSERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type VARCHAR(60) NOT NULL,
  from_state VARCHAR(60),
  to_state VARCHAR(60),
  description TEXT NOT NULL,
  actor VARCHAR(150) DEFAULT 'system',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events (order_id, created_at DESC);
