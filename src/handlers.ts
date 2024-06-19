import { RestRequest, rest } from "msw";
import { Company, User, Shareholder, Grant } from "./types";

function nextID(collection: { [key: number]: unknown }) {
  return (
    Math.max(0, ...Object.keys(collection).map((e) => parseInt(e, 10))) + 1
  );
}
function storeState(state: any): void {
  localStorage.setItem("data", JSON.stringify(state));
}

function getQueryParams(req: RestRequest) {
  const url = new URL(req.url);

  return url.searchParams;
}

export function getHandlers(
  params: {
    company?: Company;
    users?: { [email: string]: User };
    shareholders?: { [id: number]: Shareholder };
    grants?: { [id: number]: Grant };
  } = {},
  persist: boolean = false
) {
  let { company, users = {}, shareholders = {}, grants = {} } = params;
  if (persist) {
    storeState({
      shareholders,
      users,
      grants,
      company,
    });
    setInterval(() => {
      if (localStorage.getItem("data")) {
        storeState({
          shareholders,
          users,
          grants,
          company,
        });
      }
    }, 5000);
  }

  function shareAmountReducer(isByValue: boolean = false) {
    return (acc: number, grantID: number) => {
      let amount = grants[grantID].amount;
      if (isByValue) {
        amount *= company!.shareTypes[grants[grantID].type] ?? 1.0;
      }
      return acc + amount;
    };
  }

  return [
    // Yes, this is a passwordless login
    rest.post<{ email: string }>("/signin", async (req, res, ctx) => {
      const { email } = await req.json();
      const user = Object.values(users).find((user) => user.email === email);
      if (!user) {
        return res(ctx.status(401));
      }

      return res(ctx.json(user));
    }),

    rest.post<Company>("/company/new", async (req, res, ctx) => {
      company = await req.json();

      if (!company) {
        return res(ctx.json(new Error("Invalid input")));
      }
      const shareTypes = Object.fromEntries(company?.shareTypes as any);
      company["shareTypes"] = shareTypes as any;
      return res(ctx.json(company));
    }),

    rest.post<Omit<Shareholder, "id">>(
      "/shareholder/new",
      async (req, res, ctx) => {
        const { name, email, grants = [], group } = await req.json();
        const shareholder: Shareholder = {
          name,
          email,
          grants,
          id: nextID(shareholders),
          group,
        };
        shareholders[shareholder.id] = shareholder;
        if (email) {
          const existingUser = users[email];
          if (existingUser.shareholderID) {
            // User already has a shareholder ID
            console.error("User already has a shareholder ID");
            return res(ctx.status(400));
          }
          users[email].shareholderID = shareholder.id;
        }

        return res(ctx.json(shareholder));
      }
    ),

    rest.post<{ shareholderID?: number; grant: Omit<Grant, "id"> }>(
      "/grant/new",
      async (req, res, ctx) => {
        const {
          shareholderID,
          grant: { issued, name, amount, type },
        } = await req.json();
        const grant: Grant = { name, issued, amount, id: nextID(grants), type };
        grants[grant.id] = grant;

        if (
          typeof shareholderID !== "undefined" &&
          shareholders[shareholderID]
        ) {
          shareholders[shareholderID].grants.push(grant.id);
        }

        return res(ctx.json(grant));
      }
    ),

    rest.post<User>("/user/new", async (req, res, ctx) => {
      const body = await req.json();
      const { email, name } = body;
      if (!!users[email]) {
        console.warn("User already exists");
        return res(ctx.status(400));
      }

      users[email] = {
        email,
        name,
      };

      return res(ctx.json(body));
    }),

    rest.get("/grants", (req, res, ctx) => {
      return res(ctx.json(grants));
    }),

    rest.get<{ x: number | string; y: number }[]>(
      "/grants/:mode",
      (req, res, ctx) => {
        const params = getQueryParams(req);

        const isByValue =
          params.get("byValue") === "true" &&
          !!company &&
          !!company?.shareTypes;

        if (req.params.mode === "group") {
          return res(
            ctx.json(
              ["investor", "founder", "employee"]
                .map((group) => ({
                  x: group,
                  y: Object.values(shareholders ?? {})
                    .filter((s) => s.group === group)
                    .flatMap((s) => s.grants)
                    .reduce(shareAmountReducer(isByValue), 0),
                }))
                .filter((e) => e.y > 0)
            )
          );
        }

        if (req.params.mode === "investor") {
          return res(
            ctx.json(
              Object.values(shareholders)
                .map((s) => ({
                  x: s.name,
                  y: s.grants.reduce(shareAmountReducer(isByValue), 0),
                }))
                .filter((e) => e.y > 0)
            )
          );
        }

        if (req.params.mode === "sharetype") {
          return res(
            ctx.json(
              ["common", "preferred"].map((group) => ({
                x: group,
                y: Object.values(grants ?? {})
                  .filter((g) => g.type === group)
                  .map((grant) => grant.id)
                  .reduce(shareAmountReducer(isByValue), 0),
              }))
            )
          );
        }

        return res(ctx.json([]));
      }
    ),

    rest.get("/shareholders", (req, res, ctx) => {
      return res(ctx.json(shareholders));
    }),

    rest.get<Shareholder & { grantsData: (Grant & { value: number })[] }>(
      "/shareholders/:shareholderID",
      async (req, res, ctx) => {
        const id = parseInt(req.params.shareholderID as string);

        if (isNaN(id) || typeof id !== "number" || !shareholders[id]) {
          return res(
            ctx.status(404),
            ctx.json({ status: 404, message: "Shareholder not found" })
          );
        }

        const result: Shareholder & {
          grantsData: (Grant & { value: number })[];
        } = {
          ...shareholders[id],
          grantsData: shareholders[id].grants.map((id) => {
            const grant = grants[id];

            const valueScalar = company?.shareTypes[grant.type] ?? 1.0;
            return {
              ...grant,
              value: grant.amount * valueScalar,
            };
          }),
        };

        return res(ctx.json(result));
      }
    ),

    rest.get("/company", (req, res, ctx) => {
      return res(ctx.json(company));
    }),

    rest.post<Shareholder>(
      "/shareholder/:shareholderID/edit",
      async (req, res, ctx) => {
        const { id, name, group } = await req.json();
        if (shareholders[id]) {
          shareholders[id].group = group;
          shareholders[id].name = name;
        }

        res(ctx.json(shareholders[id]));
      }
    ),
  ];
}
