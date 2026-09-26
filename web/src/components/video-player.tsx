"use client";

import { useEffect, useRef, useState } from "react";
import { useRoom, type SyncedVideo } from "@/components/room-provider";
import { loadYouTubeApi } from "@/lib/youtube";

const POLL_INTERVAL_MS = 500;
const SEEK_JUMP_SECONDS = 1.5;
const APPLY_TOLERANCE_SECONDS = 0.75;
const IGNORE_AFTER_COMMAND_MS = 1000;
const REPORT_INTERVAL_MS = 3000;

interface LocalPlayback {
  loadedVideoId: string | null;
  time: number;
  at: number;
  playing: boolean;
  ignoreUntil: number;
  lastReportAt: number;
}

function expectedPosition(video: SyncedVideo): number {
  if (!video.playing) return video.position;
  return video.position + (Date.now() - video.receivedAt) / 1000;
}

function rebase(local: LocalPlayback, time: number, playing: boolean) {
  local.time = time;
  local.at = Date.now();
  local.playing = playing;
}

function applyServerState(player: YT.Player, video: SyncedVideo, local: LocalPlayback) {
  if (video.videoId === null) return;
  const target = expectedPosition(video);

  if (local.loadedVideoId !== video.videoId) {
    local.loadedVideoId = video.videoId;
    local.ignoreUntil = Date.now() + IGNORE_AFTER_COMMAND_MS;
    if (video.playing) {
      player.loadVideoById(video.videoId, target);
    } else {
      player.cueVideoById(video.videoId, target);
    }
    rebase(local, target, video.playing);
    return;
  }

  const state = player.getPlayerState();
  const isPlayingLocally =
    state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING;
  let commanded = false;

  const current = player.getCurrentTime();
  const needsSeek = Math.abs(current - target) > APPLY_TOLERANCE_SECONDS;
  if (needsSeek) {
    player.seekTo(target, true);
    commanded = true;
  }
  if (video.playing && !isPlayingLocally) {
    player.playVideo();
    commanded = true;
  } else if (!video.playing && isPlayingLocally) {
    player.pauseVideo();
    commanded = true;
  }

  if (commanded) local.ignoreUntil = Date.now() + IGNORE_AFTER_COMMAND_MS;
  rebase(local, needsSeek ? target : current, video.playing);
}

export default function VideoPlayer({ fill = false }: { fill?: boolean }) {
  const { room, controlVideo, reportPosition } = useRoom();
  const video = room?.video;

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const videoRef = useRef(video);
  const controlRef = useRef(controlVideo);
  const reportRef = useRef(reportPosition);
  const localRef = useRef<LocalPlayback>({
    loadedVideoId: null,
    time: 0,
    at: 0,
    playing: false,
    ignoreUntil: 0,
    lastReportAt: 0,
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    videoRef.current = video;
    controlRef.current = controlVideo;
    reportRef.current = reportPosition;
  });

  useEffect(() => {
    const container = containerRef.current;
    const local = localRef.current;
    if (!container) return;

    let cancelled = false;
    let intervalId: number | undefined;
    let created: YT.Player | undefined;
    const mount = document.createElement("div");
    container.appendChild(mount);

    function checkForUserSeek(player: YT.Player) {
      const now = Date.now();
      const time = player.getCurrentTime();
      const predicted = local.playing ? local.time + (now - local.at) / 1000 : local.time;
      if (now > local.ignoreUntil && Math.abs(time - predicted) > SEEK_JUMP_SECONDS) {
        controlRef.current("seek", time);
      }
    }

    function handleStateChange(event: YT.OnStateChangeEvent) {
      const player = event.target;
      const server = videoRef.current;
      const state = event.data;
      const time = player.getCurrentTime();

      if (state === YT.PlayerState.BUFFERING) {
        checkForUserSeek(player);
        rebase(local, time, false);
        return;
      }

      const ignored = Date.now() < local.ignoreUntil;
      rebase(local, time, state === YT.PlayerState.PLAYING);
      if (ignored || !server) return;

      if (state === YT.PlayerState.PLAYING && !server.playing) {
        controlRef.current("play", time);
      } else if (
        (state === YT.PlayerState.PAUSED || state === YT.PlayerState.ENDED) &&
        server.playing
      ) {
        controlRef.current("pause", time);
      }
    }

    function poll() {
      const player = playerRef.current;
      if (!player) return;
      const state = player.getPlayerState();
      if (state !== YT.PlayerState.BUFFERING) checkForUserSeek(player);
      rebase(local, player.getCurrentTime(), state === YT.PlayerState.PLAYING);

      const now = Date.now();
      const isSteady =
        state === YT.PlayerState.PLAYING || state === YT.PlayerState.PAUSED;
      if (isSteady && now > local.ignoreUntil && now - local.lastReportAt >= REPORT_INTERVAL_MS) {
        local.lastReportAt = now;
        reportRef.current(player.getCurrentTime());
      }
    }

    loadYouTubeApi()
      .then(() => {
        if (cancelled) return;
        const initial = videoRef.current;
        local.loadedVideoId = initial?.videoId ?? null;

        const player = new YT.Player(mount, {
          width: "100%",
          height: "100%",
          videoId: initial?.videoId ?? undefined,
          playerVars: { playsinline: 1, rel: 0, fs: document.fullscreenEnabled ? 0 : 1 },
          events: {
            onReady: () => {
              if (cancelled) return;
              playerRef.current = player;
              const latest = videoRef.current;
              if (latest) applyServerState(player, latest, local);
              intervalId = window.setInterval(poll, POLL_INTERVAL_MS);
            },
            onStateChange: handleStateChange,
          },
        });
        created = player;
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      playerRef.current = null;
      created?.destroy();
      mount.remove();
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (player && video) applyServerState(player, video, localRef.current);
  }, [video]);

  return (
    <div className={fill ? "h-full w-full" : ""}>
      <div
        ref={containerRef}
        className={
          fill
            ? "h-full w-full bg-black"
            : "mx-auto aspect-video w-full max-w-[138vh] overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/50 ring-1 ring-line"
        }
      />
      {failed && (
        <p role="alert" className="mt-2 text-sm text-danger">
          Couldn&apos;t load the YouTube player. Check your connection or ad blocker.
        </p>
      )}
    </div>
  );
}
