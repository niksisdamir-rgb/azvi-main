/**
 * Shared tRPC mock factory.
 *
 * Returns a recursive Proxy that, for any property chain, hands back default
 * stubs for the hooks tRPC react-query generates.
 *
 * Usage inside a test file:
 *
 *   import { makeTrpcMock } from '../__mocks__/trpc.mock';
 *   vi.mock('@/lib/trpc', () => ({ trpc: makeTrpcMock() }));
 */
import { vi } from "vitest";

type QueryReturn = {
  data: undefined;
  isLoading: boolean;
  isError: boolean;
  error: null;
  refetch: ReturnType<typeof vi.fn>;
  isFetching: boolean;
};

type MutationReturn = {
  mutate: ReturnType<typeof vi.fn>;
  mutateAsync: ReturnType<typeof vi.fn>;
  isPending: boolean;
  isError: boolean;
  error: null;
  reset: ReturnType<typeof vi.fn>;
};

export function makeQueryStub(overrides?: Partial<QueryReturn>): QueryReturn {
  return {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
    ...overrides,
  };
}

export function makeMutationStub(
  overrides?: Partial<MutationReturn>
): MutationReturn {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
    ...overrides,
  };
}

/** Recursive proxy that auto-generates useQuery / useMutation stubs. */
function makeProxy(): any {
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "useQuery") return vi.fn().mockReturnValue(makeQueryStub());
        if (prop === "useMutation")
          return vi.fn().mockReturnValue(makeMutationStub());
        if (prop === "useUtils") return vi.fn().mockReturnValue(makeUtilsStub());
        if (prop === "useInfiniteQuery")
          return vi.fn().mockReturnValue(makeQueryStub());
        if (prop === "useSuspenseQuery")
          return vi.fn().mockReturnValue({ data: undefined });
        if (prop === "Provider")
          return ({ children }: { children: any }) => children;
        if (prop === "createClient") return vi.fn().mockReturnValue({});
        // For any other prop, return another proxy (supports deep chains like trpc.deliveries.list.useQuery)
        return makeProxy();
      },
    }
  );
}

function makeUtilsStub(): any {
  return new Proxy(
    {},
    {
      get(_target, _prop: string) {
        return new Proxy(
          {},
          {
            get(_t, _p: string) {
              return new Proxy(
                {},
                {
                  get(_t2, p2: string) {
                    if (p2 === "invalidate") return vi.fn().mockResolvedValue(undefined);
                    if (p2 === "cancel") return vi.fn().mockResolvedValue(undefined);
                    if (p2 === "setData") return vi.fn();
                    if (p2 === "getData") return vi.fn().mockReturnValue(undefined);
                    if (p2 === "prefetch") return vi.fn().mockResolvedValue(undefined);
                    return vi.fn();
                  },
                }
              );
            },
          }
        );
      },
    }
  );
}

export function makeTrpcMock() {
  return makeProxy();
}
