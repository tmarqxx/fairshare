import { useNavigate, useParams } from "react-router-dom";
import {
  Text,
  Heading,
  Stack,
  Button,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  Modal,
  useDisclosure,
  ModalContent,
  Spinner,
  ModalOverlay,
  StackDivider,
  Flex,
  Spacer,
  Box,
} from "@chakra-ui/react";
import { ReactComponent as Avatar } from "../assets/avatar-male.svg";
import { Grant, Shareholder } from "../types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { NewGrantForm } from "../components/forms/NewGrantForm";
import { getFormattedCurrency } from "../utils";
import { Navbar } from "../components/forms/Navbar";

export function ShareholderPage() {
  const queryClient = useQueryClient();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { shareholderID = "" } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<
    Shareholder & { grantsData: (Grant & { value: number })[] },
    { status: number; message: string }
  >(
    ["shareholders", shareholderID],
    () => fetch("/shareholders/" + shareholderID).then((e) => e.json()),
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000,
      onSuccess: (data) => {
        if ((data as any).status === 404) {
          navigate("/dashboard", { replace: true });
        }
      },
    }
  );

  const grantMutation = useMutation<Grant, unknown, Omit<Grant, "id">>(
    (grant) =>
      fetch("/grant/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareholderID: parseInt(shareholderID, 10),
          grant,
        }),
      }).then((res) => res.json()),
    {
      onSuccess: (_) => {
        queryClient.invalidateQueries("grants", {
          exact: false,
        });

        queryClient.invalidateQueries("shareholders");
        queryClient.invalidateQueries(["shareholders", shareholderID]);
      },
    }
  );

  function submitGrant(formValues: Omit<Grant, "id">) {
    grantMutation.mutateAsync(formValues).then(() => {
      onClose();
    });
  }

  if (isLoading) {
    return <Spinner />;
  }

  const shareholder = data!;

  return (
    <Stack spacing="0.75rem">
      <Navbar />

      <Stack direction="row" spacing="8">
        <Avatar width="100px" height="auto" />
        <Stack>
          <Heading>{shareholder.name}</Heading>
          <Stack
            direction="row"
            justify="space-between"
            gap="4"
            flexWrap="wrap"
          >
          <Text fontSize="sm" fontWeight="thin">
            <strong data-testid="grants-issued">
              {shareholder.grants.length}
            </strong>{" "}
            grants issued
          </Text>
          <Text fontSize="sm" fontWeight="thin">
            <strong data-testid="shares-granted">
                {shareholder.grantsData.reduce(
                  (acc, grant) => acc + grant.amount,
                0
              )}
            </strong>{" "}
            shares
          </Text>
            <Text fontSize="sm" fontWeight="thin">
              <strong data-testid="shares-total-value">
                {getFormattedCurrency(
                  shareholder.grantsData.reduce(
                    (acc, grant) => acc + grant.value,
                    0
                  )
                )}
              </strong>{" "}
              total value
            </Text>
          </Stack>
        </Stack>
      </Stack>

      <Stack divider={<StackDivider />} paddingTop="10">
        <Flex>
          <Heading>Grants</Heading>
          <Spacer />
          <Button onClick={onOpen}>Add Grant</Button>
        </Flex>
        <Box style={{ width: "100%", maxWidth: 736, overflow: "auto" }}>
          <Table>
        <Thead>
          <Tr>
                <Td fontWeight="bold">Occasion</Td>
                <Td fontWeight="bold">Date</Td>
                <Td fontWeight="bold">Amount</Td>
                <Td fontWeight="bold">Type</Td>
                <Td fontWeight="bold">Value</Td>
          </Tr>
        </Thead>
        <Tbody role="rowgroup">
              {shareholder.grantsData.map((grant) => {
              return (
                  <Tr key={grant.id}>
                    <Td>{grant.name}</Td>
                    <Td>{new Date(grant.issued).toLocaleDateString()}</Td>
                    <Td>{grant.amount}</Td>
                    <Td>{grant.type}</Td>
                    <Td>{getFormattedCurrency(grant.value)}</Td>
                </Tr>
              );
              })}
        </Tbody>
      </Table>
        </Box>
      </Stack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <NewGrantForm onSubmit={submitGrant} />
        </ModalContent>
      </Modal>
    </Stack>
  );
}
