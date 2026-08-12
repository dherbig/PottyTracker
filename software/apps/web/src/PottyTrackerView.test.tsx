import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiClient } from "@potty/shared";
import { PottyTrackerView } from "./PottyTrackerView.js";

const mockState = {
  dogId: "dog-1",
  lastEvent: null,
  lastOutAt: null,
  lastPoopAt: null,
  isCleared: false,
};

function createMockClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    health: vi.fn().mockResolvedValue({ status: "ok" }),
    listDogs: vi.fn().mockResolvedValue([
      { id: "dog-1", name: "Default", createdAt: "2026-08-12T12:00:00Z" },
    ]),
    getState: vi.fn().mockResolvedValue(mockState),
    listEvents: vi.fn().mockResolvedValue([]),
    logEvent: vi.fn().mockResolvedValue({
      ...mockState,
      lastOutAt: "2026-08-12T12:00:00Z",
      isCleared: false,
      lastEvent: {
        id: "e1",
        dogId: "dog-1",
        type: "potty" as const,
        timestamp: "2026-08-12T12:00:00Z",
        insertedAt: "2026-08-12T12:00:00Z",
        hadPoop: false,
      },
    }),
    clear: vi.fn().mockResolvedValue({
      ...mockState,
      isCleared: true,
    }),
    ...overrides,
  };
}

describe("PottyTrackerView", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows empty state initially", async () => {
    render(<PottyTrackerView client={createMockClient()} />);
    expect(await screen.findByText(/no outing logged/i)).toBeInTheDocument();
  });

  it("logs an out event when Out is pressed", async () => {
    const client = createMockClient();
    const user = userEvent.setup();

    render(<PottyTrackerView client={client} nowIso="2026-08-12T13:00:00Z" />);

    await user.click(await screen.findByRole("button", { name: /^out$/i }));

    await waitFor(() => {
      expect(client.logEvent).toHaveBeenCalledWith("dog-1", { hadPoop: false });
    });
  });

  it("requires confirmation before clear", async () => {
    const client = createMockClient();
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<PottyTrackerView client={client} />);
    await user.click(await screen.findByRole("button", { name: /clear/i }));

    expect(client.clear).not.toHaveBeenCalled();
  });

  it("clears state after confirmation", async () => {
    const client = createMockClient();
    const user = userEvent.setup();

    render(<PottyTrackerView client={client} />);
    await user.click(await screen.findByRole("button", { name: /clear/i }));

    await waitFor(() => {
      expect(client.clear).toHaveBeenCalledWith("dog-1");
    });
  });

  it("logs a backdated event from the form", async () => {
    const client = createMockClient();
    const user = userEvent.setup();

    render(<PottyTrackerView client={client} />);

    const input = await screen.findByLabelText(/log past event/i);
    await user.clear(input);
    await user.type(input, "2026-08-12T08:30");
    await user.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(client.logEvent).toHaveBeenCalledWith("dog-1", {
        hadPoop: false,
        timestamp: expect.stringMatching(/2026-08-12T/),
      });
    });
  });

  it("shows dog selector when multiple dogs exist", async () => {
    const client = createMockClient({
      listDogs: vi.fn().mockResolvedValue([
        { id: "dog-1", name: "Default", createdAt: "2026-08-12T12:00:00Z" },
        { id: "dog-2", name: "Rex", createdAt: "2026-08-12T12:01:00Z" },
      ]),
    });

    render(<PottyTrackerView client={client} />);
    expect(await screen.findByLabelText(/select dog/i)).toBeInTheDocument();
  });

  it("shows poop badge when last event included poop", async () => {
    const client = createMockClient({
      getState: vi.fn().mockResolvedValue({
        dogId: "dog-1",
        lastOutAt: "2026-08-12T12:00:00Z",
        lastPoopAt: "2026-08-12T12:00:00Z",
        isCleared: false,
        lastEvent: {
          id: "e1",
          dogId: "dog-1",
          type: "potty",
          timestamp: "2026-08-12T12:00:00Z",
          insertedAt: "2026-08-12T12:00:00Z",
          hadPoop: true,
        },
      }),
    });

    render(
      <PottyTrackerView client={client} nowIso="2026-08-12T13:00:00Z" />,
    );
    expect(await screen.findByText(/included poop/i)).toBeInTheDocument();
  });

  it("rolls back optimistic state when the request fails", async () => {
    const client = createMockClient({
      getState: vi.fn().mockResolvedValue({
        dogId: "dog-1",
        lastOutAt: "2026-08-12T10:00:00Z",
        lastPoopAt: null,
        isCleared: false,
        lastEvent: {
          id: "e0",
          dogId: "dog-1",
          type: "potty",
          timestamp: "2026-08-12T10:00:00Z",
          insertedAt: "2026-08-12T10:00:00Z",
          hadPoop: false,
        },
      }),
      logEvent: vi.fn().mockRejectedValue(new Error("network down")),
    });
    const user = userEvent.setup();

    render(
      <PottyTrackerView client={client} nowIso="2026-08-12T12:00:00Z" />,
    );

    expect(await screen.findByText(/2h ago/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^out$/i }));

    expect(await screen.findByText(/network down/i)).toBeInTheDocument();
    expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
  });

  it("shows collapsible history when events exist", async () => {
    const client = createMockClient({
      listEvents: vi.fn().mockResolvedValue([
        {
          id: "e1",
          dogId: "dog-1",
          type: "potty",
          timestamp: "2026-08-12T10:00:00Z",
          insertedAt: "2026-08-12T10:00:00Z",
          hadPoop: true,
        },
      ]),
    });
    const user = userEvent.setup();

    render(
      <PottyTrackerView client={client} nowIso="2026-08-12T12:00:00Z" />,
    );

    const summary = await screen.findByText(/history \(1\)/i);
    await user.click(summary);
    expect(await screen.findByText("Out + poop")).toBeInTheDocument();
  });
});
