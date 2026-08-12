import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatLocalTime,
  formatRelative,
  plainDateTimeLocalToIso,
  type ApiClient,
  type Dog,
  type PottyState,
} from "@potty/shared";

interface PottyTrackerViewProps {
  client: ApiClient;
  nowIso?: string;
  timeZone?: string;
}

function toDateTimeLocalValue(iso: string): string {
  const zdt = Temporal.Instant.from(iso).toZonedDateTimeISO(
    Temporal.Now.timeZoneId(),
  );
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${zdt.year}-${pad(zdt.month)}-${pad(zdt.day)}T${pad(zdt.hour)}:${pad(zdt.minute)}`;
}

export function PottyTrackerView({
  client,
  nowIso,
  timeZone = Temporal.Now.timeZoneId(),
}: PottyTrackerViewProps) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [selectedDogId, setSelectedDogId] = useState<string>("");
  const [state, setState] = useState<PottyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backdateValue, setBackdateValue] = useState(() =>
    toDateTimeLocalValue(nowIso ?? Temporal.Now.instant().toString()),
  );

  const referenceNow = nowIso ?? Temporal.Now.instant().toString();

  const loadState = useCallback(
    async (dogId: string) => {
      const nextState = await client.getState(dogId);
      setState(nextState);
    },
    [client],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const nextDogs = await client.listDogs();
        if (cancelled) return;
        setDogs(nextDogs);
        const dogId = nextDogs[0]?.id ?? "";
        setSelectedDogId(dogId);
        if (dogId) {
          await loadState(dogId);
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(
            bootstrapError instanceof Error
              ? bootstrapError.message
              : "Failed to load",
          );
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [client, loadState]);

  const showDogSelector = dogs.length > 1;

  const display = useMemo(() => {
    if (!state || state.isCleared || !state.lastOutAt) {
      return { empty: true, time: null, relative: null, hadPoop: false };
    }

    return {
      empty: false,
      time: formatLocalTime(state.lastOutAt, timeZone),
      relative: formatRelative(state.lastOutAt, referenceNow),
      hadPoop: state.lastEvent?.hadPoop ?? false,
    };
  }, [referenceNow, state, timeZone]);

  async function runAction(action: () => Promise<PottyState>) {
    setLoading(true);
    setError(null);
    try {
      const nextState = await action();
      setState(nextState);
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Request failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleLog(hadPoop: boolean, timestamp?: string) {
    if (!selectedDogId) return;
    await runAction(() => client.logEvent(selectedDogId, { hadPoop, timestamp }));
  }

  async function handleClear() {
    if (!selectedDogId) return;
    if (!window.confirm("Clear the last potty time?")) return;
    await runAction(() => client.clear(selectedDogId));
  }

  function parseBackdateTimestamp(): string {
    const [datePart, timePart] = backdateValue.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);
    return plainDateTimeLocalToIso(
      { year, month, day, hour, minute },
      timeZone,
    );
  }

  return (
    <main className="app">
      <h1>Potty Tracker</h1>

      {showDogSelector ? (
        <select
          className="dog-select"
          aria-label="Select dog"
          value={selectedDogId}
          onChange={(event) => {
            const dogId = event.target.value;
            setSelectedDogId(dogId);
            void loadState(dogId);
          }}
        >
          {dogs.map((dog) => (
            <option key={dog.id} value={dog.id}>
              {dog.name}
            </option>
          ))}
        </select>
      ) : (
        dogs[0] && <p aria-label="Dog name">{dogs[0].name}</p>
      )}

      <section className={`status-card${display.empty ? " empty" : ""}`}>
        {display.empty ? (
          <>
            <p className="status-label">Last out</p>
            <p className="status-time">No outing logged</p>
          </>
        ) : (
          <>
            <p className="status-label">Last out</p>
            <p className="status-time">{display.time}</p>
            <p className="status-relative">{display.relative}</p>
            {display.hadPoop && <span className="poop-badge">Included poop</span>}
          </>
        )}
      </section>

      <div className="button-row">
        <button
          type="button"
          className="btn-out"
          disabled={loading || !selectedDogId}
          onClick={() => void handleLog(false)}
        >
          Out
        </button>
        <button
          type="button"
          className="btn-poop"
          disabled={loading || !selectedDogId}
          onClick={() => void handleLog(true)}
        >
          Poop
        </button>
      </div>

      <button
        type="button"
        className="btn-clear"
        disabled={loading || !selectedDogId}
        onClick={() => void handleClear()}
      >
        Clear
      </button>

      <section className="backdate">
        <h2>Log past event</h2>
        <input
          type="datetime-local"
          aria-label="Log past event"
          value={backdateValue}
          onChange={(event) => setBackdateValue(event.target.value)}
        />
        <div className="button-row">
          <button
            type="button"
            className="btn-out"
            disabled={loading || !selectedDogId}
            onClick={() => void handleLog(false, parseBackdateTimestamp())}
          >
            Log Out
          </button>
          <button
            type="button"
            className="btn-poop"
            disabled={loading || !selectedDogId}
            onClick={() => void handleLog(true, parseBackdateTimestamp())}
          >
            Log Poop
          </button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
    </main>
  );
}
