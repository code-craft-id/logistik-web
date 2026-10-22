import type { PreviewScreen } from "@/components/patterns/preview-contract";

// Source-derived UI metadata only; never consumes a DRAFT model or legacy data.
export const screens = {
  "/login": {
    path: "/login",
    title: "Masuk Sistem",
    source: "src/pages/login/Login.jsx",
    kind: "workspace",
    integration: "Awaiting PLT-01 identity, session and access contracts.",
    views: [
      {
        id: "masuk-sistem",
        label: "Masuk Sistem",
        columns: [],
        fields: [
          {
            key: "username",
            label: "Username",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "password",
            label: "Password",
            type: "password",
            required: true,
            table: true,
            options: [],
          },
        ],
      },
    ],
  },
  "/group-user": {
    path: "/group-user",
    title: "Grup User",
    source: "src/pages/setting/GroupUser.jsx",
    kind: "workspace",
    integration: "Awaiting PLT-01 identity, session and access contracts.",
    views: [
      {
        id: "grup-user",
        label: "Grup User",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "level",
            label: "Level User",
          },
          {
            key: "deskripsi",
            label: "Deskripsi",
          },
          {
            key: "status",
            label: "Status",
          },
        ],
        fields: [
          {
            key: "level",
            label: "Level User",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "deskripsi",
            label: "Deskripsi",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "status",
            label: "Status",
            type: "checkbox",
          },
        ],
      },
    ],
  },
  "/user-management": {
    path: "/user-management",
    title: "Manajemen User",
    source: "src/pages/setting/UserManagement.jsx",
    kind: "workspace",
    integration: "Awaiting PLT-01 identity, session and access contracts.",
    views: [
      {
        id: "user",
        label: "User",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "ID",
            label: "ID",
          },
          {
            key: "codeInitial",
            label: "Code Initial",
          },
          {
            key: "username",
            label: "Username",
          },
          {
            key: "email",
            label: "Email",
          },
          {
            key: "level",
            label: "Level",
          },
          {
            key: "Flag Session",
            label: "Flag Session",
          },
          {
            key: "active",
            label: "Aktif",
          },
        ],
        fields: [
          {
            key: "codeInitial",
            label: "Code Initial",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "firstName",
            label: "First Name",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "lastName",
            label: "Last Name",
            type: "text",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "username",
            label: "Username",
            type: "text",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "email",
            label: "Email",
            type: "email",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "password",
            label: "Password",
            type: "password",
            required: true,
            table: true,
            options: [],
          },
          {
            key: "confirmPassword",
            label: "Confirm Password",
            type: "password",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "groupUser",
            label: "Group User",
            type: "select",
            required: false,
            table: true,
            options: ["Administrator", "Operasional", "Viewer"],
          },
          {
            key: "customer",
            label: "Customer",
            type: "select",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "vendor",
            label: "Vendor",
            type: "select",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "marketing",
            label: "Marketing",
            type: "select",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "level",
            label: "Level",
            type: "select",
            required: false,
            table: true,
            options: ["Admin", "Operasional", "Viewer", "Kurir"],
          },
          {
            key: "courier",
            label: "Kurir",
            type: "select",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "active",
            label: "Aktif",
            type: "checkbox",
          },
        ],
      },
    ],
  },
  "/hak-akses-menu": {
    path: "/hak-akses-menu",
    title: "Hak Akses Menu",
    source: "src/pages/setting/MenuAccess.jsx",
    kind: "workspace",
    integration: "Awaiting PLT-01 identity, session and access contracts.",
    views: [
      {
        id: "hak-akses-menu",
        label: "Hak Akses Menu",
        columns: [
          {
            key: "No",
            label: "No",
          },
          {
            key: "Menu",
            label: "Menu",
          },
          {
            key: "Group User",
            label: "Group User",
          },
          {
            key: "Read",
            label: "Read",
          },
          {
            key: "Input",
            label: "Input",
          },
          {
            key: "Edit",
            label: "Edit",
          },
          {
            key: "Delete",
            label: "Delete",
          },
        ],
        fields: [
          {
            key: "Group User",
            label: "Group User",
            type: "select",
            required: false,
            table: true,
            options: [],
          },
          {
            key: "Type",
            label: "Type",
            type: "select",
            required: false,
            table: true,
            options: ["Semua Menu", "Terpilih"],
          },
        ],
      },
    ],
  },
  "/profile": {
    path: "/profile",
    title: "Profil Saya",
    source: "src/pages/Profile.jsx",
    kind: "heading",
    integration: "Awaiting PLT-01 identity, session and access contracts.",
    views: [],
  },
} satisfies Record<string, PreviewScreen>;
