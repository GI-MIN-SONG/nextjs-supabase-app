import { EventForm } from "@/components/event-form";

export default function NewEventPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <h1 className="text-2xl font-bold">새 모임 만들기</h1>
      <EventForm mode="create" />
    </div>
  );
}
