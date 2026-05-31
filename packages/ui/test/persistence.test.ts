import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createThrottledWriter } from "../src/store/persistence";

describe("createThrottledWriter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("coalesces a burst of writes into a single trailing write per key", () => {
    const setItem = vi.fn();
    const { write } = createThrottledWriter(setItem, 140);

    write("mdp.theme", "a");
    write("mdp.theme", "b");
    write("mdp.theme", "c");
    expect(setItem).not.toHaveBeenCalled();

    vi.advanceTimersByTime(140);
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith("mdp.theme", "c");
  });

  it("keeps the latest value for each distinct key", () => {
    const setItem = vi.fn();
    const { write } = createThrottledWriter(setItem, 140);

    write("mdp.theme", "t1");
    write("mdp.document", "d1");
    write("mdp.theme", "t2");

    vi.advanceTimersByTime(140);
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(setItem).toHaveBeenCalledWith("mdp.theme", "t2");
    expect(setItem).toHaveBeenCalledWith("mdp.document", "d1");
  });

  it("flush writes the pending value immediately and cancels the timer", () => {
    const setItem = vi.fn();
    const { write, flush } = createThrottledWriter(setItem, 140);

    write("mdp.theme", "last");
    flush();
    expect(setItem).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledWith("mdp.theme", "last");

    // No trailing write should fire after a flush drained the queue.
    vi.advanceTimersByTime(140);
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh window after a flush", () => {
    const setItem = vi.fn();
    const { write, flush } = createThrottledWriter(setItem, 140);

    write("mdp.theme", "a");
    flush();
    write("mdp.theme", "b");
    expect(setItem).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(140);
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(setItem).toHaveBeenLastCalledWith("mdp.theme", "b");
  });
});
