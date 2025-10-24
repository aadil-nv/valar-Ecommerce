


export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: '$45,231', change: '+20.1%' },
          { label: 'Orders', value: '1,234', change: '+15.3%' },
          { label: 'Products', value: '567', change: '+5.2%' },
          { label: 'Customers', value: '890', change: '+12.5%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</div>
            <div className="text-sm text-green-600 mt-1">{stat.change}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
