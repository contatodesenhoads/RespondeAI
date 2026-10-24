"use client";

// Botão de envio que pede confirmação antes (ex.: excluir, desconectar, pausar).
export function BotaoConfirmar({
  pergunta,
  children,
  className,
  nome,
  valor,
}: {
  pergunta: string;
  children: React.ReactNode;
  className?: string;
  nome?: string;
  valor?: string;
}) {
  return (
    <button
      type="submit"
      name={nome}
      value={valor}
      className={className}
      onClick={(e) => {
        if (!window.confirm(pergunta)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
