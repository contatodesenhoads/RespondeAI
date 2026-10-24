"use client";

// Botão de envio que pede confirmação antes (ex.: excluir, desconectar, pausar).
// Com nome/valor, grava o valor num campo oculto de mesmo nome no formulário,
// para o servidor saber qual botão foi clicado em qualquer navegador.
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
      className={className}
      onClick={(e) => {
        if (!window.confirm(pergunta)) {
          e.preventDefault();
          return;
        }
        if (nome && valor !== undefined) {
          const campo = e.currentTarget.form?.querySelector<HTMLInputElement>(`input[type="hidden"][name="${nome}"]`);
          if (campo) campo.value = valor;
        }
      }}
    >
      {children}
    </button>
  );
}
