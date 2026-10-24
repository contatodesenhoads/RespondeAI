import Link from "next/link";
import { LISTA_PLANOS } from "@/lib/planos";
import { Cabecalho } from "@/components/ui";
import { FormNovoCliente } from "./FormNovoCliente";

export const metadata = { title: "Novo cliente · Administração" };

export default function NovoCliente() {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm text-suave">
          <Link href="/admin/clientes" className="font-medium">Clientes</Link> / Novo
        </p>
        <Cabecalho titulo="Novo cliente" subtitulo="Crie o acesso e escolha o plano. O cliente define a própria senha." />
      </div>
      <FormNovoCliente planos={LISTA_PLANOS} />
    </>
  );
}
