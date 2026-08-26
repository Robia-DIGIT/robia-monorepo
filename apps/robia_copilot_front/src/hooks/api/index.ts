import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/apiService";
import { queryKeys } from "./keys";
import { PmeProfile } from "@/types";

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiService.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PmeProfile>) => apiService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.audit });
    },
  });
}

export function useConnectGbp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gbpId?: string) => apiService.connectGbp(gbpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.audit });
    },
  });
}

export function useDisconnectGbp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.disconnectGbp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.audit });
    },
  });
}

export function useConnectSite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => apiService.connectSite(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audit });
    },
  });
}

export function useAudit() {
  return useQuery({
    queryKey: queryKeys.audit,
    queryFn: () => apiService.getAudit(),
  });
}

export function useStartAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.startAudit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.audit });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
    },
  });
}

export function useAuditHistory() {
  return useQuery({
    queryKey: queryKeys.auditHistory,
    queryFn: () => apiService.getAuditHistory(),
  });
}

export function useCategoryDetail(categoryId: string) {
  return useQuery({
    queryKey: queryKeys.categoryDetail(categoryId),
    queryFn: () => apiService.getCategoryDetail(categoryId),
    enabled: !!categoryId,
  });
}

export function useOpportunities() {
  return useQuery({
    queryKey: queryKeys.opportunities,
    queryFn: () => apiService.getOpportunities(),
  });
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: queryKeys.opportunity(id),
    queryFn: () => apiService.getOpportunityById(id),
    enabled: !!id,
  });
}

export function useUpdateOpportunityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "todo" | "in_progress" | "done";
    }) => apiService.updateOpportunityStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunity(id) });
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => apiService.getDocument(id),
    enabled: !!id,
  });
}

export function useGenerateDocument() {
  return useMutation({
    mutationFn: ({
      opportunityId,
      type,
      tone,
      extraInstructions,
    }: {
      opportunityId: string;
      type: "email" | "script" | "report";
      tone: string;
      extraInstructions?: string;
    }) =>
      apiService.generateDocument(
        opportunityId,
        type,
        tone,
        extraInstructions,
      ),
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      title,
      content,
    }: {
      id: string;
      title: string;
      content: string;
    }) => apiService.updateDocument(id, title, content),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.document(id) });
    },
  });
}

export function useValidateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      comment,
    }: {
      id: string;
      action: "approved" | "rejected" | "modified";
      comment?: string;
    }) => apiService.validateDocument(id, action, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.validationHistory });
    },
  });
}

export function useValidationHistory() {
  return useQuery({
    queryKey: queryKeys.validationHistory,
    queryFn: () => apiService.getValidationHistory(),
  });
}

export function useActionTrackerTasks() {
  return useQuery({
    queryKey: queryKeys.actionTracker,
    queryFn: () => apiService.getActionTrackerTasks(),
  });
}

export function useToggleActionTrackerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiService.toggleActionTrackerStatus(id),
    onSuccess: (tasks) => {
      queryClient.setQueryData(queryKeys.actionTracker, tasks);
    },
  });
}

export function useActionPlan() {
  return useQuery({
    queryKey: queryKeys.actionPlan,
    queryFn: () => apiService.getActionPlan(),
  });
}

export function useToggleActionPlanTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ week, taskName }: { week: number; taskName: string }) =>
      apiService.toggleActionPlanTask(week, taskName),
    onSuccess: (plan) => {
      queryClient.setQueryData(queryKeys.actionPlan, plan);
    },
  });
}

export function useAdminPmes() {
  return useQuery({
    queryKey: queryKeys.adminPmes,
    queryFn: () => apiService.getAdminPmes(),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiService.login(email, password),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      email,
      password,
    }: {
      email: string;
      password: string;
      name?: string;
      company?: string;
    }) => apiService.register(email, password),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => apiService.logout(),
  });
}

export function useGenerateOpportunities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: string) => apiService.generateOpportunities(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
    },
  });
}

export function useGenerateActions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opportunityId: string) =>
      apiService.generateActions(opportunityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.actionTracker });
      queryClient.invalidateQueries({ queryKey: queryKeys.actionPlan });
    },
  });
}

export function useExportActionPlan() {
  return useMutation({
    mutationFn: () => apiService.exportActionPlanPdf(),
  });
}
