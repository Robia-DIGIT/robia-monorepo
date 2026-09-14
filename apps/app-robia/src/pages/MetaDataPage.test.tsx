import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MetaDataPage from "./MetaDataPage";
import * as meta from "../lib/meta";

vi.mock("../lib/meta");

const mockedMeta = vi.mocked(meta);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("MetaDataPage — état déconnecté", () => {
  it("propose la connexion sans charger les assets ni les performances", async () => {
    mockedMeta.getMetaStatus.mockResolvedValue({
      connected: false,
      metaUserId: null,
      metaUserName: null,
      grantedScopes: [],
      requiredScopes: ["pages_show_list", "pages_read_engagement", "instagram_basic"],
      selectedPageId: null,
      selectedPageName: null,
      selectedInstagramAccountId: null,
      selectedInstagramUsername: null,
      connectedAt: null,
      lastSyncedAt: null,
      readOnly: true,
      scoreInfluence: false,
    });

    render(<MetaDataPage />);

    await waitFor(() => expect(screen.getByRole("button", { name: /Connecter Meta/i })).toBeInTheDocument());
    expect(mockedMeta.listMetaAssets).not.toHaveBeenCalled();
    expect(mockedMeta.getMetaPerformance).not.toHaveBeenCalled();
    expect(screen.getByText(/lecture seule/i)).toBeInTheDocument();
    expect(screen.getByText(/séparés du score SEO/i)).toBeInTheDocument();
  });
});

describe("MetaDataPage — état connecté", () => {
  it("affiche les métriques Facebook et Instagram sans les inclure dans le score", async () => {
    mockedMeta.getMetaStatus.mockResolvedValue({
      connected: true,
      metaUserId: "meta-user-1",
      metaUserName: "ROBIA Owner",
      grantedScopes: ["pages_show_list", "pages_read_engagement", "instagram_basic"],
      requiredScopes: ["pages_show_list", "pages_read_engagement", "instagram_basic"],
      selectedPageId: "page-1",
      selectedPageName: "ROBIA Copilot",
      selectedInstagramAccountId: "ig-1",
      selectedInstagramUsername: "robiacopilot",
      connectedAt: "2026-09-14T00:00:00Z",
      lastSyncedAt: "2026-09-14T00:10:00Z",
      readOnly: true,
      scoreInfluence: false,
    });
    mockedMeta.listMetaAssets.mockResolvedValue([
      {
        pageId: "page-1",
        pageName: "ROBIA Copilot",
        tasks: ["ANALYZE"],
        instagramAccount: { id: "ig-1", username: "robiacopilot" },
        selected: true,
      },
    ]);
    mockedMeta.getMetaPerformance.mockResolvedValue({
      source: "meta",
      readOnly: true,
      scoreInfluence: false,
      lastSyncedAt: "2026-09-14T00:10:00Z",
      facebook: {
        pageId: "page-1",
        pageName: "ROBIA Copilot",
        fanCount: 120,
        followersCount: 145,
        talkingAboutCount: 12,
      },
      instagram: {
        accountId: "ig-1",
        username: "robiacopilot",
        followersCount: 310,
        followsCount: 84,
        mediaCount: 27,
        recentMedia: [],
      },
    });

    render(<MetaDataPage />);

    await waitFor(() => expect(screen.getByText("ROBIA Owner")).toBeInTheDocument());
    expect(screen.getAllByText("ROBIA Copilot").length).toBeGreaterThan(0);
    expect(screen.getByText("145")).toBeInTheDocument();
    expect(screen.getByText("310")).toBeInTheDocument();
    expect(screen.getAllByText(/Hors score SEO/i).length).toBeGreaterThan(0);
    expect(mockedMeta.listMetaAssets).toHaveBeenCalledTimes(1);
    expect(mockedMeta.getMetaPerformance).toHaveBeenCalledTimes(1);
  });
});
