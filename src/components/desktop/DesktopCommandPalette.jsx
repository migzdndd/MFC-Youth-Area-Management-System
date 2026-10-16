import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Briefcase, 
  FileText, 
  Building2, 
  BookOpen, 
  Settings, 
  History,
  PlusCircle,
  ArrowRight,
  X
} from 'lucide-react';

export function DesktopCommandPalette({ isOpen, onClose, onNavigate, onTriggerAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const navigationItems = [
    { id: 'dashboard', label: 'Area Dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { id: 'members', label: 'Members Directory', icon: Users, category: 'Navigation' },
    { id: 'events', label: 'Events & Attendance', icon: Calendar, category: 'Navigation' },
    { id: 'services', label: 'LIT & Ministries Services', icon: Briefcase, category: 'Navigation' },
    { id: 'reports', label: 'Pastoral & Activity Reports', icon: FileText, category: 'Navigation' },
    { id: 'chapters', label: 'Chapters & Households', icon: Building2, category: 'Navigation' },
    { id: 'readings', label: 'Daily Scripture Readings', icon: BookOpen, category: 'Navigation' },
    { id: 'changelogs', label: 'System Changelogs', icon: History, category: 'Navigation' },
    { id: 'settings', label: 'Area Settings & Profile', icon: Settings, category: 'Navigation' }
  ];

  const quickActions = [
    { id: 'create-member', label: 'Register New Youth Member', icon: PlusCircle, target: 'members', category: 'Quick Action' },
    { id: 'create-event', label: 'Schedule New Assembly or Event', icon: PlusCircle, target: 'events', category: 'Quick Action' },
    { id: 'create-report', label: 'Submit Pastoral Activity Report', icon: PlusCircle, target: 'reports', category: 'Quick Action' },
    { id: 'create-gig', label: 'Request Music / Tech Service (LIT Gig)', icon: PlusCircle, target: 'gig', category: 'Quick Action' }
  ];

  const allItems = [...navigationItems, ...quickActions];
  const filteredItems = allItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle palette on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent
          window.dispatchEvent(new CustomEvent('mfc:open-command-palette'));
        }
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) {
          handleSelect(item);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  const handleSelect = (item) => {
    onClose();
    if (item.category === 'Quick Action') {
      onTriggerAction(item.id, item.target);
    } else {
      onNavigate(item.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
        <div className="command-palette-input-wrap">
          <Search size={18} className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command, page, or quick action..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <button type="button" className="palette-close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="command-palette-results">
          {filteredItems.length === 0 ? (
            <div className="palette-empty-state">
              No matching commands or pages found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={`${item.category}-${item.id}`}
                  className={`palette-item ${isSelected ? 'selected' : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(item)}
                >
                  <div className="palette-item-left">
                    <span className="palette-item-icon">
                      <Icon size={16} />
                    </span>
                    <span className="palette-item-label">{item.label}</span>
                  </div>
                  <div className="palette-item-right">
                    <span className="palette-item-badge">{item.category}</span>
                    <ArrowRight size={14} className="palette-arrow" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="command-palette-footer">
          <span>Use <b>↑</b> <b>↓</b> to navigate</span>
          <span><b>Enter</b> to select</span>
          <span><b>ESC</b> to close</span>
        </div>
      </div>
    </div>
  );
}
