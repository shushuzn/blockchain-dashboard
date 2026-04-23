import { ref, onMounted, onUnmounted } from 'vue';

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | null;
  returnFocusOnDeactivate?: boolean;
  allowOutsideClick?: boolean;
}

export function useFocusTrap(
  containerRef: { value: HTMLElement | null },
  options: FocusTrapOptions = {}
) {
  const {
    initialFocus = null,
    returnFocusOnDeactivate = true,
    allowOutsideClick = false,
  } = options;

  let previousActiveElement: HTMLElement | null = null;
  const focusableElements = ref<HTMLElement[]>([]);

  function getFocusableElements(): HTMLElement[] {
    if (!containerRef.value) return [];

    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    return Array.from(containerRef.value.querySelectorAll(selector));
  }

  function activate() {
    previousActiveElement = document.activeElement as HTMLElement;

    focusableElements.value = getFocusableElements();

    if (focusableElements.value.length === 0) return;

    const target = initialFocus || focusableElements.value[0];
    target?.focus();
  }

  function deactivate() {
    if (returnFocusOnDeactivate && previousActiveElement) {
      previousActiveElement.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  function handleOutsideClick(event: MouseEvent) {
    if (allowOutsideClick) return;

    if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onMounted(() => {
    activate();
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);
  });

  onUnmounted(() => {
    deactivate();
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleOutsideClick);
  });

  return {
    activate,
    deactivate,
    getFocusableElements,
  };
}

export function useAnnouncer() {
  const message = ref('');
  const politeness = ref<'polite' | 'assertive'>('polite');
  let timeoutId: number | null = null;

  function announce(newMessage: string, level: 'polite' | 'assertive' = 'polite') {
    message.value = '';
    politeness.value = level;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    requestAnimationFrame(() => {
      message.value = newMessage;
    });

    timeoutId = window.setTimeout(() => {
      message.value = '';
    }, 3000);
  }

  function clear() {
    message.value = '';
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  return {
    message,
    politeness,
    announce,
    clear,
  };
}

export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  function handleKeyDown(event: KeyboardEvent) {
    const key = [];

    if (event.ctrlKey || event.metaKey) key.push('ctrl');
    if (event.altKey) key.push('alt');
    if (event.shiftKey) key.push('shift');
    if (
      event.key !== 'Control' &&
      event.key !== 'Alt' &&
      event.key !== 'Shift' &&
      event.key !== 'Meta'
    ) {
      key.push(event.key.toLowerCase());
    }

    const combo = key.join('+');

    if (shortcuts[combo]) {
      event.preventDefault();
      shortcuts[combo]();
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown);
  });
}

export function useReducedMotion() {
  const prefersReducedMotion = ref(false);

  function updateMediaQuery() {
    prefersReducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  onMounted(() => {
    updateMediaQuery();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', updateMediaQuery);

    onUnmounted(() => {
      mediaQuery.removeEventListener('change', updateMediaQuery);
    });
  });

  return prefersReducedMotion;
}
