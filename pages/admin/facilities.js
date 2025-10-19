import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ManageFacilities() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    location: "",
    contact: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Check login + role
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login");
    } else {
      const parsed = JSON.parse(storedUser);
      if (parsed.role !== "admin") {
        router.push("/login");
      } else {
        setUser(parsed);
        fetchFacilities();
      }
    }
  }, []);

  // ✅ Fetch facilities
  const fetchFacilities = async () => {
    const res = await fetch("/api/facility/getFacilities");
    const data = await res.json();
    setFacilities(data);
  };

  // ✅ Add or update facility
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isEditing
      ? "/api/facility/updateFacility"
      : "/api/facility/addFacility";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      alert(isEditing ? "Facility updated successfully" : "Facility added successfully");
      setFormData({ id: "", name: "", location: "", contact: "" });
      setIsEditing(false);
      fetchFacilities();
    } else {
      alert(data.error || "Error saving facility");
    }
  };

  // ✅ Edit facility
  const handleEdit = (facility) => {
    setFormData(facility);
    setIsEditing(true);
  };

  // ✅ Delete facility
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this facility?")) return;

    const res = await fetch(`/api/facility/deleteFacility?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (res.ok) {
      alert("Facility deleted successfully");
      fetchFacilities();
    } else {
      alert(data.error || "Error deleting facility");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Manage Facilities</h1>
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

      {/* Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md p-4 space-y-4">
          <h2 className="text-gray-700 font-semibold mb-2">Menu</h2>
          <nav className="flex flex-col space-y-2">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="text-left px-3 py-2 rounded-lg hover:bg-blue-100"
            >
              📊 Dashboard Overview
            </button>
            <button
              onClick={() => router.push("/admin/facilities")}
              className="text-left px-3 py-2 rounded-lg bg-blue-100 font-semibold"
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

        {/* Main Area */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Facility Management
          </h2>

          {/* Add/Edit Facility Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow-md mb-8 max-w-lg"
          >
            <h3 className="text-lg font-semibold mb-4">
              {isEditing ? "Edit Facility" : "Add New Facility"}
            </h3>
            <input
              type="text"
              placeholder="Facility Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full mb-3 p-2 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full mb-3 p-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Contact"
              value={formData.contact}
              onChange={(e) =>
                setFormData({ ...formData, contact: e.target.value })
              }
              className="w-full mb-3 p-2 border rounded-lg"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full hover:bg-blue-700 transition"
              >
                {loading
                  ? "Saving..."
                  : isEditing
                  ? "Update Facility"
                  : "Add Facility"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ id: "", name: "", location: "", contact: "" });
                  }}
                  className="bg-gray-400 text-white px-4 py-2 rounded-lg w-full hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Facilities Table */}
          <div className="bg-white shadow-md rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Existing Facilities</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Location</th>
                  <th className="border p-2 text-left">Contact</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facilities.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-gray-500 p-4">
                      No facilities found
                    </td>
                  </tr>
                ) : (
                  facilities.map((f) => (
                    <tr key={f.id}>
                      <td className="border p-2">{f.name}</td>
                      <td className="border p-2">{f.location}</td>
                      <td className="border p-2">{f.contact}</td>
                      <td className="border p-2 text-center space-x-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
