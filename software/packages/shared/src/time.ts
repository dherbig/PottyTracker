import "temporal-polyfill/global";

const DEFAULT_SKEW_MS = 60_000;

export interface PlainDateTimeInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
}

export function parseInstant(iso: string): Temporal.Instant {
  return Temporal.Instant.from(iso);
}

export function nowInstant(): Temporal.Instant {
  return Temporal.Now.instant();
}

export function nowInstantIso(): string {
  return nowInstant().toString();
}

export function validateEventTimestamp(
  iso: string,
  referenceIso: string = nowInstantIso(),
  skewMs: number = DEFAULT_SKEW_MS,
): string {
  const timestamp = parseInstant(iso);
  const reference = parseInstant(referenceIso);
  const latestAllowed = reference.add({ milliseconds: skewMs });

  if (Temporal.Instant.compare(timestamp, latestAllowed) > 0) {
    throw new Error("Timestamp cannot be in the future");
  }

  return timestamp.toString();
}

export function formatLocalTime(
  iso: string,
  timeZone: string = Temporal.Now.timeZoneId(),
): string {
  return parseInstant(iso)
    .toZonedDateTimeISO(timeZone)
    .toLocaleString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatRelative(
  iso: string,
  referenceIso: string = nowInstantIso(),
): string {
  const start = parseInstant(iso);
  const end = parseInstant(referenceIso);
  const totalSeconds = start.until(end, { largestUnit: "second" }).total({
    unit: "second",
  });

  if (totalSeconds < 60) {
    return "just now";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m ago`;
  }

  if (hours > 0) {
    return `${hours}h ago`;
  }

  return `${minutes}m ago`;
}

export function plainDateTimeLocalToInstant(
  input: PlainDateTimeInput,
  timeZone: string = Temporal.Now.timeZoneId(),
): Temporal.Instant {
  const plain = Temporal.PlainDateTime.from({
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute,
    second: input.second ?? 0,
  });

  return plain.toZonedDateTime(timeZone).toInstant();
}

export function plainDateTimeLocalToIso(
  input: PlainDateTimeInput,
  timeZone: string = Temporal.Now.timeZoneId(),
): string {
  return plainDateTimeLocalToInstant(input, timeZone).toString();
}
