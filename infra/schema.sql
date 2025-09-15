-- EMPRESAS
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  doc text,                -- CNPJ/CPF opcional
  created_at timestamptz not null default now()
);

-- USUÁRIOS (um-para-um com empresa; simples para começar)
alter table if exists users
  add column if not exists company_id uuid references companies(id) on delete restrict;

-- índice e regra de unicidade de e-mail por empresa
create unique index if not exists ux_users_company_email on users(company_id, email);

-- CURSOS (globais)
-- (já existe)

-- AULAS (já existe)

-- MATRÍCULAS: escopo por empresa (mesmo user pode ter empresa obrigatória)
alter table if exists enrollments
  add column if not exists company_id uuid references companies(id) on delete cascade;

-- evitar matrícula duplicada por empresa
drop index if exists enrollments_pkey;
alter table enrollments
  add primary key (user_id, course_id, company_id);

-- SEEDS EXEMPLO
insert into companies (name, doc) values ('Empresa Exemplo LTDA', '12.345.678/0001-90')
on conflict do nothing;

-- pegue o id
-- select id from companies where name = 'Empresa Exemplo LTDA';

-- usuário de teste atrelado à empresa
insert into users (email, password_hash, name, company_id)
select 'aluno@exemplo.com', '123456', 'Aluno Empresa', c.id
from companies c where c.name='Empresa Exemplo LTDA'
on conflict (email) do nothing;

-- cursos e aulas como antes...
