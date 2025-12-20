
import React from 'react';

interface InfoItemProps {
  label: string;
  value: string | number | undefined;
  icon?: React.ReactNode;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, icon }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
    {icon && <div className="text-blue-400 mt-1">{icon}</div>}
    <div>
      <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
      <p className="text-zinc-100 font-semibold mt-0.5">{value ?? 'N/A'}</p>
    </div>
  </div>
);

interface InfoGridProps {
  items: InfoItemProps[];
}

const InfoGrid: React.FC<InfoGridProps> = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map((item, idx) => (
      <InfoItem key={idx} {...item} />
    ))}
  </div>
);

export default InfoGrid;
