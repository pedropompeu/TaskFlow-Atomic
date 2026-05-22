import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/users';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
    staleTime: 5 * 60 * 1000,
  });
}
