import { roles } from './roles.js';

export const pageConfig = {
  gate: {
    title: 'Gate Entry Register', subtitle: 'ખેડૂત / વેચનાર, પાક, વાહન અને yard arrival નો રેકોર્ડ.',
    endpoint: '/yard/lots', createLabel: 'નવી ગેટ એન્ટ્રી', createRoles: ['admin','gate'],
    columns: [
      ['lotNumber','LOT ID'],['farmerName','ખેડૂત / વેચનાર'],['sellerType','Seller type'],
      ['commodity','પાક'],['bags','બેગ'],['vehicle','વાહન નંબર'],['village','ગામ'],['status','Stage'],['arrivalAt','આવક સમય']
    ]
  },
  auction: {
    title: 'Auction & Digital Price Tickets', subtitle: 'ખુલ્લી હરાજી / e-auction નો સ્વીકારેલો ભાવ ticket સાથે lock કરો.',
    endpoint: '/yard/tickets', createLabel: 'નવી ભાવ-કાપલી', createRoles: ['admin','auction'],
    columns: [['ticketNumber','Ticket No.'],['lot.lotNumber','LOT ID'],['lot.farmerName','ખેડૂત'],['buyer.name','ખરીદદાર'],['quantity','જથ્થો (Q)'],['rate','ભાવ / Q'],['createdAt','Ticket સમય']]
  },
  weighment: {
    title: 'Weighbridge & Weighment', subtitle: 'Gross − tare = net. દરેક reading operator અને scale reference સાથે સાચવો.',
    endpoint: '/yard/weighments', createLabel: 'વજન નોંધો', createRoles: ['admin','weighment'],
    columns: [['lot.lotNumber','LOT ID'],['lot.farmerName','ખેડૂત'],['gross','Gross Q'],['tare','Tare Q'],['net','Net Q'],['scaleId','Scale ID'],['slipRef','Slip Ref'],['createdAt','સમય']]
  },
  sales: {
    title: 'Sale Bill Register', subtitle: 'Verified weighment અને auction ticket પરથી server-generated bill.',
    endpoint: '/yard/bills', columns: [
      ['billNumber','Bill No.'],['lot.lotNumber','LOT ID'],['farmerName','ખેડૂત'],['buyer.name','ખરીદદાર'],
      ['netWeight','Net Q'],['rate','ભાવ / Q'],['grossAmount','Gross રકમ'],['farmerNetPayable','ખેડૂત payable'],['status','સ્થિતિ']
    ]
  },
  payments: {
    title: 'Payments & Farmer Settlement', subtitle: 'Farmer settlement, trader purchase અને buyer-side dues અલગ ledgers માં નોંધો.',
    endpoint: '/yard/payments', createLabel: 'ચુકવણી નોંધો', createRoles: ['admin','accounts'],
    columns: [['receiptNumber','Receipt'],['bill.billNumber','Bill'],['type','Ledger type'],['amount','રકમ'],['mode','માધ્યમ'],['reference','UTR / Ref'],['receivedAt','ચુકવણી સમય']]
  },
  buyerledger: {
    title: 'Buyer Ledger & Credit Control', subtitle: 'Trader registration, approved purchase limit, credit days અને outstanding.',
    endpoint: '/yard/buyers', createLabel: 'નવો વેપારી', createRoles: ['admin','accounts'],
    columns: [['name','વેપારી'],['registrationNo','Licence / Reg ID'],['creditDays','Credit days'],['purchaseLimit','Purchase limit'],['ledger.gross','ખરીદ કિંમત'],['ledger.paid','ચૂકવેલ'],['ledger.outstanding','બાકી (bills)'],['ledger.exposure','કુલ exposure'],['creditStatus','Credit status'],['active','Active']]
  },
  gatepass: {
    title: 'Gate Pass & Dispatch Control', subtitle: 'Farmer settlement અને buyer dues clear થયા પછી જ yard exit pass.',
    endpoint: '/yard/gate-passes', createLabel: 'Gate Pass issue કરો', createRoles: ['admin','gate'],
    columns: [['passNumber','Pass No.'],['lot.lotNumber','LOT ID'],['lot.farmerName','ખેડૂત'],['buyer.name','ખરીદદાર'],['vehicle','વાહન'],['status','સ્થિતિ'],['issuedAt','Issued'],['dispatchAt','Dispatch']]
  },
  disputes: {
    title: 'Complaint & Dispute Register', subtitle: 'વજન, ગુણવત્તા, auction rate અને payment dispute નું resolution trail.',
    endpoint: '/yard/complaints', createLabel: 'નવી ફરિયાદ', createRoles: Object.keys(roles),
    columns: [['complaintNumber','Complaint ID'],['complainant','ફરિયાદી'],['type','પ્રકાર'],['lot.lotNumber','LOT ID'],['status','સ્થિતિ'],['createdAt','નોંધ સમય']]
  },
  audit: {
    title: 'Append-only Audit Trail', subtitle: 'કોણે, ક્યારે અને કઈ business action કરી તેનો server-side record.',
    endpoint: '/yard/audit',
    columns: [['createdAt','Timestamp'],['actorName','User'],['role','Role'],['action','Action'],['resource','Module'],['resourceId','Reference'],['reason','Reason']]
  },
  users: {
    title: 'Staff & Role Administration', subtitle: 'દરેક employee ને અલગ login અને minimum required permissions આપો.',
    endpoint: '/yard/users', createLabel: 'નવો staff user', createRoles: ['admin'],
    columns: [['name','નામ'],['email','Email'],['role','Role'],['active','Active'],['lastLoginAt','Last login']]
  }
};
