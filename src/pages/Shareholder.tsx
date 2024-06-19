import { useNavigate, useParams } from "react-router-dom";
import {
  Text,
  Heading,
  Stack,
  Button,
  Input,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  FormControl,
  Modal,
  useDisclosure,
  ModalContent,
  Spinner,
  Alert,
  AlertTitle,
  AlertIcon,
  TableCaption,
} from "@chakra-ui/react";
import { ReactComponent as Avatar } from "../assets/avatar-male.svg";
import { Company, Grant, Shareholder } from "../types";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { NewGrantForm } from "../components/forms/NewGrantForm";

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
    <Stack>
      <Stack direction="row" justify="space-between" alignItems="baseline">
        <Heading
          size="md"
          bgGradient="linear(to-br, teal.400, teal.100)"
          bgClip="text"
        >
          Fair Share
        </Heading>
      </Stack>
      <Heading size="md" textAlign="center">
        Shareholder
      </Heading>
      <Stack direction="row" spacing="8">
        <Avatar width="100px" height="auto" />
        <Stack>
          <Text fontSize="xl" fontWeight="bold">
            {shareholder.name}
          </Text>
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
        </Stack>
      </Stack>
      <Heading size="md" textAlign="center">
        Grants
      </Heading>
      <Table size="s">
        <Thead>
          <Tr>
            <Td>Occasion</Td>
            <Td>Date</Td>
            <Td>Amount</Td>
            <Td>Class</Td>
            <Td>Value</Td>
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
        <TableCaption>
          <Button colorScheme="teal" onClick={onOpen}>
            Add Grant
          </Button>
        </TableCaption>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <NewGrantForm onSubmit={submitGrant} />
        </ModalContent>
      </Modal>
    </Stack>
  );
}
