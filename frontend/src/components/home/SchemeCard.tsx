type SchemeCardProps = {
  title: string;
  summaryEnglish: string;
  summaryHindi: string;
  cta: string;
};

export function SchemeCard({ title, summaryEnglish, summaryHindi, cta }: SchemeCardProps) {
  return (
    <article className="rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm transition md:hover:shadow-md">
      <h3 className="text-lg font-semibold text-[#1f2a1f]">{title}</h3>
      <p className="mt-3 text-sm text-[#4d594d]">{summaryEnglish}</p>
      <p className="mt-2 text-sm text-[#1b5e20]">{summaryHindi}</p>
      <button
        type="button"
        className="mt-4 min-h-[60px] rounded-lg border border-[#1b5e20] px-4 py-2 text-sm font-medium text-[#1b5e20] shadow-sm transition md:hover:bg-[#1b5e20] md:hover:text-white"
      >
        {cta}
      </button>
    </article>
  );
}
