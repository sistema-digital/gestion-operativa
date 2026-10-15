import { describe, expect, it } from "vitest";

import { formatTotalHours } from "./formatTotalHours";

describe("formatTotalHours", () => {
  it("compacta acumulados grandes de horas", () => {
    expect(formatTotalHours(3_600_000)).toBe("1K hrs");
    expect(formatTotalHours(36_000_000)).toBe("10K hrs");
    expect(formatTotalHours(360_000_000)).toBe("100K hrs");
    expect(formatTotalHours(3_600_000_000)).toBe("1M hrs");
  });

  it("conserva hasta dos decimales para acumulados menores a una hora", () => {
    expect(formatTotalHours(1_800)).toBe("0.5 hrs");
  });

  it("conserva el marcador de ausencia cuando no hay segundos", () => {
    expect(formatTotalHours(null)).toBe("—");
  });
});
