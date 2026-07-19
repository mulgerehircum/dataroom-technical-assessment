import { createBrowserRouter } from "react-router-dom";
import { DataRoomPage } from "@/features/dataroom/components/DataRoomPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DataRoomPage />,
  },
  {
    path: "/folder/:folderId",
    element: <DataRoomPage />,
  },
]);
