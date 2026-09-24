import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase-admin/firestore";
import { DateTime } from "luxon";
import { BOOKING_EXPORT_CSV_HEADERS, bookingRowToCsvCells } from "./bookings-export-csv";

const zone = "America/Chicago";
const at = (iso: string) => Timestamp.fromMillis(DateTime.fromISO(iso, { zone }).toMillis());

function cellsByHeader(data: Record<string, unknown>): Record<string, string> {
  const cells = bookingRowToCsvCells("b1", data);
  expect(cells).toHaveLength(BOOKING_EXPORT_CSV_HEADERS.length);
  return Object.fromEntries(BOOKING_EXPORT_CSV_HEADERS.map((h, i) => [h, cells[i]!]));
}

describe("bookingRowToCsvCells payment columns", () => {
  it("exports an in-office payment", () => {
    const row = cellsByHeader({
      status: "confirmed",
      startAt: at("2026-09-23T15:00:00"),
      paidAt: at("2026-09-23T15:42:00"),
      paidAmountCents: 6500,
      paymentMethod: "card",
      paymentNote: "tip included",
      paymentRecordedByEmail: "desk@example.com",
    });
    expect(row["Pay status"]).toBe("Paid");
    expect(row["Payment method"]).toBe("Card");
    expect(row["Paid amount"]).toBe("65.00");
    expect(row["Paid at (Chicago)"]).toBe("2026-09-23 03:42 PM");
    expect(row["Payment recorded by"]).toBe("desk@example.com");
    expect(row["Payment note"]).toBe("tip included");
    expect(row["Booking ID"]).toBe("b1");
  });

  it("exports a cash payment recorded without an amount as paid", () => {
    const row = cellsByHeader({ status: "confirmed", paidAt: at("2026-09-23T15:42:00"), paymentMethod: "cash" });
    expect(row["Pay status"]).toBe("Paid");
    expect(row["Payment method"]).toBe("Cash");
    expect(row["Paid amount"]).toBe("");
  });

  it("labels an older Square payment as online", () => {
    const row = cellsByHeader({ status: "confirmed", paidAmountCents: 5000, squarePaymentId: "sq_1" });
    expect(row["Payment method"]).toBe("Online (Square)");
    expect(row["Square payment ID"]).toBe("sq_1");
  });

  it("leaves payment columns blank when unpaid and marks no-shows", () => {
    const row = cellsByHeader({ status: "confirmed", noShow: true });
    expect(row["Pay status"]).toBe("");
    expect(row["Payment method"]).toBe("");
    expect(row["No-show"]).toBe("yes");
  });
});
