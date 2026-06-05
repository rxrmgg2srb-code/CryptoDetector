import { Section } from './constants';

interface DocSidebarProps {
  sections: Section[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

export function DocSidebar({ sections, activeSection, onSectionClick }: DocSidebarProps) {
  return (
    <aside className="lg:w-64 flex-shrink-0">
      <div className="sticky top-24 bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
        <h2 className="text-sm font-bold text-purple-300 mb-3 uppercase tracking-wider">
          Contenido
        </h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionClick(section.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                activeSection === section.id
                  ? 'bg-purple-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-purple-900/30 hover:text-white'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
