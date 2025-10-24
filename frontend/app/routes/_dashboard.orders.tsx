export default function Orders() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Orders</h2>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-medium text-gray-800">Order #{1000 + item}</p>
              <p className="text-sm text-gray-600">Customer: John Doe</p>
              <p className="text-sm text-gray-600">Total: $199.99</p>
              <p className="text-sm text-green-600">Status: Shipped</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}