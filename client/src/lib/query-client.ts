import { QueryClient } from "@tanstack/react-query";

// This is your "database" of server data in the browser
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Settings for ALL queries
      staleTime: 1000 * 60 * 5, // 5 minutes - How long data stays "fresh"
      //         ↑    ↑   ↑
      //        ms   sec  min
      // Translation: "Trust this data for 5 minutes before refetching"

      gcTime: 1000 * 60 * 10, // 10 minutes - Garbage collection time
      // When to delete unused data from memory
      // OLD NAME in v4: cacheTime (they renamed it in v5)

      retry: 3, // Retry failed requests 3 times before giving up
      // Useful for flaky networks!

      refetchOnWindowFocus: false, // Don't refetch when I tab back
      // I turned this OFF (annoying during development)
      // You might want it ON in production!

      refetchOnReconnect: true, // DO refetch when internet comes back
      // This one is useful!
    },
    mutations: {
      // Settings for ALL mutations (create/update/delete)
      retry: 1, // Only retry once (mutations are more risky)
    },
  },
});
