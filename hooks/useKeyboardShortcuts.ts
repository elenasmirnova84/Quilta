import { useEffect } from 'react';

export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K = Open code modal
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        if (shortcuts.openCodeModal) {
          e.preventDefault();
          shortcuts.openCodeModal();
        }
      }

      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (shortcuts.save) {
          e.preventDefault();
          shortcuts.save();
        }
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (shortcuts.undo) {
          e.preventDefault();
          shortcuts.undo();
        }
      }

      // ESC = Close modal
      if (e.key === 'Escape') {
        if (shortcuts.closeModal) {
          shortcuts.closeModal();
        }
      }

      // ? = Show help (only if not typing in an input)
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (shortcuts.showHelp) {
          shortcuts.showHelp();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};
