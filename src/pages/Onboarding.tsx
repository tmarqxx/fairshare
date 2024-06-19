import React from "react";
import {
  Route,
  Routes,
  Link,
  Navigate,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
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
  Th,
  Tbody,
  Td,
  FormControl,
  FormLabel,
  Modal,
  useDisclosure,
  ModalContent,
  FormHelperText,
  Spinner,
  Select,
  Badge,
} from "@chakra-ui/react";
import produce from "immer";
import { useContext } from "react";
import { Company, Grant, Shareholder, User } from "../types";
import { useMutation, useQueryClient } from "react-query";
import { AuthContext } from "../App";

export const OnboardingContext = React.createContext<
  OnboardingFields & { dispatch: React.Dispatch<OnboardingAction> }
>({
  userName: "",
  email: "",
  companyName: "",
  shareTypes: { common: undefined, preferred: undefined },
  shareholders: {},
  grants: {},
  dispatch: () => {},
});

export function UserStep() {
  const [searchParams] = useSearchParams();

  const { userName, email, dispatch } = useContext(OnboardingContext);
  const navigate = useNavigate();

  function onSubmt(e: React.FormEvent) {
    e.preventDefault();
    searchParams.set("userName", userName);
    searchParams.set("email", email);
    navigate({
      pathname: "/start/company",
      search: searchParams.toString(),
    });
  }

  return (
    <Stack as="form" onSubmit={onSubmt} spacing="4">
      <FormControl id="userName" size="lg" color="teal.400">
        <FormLabel>First, who is setting up this account?</FormLabel>
        <Input
          type="text"
          placeholder="Your Name"
          data-testid="user-username"
          onChange={(e) =>
            dispatch({ type: "updateUser", payload: e.target.value })
          }
          value={userName}
        />
      </FormControl>
      <FormControl id="email" size="lg" color="teal.400">
        <FormLabel>What email will you use to sign in?</FormLabel>
        <Input
          type="email"
          placeholder="Your Email"
          data-testid="user-email"
          onChange={(e) =>
            dispatch({ type: "updateEmail", payload: e.target.value })
          }
          value={email}
        />
        <FormHelperText>
          We only use this to create your account.
        </FormHelperText>
      </FormControl>
      <Button
        type="submit"
        colorScheme="teal"
        isDisabled={!userName.length || !email.length}
      >
        Next
      </Button>
    </Stack>
  );
}

export function CompanyStep() {
  const [searchParams] = useSearchParams();
  const { companyName, shareTypes, dispatch } = useContext(OnboardingContext);
  const navigate = useNavigate();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    searchParams.set("companyName", companyName);
    searchParams.set("shareTypes", JSON.stringify(shareTypes));
    navigate({
      pathname: "/start/shareholders",
      search: searchParams.toString(),
    });
  }

  return (
    <Stack as="form" onSubmit={onSubmit} spacing="4">
      <FormControl id="companyName" size="lg" color="teal.400">
        <FormLabel>What company are we examining?</FormLabel>
        <Input
          type="text"
          placeholder="Company Name"
          onChange={(e) =>
            dispatch({ type: "updateCompany", payload: e.target.value })
          }
          value={companyName}
        />
      </FormControl>

      <FormControl id="shareTypes" size="lg" color="teal.400">
        <FormLabel>
          What types of shares are available at this company?
        </FormLabel>
        {Object.entries(shareTypes).map(([key, val], index) => (
          <Stack direction="row" key={`sharetype-row-${index}`}>
            <Input
              id={`sharetype-${key}-label`}
              placeholder="Share type"
              type="text"
              value={key}
              onChange={(e) =>
                dispatch({
                  type: "updateShareTypes",
                  payload: { key, newKey: e.target.value },
                })
              }
            />
            <Input
              type="number"
              data-testid={`sharetype-${key}-input`}
              placeholder="Value"
              onChange={(e) => {
                const float = parseFloat(e.target.value);
                dispatch({
                  type: "updateShareTypes",
                  payload: {
                    key,
                    value: isNaN(float) ? "" : float,
                  },
                });
              }}
              value={val}
            />
          </Stack>
        ))}
      </FormControl>
      <Button
        type="submit"
        colorScheme="teal"
        isDisabled={
          !companyName.length ||
          Object.entries(shareTypes).some(([key, val]) => !key || !val)
        }
      >
        Next
      </Button>
    </Stack>
  );
}

export function ShareholdersStep() {
  const [searchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { shareholders, companyName, dispatch } = useContext(OnboardingContext);
  const [newShareholder, setNewShareholder] = React.useState<
    Omit<Shareholder, "id" | "grants">
  >({ name: "", group: "employee" });

  function submitNewShareholder(e: React.FormEvent) {
    e.preventDefault();
    dispatch({ type: "addShareholder", payload: newShareholder });
    setNewShareholder({ name: "", group: "employee" });
    onClose();
  }

  return (
    <Stack>
      <Text color="teal.400">
        {/* TODO: redirect to previous step if company name isn't there*/}
        Who are <strong>{companyName}</strong>'s shareholders?
      </Text>
      <Stack divider={<StackDivider borderColor="teal-200" />}>
        {Object.values(shareholders).map((s, i) => (
          <Stack justify="space-between" direction="row" key={i}>
            <Text data-testid={`shareholder-${s.name}-name`}>{s.name}</Text>
            <Badge data-testid={`shareholder-${s.name}-group`}>{s.group}</Badge>
          </Stack>
        ))}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalContent>
            <Stack p="10" as="form" onSubmit={submitNewShareholder}>
              <Input
                value={newShareholder.name}
                placeholder="Shareholder Name"
                onChange={(e) =>
                  setNewShareholder((s) => ({ ...s, name: e.target.value }))
                }
              />
              {/* TODO: bad any */}
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
              <Button type="submit" colorScheme="teal">
                Create
              </Button>
            </Stack>
          </ModalContent>
        </Modal>
      </Stack>
      <Button colorScheme="teal" variant="outline" onClick={onOpen}>
        Add Shareholder
      </Button>
      <Button
        as={Link}
        to={{ pathname: "/start/grants", search: searchParams.toString() }}
        colorScheme="teal"
      >
        Next
      </Button>
    </Stack>
  );
}

export function ShareholderGrantsStep() {
  const { shareholders, grants, dispatch } = useContext(OnboardingContext);
  const { shareholderID = "" } = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const shareholder = shareholders[parseInt(shareholderID, 10)];

  const [draftGrant, setDraftGrant] = React.useState<Omit<Grant, "id">>({
    name: "",
    amount: 0,
    issued: "",
    type: "common",
  });

  if (!shareholder) {
    return <Navigate to="/start/shareholders" replace={true} />;
  }
  const nextLink = !shareholders[shareholder.id + 1]
    ? `../done`
    : `../grants/${shareholder.id + 1}`;

  function submitGrant(e: React.FormEvent) {
    e.preventDefault();
    dispatch({
      type: "addGrant",
      payload: {
        shareholderID: parseInt(shareholderID, 10),
        grant: draftGrant,
      },
    });
    onClose();
    setDraftGrant({ name: "", amount: 0, issued: "", type: "common" });
  }
  console.log(shareholder)

  return (
    <Stack>
      <Text color="teal-400">
        What grants does <strong>{shareholder.name}</strong> have?
      </Text>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th>Occasion</Th>
            <Th>Amount</Th>
            <Th>Date</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody role="rowgroup">
          {shareholder.grants.map((gid) => (
            <Tr key={gid}>
              <Td>{grants[gid].name}</Td>
              <Td>{grants[gid].amount}</Td>
              <Td>{grants[gid].type}</Td>
              <Td>{grants[gid].issued}</Td>
            </Tr>
          ))}
          {shareholder.grants.length === 0 && (
            <Tr>
              <Td colSpan={3} textAlign="center">
                No grants to show for <strong>{shareholder.name}</strong>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
      <Button variant="outline" onClick={onOpen}>
        Add Grant
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <Stack p="10" as="form" onSubmit={submitGrant}>
            <Text>
              A <strong>Grant</strong> is any occasion where new shares are
              issued to a shareholder.
            </Text>

            <FormControl>
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
            <FormControl>
              <Input
                variant="flushed"
                placeholder="Shares"
                data-testid="grant-amount"
                value={draftGrant.amount || ""}
                onChange={(e) =>
                  setDraftGrant((g) => ({
                    ...g,
                    amount: parseInt(e.target.value, 10),
                  }))
                }
              />
            </FormControl>
            <FormControl>
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
            <Button type="submit">Save</Button>
          </Stack>
        </ModalContent>
      </Modal>
      <Button as={Link} to={nextLink} colorScheme="teal">
        Next
      </Button>
    </Stack>
  );
}

export function DoneStep() {
  const { authorize } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { email, userName, companyName, shareTypes, shareholders, grants } =
    useContext(OnboardingContext);

  const grantMutation = useMutation<Grant, unknown, Grant>((grant) =>
    fetch("/grant/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant }),
    }).then((res) => res.json())
  );
  const shareholderMutation = useMutation<Shareholder, unknown, Shareholder>(
    (shareholder) =>
      fetch("/shareholder/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shareholder),
      }).then((res) => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("user");
      },
    }
  );
  const userMutation = useMutation<User, unknown, User>((user) =>
    fetch("/user/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }).then((res) => res.json())
  );
  const companyMutation = useMutation<Company, unknown, Company>((company) =>
    fetch("/company/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(company),
    }).then((res) => res.json())
  );

  React.useEffect(() => {
    async function saveData() {
      let user;
      try {
        user = await userMutation.mutateAsync({ email, name: userName });
      } catch (error) {
        console.error(error);
        return;
      }
      
      await Promise.all([
        ...Object.values(grants).map((grant) =>
          grantMutation.mutateAsync(grant)
        ),
        ...Object.values(shareholders).map((shareholder) =>
          shareholderMutation.mutateAsync(shareholder)
        ),
        companyMutation.mutateAsync({
          name: companyName,
          shareTypes,
        }),
      ]);

      if (user) {
        authorize(user);
        navigate("/dashboard");
      } else {
        // Something bad happened.
        console.log("Something bad happened");
      }
    }

    saveData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack alignItems="center">
      <Spinner />
      <Text color="teal.400">...Wrapping up</Text>
    </Stack>
  );
}
export interface OnboardingFields {
  companyName: string;
  shareTypes: Record<string, number | undefined>;
  userName: string;
  email: string;
  shareholders: { [shareholderID: number]: Shareholder };
  grants: { [grantID: number]: Grant };
}
interface UpdateUserAction {
  type: "updateUser";
  payload: string;
}
interface UpdateEmail {
  type: "updateEmail";
  payload: string;
}
interface UpdateCompanyAction {
  type: "updateCompany";
  payload: string;
}
interface UpdateShareTypesAction {
  type: "updateShareTypes";
  payload: {
    key: string;
    newKey?: string;
    value?: string | number;
  };
}
interface AddShareholderAction {
  type: "addShareholder";
  payload: Omit<Shareholder, "id" | "grants">;
}
interface AddGrant {
  type: "addGrant";
  payload: { shareholderID: number; grant: Omit<Grant, "id"> };
}
type OnboardingAction =
  | UpdateUserAction
  | UpdateEmail
  | UpdateCompanyAction
  | UpdateShareTypesAction
  | AddShareholderAction
  | AddGrant;
export function signupReducer(
  state: OnboardingFields,
  action: OnboardingAction
) {
  return produce(state, (draft) => {
    switch (action.type) {
      case "updateUser":
        draft.userName = action.payload;
        if (draft.shareholders[0]) {
          draft.shareholders[0].name = action.payload;
        } else {
          draft.shareholders[0] = {
            id: 0,
            name: action.payload,
            grants: [],
            group: "founder",
          };
        }
        break;
      case "updateEmail":
        draft.email = action.payload;
        break;
      case "updateCompany":
        draft.companyName = action.payload;
        break;
      case "updateShareTypes":
        if (typeof action.payload.newKey === "string") {
          draft.shareTypes[action.payload.newKey] =
            draft.shareTypes[action.payload.key];
          delete draft.shareTypes[action.payload.key];
        } else {
          draft.shareTypes[action.payload.key] = action.payload.value as number;
        }
        break;
      case "addShareholder":
        const nextShareholderID =
          Math.max(
            0,
            ...Object.keys(draft.shareholders).map((e) => parseInt(e, 10))
          ) + 1;
        draft.shareholders[nextShareholderID] = {
          id: nextShareholderID,
          grants: [],
          ...action.payload,
        };
        break;
      case "addGrant":
        const nextGrantID =
          Math.max(
            0,
            ...Object.keys(draft.grants).map((e) => parseInt(e, 10))
          ) + 1;
        draft.grants[nextGrantID] = {
          id: nextGrantID,
          ...action.payload.grant,
        };
        draft.shareholders[action.payload.shareholderID].grants.push(
          nextGrantID
        );
        break;
    }
  });
}
export function Start() {
  const [searchParams] = useSearchParams();
  const [state, dispatch] = React.useReducer(signupReducer, {
    userName: searchParams.get("userName") ?? "",
    email: searchParams.get("email") ?? "",
    companyName: searchParams.get("companyName") ?? "",
    shareTypes: searchParams.has("shareTypes")
      ? (JSON.parse(
          searchParams.get("shareTypes") ?? ""
        ) as unknown as OnboardingFields["shareTypes"])
      : {
          common: undefined,
          preferred: undefined,
        },
    shareholders: searchParams.has("userName")
      ? {
          0: {
            id: 0,
            name: searchParams.get("userName") as string,
            grants: [],
            group: "founder",
          },
        }
      : {},
    grants: {},
  });

  return (
    <OnboardingContext.Provider value={{ ...state, dispatch }}>
      <Stack direction="column" alignItems="center" spacing="10">
        <Heading size="2x1" color="teal.400">
          Lets get started.
        </Heading>
        <Routes>
          <Route path="/" element={<Navigate to="user" replace={true} />} />
          <Route path="user" element={<UserStep />} />
          <Route path="company" element={<CompanyStep />} />
          <Route path="shareholders" element={<ShareholdersStep />} />
          <Route
            path="grants"
            element={
              <Navigate
                to={{
                  pathname: `/start/grants/0`,
                  search: searchParams.toString(),
                }}
              />
            }
          />
          <Route
            path="grants/:shareholderID"
            element={<ShareholderGrantsStep />}
          />
          <Route path="done" element={<DoneStep />} />
        </Routes>
      </Stack>
    </OnboardingContext.Provider>
  );
}
