import RoomView from "@/components/room-view";

export default async function RoomPage(props: PageProps<"/room/[code]">) {
  const { code } = await props.params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <RoomView code={code.toUpperCase()} />
    </main>
  );
}
