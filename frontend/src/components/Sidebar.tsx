import React from 'react';
import { Activity, BarChart3, LayoutDashboard, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeAlgorithm: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'simulation', label: 'Simulation', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-16 md:w-52 bg-[#092526] border-r border-[#1B5655] flex flex-col justify-between shrink-0 select-none z-30 transition-all duration-200">
      {/* Top Nav List */}
      <div className="flex flex-col py-3">
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-[#123A3A] text-[#10D6A0] border border-[#1B5655] shadow-sm font-semibold'
                    : 'text-[#8BAFAC] hover:bg-[#0D3031] hover:text-[#E8F5F2]'
                }`}
                title={item.label}
              >
                {/* Active emerald indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-md bg-[#10D6A0]" />
                )}
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-[#10D6A0]' : 'text-[#8BAFAC] group-hover:text-[#10D6A0]'
                  }`}
                />
                <span className="hidden md:inline truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom compact status card: SYSTEM ONLINE / All systems operational */}
      <div className="p-2.5 m-2 rounded-lg bg-[#0D3031] border border-[#1B5655] flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10D98B] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10D98B]" />
          </span>
          <span className="hidden md:inline text-[11px] font-bold font-mono text-[#E8F5F2] uppercase tracking-wider">
            SYSTEM ONLINE
          </span>
        </div>
        <p className="hidden md:block text-[10px] text-[#8BAFAC] font-mono leading-tight">
          All systems operational
        </p>
      </div>
    </aside>
  );
};
