import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    facilities: 0,
    totalDrugs: 0,
    stockAssigned: 0,
    expiringSoon: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "admin") {
        router.push("/login");
      } else {
        setUser(parsedUser);
        fetchOverview();
      }
    }
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/admin/overview");
      const data = await res.json();
      if (res.ok) setStats(data);
      else console.error("Failed to load stats:", data.error);
    } catch (err) {
      console.error("Error fetching overview:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Pharmacy EMR - Admin Dashboard</h1>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            router.push("/login");
          }}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm font-medium"
        >
          Logout
        </button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md p-4 space-y-4">
          <h2 className="text-gray-700 font-semibold mb-2">Menu</h2>
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-left px-3 py-2 rounded-lg bg-blue-100 font-semibold"
            >
              📊 Dashboard Overview
            </button>
            <button
              onClick={() => router.push("/admin/facilities")}
              className="text-left px-3 py-2 rounded-lg hover:bg-blue-100"
            >
              🏥 Manage Facilities
            </button>
            <button
              onClick={() => router.push("/admin/drugs")}
              className="text-left px-3 py-2 rounded-lg hover:bg-blue-100"
            >
              💊 Manage Drugs
            </button>
            <button
              onClick={() => router.push("/admin/stock")}
              className="text-left px-3 py-2 rounded-lg hover:bg-blue-100"
            >
              📦 Assign Stock
            </button>
            <button
              onClick={() => router.push("/admin/reports")}
              className="text-left px-3 py-2 rounded-lg hover:bg-blue-100"
            >
              📈 Reports
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Welcome, {user.fullname}
          </h2>

          {loading ? (
            <p>Loading overview...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-gray-600 font-medium">🏥 Facilities</h3>
                <p className="text-3xl font-bold text-blue-700 mt-2">
                  {stats.facilities}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-gray-600 font-medium">💊 Total Drugs</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.totalDrugs}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-gray-600 font-medium">📦 Stock Assigned</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {stats.totalQuantityAssigned}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-gray-600 font-medium">⏰ Expiring Soon</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.expiringSoon}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (within next 14 days)
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
