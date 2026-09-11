import { createBrowserRouter } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import GoogleBusinessProfileMadagascar from "./pages/GoogleBusinessProfileMadagascar";
import Home from "./pages/Home";
import LocalSeoAntananarivo from "./pages/LocalSeoAntananarivo";
import LocalSeoSoftwareMadagascar from "./pages/LocalSeoSoftwareMadagascar";
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
        path: "optimisation-google-business-profile-madagascar",
        element: <GoogleBusinessProfileMadagascar />,
      },
      {
        path: "logiciel-seo-local-madagascar",
        element: <LocalSeoSoftwareMadagascar />,
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
