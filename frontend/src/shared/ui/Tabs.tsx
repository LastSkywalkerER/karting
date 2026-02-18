import { Children, isValidElement, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';

interface TabPanelProps {
  header: string;
  children: ReactNode;
}

export function TabPanel({ children }: TabPanelProps) {
  return <>{children}</>;
}

interface TabViewProps {
  children: ReactNode;
}

export function TabView({ children }: TabViewProps) {
  const tabs = useMemo(
    () =>
      Children.toArray(children).filter((child): child is ReactElement<TabPanelProps> =>
        isValidElement(child)
      ),
    [children]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto -mx-1 px-1">
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={tab.props.header}
              type="button"
              className={`shrink-0 px-4 sm:px-6 py-3 min-h-[44px] text-sm font-medium transition-colors ${
                isActive
                  ? 'border-b-2 border-emerald-500 text-emerald-400'
                  : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
              }`}
              onClick={() => setActiveIndex(index)}
            >
              {tab.props.header}
            </button>
          );
        })}
      </div>
      <div className="pt-4 min-w-0">{tabs[activeIndex]}</div>
    </div>
  );
}
