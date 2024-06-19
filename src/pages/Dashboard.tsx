import { ChangeEvent, useMemo } from "react";
import { VictoryContainer, VictoryPie } from "victory";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Text,
  Heading,
  Stack,
  Button,
  StackDivider,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  Modal,
  useDisclosure,
  ModalContent,
  Spinner,
  Switch,
  FormLabel,
  FormControl,
  Box,
  Spacer,
  Flex,
  ModalOverlay,
  Th,
} from "@chakra-ui/react";
import { Grant, Shareholder } from "../types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import produce from "immer";
import {
  useCompanyQuery,
  useGrantsQuery,
  useShareholdersQuery,
} from "../queries";
import { NewShareholderForm } from "../components/forms/NewShareholderForm";
import { Navbar } from "../components/forms/Navbar";
import { getFormattedCurrency } from "../utils";

export function Dashboard() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const queryClient = useQueryClient();

  const shareholderMutation = useMutation<
    Shareholder,
    unknown,
    Omit<Shareholder, "id" | "grants">
  >(
    (shareholder) =>
      fetch("/shareholder/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareholder),
      }).then((res) => res.json()),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries("shareholders");
      },
    }
  );

  const grant = useGrantsQuery();

  const shareholder = useShareholdersQuery();

  if (grant.isLoading || shareholder.isLoading) {
    return <Spinner />;
  }

  function getShareAmount(shareholder: Shareholder, type?: Grant["type"]) {
    if (!grant.data) {
      return 0;
    }

    return shareholder.grants
      .filter((grantID) => {
        if (!type) return grant.data[grantID];

        return grant.data[grantID].type === type;
      })
      .reduce((acc, grantID) => {
        return acc + grant.data[grantID].amount;
      }, 0);
  }

  async function submitNewShareholder(
    formValues: Pick<Shareholder, "name" | "group">
  ) {
    await shareholderMutation.mutateAsync(formValues);
    onClose();
  }

  return (
    <Stack spacing="0.75rem">
      <Navbar />

      <PieChart />

      <Stack divider={<StackDivider />}>
        <Flex>
          <Heading>Shareholders</Heading>
          <Spacer />
          <Button onClick={onOpen}>Add Shareholder</Button>
        </Flex>
        <Box style={{ width: "100%", maxWidth: 736, overflow: "auto" }}>
          <Table>
            <Thead>
              <Tr>
                <Th color="black">Name</Th>
                <Th color="black">Group</Th>
                <Th color="black">Grants</Th>
                <Th color="black">Common Shares</Th>
                <Th color="black">Preferred Shares</Th>
                <Th color="black">Total Shares</Th>
              </Tr>
            </Thead>
            <Tbody>
              {shareholder.isSuccess &&
                Object.values(shareholder.data).map((s) => {
                  const commonAmount = getShareAmount(s, "common");
                  const preferredAmount = getShareAmount(s, "preferred");

                  return (
                    <Tr key={s.id}>
                      <Td>
                        <Link to={`/shareholder/${s.id}`}>
                          <Stack direction="row" alignItems="center">
                            <Text color="teal.600">{s.name}</Text>
                            <ArrowForwardIcon color="teal.600" />
                          </Stack>
                        </Link>
                      </Td>
                      <Td data-testid={`shareholder-${s.name}-group`}>
                        {s.group}
                      </Td>
                      <Td data-testid={`shareholder-${s.name}-grants`}>
                        {s.grants.length}
                      </Td>
                      <Td data-testid={`shareholder-${s.name}-common-shares`}>
                        {commonAmount}
                      </Td>
                      <Td
                        data-testid={`shareholder-${s.name}-preferred-shares`}
                      >
                        {preferredAmount}
                      </Td>
                      <Td data-testid={`shareholder-${s.name}-shares`}>
                        {commonAmount + preferredAmount}
                      </Td>
                    </Tr>
                  );
                })}
            </Tbody>
          </Table>

          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <NewShareholderForm onSubmit={submitNewShareholder} />
            </ModalContent>
          </Modal>
        </Box>
      </Stack>
    </Stack>
  );
}

function useTotalMarketCap() {
  const company = useCompanyQuery();
  const grants = useGrantsQuery();

  const sum = useMemo(() => {
    if (!company.data || !grants.data) {
      return null;
    }

    let sum = 0;

    Object.entries(company.data.shareTypes as Record<string, number>).forEach(
      ([type, val]) => {
        if (!val) {
          return;
        }

        Object.entries(grants.data)
          .filter(([_, grant]) => grant.type === type)
          .forEach(([_, grant]) => {
            sum += grant.amount * val;
          });
      }
    );

    return sum;
  }, [company.data, grants.data]);

  return sum;
}

function PieChart() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode } = useParams();

  const isChecked = searchParams.get("byValue") === "true";
  const marketCap = useTotalMarketCap();

  const stats = useQuery(
    ["grants", mode, isChecked],
    () =>
      fetch("/grants/" + mode + "?" + searchParams.toString()).then((e) =>
        e.json()
      ),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
    }
  );

  return (
    <>
      <Stack justify="space-between" divider={<StackDivider />}>
        <Stack>
          <Flex>
            <Heading>Shares</Heading>
            <Spacer />
            <Flex alignItems="center">
              <FormControl display="inline-flex" alignItems="center">
                <FormLabel htmlFor="byValue" mb="0">
                  Show equity value
                </FormLabel>
                <Switch
                  size="lg"
                  id="byValue"
                  isChecked={isChecked}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setSearchParams((params) => ({
                      ...params,
                      byValue: e.target.checked,
                    }));
                  }}
                />
              </FormControl>
            </Flex>
          </Flex>
        </Stack>

        <Stack>
          <Flex flexWrap="wrap">
            <Stack direction="row">
              <Button
                colorScheme="teal"
                as={Link}
                to={{
                  pathname: "/dashboard/investor",
                  search: searchParams.toString(),
                }}
                variant="ghost"
                isActive={mode === "investor"}
              >
                By Investor
              </Button>
              <Button
                colorScheme="teal"
                as={Link}
                to={{
                  pathname: "/dashboard/group",
                  search: searchParams.toString(),
                }}
                variant="ghost"
                isActive={mode === "group"}
              >
                By Group
              </Button>
              <Button
                colorScheme="teal"
                as={Link}
                to={{
                  pathname: "/dashboard/sharetype",
                  search: searchParams.toString(),
                }}
                variant="ghost"
                isActive={mode === "sharetype"}
              >
                By Share Type
              </Button>
            </Stack>
            <Spacer />
            <Box as="div" style={{ lineHeight: "40px" }}>
              {marketCap !== null && (
                <>
                  Market cap:{" "}
                  <strong style={{ fontSize: 16 }}>
                    {getFormattedCurrency(marketCap)}
                  </strong>
                </>
              )}
            </Box>
          </Flex>
          <Flex justifyContent="center" height={400}>
            {!stats.isLoading && (
              <VictoryPie
                containerComponent={
                  <VictoryContainer style={{ maxWidth: 400 }} />
                }
                style={{
                  data: {
                    fillOpacity: 0.75,
                    stroke: "white",
                    strokeWidth: 3,
                  },
                  labels: {
                    fontSize: 16,
                    fontWeight: 700,
                  },
                }}
                colorScale={[
                  "#0B4C43",
                  "#488A81",
                  "#246B61",
                  "#7EAFA8",
                  "#002D27",
                ]}
                innerRadius={50}
                labelRadius={100}
                labels={({ datum }) => {
                  let yVal = datum.y;
                  if (isChecked) {
                    yVal = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(yVal);
                  }
                  return [datum.x, yVal];
                }}
                data={stats.data}
              />
            )}
          </Flex>
        </Stack>
      </Stack>
    </>
  );
}
