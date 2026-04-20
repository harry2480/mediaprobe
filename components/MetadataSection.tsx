
import React from 'react';

interface MetadataItem {
  label: string;
  value: string | number | undefined;
}

interface MetadataSectionProps {
  title: string;
  icon: React.ReactNode;
  accentClass: string;
  items: MetadataItem[];
}

const MetadataSection: React.FC<MetadataSectionProps> = ({ title, icon, accentClass, items }) => {
  const visibleItems = items.filter(item => item.value !== undefined && item.value !== null && item.value !== '');
  if (visibleItems.length === 0) return null;

  return (
    <div className="bg-zinc-900/20 border border-zinc-800 rounded-3xl overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 border-b border-zinc-800 ${accentClass}`}>
        <span className="opacity-80">{icon}</span>
        <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-800/40">
        {visibleItems.map((item, idx) => (
          <div key={idx} className="bg-zinc-900/60 px-4 py-3 space-y-0.5">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{item.label}</p>
            <p className="text-zinc-100 font-semibold text-sm font-mono break-all">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetadataSection;
