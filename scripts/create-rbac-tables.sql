-- Criar tabela de funções/cargos
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de permissões
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de relacionamento entre funções e permissões
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Criar tabela de funcionários
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados iniciais
INSERT INTO roles (name, description) VALUES 
  ('Administrador', 'Acesso total ao sistema'),
  ('Gerente', 'Acesso gerencial com algumas restrições'),
  ('Assistente', 'Acesso básico para operações do dia a dia'),
  ('Estagiário', 'Acesso limitado para aprendizado')
ON CONFLICT (name) DO NOTHING;

-- Inserir permissões do sistema
INSERT INTO permissions (code, description) VALUES 
  ('DASHBOARD_VIEW', 'Visualizar dashboard principal'),
  ('CLIENTS_VIEW', 'Visualizar lista de clientes'),
  ('CLIENTS_CREATE', 'Criar novos clientes'),
  ('CLIENTS_EDIT', 'Editar dados de clientes'),
  ('CLIENTS_DELETE', 'Excluir clientes'),
  ('PROCESSES_VIEW', 'Visualizar processos'),
  ('PROCESSES_CREATE', 'Criar novos processos'),
  ('PROCESSES_EDIT', 'Editar processos'),
  ('PROCESSES_DELETE', 'Excluir processos'),
  ('FINANCIAL_VIEW', 'Visualizar módulo financeiro'),
  ('FINANCIAL_CREATE', 'Criar acordos financeiros'),
  ('FINANCIAL_EDIT', 'Editar acordos financeiros'),
  ('FINANCIAL_DELETE', 'Excluir acordos financeiros'),
  ('EMPLOYEES_VIEW', 'Visualizar funcionários'),
  ('EMPLOYEES_CREATE', 'Cadastrar novos funcionários'),
  ('EMPLOYEES_EDIT', 'Editar dados de funcionários'),
  ('EMPLOYEES_DELETE', 'Excluir funcionários'),
  ('ROLES_MANAGE', 'Gerenciar funções e permissões'),
  ('REPORTS_VIEW', 'Visualizar relatórios'),
  ('SYSTEM_ADMIN', 'Administração completa do sistema')
ON CONFLICT (code) DO NOTHING;

-- Associar todas as permissões ao Administrador
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Administrador'
ON CONFLICT DO NOTHING;

-- Associar permissões básicas ao Gerente
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Gerente' 
AND p.code IN ('DASHBOARD_VIEW', 'CLIENTS_VIEW', 'CLIENTS_CREATE', 'CLIENTS_EDIT', 
               'PROCESSES_VIEW', 'PROCESSES_CREATE', 'PROCESSES_EDIT', 
               'FINANCIAL_VIEW', 'FINANCIAL_CREATE', 'FINANCIAL_EDIT', 'REPORTS_VIEW')
ON CONFLICT DO NOTHING;

-- Associar permissões básicas ao Assistente
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Assistente' 
AND p.code IN ('DASHBOARD_VIEW', 'CLIENTS_VIEW', 'CLIENTS_CREATE', 
               'PROCESSES_VIEW', 'PROCESSES_CREATE', 'FINANCIAL_VIEW')
ON CONFLICT DO NOTHING;

-- Associar permissões mínimas ao Estagiário
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'Estagiário' 
AND p.code IN ('DASHBOARD_VIEW', 'CLIENTS_VIEW', 'PROCESSES_VIEW')
ON CONFLICT DO NOTHING;

-- Inserir usuário administrador (Gustavo)
-- Senha: Brunov.4924 (hash gerado com bcrypt)
INSERT INTO employees (name, email, password_hash, role_id) VALUES (
  'Gustavo Cavalcante',
  'gustavocavalcantems@gmail.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  (SELECT id FROM roles WHERE name = 'Administrador')
) ON CONFLICT (email) DO NOTHING;

-- Habilitar RLS nas tabelas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para employees
CREATE POLICY "Employees can view their own data" ON employees
  FOR SELECT USING (auth.uid()::text = id::text OR 
    EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.id 
            WHERE e.id::text = auth.uid()::text AND r.name = 'Administrador'));

CREATE POLICY "Only admins can manage employees" ON employees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.id 
            WHERE e.id::text = auth.uid()::text AND r.name = 'Administrador')
  );

-- Políticas RLS para roles e permissions (apenas admins)
CREATE POLICY "Only admins can view roles" ON roles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.id 
            WHERE e.id::text = auth.uid()::text AND r.name = 'Administrador')
  );

CREATE POLICY "Only admins can manage roles" ON roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.id 
            WHERE e.id::text = auth.uid()::text AND r.name = 'Administrador')
  );

CREATE POLICY "Only admins can view permissions" ON permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.id 
            WHERE e.id::text = auth.uid()::text AND r.name = 'Administrador')
  );

CREATE POLICY "Only admins can view role_permissions" ON role_permissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees e JOIN roles r ON e.role_id = r.id 
            WHERE e.id::text = auth.uid()::text AND r.name = 'Administrador')
  );
