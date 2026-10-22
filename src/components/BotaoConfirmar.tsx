"use client";

// Botão de envio que pede confirmação antes (ex.: excluir, desconectar).
export function BotaoConfirmar({
  pergunta,
  children,
  className,
}: {
  pergunta: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(pergunta)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
