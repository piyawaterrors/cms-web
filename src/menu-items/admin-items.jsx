import { 
  LayoutDashboard, 
  Users, 
  Grid3X3, 
  FileSearch, 
  Wallet, 
  MoveHorizontal, 
  UserCog,
  Building2
} from 'lucide-react';

const adminItems = [
  {
    id: 'dashboard',
    title: 'แผงควบคุม',
    type: 'item',
    url: '/dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'plots',
    title: 'ผังหลุมศพ',
    type: 'item',
    url: '/plots',
    icon: Grid3X3
  },
  {
    id: 'members',
    title: 'ทะเบียนสมาชิก',
    type: 'item',
    url: '/members',
    icon: Users
  },
  {
    id: 'deceased',
    title: 'ทะเบียนผู้ล่วงลับ',
    type: 'item',
    url: '/deceased',
    icon: FileSearch
  },
  {
    id: 'donations',
    title: 'จัดการเงินบริจาค',
    type: 'item',
    url: '/donations',
    icon: Wallet
  },
  {
    id: 'relocation',
    title: 'บันทึกการเคลื่อนย้าย',
    type: 'item',
    url: '/relocation',
    icon: MoveHorizontal
  },
  {
    id: 'staff',
    title: 'บริหารพนักงาน',
    type: 'item',
    url: '/staff',
    icon: UserCog
  },
  {
    id: 'settings',
    title: 'การตั้งค่าสมาคม',
    type: 'item',
    url: '/settings',
    icon: Building2
  }
];

export default adminItems;
