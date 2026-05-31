import { type PipelineInput, runPipeline } from "./runPipeline";

// Minimal view of the dedicated worker scope. The WebWorker lib is not in our tsconfig (it conflicts
// with DOM's Window typing), so we describe only what this entry touches rather than pull it in.
interface DedicatedWorkerScope {
  addEventListener: (
    type: "message",
    listener: (event: MessageEvent<PipelineInput>) => void,
  ) => void;
  postMessage: (data: unknown) => void;
}

const scope = self as unknown as DedicatedWorkerScope;

// Off the main thread: parse Markdown, highlight, and generate CSS so typing never stutters. The
// result is posted back unsanitized — sanitization needs the DOM and runs on the main thread.
scope.addEventListener("message", (event) => {
  scope.postMessage(runPipeline(event.data));
});
