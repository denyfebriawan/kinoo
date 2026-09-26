import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";

const subscribeNever = () => () => {};

export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canFullscreen = useSyncExternalStore(
    subscribeNever,
    () => document.fullscreenEnabled,
    () => false,
  );

  useEffect(() => {
    function handleChange() {
      const active = document.fullscreenElement;
      setIsFullscreen(active !== null && active === ref.current);
    }

    document.addEventListener("fullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      if (document.fullscreenElement) void document.exitFullscreen();
    };
  }, [ref]);

  const enter = useCallback(async () => {
    try {
      await ref.current?.requestFullscreen();
    } catch {
      // The browser can refuse (no user gesture, or unsupported); the page just stays as it is.
    }
  }, [ref]);

  const exit = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // Already left fullscreen.
    }
  }, []);

  const toggle = useCallback(() => (isFullscreen ? exit() : enter()), [isFullscreen, enter, exit]);

  return { isFullscreen, canFullscreen, toggle, exit };
}
