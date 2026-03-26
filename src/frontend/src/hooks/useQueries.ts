import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AttendanceRecord, Member } from "../utils/helpers";
import {
  fetchAttendance,
  fetchMembers,
  postCheckIn,
  postCheckOut,
} from "../utils/sheetsApi";

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: () => fetchMembers() as unknown as Promise<Member[]>,
    staleTime: 30000,
    retry: 3,
  });
}

export function useAttendance() {
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance"],
    queryFn: () => fetchAttendance() as unknown as Promise<AttendanceRecord[]>,
    staleTime: 5000,
    refetchInterval: 5000,
    retry: 3,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      membershipId,
      clientName,
      status,
    }: {
      membershipId: string;
      clientName: string;
      status: string;
    }) => {
      return postCheckIn(membershipId, clientName, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => postCheckOut(membershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
