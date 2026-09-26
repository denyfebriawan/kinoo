import RoomView from "@/components/room-view";

export default async function RoomPage(props: PageProps<"/room/[code]">) {
  const { code } = await props.params;

  return <RoomView code={code.toUpperCase()} />;
}
