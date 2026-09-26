import {
  AsyncButton,
  Choices,
  Field,
  LoadState,
  apiStyles as s,
} from "@/components/api-ui";
import { RobiaCard, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import { useRobiaData } from "@/src/api/data";
import { ACTION_STATUS_LABELS } from "@/src/api/presentation";
import type { ActionItem, ActionStatus } from "@/src/api/types";
import { useResource } from "@/src/api/use-resource";
import { useSession } from "@/src/auth/session";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "react-native";
type Event = { id: string; eventType: string; createdAt: string };
export default function ActionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { request } = useSession();
  const { refresh } = useRobiaData();
  const list = useResource<ActionItem[]>("/actions");
  const item = list.data?.find((a) => a.id === id);
  const history = useResource<Event[]>(
    id ? "/actions/" + encodeURIComponent(id) + "/history" : null,
  );
  const [status, setStatus] = useState<ActionStatus>("todo");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [outcome, setOutcome] = useState("succeeded");
  const [key, setKey] = useState(
    () => "mobile-" + Date.now() + "-" + Math.random().toString(36).slice(2),
  );
  const savedStatus = item?.status;
  useEffect(() => {
    if (savedStatus) setStatus(savedStatus);
  }, [savedStatus]);
  const path = "/actions/" + encodeURIComponent(id ?? "");
  const reload = async () => {
    await Promise.all([list.reload(), history.reload(), refresh()]);
  };
  const mutate = async (suffix: string, body?: unknown, method = "POST") => {
    await request(path + suffix, { method, body });
    await reload();
  };
  return (
    <RobiaScreen fixedHeader>
      <RobiaHeader compact back title="Détail de l’action" />
      <LoadState {...list} retry={list.reload} empty={!item} />
      {item ? (
        <>
          <RobiaCard style={s.stack}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.body}>
              Statut : {ACTION_STATUS_LABELS[item.status] ?? item.status}
            </Text>
            <Choices<ActionStatus>
              value={status}
              onChange={setStatus}
              options={[
                { value: "todo", label: "À faire" },
                { value: "in_progress", label: "En cours" },
                { value: "done", label: "Terminée" },
                { value: "blocked", label: "Bloquée" },
                { value: "ignored", label: "Ignorée" },
              ]}
            />
            <AsyncButton icon="save"
              label="Enregistrer le statut"
              disabled={status === item.status}
              action={() => mutate("/status", { status }, "PATCH")}
            />
            <Text style={s.body}>
              Échéance :{" "}
              {item.dueDate
                ? new Date(item.dueDate).toLocaleDateString("fr-FR")
                : "Non planifiée"}
            </Text>
            <Field
              label="Nouvelle échéance (AAAA-MM-JJ)"
              value={date}
              onChangeText={setDate}
              placeholder="2026-10-30"
            />
            <AsyncButton icon="calendar"
              label="Enregistrer l’échéance"
              disabled={!/^\d{4}-\d{2}-\d{2}$/.test(date)}
              action={async () => {
                const d = new Date(date + "T12:00:00Z");
                if (
                  !Number.isFinite(d.getTime()) ||
                  d.toISOString().slice(0, 10) !== date
                )
                  throw new Error("Date invalide.");
                await mutate(
                  "/due-date",
                  { dueDate: d.toISOString() },
                  "PATCH",
                );
              }}
            />
          </RobiaCard>
          <RobiaCard style={s.stack}>
            <Text style={s.title}>Validation et exécution</Text>
            <AsyncButton icon="send"
              label="Soumettre pour validation"
              disabled={
                item.approvalStatus === "approved" ||
                item.approvalStatus === "pending"
              }
              action={() => mutate("/submit")}
            />
            <AsyncButton icon="approve"
              label="Approuver l’action"
              disabled={item.approvalStatus !== "pending"}
              confirm="Approuver cette action après vérification ?"
              action={() => mutate("/approve")}
            />
            <Field
              label="Motif du rejet"
              value={reason}
              onChangeText={setReason}
              maxLength={500}
            />
            <AsyncButton icon="reject"
              label="Rejeter l’action"
              disabled={
                reason.trim().length < 3 || item.approvalStatus !== "pending"
              }
              action={() => mutate("/reject", { reason: reason.trim() })}
            />
            <Text style={s.body}>
              Après avoir réalisé l’action, consignez le résultat et une preuve
              (lien ou description).
            </Text>
            <Choices
              value={outcome}
              onChange={setOutcome}
              options={[
                { value: "succeeded", label: "Réussie" },
                { value: "failed", label: "Échouée" },
              ]}
            />
            <Field
              label="Preuve ou compte rendu"
              value={evidence}
              onChangeText={setEvidence}
              multiline
            />
            <AsyncButton icon="save"
              label="Enregistrer le résultat"
              disabled={
                !evidence.trim() ||
                item.approvalStatus !== "approved" ||
                item.executionStatus === "succeeded"
              }
              confirm="Enregistrer ce résultat réel dans l’historique ?"
              action={async () => {
                await mutate("/execution-attempts", {
                  idempotencyKey: key,
                  outcome,
                  evidence: { description: evidence.trim() },
                  note:
                    outcome === "failed"
                      ? evidence.trim().slice(0, 500)
                      : undefined,
                });
                setKey(
                  "mobile-" +
                    Date.now() +
                    "-" +
                    Math.random().toString(36).slice(2),
                );
                setEvidence("");
              }}
            />
          </RobiaCard>
          <RobiaCard style={s.stack}>
            <Text style={s.title}>Historique</Text>
            <LoadState
              {...history}
              retry={history.reload}
              empty={!history.data?.length}
            />
            {history.data?.map((e) => (
              <Text key={e.id} style={s.body}>
                {new Date(e.createdAt).toLocaleString("fr-FR")} ·{" "}
                {e.eventType.replaceAll("_", " ")}
              </Text>
            ))}
          </RobiaCard>
        </>
      ) : null}
    </RobiaScreen>
  );
}
