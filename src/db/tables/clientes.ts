import {
  pgTable,
  bigserial,
  varchar,
  boolean,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const clientes = pgTable(
  'clientes',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    nome: varchar('nome', { length: 255 }).notNull(),
    cnpjCpf: varchar('cnpj', { length: 20 }), // campo opcional
    emailContato: varchar('email_contato', { length: 255 }),
    ruaEndereco: varchar('rua_endereco', { length: 255 }),
    numeroEndereco: varchar('numero_endereco', { length: 20 }),
    complementoEndereco: varchar('complemento_endereco', { length: 100 }),
    bairroEndereco: varchar('bairro_endereco', { length: 100 }),
    cidadeEndereco: varchar('cidade_endereco', { length: 100 }),
    estadoEndereco: varchar('estado_endereco', { length: 100 }),
    cepEndereco: varchar('cep_endereco', { length: 20 }),
    telefone: varchar('telefone', { length: 20 }),
    ativo: boolean('ativo').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    uniqCnpjCpf: uniqueIndex('ux_clientes_cnpjcpf').on(t.cnpjCpf),
  })
);
