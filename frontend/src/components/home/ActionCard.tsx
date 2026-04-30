import { ArrowRight } from "lucide-react";

type ActionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
};

export function ActionCard({ icon, title, description, cta, href }: ActionCardProps) {
  return (
    <article className="rounded-2xl border border-[#ddd6c4] bg-[#fffdf7] p-5 shadow-sm transition md:hover:-translate-y-0.5 md:hover:shadow-md">
      <div className="mb-3 inline-flex rounded-xl bg-[#eaf2ea] p-2 text-[#1b5e20]">{icon}</div>
      <h3 className="text-lg font-semibold text-[#1f2a1f]">{title}</h3>
      <p className="mt-2 text-sm text-[#556356]">{description}</p>
      <a
        href={href}
        className="mt-4 inline-flex min-h-[60px] items-center gap-2 rounded-lg border border-[#cfe0cf] px-4 text-sm font-medium text-[#1b5e20] shadow-sm transition md:hover:bg-[#f5faf5]"
      >
        {cta} <ArrowRight size={14} />
      </a>
    </article>
  );
}
