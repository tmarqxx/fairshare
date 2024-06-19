import { ChangeEvent, useMemo } from "react";
import { VictoryContainer, VictoryPie } from "victory";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Text,
  Heading,
  Stack,
  Button,
  Input,
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
  Alert,
  AlertTitle,
  AlertIcon,
  Select,
} from "@chakra-ui/react";
import { Grant, Shareholder } from "../types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import produce from "immer";
import { NewShareholderForm } from "../components/forms/NewShareholderForm";
import { Navbar } from "../components/forms/Navbar";

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
        queryClient.setQueryData<{ [id: number]: Shareholder } | undefined>(
          "shareholders",
          (s) => {
            if (s) {
              return produce(s, (draft) => {
                draft[data.id] = data;
              });
            }
          }
        );
      },
    }
  );

  // TODO: using this dictionary thing a lot... hmmm
  const grant = useQuery<{ [dataID: number]: Grant }, string>("grants", () =>
    fetch("/grants").then((e) => e.json())
  );
  const shareholder = useQuery<{ [dataID: number]: Shareholder }>(
    "shareholders",
    () => fetch("/shareholders").then((e) => e.json())
  );

  if (grant.status === "error") {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error: {grant.error}</AlertTitle>
      </Alert>
    );
  }
  if (grant.status !== "success") {
    return <Spinner />;
  }
  if (!grant.data || !shareholder.data) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Failed to get any data</AlertTitle>
      </Alert>
    );
  }

  // TODO: why are these inline?
  function getGroupData() {
    if (!shareholder.data || !grant.data) {
      return [];
    }
    return ["investor", "founder", "employee"].map((group) => ({
      x: group,
      y: Object.values(shareholder?.data ?? {})
        .filter((s) => s.group === group)
        .flatMap((s) => s.grants)
        .reduce((acc, grantID) => acc + grant.data[grantID].amount, 0),
    }));
  }

  function getInvestorData() {
    if (!shareholder.data || !grant.data) {
      return [];
    }
    return Object.values(shareholder.data)
      .map((s) => ({
        x: s.name,
        y: s.grants.reduce(
          (acc, grantID) => acc + grant.data[grantID].amount,
          0
        ),
      }))
      .filter((e) => e.y > 0);
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
        <Heading>Shareholders</Heading>
        <Table>
          <Thead>
            <Tr>
              <Td>Name</Td>
              <Td>Group</Td>
              <Td>Grants</Td>
              <Td>Shares</Td>
            </Tr>
          </Thead>
          <Tbody>
            {Object.values(shareholder.data).map((s) => (
              <Tr key={s.id}>
                <Td>
                  <Link to={`/shareholder/${s.id}`}>
                    <Stack direction="row" alignItems="center">
                      <Text color="teal.600">{s.name}</Text>
                      <ArrowForwardIcon color="teal.600" />
                    </Stack>
                  </Link>
                </Td>
                <Td data-testid={`shareholder-${s.name}-group`}>{s.group}</Td>
                <Td data-testid={`shareholder-${s.name}-grants`}>
                  {s.grants.length}
                </Td>
                <Td data-testid={`shareholder-${s.name}-shares`}>
                  {s.grants.reduce(
                    (acc, grantID) => acc + grant.data[grantID].amount,
                    0
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Button onClick={onOpen}>Add Shareholder</Button>
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
              <NewShareholderForm onSubmit={submitNewShareholder} />
              </Button>
            </Stack>
          </ModalContent>
        </Modal>
      </Stack>
    </Stack>
  );
}
function PieChart() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode } = useParams();

  const isChecked = searchParams.get("byValue") === "true";

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
            <Heading>Company Shares</Heading>
            <Spacer />
            <Flex alignItems="center">
              <FormControl display="inline-flex" alignItems="center">
                <FormLabel htmlFor="byValue" mb="0">
                  Show equity value
                </FormLabel>
                <Switch
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
