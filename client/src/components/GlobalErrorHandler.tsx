import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { LOGIN_PATH } from "@/const";
import { useQueryClient } from "@tanstack/react-query";

export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event: any) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.query.state.error;
        
        if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
          if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
            window.location.href = LOGIN_PATH;
          }
        }
        
        console.error("[API Query Error]", error);
      }
    });

    const unsubscribeMutation = queryClient.getMutationCache().subscribe((event: any) => {
      if (event.type === "updated" && event.action.type === "error") {
        const error = event.mutation.state.error;

        if (error instanceof TRPCClientError && error.message === UNAUTHED_ERR_MSG) {
          if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
            window.location.href = LOGIN_PATH;
          }
        }

        console.error("[API Mutation Error]", error);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeMutation();
    };
  }, [queryClient]);

  return <>{children}</>;
}
