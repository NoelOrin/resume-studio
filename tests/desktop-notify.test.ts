import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldUseSystemNotification } from "../src/lib/desktop";

test("system notification decision matrix", () => {
  const decision = (desktop: boolean, windowFocused: boolean, important = true) =>
    shouldUseSystemNotification({ desktop, windowFocused, important });

  // Browser: never, no matter what.
  assert.equal(decision(false, false), false);
  assert.equal(decision(false, true), false);

  // Desktop + unfocused: the only case that bothers the user.
  assert.equal(decision(true, false), true);

  // Desktop + focused: in-app toast already visible.
  assert.equal(decision(true, true), false);

  // Not notification-worthy: always stays toast-only.
  assert.equal(decision(true, false, false), false);
});
