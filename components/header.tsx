export const Header = ({ title }: { title: string }) => {
  return (
    <header className="border-b border-black/5 shadow-sm">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <span className="text-2xl font-semibold tracking-tight text-black">
          {title}
        </span>
      </div>
    </header>
  );
};
