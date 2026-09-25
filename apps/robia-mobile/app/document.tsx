import {
  AsyncButton,
  Choices,
  Field,
  LoadState,
  apiStyles as s,
} from "@/components/api-ui";
import { RobiaCard, RobiaHeader, RobiaScreen } from "@/components/robia-ui";
import { ApiError } from "@/src/api/client";
import { useRobiaData } from "@/src/api/data";
import { DOCUMENT_STATUS_LABELS } from "@/src/api/presentation";
import type { RobiaDocument } from "@/src/api/types";
import { useResource } from "@/src/api/use-resource";
import { useSession } from "@/src/auth/session";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, Share, Text } from "react-native";

export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DocumentEditor key={id} id={id} />;
}
function DocumentEditor({ id }: { id: string }) {
  const { request } = useSession();
  const { refresh } = useRobiaData();
  const navigation = useNavigation();
  const path = id ? "/documents/" + encodeURIComponent(id) : null;
  const resource = useResource<RobiaDocument>(path);
  const [editor, setEditor] = useState<{ text: string; base: string; revision: number } | null>(
    null,
  );
  const [actionType, setActionType] = useState("publish");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  // Refresh the saved version without replacing a draft the user is editing.
  useEffect(() => {
    if (!resource.data) return;
    const content = resource.data.content;
    setEditor((previous) =>
      !previous || previous.text === previous.base
        ? { text: content, base: content, revision: resource.data!.revision }
        : previous,
    );
  }, [resource.data]);
  const dirty = !!editor && editor.text !== editor.base;
  const remoteChanged =
    !!editor && !!resource.data && (resource.data.content !== editor.base || resource.data.revision !== editor.revision);
  usePreventRemove(dirty, ({ data }) => {
    const discard = () => navigation.dispatch(data.action);
    if (Platform.OS === "web") {
      if (globalThis.confirm("Quitter sans enregistrer les modifications ?"))
        discard();
    } else {
      Alert.alert(
        "Modifications non enregistrées",
        "Quitter sans enregistrer ce document ?",
        [
          { text: "Continuer à modifier", style: "cancel" },
          { text: "Quitter", style: "destructive", onPress: discard },
        ],
      );
    }
  });
  async function mutate(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) await resource.reload();
      throw error;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const reload = async () => {
    await resource.reload();
    await refresh();
  };
  return (
    <RobiaScreen fixedHeader>
      <RobiaHeader compact back title="Mon document" />
      <LoadState {...resource} retry={resource.reload} />
      {resource.data && editor ? (
        <RobiaCard style={s.stack}>
          <Text style={s.title}>{resource.data.title}</Text>
          <Text style={s.body}>
            {DOCUMENT_STATUS_LABELS[resource.data.status] ??
              resource.data.status}
          </Text>
          <Text style={s.body}>
            Relisez les informations avant validation. Votre approbation est
            enregistrée ; elle ne publie pas automatiquement ce contenu.
          </Text>
          <Field
            label="Contenu"
            value={editor.text}
            onChangeText={(text) =>
              setEditor((current) => (current ? { ...current, text } : current))
            }
            editable={!busy}
            multiline
            style={{ minHeight: 280 }}
          />
          {remoteChanged ? (
            <Text accessibilityRole="alert" style={s.body}>
              Le document a changé depuis votre dernière lecture. Votre
              brouillon est conservé. Comparez-le à la version enregistrée avant
              de l’envoyer.
            </Text>
          ) : null}
          {remoteChanged ? (
            <>
              <Text selectable style={s.body}>
                {resource.data.content}
              </Text>
              <AsyncButton
                label="Reprendre la version enregistrée"
                confirm="Remplacer votre brouillon par la version enregistrée ?"
                disabled={busy}
                action={async () => {
                  setEditor({
                    text: resource.data!.content,
                    base: resource.data!.content,
                    revision: resource.data!.revision,
                  });
                }}
              />
            </>
          ) : null}
          <AsyncButton
            label="Enregistrer les modifications"
            disabled={busy || !editor.text.trim() || !dirty || remoteChanged}
            onSuccess="Modifications enregistrées."
            action={() =>
              mutate(async () => {
                const submitted = editor.text;
                const saved = await request<RobiaDocument>(path!, {
                  method: "PATCH",
                  body: { content: submitted, expectedRevision: editor.revision },
                });
                setEditor({ text: saved.content, base: saved.content, revision: saved.revision });
                await reload();
              })
            }
          />
          <Choices
            value={actionType}
            onChange={setActionType}
            options={[
              { value: "publish", label: "Publication" },
              { value: "update", label: "Mise à jour" },
              { value: "reply", label: "Réponse" },
            ]}
          />
          {dirty ? (
            <Text style={s.body}>
              Enregistrez vos modifications avant de valider ou de partager.
            </Text>
          ) : null}
          <AsyncButton
            label="Approuver"
            disabled={busy || dirty}
            confirm="Confirmer que vous avez relu ce contenu et souhaitez l’approuver ?"
            action={() =>
              mutate(async () => {
                await request("/validations", {
                  method: "POST",
                  body: { documentId: id, actionType, status: "approved" },
                });
                await reload();
              })
            }
            onSuccess="Approbation enregistrée."
          />
          <AsyncButton
            label="Rejeter"
            disabled={busy || dirty}
            confirm="Rejeter ce contenu ?"
            action={() =>
              mutate(async () => {
                await request("/validations", {
                  method: "POST",
                  body: { documentId: id, actionType, status: "rejected" },
                });
                await reload();
              })
            }
            onSuccess="Rejet enregistré."
          />
          <AsyncButton
            label="Partager le texte"
            disabled={busy || dirty}
            action={() =>
              Share.share({
                title: resource.data!.title,
                message: resource.data!.title + "\n\n" + editor.text,
              })
            }
          />
        </RobiaCard>
      ) : null}
    </RobiaScreen>
  );
}
