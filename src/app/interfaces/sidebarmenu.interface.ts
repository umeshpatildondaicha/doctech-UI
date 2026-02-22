export interface SidebarMenuItem {
    label: string;
    icon: string;
    /** Optional path to custom SVG/image for sidebar (e.g. assets/icons/name.svg). When set, used instead of icon for doctor menu. */
    iconSrc?: string;
    route?: string;
    section?: 'main' | 'tools' | 'management' | 'services' | 'administration';
    userTypes?: ('doctor' | 'admin')[];
    children?: SidebarMenuItem[];
  }