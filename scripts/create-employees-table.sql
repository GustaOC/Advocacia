-- Create employees table for user management
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by VARCHAR(255) DEFAULT 'Gustavo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Gustavo as admin
INSERT INTO employees (name, email, role, permissions, status) 
VALUES (
  'Gustavo',
  'gustavo@advocacia.com',
  'Administrador',
  '{"clients": {"create": true, "read": true, "update": true, "delete": true}, "processes": {"create": true, "read": true, "update": true, "delete": true}, "financial": {"create": true, "read": true, "update": true, "delete": true}, "employees": {"create": true, "read": true, "update": true, "delete": true}}',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policy for employees
CREATE POLICY "Enable all operations for authenticated users" ON employees
FOR ALL USING (true);
