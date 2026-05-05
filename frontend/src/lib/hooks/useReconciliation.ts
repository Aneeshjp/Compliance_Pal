"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reconcileAPI, validateAPI, itcAPI } from "@/lib/api";

export function useReconciliationResults() {
  return useQuery({
    queryKey: ["reconciliation-results"],
    queryFn: async () => {
      const res = await reconcileAPI.getResults();
      return res.data;
    },
  });
}

export function useReconciliationRunDetail(runId: string) {
  return useQuery({
    queryKey: ["reconciliation-detail", runId],
    queryFn: async () => {
      const res = await reconcileAPI.getRunDetail(runId);
      return res.data;
    },
    enabled: !!runId,
  });
}

export function useReconciliationHistory() {
  return useQuery({
    queryKey: ["reconciliation-history"],
    queryFn: async () => {
      const res = await reconcileAPI.getHistory();
      return res.data;
    },
  });
}

export function useRunReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await reconcileAPI.run();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-results"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation-history"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["itc"] });
    },
  });
}

export function useValidateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const res = await validateAPI.validateOne(invoiceId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useValidateBulk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await validateAPI.validateBulk();
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useITCSummary() {
  return useQuery({
    queryKey: ["itc", "summary"],
    queryFn: async () => {
      const res = await itcAPI.getSummary();
      return res.data;
    },
  });
}

export function useITCVendors() {
  return useQuery({
    queryKey: ["itc", "vendors"],
    queryFn: async () => {
      const res = await itcAPI.getVendors();
      return res.data;
    },
  });
}
