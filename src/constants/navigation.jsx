import {
  Activity,
  BarChart3,
  Briefcase,
  Building2,
  ClipboardList,
  DollarSign,
  FileBarChart,
  FolderKanban,
  Landmark,
  LayoutDashboard,
  Package,
  Shield,
  Key,
  TrendingUp,
  Users,
} from "lucide-react";

import FinancialAnalytics from "../modules/analytics/pages/FinancialAnalytics";
import CRM from "../modules/business/pages/CRM";
import Contracts from "../modules/business/pages/Contracts";
import Quotations from "../modules/business/pages/Quotations";
import Tenders from "../modules/business/pages/Tenders";
import VendorManagement from "../modules/business/pages/VendorManagement";
import VendorDashboard from "../modules/business/pages/VendorDashboard";
import AccountsPayable from "../modules/finance/pages/AccountsPayable";
import AccountsReceivable from "../modules/finance/pages/AccountsReceivable";
import BankManagement from "../modules/finance/pages/BankManagement";
import BankReconciliation from "../modules/finance/pages/BankReconciliation";
import ChartOfAccounts from "../modules/finance/pages/ChartOfAccounts";
import GSTManagement from "../modules/finance/pages/GSTManagement";
import Invoicing from "../modules/finance/pages/Invoicing";
import InvoiceDetail from "../modules/finance/pages/InvoiceDetail";
import JobCosting from "../modules/finance/pages/JobCosting";
import TDSManagement from "../modules/finance/pages/TDSManagement";
import Vouchers from "../modules/finance/pages/Vouchers";
import VoucherEntry from "../modules/finance/pages/VoucherEntry";
import Ledger from "../modules/finance/pages/Ledger";
import ApplyLeave from "../modules/hr/pages/ApplyLeave";
import Attendance from "../modules/hr/pages/Attendance";
import EmployeeDetails from "../modules/hr/pages/EmployeeDetails";
import EmployeeMaster from "../modules/hr/pages/EmployeeMaster";
import LeaveManagement from "../modules/hr/pages/LeaveManagement";
import Payroll from "../modules/hr/pages/Payroll";
import Recruitment from "../modules/hr/pages/Recruitment";
import Reimbursements from "../modules/hr/pages/Reimbursements";
import StatutoryCompliance from "../modules/hr/pages/StatutoryCompliance";
import Dashboard from "../modules/dashboard/pages/Dashboard";
import EquipmentAssets from "../modules/operations/pages/Equipments";
import InventoryStore from "../modules/operations/pages/InventoryStore";
import MaterialIndentItems from "../modules/operations/pages/MaterialIndentItems";
import MaterialReconciliation from "../modules/operations/pages/MaterialReconciliation";
import Procurement from "../modules/operations/pages/Procurement";
import Subcontractors from "../modules/operations/pages/Subcontractors";
import PlaceholderPage from "../modules/dashboard/pages/PlaceholderPage";
import BOQ from "../modules/projects/pages/BOQ";
import ProgressTracking from "../modules/projects/pages/ProgressTracking";
import ProjectMaster from "../modules/projects/pages/ProjectMaster";
import SiteManagement from "../modules/projects/pages/SiteManagement";
import WorkOrders from "../modules/projects/pages/WorkOrders";
import ClientMaster from "../modules/projects/pages/ClientMaster";
import InventoryMaster from "../modules/projects/pages/InventoryMaster";
import Roles from "../modules/authority/pages/Roles";
import RolePermissions from "../modules/authority/pages/RolePermissions";

export const MODULE_TITLES = {
  dashboard: "Dashboard",
  "project-master": "Project Master",
  "client-master": "Client Master",
  "inventory-master": "Inventory Master",
  "work-orders": "Work Orders",
  boq: "Bill of Quantities",
  "site-management": "Site Management",
  "progress-tracking": "Progress Tracking",
  "chart-of-accounts": "Chart of Accounts",
  "bank-management": "Bank Management",
  vouchers: "Voucher Management",
  "voucher-entry": "Voucher Entry",
  ledger: "Bank Ledger",
  invoicing: "Invoicing & Billing",
  "accounts-payable": "Accounts Payable",
  "accounts-receivable": "Accounts Receivable",
  "gst-management": "GST Management",
  "tds-management": "TDS Management",
  "bank-reconciliation": "Bank Reconciliation",
  "job-costing": "Job Costing (P&L)",
  procurement: "Procurement Management",
  inventory: "Inventory & Store",
  "material-indent-items": "Material Indent Items",
  "material-reconciliation": "Material Reconciliation",
  equipment: "Equipment & Assets",
  subcontractors: "Subcontractor Management",
  "employee-master": "Employee Master",
  attendance: "Attendance Management",
  "leave-management": "Leave Management",
  "apply-leave": "Apply Leave",
  payroll: "Payroll Processing",
  "statutory-compliance": "Statutory Compliance",
  reimbursements: "Reimbursements",
  "employee-details": "Employee Details",
  crm: "CRM",
  quotations: "Quotations",
  tenders: "Tender Management",
  contracts: "Contract Management",
  "vendor-management": "Vendor Management",
  "vendor-dashboard": "Vendor Dashboard",
  "legal-compliance": "Legal Compliance",
  "board-resolutions": "Board Resolutions",
  "safety-quality": "Safety & Quality",
  "executive-dashboard": "Executive Dashboard",
  "project-analytics": "Project Analytics",
  "financial-analytics": "Financial Analytics",
  "hr-analytics": "HR Analytics",
  "custom-reports": "Custom Reports",
  roles: "Role Management",
  "role-permissions": "Role Permissions",
};

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    id: "projects",
    label: "Project Management",
    icon: FolderKanban,
    children: [
      { id: "project-master", label: "Project Master" },
      { id: "client-master", label: "Client Master" },
      { id: "inventory-master", label: "Inventory Master" },
      { id: "work-orders", label: "Work Orders" },
      { id: "boq", label: "Bill of Quantities" },
      { id: "site-management", label: "Site Management" },
      { id: "progress-tracking", label: "Progress Tracking" },
    ],
  },
  {
    id: "finance",
    label: "Finance & Accounting",
    icon: DollarSign,
    children: [
      { id: "chart-of-accounts", label: "Chart of Accounts" },
      { id: "vouchers", label: "Vouchers" },
      { id: "invoicing", label: "Invoicing & Billing" },
      { id: "accounts-payable", label: "Accounts Payable" },
      { id: "accounts-receivable", label: "Accounts Receivable" },
      { id: "gst-management", label: "GST Management" },
      { id: "tds-management", label: "TDS Management" },
      { id: "bank-reconciliation", label: "Bank Reconciliation" },
      { id: "bank-management", label: "Bank Management" },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: Package,
    children: [
      { id: "procurement", label: "Procurement" },
      { id: "material-indent-items", label: "Material Indent Items" },
      { id: "inventory", label: "Inventory & Store" },
      { id: "material-reconciliation", label: "Material Reconciliation" },
      { id: "equipment", label: "Equipment & Assets" },
      { id: "subcontractors", label: "Subcontractors" },
    ],
  },
  {
    id: "hr",
    label: "Human Resources",
    icon: Users,
    children: [
      { id: "employee-master", label: "Employee Master" },
      { id: "attendance", label: "Attendance" },
      { id: "leave-management", label: "Leave Management" },
      { id: "payroll", label: "Payroll Processing" },
      { id: "reimbursements", label: "Reimbursements" },
      { id: "recruitment", label: "Recruitment" },
    ],
  },
  {
    id: "business-dev",
    label: "Business Development",
    icon: Briefcase,
    children: [
      { id: "crm", label: "CRM" },
      { id: "quotations", label: "Quotations" },
      { id: "tenders", label: "Tender Management" },
      { id: "contracts", label: "Contract Management" },
      { id: "vendor-management", label: "Vendor Management" },
    ],
  },
  {
    id: "compliance",
    label: "Compliance & Legal",
    icon: Shield,
    children: [
      { id: "legal-compliance", label: "Legal Compliance" },
      { id: "board-resolutions", label: "Board Resolutions" },
      { id: "safety-quality", label: "Safety & Quality" },
    ],
  },
  {
    id: "analytics",
    label: "Analytics & Reports",
    icon: BarChart3,
    children: [
      { id: "executive-dashboard", label: "Executive Dashboard" },
      { id: "project-analytics", label: "Project Analytics" },
      { id: "financial-analytics", label: "Financial Analytics" },
      { id: "hr-analytics", label: "HR Analytics" },
      { id: "custom-reports", label: "Custom Reports" },
    ],
  },
  {
    id: "authority",
    label: "Authority",
    icon: Key,
    children: [
      { id: "roles", label: "Role Management" },
      { id: "role-permissions", label: "Role Permissions" },
    ],
  },
];

export const PAGE_COMPONENTS = {
  dashboard: Dashboard,
  "project-master": ProjectMaster,
  "client-master": ClientMaster,
  "inventory-master": InventoryMaster,
  "work-orders": WorkOrders,
  boq: BOQ,
  "site-management": SiteManagement,
  "progress-tracking": ProgressTracking,
  "chart-of-accounts": ChartOfAccounts,
  "bank-management": BankManagement,
  vouchers: Vouchers,
  "voucher-entry": VoucherEntry,
  ledger: Ledger,
  invoicing: Invoicing,
  "accounts-payable": AccountsPayable,
  "accounts-receivable": AccountsReceivable,
  "gst-management": GSTManagement,
  "tds-management": TDSManagement,
  "bank-reconciliation": BankReconciliation,
  "job-costing": JobCosting,
  "invoice-detail": InvoiceDetail,
  procurement: Procurement,
  "material-indent-items": MaterialIndentItems,
  inventory: InventoryStore,
  "material-reconciliation": MaterialReconciliation,
  equipment: EquipmentAssets,
  subcontractors: Subcontractors,
  "employee-master": EmployeeMaster,
  attendance: Attendance,
  "leave-management": LeaveManagement,
  "apply-leave": ApplyLeave,
  payroll: Payroll,
  recruitment: Recruitment,
  "statutory-compliance": StatutoryCompliance,
  reimbursements: Reimbursements,
  "employee-details": EmployeeDetails,
  crm: CRM,
  quotations: Quotations,
  tenders: Tenders,
  contracts: Contracts,
  "vendor-management": VendorManagement,
  "vendor-dashboard": VendorDashboard,
  "financial-analytics": FinancialAnalytics,
  roles: Roles,
  "role-permissions": RolePermissions,
};

export const PLACEHOLDER_PAGES = {
  "legal-compliance": {
    title: "Legal & Regulatory Compliance",
    description:
      "Compliance calendar, license renewal reminders, and document repository for all statutory requirements.",
    icon: Shield,
  },
  "board-resolutions": {
    title: "Board Resolutions & MCA Filings",
    description:
      "AGM/EGM minutes, director management, MCA form filing (AOC-4, MGT-7), and statutory registers.",
    icon: Landmark,
  },
  "safety-quality": {
    title: "Safety & Quality Compliance",
    description:
      "Safety inspections, incident reporting, PPE tracking, and NCR management.",
    icon: Activity,
  },
  "executive-dashboard": {
    title: "Executive Dashboard",
    description:
      "Real-time KPIs - revenue vs target, outstanding receivables, project profitability heatmap, and alerts.",
    icon: BarChart3,
  },
  "project-analytics": {
    title: "Project Analytics",
    description:
      "Progress vs timeline, cost overrun analysis, material trends, and change order impact.",
    icon: TrendingUp,
  },
  "hr-analytics": {
    title: "HR Analytics",
    description:
      "Headcount trends, attrition rates, payroll cost analysis, and compliance status dashboard.",
    icon: Users,
  },
  "custom-reports": {
    title: "Custom Report Builder",
    description:
      "Drag-and-drop report designer with filters, chart types, scheduled generation, and email distribution.",
    icon: FileBarChart,
  },
};

const DB_CODE_TO_MODULE_MAP = {
  // Authority
  role: "roles",
  roles: "roles",
  role_permission: "role-permissions",
  "role-permissions": "role-permissions",

  // Project Management
  "project-mst": "project-master",
  "work-ord": "work-orders",
  "site-mgt": "site-management",
  "ra-bill": "progress-tracking",
  "clt-inv": "invoicing",
  "doc-cntl": "document-control",
  "safety-qlt": "safety-quality",
  "earned-v-mnt": "project-analytics",

  // Finance & Accounting
  "vochr-enty": "vouchers",
  "ledgerr-mnt": "ledger",
  bnk: "bank-management",
  tds: "tds-management",
  inv: "invoicing",
  "pl-bs": "financial-analytics",
  cc: "financial-analytics",

  // Operations
  procurment: "procurement",
  "material-indent-item": "material-indent-items",
  "material-indent-items": "material-indent-items",
  inventory: "inventory",
  "mtl-recon": "material-reconciliation",
  eqpt: "equipment",
  subcontr: "subcontractors",
  "qlt-inspt": "safety-quality",

  // Human Resources
  em: "employee-master",
  at: "attendance",
  pyroll: "payroll",
  sty: "statutory-compliance",
  lev: "leave-management",
  trn: "hr-analytics",
  recut: "recruitment",
  cl: "employee-master",

  // Business Development
  crm: "crm",
  qot: "quotations",
  tdr: "tenders",
  ctr: "contracts",
  pl: "executive-dashboard",
  vm: "vendor-management",

  // Compliance & Legal
  lt: "legal-compliance",
  "mca-fil": "board-resolutions",
  sfty: "safety-quality",
  qty: "safety-quality",
  agt: "legal-compliance",
  "cpt-cldr": "legal-compliance",

  // Analytics & Reports
  "ext-db": "executive-dashboard",
  "pjt-anyt": "project-analytics",
  "finc-anyt": "financial-analytics",
  "hr-anyt": "hr-analytics",
  crb: "custom-reports",
  "audit-tril": "custom-reports",
};

export function getPageComponent(activeModule) {
  const normalizedModule =
    DB_CODE_TO_MODULE_MAP[activeModule?.toLowerCase()] || activeModule;
  const Page = PAGE_COMPONENTS[normalizedModule];

  if (Page) {
    return <Page />;
  }

  const placeholder = PLACEHOLDER_PAGES[normalizedModule];

  if (placeholder) {
    return <PlaceholderPage {...placeholder} />;
  }

  return <Dashboard />;
}
