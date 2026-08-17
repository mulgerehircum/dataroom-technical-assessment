import { createBrowserRouter } from "react-router-dom";
import { DataRoomPage } from "@/features/dataroom/components/DataRoomPage";
import { DemoDataRoomPage } from "@/features/dataroom/components/DemoDataRoomPage";

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

/** Bypasses Clerk entirely — see the pathname check in app/App.tsx. */
export const demoRouter = createBrowserRouter([
  {
    path: "/demo",
    element: <DemoDataRoomPage />,
  },
  {
    path: "/demo/folder/:folderId",
    element: <DemoDataRoomPage />,
  },
]);
