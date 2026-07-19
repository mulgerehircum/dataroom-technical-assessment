import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render } from "@testing-library/react";
import { DataRoomPage } from "@/features/dataroom/components/DataRoomPage";

export {
  failNext,
  resetFakeRepository,
} from "./fakes/fake-dataroom.repository";

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
