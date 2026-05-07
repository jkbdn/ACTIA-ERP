"use client";
import dynamic from "next/dynamic";

const FullCalendarWrapper = dynamic(() => import("@/components/tasks/FullCalendarWrapper"), { ssr: false });

export function GlobalCalendarClient({ events }: { events: any[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <FullCalendarWrapper events={events} />
    </div>
  );
}
