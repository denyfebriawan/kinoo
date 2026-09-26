import Link from "next/link";
import ConnectionIndicator from "@/components/connection-status";
import { LogoMark } from "@/components/icons";

export default function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-[110rem] items-center justify-between px-4 py-4">
      <Link href="/" className="flex items-center gap-2.5 rounded-lg">
        <LogoMark className="h-7 w-7" />
        <span className="text-lg font-semibold tracking-tight">Kinoo</span>
      </Link>
      <ConnectionIndicator />
    </header>
  );
}
