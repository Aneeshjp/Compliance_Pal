"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsAPI } from "@/lib/api";

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const res = await analyticsAPI.getSummary();
      return res.data;
    },
  });
}

export function useMonthlyAnalytics() {
  return useQuery({
    queryKey: ["analytics", "monthly"],
    queryFn: async () => {
      const res = await analyticsAPI.getMonthly();
      return res.data;
    },
  });
}

export function useVendorAnalytics() {
  return useQuery({
    queryKey: ["analytics", "vendors"],
    queryFn: async () => {
      const res = await analyticsAPI.getVendors();
      return res.data;
    },
  });
}

export function useITCTrend() {
  return useQuery({
    queryKey: ["analytics", "itc-trend"],
    queryFn: async () => {
      const res = await analyticsAPI.getITCTrend();
      return res.data;
    },
  });
}

export function useStatusDistribution() {
  return useQuery({
    queryKey: ["analytics", "status-dist"],
    queryFn: async () => {
      const res = await analyticsAPI.getStatusDist();
      return res.data;
    },
  });
}
