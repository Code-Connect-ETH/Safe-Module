import { InputSelect } from "@components/ui";
import { Message } from "@utils/handleMessage";
import saEvent from "@utils/saEvent";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useAppContext } from "../context";

type Props = {
  spaceName: string;
  setSpaceName: Dispatch<SetStateAction<string>>;
  message: Message;
};
export type SpacesRes = {
  data: Data;
};

export type Data = {
  roles: Role[];
};

export type Role = {
  space: string;
  permissions: string[];
};

const FormSpaces = ({ spaceName, setSpaceName, message }: Props) => {
  const { account } = useAppContext();

  const [spaces, setSpaces] = useState<string[]>([]);

  useEffect(() => {
    const body = {
      operationName: "Roles",
      query: `query Roles {
        roles(where:{address:\"${account}\"}){
          space
          permissions
        }
      }
      `,
      variables: {},
    };
    const res = fetch("https://testnet.snapshot.org/graphql", {
      body: JSON.stringify(body),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    res
      .then((e) => e.json())
      .then((e: SpacesRes) =>
        e.data.roles
          .filter((e) => e.permissions.includes("admin"))
          .map((e) => e.space)
      )
      .then((e) => setSpaces(e));
  }, [account]);

  const handleSetSpace = (value: string) => {
    saEvent("set_space");
    setSpaceName(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <InputSelect
          label="Space ENS"
          genericText="Pick one of your space"
          helpText={
            <>
              If you haven&apos;t created one for your project yet, you can do
              so on the{" "}
              <a
                href="https://demo.snapshot.org/#/setup"
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
                onClick={() => saEvent("gnosis_link")}
              >
                Snapshot app
              </a>
            </>
          }
          question={
            <>
              <p>
                The chosen Space will used to create proposals.
              </p>

              <p>
                After slicer is created use that as strategy along with weighted voting.
              </p>
            </>
          }
          value={spaceName}
          setValue={handleSetSpace}
          options={spaces.map((e) => {
            return { value: e, name: e };
          })}
          required
        />
      </div>
      {message && <p className="text-sm text-red-500">{message.message}</p>}
    </div>
  );
};

export default FormSpaces;
