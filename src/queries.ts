import { UseQueryOptions, useQuery, useQueryClient } from "react-query";
import { Company, Grant, Shareholder } from "./types";

type Dictionary<K = {}> = { [dataID: number]: K };

const defaultOptions = {
  keepPreviousData: true,
  staleTime: 5 * 60 * 1000,
};

function useQueryClientData<T = {}>(key: UseQueryOptions["queryKey"]) {
  const queryClient = useQueryClient();

  return queryClient.getQueryData(key!) as T;
}

export function useGrantsQuery(
  options: UseQueryOptions<Dictionary<Grant>> = defaultOptions
) {
  return useQuery<Dictionary<Grant>>("grants", () =>
    fetch("/grants").then((e) => e.json(), options as any)
  );
}

export const useGrantsData = () =>
  useQueryClientData<Dictionary<Grant>>("grants");

export function useShareholdersQuery(
  options: UseQueryOptions<Dictionary<Shareholder>> = defaultOptions
) {
  return useQuery<Dictionary<Shareholder>>("shareholders", () =>
    fetch("/shareholders").then((e) => e.json(), options as any)
  );
}

export const useShareholdersData = () =>
  useQueryClientData<Dictionary<Shareholder>>("shareholders");

export function useCompanyQuery(
  options: UseQueryOptions<Company> = defaultOptions
) {
  return useQuery<Company>(
    "company",
    () => fetch("/company").then((e) => e.json()),
    options as any
  );
}

export const useCompanyData = () => useQueryClientData<Company>("company");
