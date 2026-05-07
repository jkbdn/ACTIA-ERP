"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

interface Props {
  events: any[];
  initialView?: string;
}

export default function FullCalendarWrapper({ events, initialView = "dayGridMonth" }: Props) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
      initialView={initialView}
      locale={esLocale}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,listWeek",
      }}
      events={events}
      eventDisplay="block"
      height="auto"
      eventClassNames="text-xs"
    />
  );
}
