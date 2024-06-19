import { FormEvent, useState } from "react";
import { Shareholder } from "../../types";
import {
  Button,
  FormControl,
  Heading,
  Input,
  Select,
  Stack,
} from "@chakra-ui/react";

type TNewShareholderFormProps = {
  onSubmit: (formValues: Pick<Shareholder, "name" | "group">) => void;
  initialValues?: Pick<Shareholder, "name" | "group">;
};

export function NewShareholderForm(props: TNewShareholderFormProps) {
  const { initialValues = { name: "", group: "employee" } } = props;

  const [newShareholder, setNewShareholder] =
    useState<Pick<Shareholder, "name" | "group">>(initialValues);

  function onSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      props.onSubmit(newShareholder);
      // setNewShareholder({ name: "", amount: 0, issued: "", type: "common" });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <>
      <Stack p="10" as="form" onSubmit={onSubmit}>
        <Heading paddingBottom="4">New Shareholder</Heading>
        <FormControl id="shareholderName" isRequired>
          <Input
            value={newShareholder.name}
            placeholder="Shareholder Name"
            onChange={(e) =>
              setNewShareholder((s) => ({ ...s, name: e.target.value }))
            }
          />
        </FormControl>

        <FormControl id="shareholderGroup" isRequired>
          <Select
            placeholder="Type of shareholder"
            value={newShareholder.group}
            onChange={(e) =>
              setNewShareholder((s) => ({
                ...s,
                group: e.target.value as any,
              }))
            }
          >
            <option value="investor">Investor</option>
            <option value="founder">Founder</option>
            <option value="employee">Employee</option>
          </Select>
        </FormControl>
        <Button type="submit" colorScheme="teal">
          Save
        </Button>
      </Stack>
    </>
  );
}
