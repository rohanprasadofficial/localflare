import { HugeiconsIcon } from '@hugeicons/react';
import {
  Rocket01Icon,
  Database02Icon,
  LayersLogoIcon,
  FolderOpenIcon,
  CloudIcon,
  QueueIcon,
  CommandIcon,
  AlertCircleIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface WikiSection {
  id: string;
  title: string;
  icon: typeof Rocket01Icon;
  children?: { id: string; title: string }[];
}

export const WIKI_SECTIONS: WikiSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket01Icon,
    children: [
      { id: 'installation', title: 'Installation' },
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'configuration', title: 'Configuration' },
    ],
  },
  {
    id: 'cli',
    title: 'CLI Reference',
    icon: CommandIcon,
    children: [
      { id: 'cli-commands', title: 'Commands' },
      { id: 'cli-attach-mode', title: 'Attach Mode' },
      { id: 'cli-options', title: 'Options' },
      { id: 'cli-examples', title: 'Examples' },
    ],
  },
  {
    id: 'd1',
    title: 'D1 Database',
    icon: Database02Icon,
    children: [
      { id: 'd1-overview', title: 'Overview' },
      { id: 'd1-sql-editor', title: 'SQL Editor' },
      { id: 'd1-table-browser', title: 'Table Browser' },
      { id: 'd1-data-editing', title: 'Data Editing' },
    ],
  },
  {
    id: 'kv',
    title: 'KV Storage',
    icon: LayersLogoIcon,
    children: [
      { id: 'kv-overview', title: 'Overview' },
      { id: 'kv-browser', title: 'Key Browser' },
      { id: 'kv-operations', title: 'Operations' },
    ],
  },
  {
    id: 'r2',
    title: 'R2 Buckets',
    icon: FolderOpenIcon,
    children: [
      { id: 'r2-overview', title: 'Overview' },
      { id: 'r2-file-manager', title: 'File Manager' },
      { id: 'r2-uploads', title: 'Uploads & Downloads' },
    ],
  },
  {
    id: 'durable-objects',
    title: 'Durable Objects',
    icon: CloudIcon,
    children: [
      { id: 'do-overview', title: 'Overview' },
      { id: 'do-instances', title: 'Instance Listing' },
      { id: 'do-state', title: 'State Inspection' },
    ],
  },
  {
    id: 'queues',
    title: 'Queues',
    icon: QueueIcon,
    children: [
      { id: 'queues-overview', title: 'Overview' },
      { id: 'queues-messages', title: 'Message Viewer' },
      { id: 'queues-testing', title: 'Testing Messages' },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    icon: Settings02Icon,
    children: [
      { id: 'requirements', title: 'Requirements' },
      { id: 'architecture', title: 'Architecture' },
      { id: 'bindings', title: 'Supported Bindings' },
      { id: 'persistence', title: 'Data Persistence' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: AlertCircleIcon,
    children: [
      { id: 'common-issues', title: 'Common Issues' },
      { id: 'faq', title: 'FAQ' },
    ],
  },
];

interface WikiSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function WikiSidebar({ activeSection, onSectionChange }: WikiSidebarProps) {
  return (
    <aside className="w-56 shrink-0 bg-[#fff7f0] border-r border-zinc-200">
      <div className="sticky top-0 h-screen overflow-y-auto px-4 py-8">
        <nav className="space-y-6">
          {WIKI_SECTIONS.map((section) => (
            <div key={section.id}>
              <button
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'flex w-full items-center gap-2 text-[13px] font-medium transition-colors',
                  activeSection === section.id || section.children?.some(c => c.id === activeSection)
                    ? 'text-orange-600'
                    : 'text-zinc-700 hover:text-zinc-900'
                )}
              >
                <HugeiconsIcon icon={section.icon} size={14} strokeWidth={1.5} />
                {section.title}
              </button>

              {section.children && (
                <div className="mt-2 ml-5 space-y-1">
                  {section.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onSectionChange(child.id)}
                      className={cn(
                        'block w-full text-left text-xs transition-colors',
                        activeSection === child.id
                          ? 'text-zinc-900 font-medium'
                          : 'text-zinc-600 hover:text-zinc-800'
                      )}
                    >
                      {child.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
