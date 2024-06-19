import {
  Text,
  Button,
  FormControl,
  Input,
  Stack,
  Select,
  Heading,
} from "@chakra-ui/react";
import { Grant } from "../../types";
import { FormEvent, useState } from "react";

type TNewGrantFormProps = {
  onSubmit: (formValues: Omit<Grant, "id">) => void;
  initialValues?: Omit<Grant, "id">;
};

export function NewGrantForm(props: TNewGrantFormProps) {
  const {
    initialValues = {
      name: "",
      amount: 0,
      issued: "",
      type: "common",
    },
  } = props;

  const [draftGrant, setDraftGrant] =
    useState<Omit<Grant, "id">>(initialValues);

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      props.onSubmit(draftGrant);
      // setDraftGrant({ name: "", amount: 0, issued: "", type: "common" });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <Stack p="10" as="form" onSubmit={onSubmit}>
        <Heading paddingBottom="4">New Grant</Heading>
        <Text>
          A <strong>Grant</strong> is any occasion where new shares are issued
          to a shareholder.
        </Text>

        <FormControl isRequired>
          <Input
            variant="flushed"
            placeholder="Name"
            data-testid="grant-name"
            value={draftGrant.name}
            onChange={(e) =>
              setDraftGrant((g) => ({ ...g, name: e.target.value }))
            }
          />
        </FormControl>
        <FormControl isRequired>
          <Input
            variant="flushed"
            placeholder="Shares"
            data-testid="grant-amount"
            type="number"
            value={draftGrant.amount || ""}
            onChange={(e) =>
              setDraftGrant((g) => ({
                ...g,
                amount: parseInt(e.target.value),
              }))
            }
          />
        </FormControl>
        <FormControl isRequired>
          <Select
            variant="flushed"
            placeholder="Type of shares"
            data-testid="grant-type"
            value={draftGrant.type}
            onChange={(e) =>
              setDraftGrant((g) => ({
                ...g,
                type: e.target.value as Grant["type"],
              }))
            }
          >
            <option value="common">Common</option>
            <option value="preferred">Preferred</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <Input
            variant="flushed"
            type="date"
            data-testid="grant-issued"
            value={draftGrant.issued}
            onChange={(e) =>
              setDraftGrant((g) => ({ ...g, issued: e.target.value }))
            }
          />
        </FormControl>
        <Button
          type="submit"
          colorScheme="teal"
          isDisabled={Object.entries(draftGrant).some(
            ([k, v]) => (v as string).length === 0
          )}
        >
          Save
        </Button>
      </Stack>
    </>
  );
}
