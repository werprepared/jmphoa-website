export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="bg-primary-dark text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-2 text-white/80 max-w-2xl">{subtitle}</p>}
      </div>
    </div>
  );
}
