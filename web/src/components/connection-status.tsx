"use client";

import { useRoom, type ConnectionStatus } from "@/components/room-provider";

const LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  connected: "Live",
  offline: "Offline — retrying",
};

const DOT_CLASSES: Record<ConnectionStatus, string> = {
  connecting: "bg-accent animate-pulse",
  connected: "bg-success",
  offline: "bg-danger animate-pulse",
};

export default function ConnectionIndicator() {
  const { status } = useRoom();

  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted"
    >
      <span className={`h-2 w-2 rounded-full ${DOT_CLASSES[status]}`} />
      {LABELS[status]}
    </span>
  );
}
