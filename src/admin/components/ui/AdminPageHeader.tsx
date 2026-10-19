type AdminPageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

const AdminPageHeader = ({ title, description, children }: AdminPageHeaderProps) => (
  <header className="mb-3 pb-3 border-b border-black/10 sm:mb-6 sm:pb-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-base sm:text-lg font-bold tracking-[0.1em] uppercase text-black leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[10px] sm:text-[10px] font-bold tracking-[0.08em] uppercase text-black/45 mt-1.5 leading-relaxed max-w-xl">
            {description}
          </p>
        )}
      </div>
      {children ? <div className="shrink-0 w-full sm:w-auto">{children}</div> : null}
    </div>
  </header>
);

export default AdminPageHeader;
