declare global {
  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    window.onYouTubeIframeAPIReady = () => resolve();

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("Failed to load the YouTube player script"));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}
