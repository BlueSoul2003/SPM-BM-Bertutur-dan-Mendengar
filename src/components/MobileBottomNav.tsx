import React from 'react';
import { Mic, Headphones, Trophy, Bot } from 'lucide-react';
import { ActiveTab } from '../types';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUserRank?: number;
  isRegistered?: boolean;
  onOpenAuthModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  currentUserRank,
  isRegistered = true,
  onOpenAuthModal,
}) => {
  const tabs = [
    {
      id: 'speaking' as ActiveTab,
      label: 'Bertutur',
      icon: Mic,
    },
    {
      id: 'listening' as ActiveTab,
      label: 'Mendengar',
      icon: Headphones,
    },
    {
      id: 'leaderboard' as ActiveTab,
      label: 'Kedudukan',
      icon: Trophy,
      rankBadge: currentUserRank ? `#${currentUserRank}` : undefined,
    },
    {
      id: 'tutor' as ActiveTab,
      label: 'Cikgu AI',
      icon: Bot,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 py-1 flex justify-around items-center shadow-lg"
      style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
      aria-label="Navigasi Mudah Alih"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            aria-current={isActive ? 'page' : undefined}
            id={`mobile-nav-${tab.id}`}
            onClick={() => {
              if (!isRegistered && onOpenAuthModal) {
                onOpenAuthModal();
              } else {
                onTabChange(tab.id);
              }
            }}
            className={`flex-1 min-w-[56px] py-1.5 px-1 flex flex-col items-center justify-center relative rounded-xl transition-all cursor-pointer active:scale-95 ${
              isActive
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-colors relative ${
                isActive ? 'bg-emerald-50 text-emerald-600' : ''
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />

              {tab.rankBadge && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] leading-tight shadow-sm">
                  {tab.rankBadge}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
              {tab.label}
            </span>

            {isActive && (
              <span className="w-4 h-0.5 bg-emerald-600 rounded-full mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
