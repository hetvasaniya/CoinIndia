export const CONDITION_COLORS = {
  'UNC': 'bg-green-100 text-green-800',
  'XF': 'bg-orange-100 text-orange-800',
  'VF': 'bg-blue-100 text-blue-800',
  'F': 'bg-gray-100 text-gray-800',
  'VG': 'bg-yellow-100 text-yellow-800',
  'G': 'bg-red-100 text-red-800',
};

export const STATUS_COLORS = {
  'pending': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  'confirmed': 'bg-blue-100 text-blue-800 border border-blue-300',
  'processing': 'bg-indigo-100 text-indigo-800 border border-indigo-300',
  'shipped': 'bg-purple-100 text-purple-800 border border-purple-300',
  'delivered': 'bg-green-100 text-green-800 border border-green-300',
  'cancelled': 'bg-red-100 text-red-800 border border-red-300',
  'Pending': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  'Confirmed': 'bg-blue-100 text-blue-800 border border-blue-300',
  'Processing': 'bg-indigo-100 text-indigo-800 border border-indigo-300',
  'Shipped': 'bg-purple-100 text-purple-800 border border-purple-300',
  'Delivered': 'bg-green-100 text-green-800 border border-green-300',
  'Cancelled': 'bg-red-100 text-red-800 border border-red-300',
};

export const REFUND_STATUS_COLORS = {
  'none': 'bg-gray-100 text-gray-700',
  'pending': 'bg-amber-100 text-amber-800 border border-amber-300',
  'processing': 'bg-blue-100 text-blue-800 border border-blue-300',
  'refunded': 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  'failed': 'bg-rose-100 text-rose-800 border border-rose-300',
};

export const PAYMENT_STATUS_COLORS = {
  'paid': 'bg-green-100 text-green-800 border border-green-200',
  'pending': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'failed': 'bg-red-100 text-red-800 border border-red-200',
  'refunded': 'bg-purple-100 text-purple-800 border border-purple-200',
};


export const ERA_OPTIONS = [
  'All Eras',
  'Ancient',
  'Medieval',
  'Mughal',
  'British India',
  'Republic of India',
  'Foreign'
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'year_desc', label: 'Year: Newest First' }
];
