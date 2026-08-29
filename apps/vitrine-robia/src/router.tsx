import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import LocalSeoAntananarivo from "./pages/LocalSeoAntananarivo";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "seo-local-antananarivo",
        element: <LocalSeoAntananarivo />,
      },
    ],
  },
]);
