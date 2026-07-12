interface StatCardProps {
  value: string;
  label: string;
  detail?: string;
  href?: string;
}

export function StatCard({ value, label, detail, href }: StatCardProps) {
  const inner = (
    <>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </>
  );

  if (href) {
    return (
      <a className="stat-card stat-card-link" href={href}>
        {inner}
      </a>
    );
  }

  return <div className="stat-card">{inner}</div>;
}
