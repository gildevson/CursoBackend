-- cria a tabela clientes (somente se ela não existir ainda)
CREATE TABLE IF NOT EXISTS "clientes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"cnpj" varchar(20),
	"email_contato" varchar(255),
	"ativo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- corrige o nome do índice (novo nome alinhado com o arquivo clientes.ts)
CREATE UNIQUE INDEX IF NOT EXISTS "ux_clientes_cnpj" ON "clientes" USING btree ("cnpj");
