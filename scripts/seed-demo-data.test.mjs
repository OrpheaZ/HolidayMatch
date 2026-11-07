import test from "node:test";
import assert from "node:assert/strict";
import { assertExistingRows, demoEmail, demoId, generateData } from "./seed-demo-data.mjs";

const users = Array.from({ length: 200 }, (_, i) => demoId("test-user", i));
const data = generateData(users);

test("Generierung ist reproduzierbar und hat die geforderten Mengen", () => {
  assert.deepEqual(data, generateData(users));
  assert.deepEqual(
    [data.profiles.length, data.children.length, data.destinations.length, data.trips.length, data.contact_requests.length],
    [200, 350, 25, 300, 40],
  );
  assert.equal(new Set(users.map((_, i) => demoEmail(i))).size, 200);
  assert.equal(new Set(data.children.map((child) => child.id)).size, 350);
});

test("Kinder, Reisen und Kontaktanfragen sind korrekt verknüpft", () => {
  const children = new Map(data.children.map((child) => [child.id, child]));
  const trips = new Map(data.trips.map((trip) => [trip.id, trip]));
  const destinations = new Set(data.destinations.map((destination) => destination.id));
  for (const trip of data.trips) {
    assert.ok(destinations.has(trip.destination_id));
    const duration = (Date.parse(trip.end_date) - Date.parse(trip.start_date)) / 86400000;
    assert.ok(duration >= 5 && duration <= 21);
    assert.ok(data.trip_children.some((link) => link.trip_id === trip.id));
  }
  for (const link of data.trip_children) {
    assert.equal(children.get(link.child_id).user_id, link.user_id);
    assert.equal(trips.get(link.trip_id).user_id, link.user_id);
  }
  for (const request of data.contact_requests) {
    const trip = trips.get(request.trip_id);
    assert.equal(trip.user_id, request.recipient_id);
    assert.equal(trip.is_public, true);
    assert.notEqual(request.sender_id, request.recipient_id);
    assert.ok(data.trips.some((other) => other.user_id === request.sender_id
      && other.destination_id === trip.destination_id
      && other.start_date <= trip.end_date && trip.start_date <= other.end_date));
  }
  assert.equal(new Set(data.contact_requests.map((request) => `${request.sender_id}:${request.trip_id}`)).size, 40);
  assert.deepEqual(new Set(data.contact_requests.map((request) => request.status)), new Set(["pending", "accepted", "rejected"]));
});

test("Es gibt Überschneidungen und ein isoliertes öffentliches Reiseziel", () => {
  const lonely = data.trips.filter((trip) => trip.destination_id === data.destinations[24].id);
  assert.equal(lonely.length, 1);
  assert.equal(lonely[0].is_public, true);
  const publicTrips = data.trips.filter((trip) => trip.is_public && trip.destination_id === data.destinations[1].id);
  assert.ok(publicTrips.some((a) => publicTrips.some((b) =>
    a.user_id !== b.user_id && a.start_date <= b.end_date && b.start_date <= a.end_date)));
});

test("Fremde oder veränderte Datensätze werden abgelehnt", () => {
  assert.doesNotThrow(() => assertExistingRows("profiles", data.profiles.slice(0, 1), data.profiles));
  assert.throws(() => assertExistingRows("profiles", [{ ...data.profiles[0], display_name: "Geändert" }], data.profiles));
  assert.throws(() => assertExistingRows("profiles", [{ ...data.profiles[0], user_id: demoId("foreign", 1) }], data.profiles));
  assert.throws(() => assertExistingRows("user_roles", [{ user_id: users[0], role: "admin" }], [{ user_id: users[0], role: "user" }]));
});
