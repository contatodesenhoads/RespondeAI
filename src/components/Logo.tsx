import Image from "next/image";

// O "D" da Desenho Ads, recortado do logo oficial.
export function Logo({ tamanho = 40, className = "" }: { tamanho?: number; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-lg ${className}`}
      style={{ width: tamanho, height: tamanho }}
    >
      <Image
        src="/logo-desenho-ads.png"
        alt="Logo Desenho Ads"
        width={tamanho}
        height={tamanho}
        className="h-full w-full object-cover"
        style={{ objectPosition: "center 30%" }}
        priority
      />
    </span>
  );
}
