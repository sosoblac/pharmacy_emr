import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function ManageDrugs() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [addForm, setAddForm] = useState({
    name: "",
    strength: "",
    quantity: "",
    batch_id: "",
    expiry_date: "",
  });

  const [restockForm, setRestockForm] = useState({
    id: "",
    amount: "",
  });

  const [editDrug, setEditDrug] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(stored);
    if (parsed.role !== "admin") {
      router.push("/login");
      return;
    }
    setUser(parsed);
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drugs/getDrugs");
      const data = await res.json();
      if (res.ok) setDrugs(data.drugs || []);
      else setMessage(data.error || "Failed to fetch drugs");
    } catch (err) {
      console.error("fetchDrugs error:", err);
      setMessage("Error fetching drugs");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Add new drug
  const handleAddDrug = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/drugs/addDrug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Drug added successfully");
        setAddForm({
          name: "",
          strength: "",
          quantity: "",
          batch_id: "",
          expiry_date: "",
        });
        fetchDrugs();
      } else setMessage(data.error || "Failed to add drug");
    } catch (err) {
      console.error("addDrug error:", err);
      setMessage("Error adding drug");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Restock existing
  const handleRestock = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const payload = { id: restockForm.id, amount: Number(restockForm.amount) };
      const res = await fetch("/api/drugs/restockDrug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Drug restocked successfully");
        setRestockForm({ id: "", amount: "" });
        fetchDrugs();
      } else setMessage(data.error || "Failed to restock drug");
    } catch (err) {
      console.error("restockDrug error:", err);
      setMessage("Error restocking drug");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update drug
  const handleUpdateDrug = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/drugs/updateDrug", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDrug),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Drug updated successfully");
        setEditDrug(null);
        fetchDrugs();
      } else setMessage(data.error || "Failed to update drug");
    } catch (err) {
      console.error("updateDrug error:", err);
      setMessage("Error updating drug");
    }
  };

  // ✅ Delete handler
  const handleDeleteDrug = async (id) => {
    if (!confirm("Are you sure you want to delete this drug?")) return;
    setMessage("");
    try {
      const res = await fetch(`/api/drugs/deleteDrug?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("🗑️ Drug deleted successfully");
        fetchDrugs();
      } else setMessage(data.error || "Failed to delete drug");
    } catch (err) {
      console.error("deleteDrug error:", err);
      setMessage("Error deleting drug");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">💊 Manage Drugs</h1>
        <div className="flex items-center gap-3">
          <span>{user.fullname}</span>
          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>

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
              className="text-left px-3 py-2 rounded-lg hover:bg-blue-100"
            >
              🏥 Manage Facilities
            </button>
            <button
              onClick={() => router.push("/admin/drugs")}
              className="text-left px-3 py-2 rounded-lg bg-blue-100 font-semibold"
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

        {/* Main */}
        <main className="flex-1 p-6">
          {message && (
            <div className="mb-4 text-center text-sm text-green-700 font-medium">
              {message}
            </div>
          )}

          {/* ➕ Add Drug */}
          <div className="bg-white shadow rounded-xl p-6 mb-6 max-w-6xl">
            <h2 className="text-lg font-semibold mb-4">➕ Add New Drug</h2>
            <form
              onSubmit={handleAddDrug}
              className="grid grid-cols-1 md:grid-cols-5 gap-4"
            >
              {["name", "strength", "quantity", "batch_id"].map((key) => (
                <input
                  key={key}
                  type={key === "quantity" ? "number" : "text"}
                  placeholder={key.replace("_", " ").toUpperCase()}
                  value={addForm[key]}
                  onChange={(e) =>
                    setAddForm({ ...addForm, [key]: e.target.value })
                  }
                  className="border p-2 rounded"
                  required
                />
              ))}
              <input
                type="date"
                value={addForm.expiry_date}
                onChange={(e) =>
                  setAddForm({ ...addForm, expiry_date: e.target.value })
                }
                className="border p-2 rounded"
                required
              />
              <button
                type="submit"
                className="col-span-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700"
              >
                Add Drug
              </button>
            </form>
          </div>

          {/* 📋 Table */}
          <div className="bg-white shadow rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Drug Inventory</h2>

            {loading ? (
              <p>Loading drugs...</p>
            ) : drugs.length === 0 ? (
              <p>No drugs available.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border px-3 py-2 text-left">Name</th>
                      <th className="border px-3 py-2 text-left">Strength</th>
                      <th className="border px-3 py-2 text-left">Batch ID</th>
                      <th className="border px-3 py-2 text-center">Expiry Date</th>
                      <th className="border px-3 py-2 text-center">Quantity</th>
                      <th className="border px-3 py-2 text-center">Created</th>
                      <th className="border px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugs.map((drug) => (
                      <tr
                        key={drug.id}
                        className={`hover:bg-gray-50 ${
                          drug.quantity < 20 ? "bg-red-100" : ""
                        }`}
                      >
                        <td className="border px-3 py-2">{drug.name}</td>
                        <td className="border px-3 py-2">{drug.strength}</td>
                        <td className="border px-3 py-2">{drug.batch_id}</td>
                        <td className="border px-3 py-2 text-center">
                          {drug.expiry_date
                            ? new Date(drug.expiry_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="border px-3 py-2 text-center font-semibold">
                          {drug.quantity}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          {drug.created_at
                            ? new Date(drug.created_at).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="border px-3 py-2 text-center space-x-2">
                          <button
                            onClick={() => setEditDrug(drug)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDrug(drug.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ✏️ Edit Modal */}
          {editDrug && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="bg-white p-6 rounded-xl shadow-xl max-w-lg w-full">
                <h2 className="text-lg font-semibold mb-4">
                  ✏️ Edit Drug – {editDrug.name}
                </h2>
                <form
                  onSubmit={handleUpdateDrug}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {["name", "strength", "batch_id"].map((key) => (
                    <input
                      key={key}
                      type="text"
                      value={editDrug[key]}
                      onChange={(e) =>
                        setEditDrug({ ...editDrug, [key]: e.target.value })
                      }
                      className="border p-2 rounded"
                    />
                  ))}
                  <input
                    type="number"
                    value={editDrug.quantity}
                    onChange={(e) =>
                      setEditDrug({
                        ...editDrug,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="border p-2 rounded"
                  />
                  <input
                    type="date"
                    value={
                      editDrug.expiry_date
                        ? editDrug.expiry_date.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setEditDrug({
                        ...editDrug,
                        expiry_date: e.target.value,
                      })
                    }
                    className="border p-2 rounded"
                  />

                  <div className="col-span-full flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setEditDrug(null)}
                      className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
