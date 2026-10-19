type AdminPanelProps = {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
};

const AdminPanel = ({ title, children, action }: AdminPanelProps) => (
  <section className="border border-black/10 bg-white">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-3 border-b border-black/10 sm:px-5">
      <h2 className="text-[10px] font-bold tracking-[0.18em] uppercase text-black">{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    <div className="p-3 sm:p-5">{children}</div>
  </section>
);

export default AdminPanel;
