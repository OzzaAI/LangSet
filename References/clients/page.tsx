export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Clients</h2>
        <p className="text-gray-600">Manage your coaching clients and their progress</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Active Clients</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
              Add New Client
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Sample client data */}
          <div className="space-y-4">
            {[ /* Sample client data */
              { name: 'Sarah Johnson', email: 'sarah@example.com', sessions: 8, nextSession: 'Tomorrow 2:00 PM' },
              { name: 'Mike Chen', email: 'mike@example.com', sessions: 3, nextSession: 'Thursday 10:00 AM' },
              { name: 'Lisa Rodriguez', email: 'lisa@example.com', sessions: 12, nextSession: 'Friday 3:00 PM' },
            ].map((client, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{client.name}</h4>
                    <p className="text-sm text-gray-600">{client.email}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {client.sessions} sessions completed
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Next Session</p>
                    <p className="text-sm text-gray-600">{client.nextSession}</p>
                    <div className="mt-2 space-x-2">
                      <button className="text-blue-600 hover:text-blue-500 text-sm">
                        View Details
                      </button>
                      <button className="text-gray-600 hover:text-gray-500 text-sm">
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty state message */}
          <div className="text-center py-8 text-gray-500">
            <p>This is a demo view. In the full implementation, this would show your actual coaching clients.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 