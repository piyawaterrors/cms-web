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
    subUrls: [],
    icon: LayoutDashboard
  },
  {
    id: 'plots',
    title: 'ผังหลุมศพ',
    type: 'item',
    url: '/plots',
    subUrls: ['/plots/detail'],
    icon: Grid3X3
  },
  {
    id: 'members',
    title: 'ทะเบียนสมาชิก',
    type: 'item',
    url: '/members',
    subUrls: ['/members/detail', '/members/add', '/members/edit'],
    icon: Users
  },
  {
    id: 'deceased',
    title: 'ทะเบียนผู้ล่วงลับ',
    type: 'item',
    url: '/deceased',
    subUrls: ['/deceased/detail', '/deceased/add', '/deceased/edit'],
    icon: FileSearch
  },
  {
    id: 'donations',
    title: 'จัดการเงินบริจาค',
    type: 'item',
    url: '/donations',
    subUrls: ['/donations/detail', '/donations/add', '/donations/edit'],
    icon: Wallet
  },
  {
    id: 'staff',
    title: 'บริหารพนักงาน',
    type: 'item',
    url: '/staff',
    subUrls: ['/staff/detail', '/staff/add', '/staff/edit'],
    icon: UserCog
  },
  {
    id: 'settings',
    title: 'การตั้งค่าสมาคม',
    type: 'item',
    url: '/settings',
    subUrls: ['/settings/detail', '/settings/edit'],
    icon: Building2
  }
];

export default adminItems;
