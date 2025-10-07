import { clientes } from "../db/tables/clientes";
import { eq } from "drizzle-orm";

export async function criarCliente(db: any, body: any) {
  const {
    nome,
    cnpjCpf,
    emailContato,
    telefone,
    ruaEndereco,
    numeroEndereco,
    complementoEndereco,
    bairroEndereco,
    cidadeEndereco,
    estadoEndereco,
    cepEndereco,
  } = body;

  if (!nome) throw new Error("Nome é obrigatório");

  if (cnpjCpf) {
    const [exists] = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(eq(clientes.cnpjCpf, cnpjCpf))
      .limit(1);

    if (exists) throw new Error("CNPJ/CPF já cadastrado");
  }

  const [created] = await db
    .insert(clientes)
    .values({
      nome,
      cnpjCpf,
      emailContato,
      telefone,
      ruaEndereco,
      numeroEndereco,
      complementoEndereco,
      bairroEndereco,
      cidadeEndereco,
      estadoEndereco,
      cepEndereco,
    })
    .returning({
      id: clientes.id,
      nome: clientes.nome,
      cnpjCpf: clientes.cnpjCpf,
      emailContato: clientes.emailContato,
    });

  return created;
}
