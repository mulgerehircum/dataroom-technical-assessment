import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { FILES_STORE, FOLDERS_STORE } from "@/features/dataroom/model/constants";
import { getDataRoomDB } from "@/features/dataroom/storage/db";
import { DataRoomPage } from "@/features/dataroom/components/DataRoomPage";

export async function resetDataRoomDB(): Promise<void> {
  const db = await getDataRoomDB();
  await db.clear(FOLDERS_STORE);
  await db.clear(FILES_STORE);
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: ReactElement, route = "/") {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Renders the real app shell's route table, so folder navigation works end to end. */
export function renderDataRoomApp(route = "/") {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/" element={<DataRoomPage />} />
          <Route path="/folder/:folderId" element={<DataRoomPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
