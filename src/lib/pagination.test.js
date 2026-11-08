import test from "node:test";
import assert from "node:assert/strict";
import { paginate, paginationMarkup } from "./pagination.js";

test("Seitengrenzen bei 30 Einträgen und nach dem Entfernen", () => {
  const items = Array.from({ length: 61 }, (_, index) => index);
  assert.equal(paginate(items.slice(0, 30), 1).pages, 1);
  assert.deepEqual(paginate(items, 2).items, items.slice(30, 60));
  assert.deepEqual(paginate(items, 3).items, [60]);
  assert.equal(paginate(items.slice(0, 30), 3).current, 1);
  assert.equal(paginationMarkup(1, 1, "Reisen"), "");
  assert.match(paginationMarkup(1, 3, "Reisen"), /Seite 1 von 3/);
  assert.match(paginationMarkup(2, 3, "Trips", "en"), /Page 2 of 3/);
  assert.match(paginationMarkup(2, 3, "Пътувания", "bg"), /Страница 2 от 3/);
});
