import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface LazyImageOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
}

export function useLazyImage(
  imageRef: Ref<HTMLImageElement | null>,
  imageSrc: Ref<string>,
  options: LazyImageOptions = {}
) {
  const isLoaded = ref(false);
  const isLoading = ref(false);
  const hasError = ref(false);

  const defaultOptions: IntersectionObserverInit = {
    root: options.root || null,
    rootMargin: options.rootMargin || '50px',
    threshold: options.threshold || 0.1,
  };

  let observer: IntersectionObserver | null = null;

  function loadImage() {
    if (isLoading.value || isLoaded.value) return;

    const img = imageRef.value;
    if (!img) return;

    isLoading.value = true;
    hasError.value = false;

    img.onload = () => {
      isLoaded.value = true;
      isLoading.value = false;
      if (observer) {
        observer.disconnect();
      }
    };

    img.onerror = () => {
      hasError.value = true;
      isLoading.value = false;
    };

    img.src = imageSrc.value;
  }

  onMounted(() => {
    if (!('IntersectionObserver' in window)) {
      loadImage();
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage();
        }
      });
    }, defaultOptions);

    if (imageRef.value) {
      observer.observe(imageRef.value);
    }
  });

  onUnmounted(() => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return {
    isLoaded,
    isLoading,
    hasError,
    loadImage,
  };
}

export function useVirtualScroll(
  containerRef: Ref<HTMLElement | null>,
  items: Ref<unknown[]>,
  itemHeight: number,
  overscan = 5
) {
  const scrollTop = ref(0);
  const containerHeight = ref(0);

  const startIndex = ref(0);
  const endIndex = ref(0);
  const visibleItems = ref<unknown[]>([]);

  function calculateVisibleRange() {
    const scrollY = scrollTop.value;
    const viewHeight = containerHeight.value;

    const start = Math.max(0, Math.floor(scrollY / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewHeight / itemHeight);
    const end = Math.min(items.value.length, start + visibleCount + overscan * 2);

    startIndex.value = start;
    endIndex.value = end;
    visibleItems.value = items.value.slice(start, end);
  }

  function handleScroll(event: Event) {
    const target = event.target as HTMLElement;
    scrollTop.value = target.scrollTop;
    calculateVisibleRange();
  }

  function updateContainerHeight() {
    if (containerRef.value) {
      containerHeight.value = containerRef.value.clientHeight;
      calculateVisibleRange();
    }
  }

  onMounted(() => {
    if (containerRef.value) {
      containerRef.value.addEventListener('scroll', handleScroll);
      updateContainerHeight();

      const resizeObserver = new ResizeObserver(updateContainerHeight);
      resizeObserver.observe(containerRef.value);
    }
  });

  onUnmounted(() => {
    if (containerRef.value) {
      containerRef.value.removeEventListener('scroll', handleScroll);
    }
  });

  return {
    scrollTop,
    startIndex,
    endIndex,
    visibleItems,
    totalHeight: items.value.length * itemHeight,
    offsetY: startIndex.value * itemHeight,
  };
}
