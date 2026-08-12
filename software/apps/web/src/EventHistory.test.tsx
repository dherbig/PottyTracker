import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TrackerEvent } from "@potty/shared";
import { EventHistory } from "./EventHistory.js";

const events: TrackerEvent[] = [
  {
    id: "e1",
    dogId: "dog-1",
    type: "potty",
    timestamp: "2026-08-12T10:00:00Z",
    insertedAt: "2026-08-12T10:00:00Z",
    hadPoop: false,
  },
  {
    id: "e2",
    dogId: "dog-1",
    type: "clear",
    timestamp: "2026-08-12T11:00:00Z",
    insertedAt: "2026-08-12T11:00:00Z",
  },
];

describe("EventHistory", () => {
  it("renders nothing when there are no events", () => {
    const { container } = render(<EventHistory events={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a collapsible list of events", () => {
    render(
      <EventHistory
        events={events}
        timeZone="UTC"
      />,
    );

    expect(screen.getByText("History (2)")).toBeInTheDocument();
    expect(screen.getByText("Out")).toBeInTheDocument();
    expect(screen.getByText("Cleared")).toBeInTheDocument();
  });
});
