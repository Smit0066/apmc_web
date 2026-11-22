import { Activity, CircleHelp, DoorOpen, Gavel, LayoutDashboard, ReceiptText, Scale, Settings, Users, Wallet, FileBarChart, Truck, UserCog } from 'lucide-react';
import { roles } from './roles.js';

export const navigation = [
  { id: 'dashboard', label: 'ડેશબોર્ડ', sub: 'Dashboard', icon: LayoutDashboard, roles: Object.keys(roles) },
  { id: 'gate', label: 'ગેટ એન્ટ્રી', sub: 'Gate Entry', icon: DoorOpen, roles: ['admin','gate','auction','weighment','accounts','inspector'] },
  { id: 'auction', label: 'હરાજી / ભાવ-કાપલી', sub: 'Auction & Tickets', icon: Gavel, roles: ['admin','auction','accounts','inspector'] },
  { id: 'weighment', label: 'વજન કાંટો', sub: 'Weighment', icon: Scale, roles: ['admin','weighment','accounts','inspector'] },
  { id: 'sales', label: 'વેચાણ બિલ', sub: 'Sale Bills', icon: ReceiptText, roles: ['admin','accounts','inspector'] },
  { id: 'payments', label: 'ચુકવણી', sub: 'Payments & Settlement', icon: Wallet, roles: ['admin','accounts'] },
  { id: 'buyerledger', label: 'વેપારી ખાતું', sub: 'Buyer Ledger & Credit', icon: Users, roles: ['admin','accounts'] },
  { id: 'gatepass', label: 'ગેટ પાસ / નિકાલ', sub: 'Gate Pass & Dispatch', icon: Truck, roles: ['admin','gate','inspector'] },
  { id: 'disputes', label: 'ફરિયાદ / વિવાદ', sub: 'Complaints', icon: CircleHelp, roles: Object.keys(roles) },
  { id: 'reports', label: 'રિપોર્ટ્સ', sub: 'Reports & MIS', icon: FileBarChart, roles: Object.keys(roles) },
  { id: 'audit', label: 'ઓડિટ ટ્રેલ', sub: 'Audit Trail', icon: Activity, roles: ['admin','inspector'] },
  { id: 'users', label: 'સ્ટાફ / યુઝર્સ', sub: 'Staff & Roles', icon: UserCog, roles: ['admin'] },
  { id: 'settings', label: 'સેટિંગ્સ', sub: 'Yard Settings', icon: Settings, roles: ['admin'] }
];
