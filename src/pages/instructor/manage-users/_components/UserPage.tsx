import { actions } from "astro:actions";

import DisplayTable, { type Column } from "@/components/table/DisplayTable";

interface UserPageProps {
  data: Record<string, any>[];
  totalItems: number;
}

const columns: Column[] = [
  {
    key: "name",
    name: "Name",
    label: "Name",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      regex: /^[A-Za-z0-9\s]{2,50}$/,
      message: "Name must be 2-50 characters, letters and numbers only",
    },
  },
  {
    key: "username",
    name: "Username",
    label: "Username",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      regex: /^[a-zA-Z0-9_]{3,20}$/,
      message: "Username must be 3-20 characters, alphanumeric and underscore only",
    },
  },
  {
    key: "role",
    name: "Role",
    label: "Role",
    type: "select",
    options: [
      { label: "Student", value: "STUDENT" },
      { label: "Mentor", value: "MENTOR" },
    ],
    sortable: true,
    filterable: true,
  },
  {
    key: "email",
    name: "Email",
    label: "Email",
    type: "email",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Must be a valid email address",
    },
  },
  {
    key: "password",
    name: "Password",
    label: "Password",
    type: "password",
    sortable: false,
    filterable: false,
    hideInTable: true,
    hidden: true,
    validation: {
      required: false,
      regex: /^.{6,}$/,
      message: "Password must be at least 6 characters",
    },
  },
];

const actionWrapper = (action: any) => {
  return async (data: any) => {
    const result = (await action(data)) as any;
    window.location.reload();
    return result;
  };
};

export default function UserPage({ data, totalItems }: UserPageProps) {
  return (
    <DisplayTable
      data={data}
      columns={columns}
      defaultView="table"
      filterable={true}
      clientSideProcessing={false}
      totalItems={totalItems}
      defaultPageSize={10}
      onView={async (data: any) => {
        return (await actions.users_getUser(data)) as any;
      }}
      onCreate={actionWrapper(actions.users_createUser)}
      onEdit={actionWrapper(actions.users_updateUser)}
      onDelete={actionWrapper(actions.users_deleteUser)}
      onBulkImport={actionWrapper(actions.users_bulkUpsert)}
      title="Users Management"
      actions={[]}
    />
  );
}
