import {
  describeEvent,
  formatLocalTime,
  type TrackerEvent,
} from "@potty/shared";

interface EventHistoryProps {
  events: TrackerEvent[];
  timeZone?: string;
}

export function EventHistory({
  events,
  timeZone = Temporal.Now.timeZoneId(),
}: EventHistoryProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <details className="history">
      <summary>History ({events.length})</summary>
      <ul className="history-list">
        {events.map((event) => (
          <li key={event.id}>
            <span className="history-label">{describeEvent(event)}</span>
            <span className="history-time">
              {formatLocalTime(event.timestamp, timeZone)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
