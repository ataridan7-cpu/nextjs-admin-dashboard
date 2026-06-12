import * as Icons from "../icons";

type NavSubItem = { title: string; url: string };

type NavItem = {
  title: string;
  url?: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  items: NavSubItem[];
};

type NavSection = { label: string; items: NavItem[] };

export const NAV_DATA: NavSection[] = [
  {
    label: "COUNCIL CAPITAL",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Council Runs",
        url: "/runs",
        icon: Icons.Table,
        items: [],
      },
    ],
  },
];
