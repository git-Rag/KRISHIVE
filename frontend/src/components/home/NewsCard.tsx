type NewsCardProps = {
  headline: string;
  summary: string;
  tag: string;
};

export function NewsCard({ headline, summary, tag }: NewsCardProps) {
  return (
    <article className="rounded-2xl border border-[#ddd6c4] bg-white p-5 shadow-sm transition md:hover:shadow-md">
      <span className="rounded-full bg-[#f5ead2] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#8f5a12]">{tag}</span>
      <h3 className="mt-3 text-base font-semibold text-[#212b21] sm:text-lg">{headline}</h3>
      <p className="mt-2 text-sm text-[#4f5d50]">{summary}</p>
    </article>
  );
}
