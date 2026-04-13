import {
  DownloadTask,
  DownloadPhase,
  type DownloadTaskSnapshot,
} from "@/lib/downloadQueue/downloadTask";
import { SavedPage, type OnlinePageView } from "ropegeo-common/models";

export type QueueDownloadPhase = DownloadPhase;
export type { DownloadTaskSnapshot };

type QueueEntry = {
  data: OnlinePageView;
  savedAt?: number;
  onSuccess: (savedPage: SavedPage) => Promise<void> | void;
};

type Listener = (snapshots: Record<string, DownloadTaskSnapshot>) => void;

export class DownloadQueue {
  private static instance: DownloadQueue | null = null;

  private readonly queue: DownloadTask[] = [];

  private readonly tasks = new Map<string, DownloadTask>();

  private readonly onSuccessByPageId = new Map<
    string,
    (savedPage: SavedPage) => Promise<void> | void
  >();

  private readonly onlineViewByPageId = new Map<string, OnlinePageView>();

  private readonly displayPlanByPageId = new Map<string, DownloadPhase[]>();

  private readonly savedAtByPageId = new Map<string, number>();

  private readonly listeners = new Set<Listener>();

  private readonly cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private processing = false;

  static getInstance(): DownloadQueue {
    if (DownloadQueue.instance == null) {
      DownloadQueue.instance = new DownloadQueue();
    }
    return DownloadQueue.instance;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshots());
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(pageId: string): DownloadTaskSnapshot | null {
    const task = this.tasks.get(pageId);
    return task?.getSnapshot() ?? null;
  }

  getSnapshots(): Record<string, DownloadTaskSnapshot> {
    return Object.fromEntries(
      Array.from(this.tasks.entries()).map(([pageId, task]) => [
        pageId,
        task.getSnapshot(),
      ]),
    );
  }

  enqueue(entry: QueueEntry): void {
    const pageId = entry.data.id;
    const existing = this.tasks.get(pageId)?.getSnapshot();
    if (existing != null && (existing.state === "queued" || existing.state === "running")) {
      return;
    }

    const task = new DownloadTask(pageId, entry.data.pageViewType, () => {
      this.emit();
    });
    const displayPlan = DownloadTask.buildDisplayPlanForView(entry.data);

    this.clearCleanupTimer(task.pageId);
    task.phase = DownloadPhase.Queued;
    task.phaseProgress = 0;
    task.state = "queued";
    task.errorMessage = null;
    task.displayStep = 0;
    task.displayTotal = displayPlan.length;
    task.displayPlan = [...displayPlan];
    this.queue.push(task);
    this.tasks.set(task.pageId, task);
    this.onlineViewByPageId.set(task.pageId, entry.data);
    this.displayPlanByPageId.set(task.pageId, displayPlan);
    this.savedAtByPageId.set(task.pageId, entry.savedAt ?? Date.now());
    this.onSuccessByPageId.set(task.pageId, entry.onSuccess);
    this.emit();
    void this.process();
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const task = this.queue.shift();
        if (task == null) break;
        const onSuccess = this.onSuccessByPageId.get(task.pageId);
        const view = this.onlineViewByPageId.get(task.pageId);
        const displayPlan = this.displayPlanByPageId.get(task.pageId);
        const savedAt = this.savedAtByPageId.get(task.pageId);
        if (onSuccess == null || view == null || displayPlan == null || savedAt == null) continue;
        const viewSaved = view.toSavedPage();
        const savedPage = new SavedPage(viewSaved.preview, savedAt, viewSaved.downloadedPageViewPath);

        try {
          const result = await task.run(savedPage, displayPlan);
          await onSuccess(result);
          this.emit();
          this.scheduleCleanup(task.pageId, 2000);
        } catch {
          this.emit();
          this.scheduleCleanup(task.pageId, 4000);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  private scheduleCleanup(pageId: string, timeoutMs: number): void {
    this.clearCleanupTimer(pageId);
    const timer = setTimeout(() => {
      this.cleanupTimers.delete(pageId);
      this.tasks.delete(pageId);
      this.onSuccessByPageId.delete(pageId);
      this.onlineViewByPageId.delete(pageId);
      this.displayPlanByPageId.delete(pageId);
      this.savedAtByPageId.delete(pageId);
      this.emit();
    }, timeoutMs);
    this.cleanupTimers.set(pageId, timer);
  }

  private clearCleanupTimer(pageId: string): void {
    const timer = this.cleanupTimers.get(pageId);
    if (timer != null) {
      clearTimeout(timer);
      this.cleanupTimers.delete(pageId);
    }
  }

  private emit(): void {
    const out = this.getSnapshots();
    for (const listener of this.listeners) {
      listener(out);
    }
  }
}
