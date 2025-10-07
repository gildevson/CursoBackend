DROP INDEX "ux_empresas_cnpj";--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "endereco" varchar(500);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "rua_endereco" varchar(255);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "numero_endereco" varchar(20);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "complemento_endereco" varchar(100);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "bairro_endereco" varchar(100);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "cidade_endereco" varchar(100);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "estado_endereco" varchar(100);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "cep_endereco" varchar(20);--> statement-breakpoint
ALTER TABLE "clientes" ADD COLUMN "telefone" varchar(20);--> statement-breakpoint
CREATE UNIQUE INDEX "ux_clientes_cnpjcpf" ON "clientes" USING btree ("cnpj");