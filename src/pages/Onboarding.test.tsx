import React from "react";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import {
  CompanyStep,
  OnboardingContext,
  OnboardingFields,
  ShareholderGrantsStep,
  ShareholdersStep,
  signupReducer,
  Start,
  UserStep,
} from "./Onboarding";
import { Navigate, Route, Routes } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { getTestRouter, ThemeWrapper } from "../testutils";

const defaultOnboardingState = {
  userName: "",
  email: "",
  companyName: "",
  shareTypes: { common: undefined, preferred: undefined },
  shareholders: {},
  grants: {},
};

const Page = ({
  initialState = defaultOnboardingState,
}: {
  initialState?: OnboardingFields;
}) => {
  const [state, dispatch] = React.useReducer(signupReducer, initialState);

  return (
    <OnboardingContext.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="user" replace={true} />} />
        <Route path="user" element={<UserStep />} />
        <Route path="company" element={<CompanyStep />} />
        <Route path="shareholders" element={<ShareholdersStep />} />
        <Route
          path="grants"
          element={<Navigate to={`/grants/0`} replace={true} />}
        />
        <Route
          path="grants/:shareholderID"
          element={<ShareholderGrantsStep />}
        />
        <Route path="done" element={<div />} />
      </Routes>
    </OnboardingContext.Provider>
  );
};

describe("Onboarding", () => {
  it("should allow configuring user details", async () => {
    const Router = getTestRouter("/");
    render(
      <Router>
        <Page />
      </Router>,
      { wrapper: ThemeWrapper }
    );

    const nameField = screen.getByRole("textbox", { name: /who is setting/ });
    await userEvent.click(nameField);
    await userEvent.type(nameField, "Terry");
    expect(nameField).toHaveValue("Terry");

    const emailField = screen.getByRole("textbox", { name: /email/ });
    await userEvent.click(emailField);
    await userEvent.type(emailField, "great@email.com");
    expect(emailField).toHaveValue("great@email.com");

    const nextButton = screen.getByRole("button", { name: "Next" });
    await userEvent.click(nextButton);
    expect(nameField).not.toBeInTheDocument();
  });

  it("should allow configuring company", async () => {
    const Router = getTestRouter("/company");
    render(
      <Router>
        <Page />
      </Router>,
      { wrapper: ThemeWrapper }
    );

    const companyNameField = screen.getByRole("textbox", {
      name: /company are we/,
    });
    await userEvent.type(companyNameField, "Admiral");
    expect(companyNameField).toHaveValue("Admiral");

    const nextButton = screen.getByRole("button", { name: "Next" });
    await userEvent.click(nextButton);
    expect(companyNameField).toBeInTheDocument();

    const commonValueInput = screen.getByTestId("sharetype-value-0");
    const preferredValueInput = screen.getByTestId("sharetype-value-1");

    await userEvent.click(commonValueInput);
    await userEvent.paste("5.25");
    expect(commonValueInput).toHaveValue(5.25);

    await userEvent.click(preferredValueInput);
    await userEvent.paste("10.0");
    expect(preferredValueInput).toHaveValue(10);

    await userEvent.click(nextButton);
    expect(companyNameField).not.toBeInTheDocument();
  });

  it("should allow configuring shareholders", async () => {
    const Router = getTestRouter("/shareholders");
    render(
      <Router>
        <Page
          initialState={{
            ...defaultOnboardingState,
            companyName: "My Company",
            shareTypes: { common: 2.0, preferred: 4.0 },
            shareholders: {
              "0": { name: "Jenn", group: "founder", grants: [], id: 0 },
            },
          }}
        />
      </Router>,
      { wrapper: ThemeWrapper }
    );

    expect(screen.getByText("Jenn")).toBeInTheDocument();
    expect(screen.queryByText("Anne")).toBeNull();

    const addShareholdersButton = screen.getByRole("button", {
      name: "Add Shareholder",
    });
    await userEvent.click(addShareholdersButton);

    let newShareholderNameField = screen.getByRole("textbox");
    let groupPicker = screen.getByRole("combobox");
    let createButton = screen.getByRole("button", { name: "Save" });
    await waitFor(() => {
      expect(newShareholderNameField).toBeVisible();
    });
    await userEvent.click(newShareholderNameField);
    await userEvent.paste("Anne");
    await userEvent.selectOptions(groupPicker, "founder");
    await userEvent.click(createButton);

    await waitForElementToBeRemoved(newShareholderNameField);
    expect(screen.getByText("Anne")).toBeInTheDocument();

    await userEvent.click(addShareholdersButton);
    newShareholderNameField = screen.getByRole("textbox");
    groupPicker = screen.getByRole("combobox");
    createButton = screen.getByRole("button", { name: "Save" });
    await waitFor(() => {
      expect(newShareholderNameField).toBeVisible();
    });
    expect(newShareholderNameField).toHaveValue("");

    await userEvent.click(newShareholderNameField);
    await userEvent.paste("Byron");
    await userEvent.selectOptions(groupPicker, "employee");
    await userEvent.click(createButton);

    expect(screen.getByText("Byron")).toBeInTheDocument();
  });

  it("should allow for configuring shareholder grants", async () => {
    const Router = getTestRouter("/grants");
    render(
      <Router>
        <Page
          initialState={{
            ...defaultOnboardingState,
            companyName: "My Company",
            shareTypes: { common: 2.0, preferred: 4.0 },
            shareholders: {
              0: { name: "Jenn", group: "founder", grants: [1], id: 0 },
              1: { name: "Aaron", group: "employee", grants: [], id: 1 },
              2: { name: "Sam", group: "investor", grants: [], id: 2 },
            },
            grants: {
              1: {
                id: 1,
                name: "Initial issuance",
                amount: 1000,
                issued: Date.now().toLocaleString(),
                type: "common",
              },
            },
          }}
        />
      </Router>,
      { wrapper: ThemeWrapper }
    );

    expect(screen.getByText(/Jenn/)).toBeInTheDocument();
    expect(screen.getByText("Initial issuance")).toBeInTheDocument();

    const addGrantButton = screen.getByRole("button", { name: /Add Grant/ });
    await userEvent.click(addGrantButton);

    const grantTable = screen.getAllByRole("rowgroup")[1];

    let grantNameInput = screen.getByTestId("grant-name");
    let grantAmountInput = screen.getByTestId("grant-amount");
    let grantTypeInput = screen.getByTestId("grant-type");
    let grantDateInput = screen.getByTestId("grant-issued");

    await waitFor(() => {
      expect(grantNameInput).toBeVisible();
    });

    let saveButton = screen.getByRole("button", { name: /Save/ });

    expect(saveButton).toBeDisabled();

    await userEvent.click(grantNameInput);
    await userEvent.paste("2020 Incentive");
    expect(grantNameInput).toHaveValue("2020 Incentive");

    await userEvent.click(grantAmountInput);
    await userEvent.paste("2000");
    expect(grantAmountInput).toHaveValue(2000);

    await userEvent.selectOptions(grantTypeInput, ["preferred"]);
    expect(grantTypeInput).toHaveValue("preferred");

    await userEvent.click(grantDateInput);
    await userEvent.type(grantDateInput, "2024-06-18");
    expect(grantDateInput).toHaveValue();

    expect(saveButton).not.toBeDisabled();

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(grantNameInput).not.toBeInTheDocument();
    });

    expect(
      await within(grantTable).findByText(/2020 Incentive/)
    ).toBeInTheDocument();

    let nextButton = screen.getByRole("link", { name: /Next/ });
    await userEvent.click(nextButton);

    await screen.findAllByText(/Aaron/);
    expect(screen.getByText(/No grants to show/)).toBeInTheDocument();

    await userEvent.click(addGrantButton);

    grantNameInput = screen.getByTestId("grant-name");
    grantAmountInput = screen.getByTestId("grant-amount");
    grantTypeInput = screen.getByTestId("grant-type");
    grantDateInput = screen.getByTestId("grant-issued");

    await userEvent.click(grantNameInput);
    await userEvent.clear(grantNameInput);
    await userEvent.paste("Options conversion");
    expect(grantNameInput).toHaveValue("Options conversion");

    await userEvent.click(grantAmountInput);
    await userEvent.paste("100");
    expect(grantAmountInput).toHaveValue(100);

    expect(grantTypeInput).toHaveValue("common");

    await userEvent.click(grantDateInput);
    await userEvent.type(grantDateInput, "2024-06-12");
    expect(grantDateInput).toHaveValue();

    saveButton = screen.getByRole("button", { name: /Save/ });

    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(grantNameInput).not.toBeInTheDocument();
    });

    expect(
      await within(grantTable).findByText("Options conversion")
    ).toBeInTheDocument();

    nextButton = screen.getByRole("link", { name: /Next/ });
    await userEvent.click(nextButton);

    await screen.findAllByText(/Sam/);
    expect(screen.getByText(/No grants to show/)).toBeInTheDocument();

    await userEvent.click(addGrantButton);

    grantNameInput = screen.getByTestId("grant-name");
    grantAmountInput = screen.getByTestId("grant-amount");
    grantTypeInput = screen.getByTestId("grant-type");
    grantDateInput = screen.getByTestId("grant-issued");

    expect(grantNameInput).toHaveValue("");
    await userEvent.click(grantNameInput);
    await userEvent.paste("Series A Purchase");
    expect(grantNameInput).toHaveValue("Series A Purchase");

    await userEvent.click(grantAmountInput);
    // Something is wrong with this input *hint*
    await userEvent.paste("800");
    expect(grantAmountInput).toHaveValue(800);

    expect(grantTypeInput).toHaveValue("common");

    await userEvent.click(grantDateInput);
    await userEvent.type(grantDateInput, "2020-12-12");
    expect(grantDateInput).toHaveValue();

    await userEvent.click(saveButton);

    const textIndicator = screen.getByText(/What grants does/);
    expect(textIndicator).toBeInTheDocument();
    await userEvent.click(nextButton);
    expect(textIndicator).not.toBeInTheDocument();
  }, 10000);

  it("should persist onboard config", async () => {
    const searchParams = new URLSearchParams({
      userName: "Tonya",
      email: "tonya@email.com",
      companyName: "Tonya's Tech",
    });

    let Router = getTestRouter("/shareholders?" + searchParams.toString());
    render(
      <Router>
        <Start />
      </Router>,
      { wrapper: ThemeWrapper }
    );

    expect(screen.getByText("Tonya's Tech")).toBeInTheDocument();
    expect(screen.getByTestId("shareholder-Tonya-name")).toHaveTextContent(
      "Tonya"
    );
    expect(screen.getByTestId("shareholder-Tonya-group")).toHaveTextContent(
      "founder"
    );

    Router = getTestRouter("/grants?" + searchParams.toString());
    render(
      <Router>
        <Start />
      </Router>,
      { wrapper: ThemeWrapper }
    );

    expect(screen.getByText("Tonya")).toBeInTheDocument();
  });
});
