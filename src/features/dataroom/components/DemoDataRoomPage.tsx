import {
  demoDataRoomRepository,
  resetDemoDataRoom,
} from "@/features/dataroom/storage/demo-dataroom.repository";
import { setDataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { DataRoomPage } from "@/features/dataroom/components/DataRoomPage";

let seededOnce = false;

/**
 * Entry point for the public `/demo` route. Points the shared repository at
 * the in-memory demo implementation before `DataRoomPage` mounts (done
 * during render, not an effect, so the first folder query already sees it —
 * see the same note on `setTokenGetter` in app/App.tsx), then resets the
 * seed data once per full page load so a demo left messy doesn't linger.
 */
export function DemoDataRoomPage() {
  setDataRoomRepository(demoDataRoomRepository);
  if (!seededOnce) {
    seededOnce = true;
    resetDemoDataRoom();
  }

  return <DataRoomPage isDemo />;
}
