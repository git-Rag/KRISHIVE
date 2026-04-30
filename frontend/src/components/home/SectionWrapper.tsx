type SectionWrapperProps = {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function SectionWrapper({ id, title, subtitle, children }: SectionWrapperProps) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-2xl font-semibold text-[#1b5e20] sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-[#4e5b4f] sm:text-base">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
