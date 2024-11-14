import cx from "classnames";
import { PropsWithChildren, useCallback, useMemo, useRef, useState } from "react";
import { BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { useEffectOnce, useMeasure, useWindowSize } from "react-use";

const MIN_FADE_AREA = 24; //px
const MAX_SCROLL_LEFT_TO_END_AREA = 50; //px
const MIN_SCROLL_END_SPACE = 5; // px

function useScrollFade(getSnapChildren: (scrollable: HTMLDivElement) => HTMLElement[]) {
  const scrollableRef = useRef<HTMLDivElement | null>(null);

  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollRight, setScrollRight] = useState(0);
  const [maxFadeArea, setMaxFadeArea] = useState(75);

  const setScrolls = useCallback(() => {
    const scrollable = scrollableRef.current;
    if (!scrollable) {
      return;
    }

    if (scrollable.scrollWidth > scrollable.clientWidth) {
      setScrollLeft(scrollable.scrollLeft);
      const right = scrollable.scrollWidth - scrollable.clientWidth - scrollable.scrollLeft;
      setScrollRight(right < MIN_SCROLL_END_SPACE ? 0 : right);
      setMaxFadeArea(scrollable.clientWidth / 10);
    } else {
      setScrollLeft(0);
      setScrollRight(0);
    }
  }, [scrollableRef]);

  useEffectOnce(() => {
    setScrolls();

    window.addEventListener("resize", setScrolls);
    scrollableRef.current?.addEventListener("scroll", setScrolls);

    return () => {
      window.removeEventListener("resize", setScrolls);
      scrollableRef.current?.removeEventListener("scroll", setScrolls);
    };
  });

  const leftStyles = useMemo(() => {
    return {
      width: `${Math.max(MIN_FADE_AREA, Math.min(scrollLeft + 8, maxFadeArea))}px`,
    };
  }, [scrollLeft, maxFadeArea]);

  const rightStyles = useMemo(() => {
    return {
      width: `${Math.max(MIN_FADE_AREA, Math.min(scrollRight + 8, maxFadeArea))}px`,
    };
  }, [scrollRight, maxFadeArea]);

  const scrollTo = useCallback(
    (dir: 1 | -1) => {
      if (!scrollableRef.current) {
        return;
      }

      let nextNonVisibleElement: Element | undefined;

      const { left: containerLeft, width: containerWidth } = scrollableRef.current.getBoundingClientRect();
      const containerRight = containerLeft + containerWidth;

      const children = getSnapChildren(scrollableRef.current);

      for (const child of children) {
        const { left: childLeft, right: childRight, width: childWidth } = child.getBoundingClientRect();
        const childVisibleLeft = Math.max(childLeft, containerLeft);
        const childVisibleRight = Math.min(childRight, containerRight);
        const isVisible = childVisibleRight - childVisibleLeft === childWidth;

        if (dir === 1 && childLeft > containerLeft && !isVisible) {
          nextNonVisibleElement = child;
          break;
        } else if (dir === -1 && childRight < containerRight && !isVisible) {
          nextNonVisibleElement = child;
        }
      }

      if (!nextNonVisibleElement) {
        return;
      }

      let proposedScrollLeft = dir * nextNonVisibleElement.getBoundingClientRect().width;
      const nextLeftScroll = scrollableRef.current.scrollLeft + proposedScrollLeft;

      /**
       * This part is to prevent scrolling to visible area of element but leaving a small margin to the end (MAX_SCROLL_LEFT_TO_END_AREA),
       * it's better to scroll to the end in such cases
       */
      if (
        (dir === 1 && containerWidth - nextLeftScroll < MAX_SCROLL_LEFT_TO_END_AREA) ||
        (dir === -1 && nextLeftScroll < MAX_SCROLL_LEFT_TO_END_AREA)
      ) {
        proposedScrollLeft = dir * containerWidth;
      }

      scrollableRef.current.scrollBy({
        left: proposedScrollLeft,
        behavior: "smooth",
      });
      setScrolls();
    },
    [getSnapChildren, setScrolls]
  );

  const scrollToLeft = useCallback(() => scrollTo(-1), [scrollTo]);
  const scrollToRight = useCallback(() => scrollTo(1), [scrollTo]);

  return {
    scrollableRef,
    scrollLeft,
    scrollRight,
    leftStyles,
    rightStyles,
    scrollToRight,
    scrollToLeft,
  };
}

function useTableScrollFade() {
  const getTableSnapChildren = useCallback((scrollable: HTMLElement) => {
    const firstTheadTr = scrollable.querySelector("thead > tr");
    const ths = firstTheadTr?.querySelectorAll("th") || [];

    return Array.from(ths);
  }, []);

  return useScrollFade(getTableSnapChildren);
}

function useDefaultScrollFade() {
  const getSnapChildren = useCallback((scrollable: HTMLElement) => {
    return Array.from(scrollable.children) as HTMLElement[];
  }, []);

  return useScrollFade(getSnapChildren);
}

function ScrollFadeControls({
  scrollLeft,
  scrollRight,
  leftStyles,
  rightStyles,
  scrollToLeft,
  scrollToRight,
  gradientColor = "slate-800",
}: {
  scrollLeft: number;
  scrollRight: number;
  leftStyles: React.CSSProperties;
  rightStyles: React.CSSProperties;
  scrollToLeft: () => void;
  scrollToRight: () => void;
  /**
   * @default "slate-800"
   */
  gradientColor?: "slate-800" | "slate-900";
}) {
  const toColor = gradientColor === "slate-800" ? "to-slate-800" : "to-slate-900";

  const [absoluteRef, { height: absoluteHeight }] = useMeasure<HTMLDivElement>();
  const { height: windowHeight } = useWindowSize();

  const isContainerLarge = windowHeight < absoluteHeight;

  return (
    <div className="pointer-events-none absolute flex h-full w-full flex-row justify-between" ref={absoluteRef}>
      <div
        className={cx(
          "group z-[120] h-full max-w-50 cursor-pointer transition-opacity",
          "bg-gradient-to-l from-[transparent]",
          toColor,
          "flex justify-start",
          isContainerLarge ? "items-start" : "items-center",
          {
            "!cursor-default opacity-0": scrollLeft <= 0,
            "pointer-events-auto opacity-100": scrollLeft > 0,
          }
        )}
        style={leftStyles}
        onClick={scrollToLeft}
      >
        {scrollLeft > 0 && (
          <div className={cx("sticky py-12", isContainerLarge ? "top-1/2" : "bottom-0 top-0")}>
            <BiChevronLeft className="opacity-70 group-hover:opacity-100" size={24} />
          </div>
        )}
      </div>
      <div
        className={cx(
          "group z-[120] h-full max-w-50 cursor-pointer transition-opacity",
          "bg-gradient-to-r from-[transparent]",
          toColor,
          "flex justify-end",
          isContainerLarge ? "items-start" : "items-center",
          {
            "!cursor-default opacity-0": scrollRight <= 0,
            "pointer-events-auto opacity-100": scrollRight > 0,
          }
        )}
        style={rightStyles}
        onClick={scrollToRight}
      >
        {scrollRight > 0 && (
          <div className={cx("sticky py-12", isContainerLarge ? "top-1/2" : "bottom-0 top-0")}>
            <BiChevronRight className="opacity-70 group-hover:opacity-100" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}

export function TableScrollFadeContainer({ children }: PropsWithChildren<{}>) {
  const tableScrollFade = useTableScrollFade();

  return (
    <div className="relative">
      <ScrollFadeControls {...tableScrollFade} />
      <div className="scrollbar-hide overflow-x-auto" ref={tableScrollFade.scrollableRef}>
        {children}
      </div>
    </div>
  );
}

export function BodyScrollFadeContainer({ children, className }: PropsWithChildren<{ className?: string }>) {
  const scrollFade = useDefaultScrollFade();

  return (
    <div className="relative">
      <ScrollFadeControls {...scrollFade} gradientColor="slate-900" />
      <div className={cx("scrollbar-hide overflow-x-auto", className)} ref={scrollFade.scrollableRef}>
        {children}
      </div>
    </div>
  );
}
