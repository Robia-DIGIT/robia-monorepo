import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import LocalSeoAntananarivo from "./pages/LocalSeoAntananarivo";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";

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
      {
        path: "confidentialite",
        element: <PrivacyPolicy />,
      },
      {
        path: "conditions-utilisation",
        element: <TermsOfUse />,
      },
    ],
  },
]);
