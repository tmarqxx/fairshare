import { Button, Flex, Heading, Spacer } from "@chakra-ui/react";
import { useContext } from "react";
import { AuthContext } from "../../App";
import { Link } from "react-router-dom";

export function Navbar() {
  const { deauthroize } = useContext(AuthContext);

  return (
    <Flex paddingBottom={4} as="nav">
      <Link to="/dashboard">
        <Heading
          as="h1"
          fontSize={32}
          bgGradient="linear(to-br, teal.400, teal.100)"
          bgClip="text"
          style={{ lineHeight: "32px" }}
        >
          Fair Share
        </Heading>
      </Link>
      <Spacer />

      <Button colorScheme="teal" variant="ghost" onClick={(_) => deauthroize()}>
        Sign Out
      </Button>
    </Flex>
  );
}
