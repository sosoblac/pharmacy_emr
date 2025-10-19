// pages/admin/stock.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AssignStock() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [drugsRaw, setDrugsRaw] = useState([]); // raw rows from /api/drugs/getDrugs
  const [drugsAggregate, setDrugsAggregate] = useState([]); // distinct names + total qty
  const [batches, setBatches] = useState([]); // batches for selected drug name (rows)
  const [formData, setFormData] = useState({
    facility_id: "",
    drug_name: "",     // selected drug name
    drug_id: "",       // actual drug row id (selected from batch dropdown)
    batch_no: "",
    quantity_assigned: "",
    expiry_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState([]);

  // Verify admin login
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
        fetchDrugs();         // loads drugsRaw and aggregates
        fetchAssignments();   // loads assigned stock table
      }
    }
  }, []);

  // Fetch facilities
  const fetchFacilities = async () => {
    try {
      const res = await fetch("/api/facility/getFacilities");
      const data = await res.json();
      // your getFacilities returns array; keep as-is
      setFacilities(data);
    } catch (err) {
      console.error("Error fetching facilities:", err);
    }
  };

  // Fetch all drugs rows and compute non-expired aggregate and reset batch state
  const fetchDrugs = async () => {
    try {
      const res = await fetch("/api/drugs/getDrugs");
      const data = await res.json();
      const rows = Array.isArray(data.drugs) ? data.drugs : [];
      setDrugsRaw(rows);

      // filter out expired rows first (expiry_date null or > now are valid)
      const now = new Date();
      const validRows = rows.filter(
        (r) => !r.expiry_date || new Date(r.expiry_date) > now
      );

      // aggregate by name: { name, strength (first), totalQty }
      const map = {};
      validRows.forEach((r) => {
        const key = r.name;
        if (!map[key]) {
          map[key] = {
            name: r.name,
            strength: r.strength,
            unit: r.unit,
            totalQty: Number(r.quantity) || 0,
          };
        } else {
          map[key].totalQty += Number(r.quantity) || 0;
        }
      });

      const agg = Object.values(map);
      setDrugsAggregate(agg);

      // reset batches & selection if previously selected drug no longer exists
      if (!agg.find((a) => a.name === formData.drug_name)) {
        setBatches([]);
        setFormData((f) => ({ ...f, drug_name: "", drug_id: "", batch_no: "" }));
      }
    } catch (error) {
      console.error("Error fetching drugs:", error);
      setDrugsRaw([]);
      setDrugsAggregate([]);
      setBatches([]);
    }
  };

  // Fetch batches for selected drug name (distinct batch rows from drugs table)
  const loadBatchesForDrugName = (drugName) => {
    if (!drugName) {
      setBatches([]);
      setFormData((f) => ({ ...f, drug_id: "", batch_no: "" }));
      return;
    }

    // use drugsRaw rows to find rows that match the name and are not expired
    const now = new Date();
    const rows = drugsRaw.filter(
      (r) =>
        r.name === drugName && (!r.expiry_date || new Date(r.expiry_date) > now)
    );

    // map to batch options, keep row id so selecting a batch sets the drug_id
    // each batch object: { drug_row_id, batch_id, expiry_date, quantity }
    const batchObjs = rows.map((r) => ({
      drug_row_id: r.id,
      batch_id: r.batch_id || r.batch_no || "", // support naming differences
      expiry_date: r.expiry_date,
      quantity: r.quantity,
    }));

    setBatches(batchObjs);

    // clear batch selection
    setFormData((f) => ({ ...f, drug_id: "", batch_no: "" }));
  };

  // Fetch assigned stock entries (stock table)
  const fetchAssignments = async () => {
    try {
      const res = await fetch("/api/stock/getAssignedStock");
      const data = await res.json();
      // Expecting { assignments: [...] }
      const arr = Array.isArray(data.assignments) ? data.assignments : [];
      setAssignments(arr);
    } catch (err) {
      console.error("Error fetching assigned stock:", err);
      setAssignments([]);
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ensure we have a drug_id (selected from batch); if not, stop
    if (!formData.drug_id || !formData.batch_no) {
      alert("Please select a batch for the chosen drug.");
      setLoading(false);
      return;
    }

    const payload = {
      facility_id: Number(formData.facility_id),
      drug_id: Number(formData.drug_id), // actual drugs table row id for the chosen batch
      batch_no: formData.batch_no,
      quantity_assigned: Number(formData.quantity_assigned),
      expiry_date: formData.expiry_date || null,
      assigned_by: user?.id || null,
    };

    try {
      const res = await fetch("/api/facility/assignStock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        // update assignments table and refresh drugs list (to reflect central qty change)
        fetchAssignments();
        fetchDrugs();

        // clear form
        setFormData({
          facility_id: "",
          drug_name: "",
          drug_id: "",
          batch_no: "",
          quantity_assigned: "",
          expiry_date: "",
        });

        alert("Stock assigned successfully!");
      } else {
        alert(data.message || "Error assigning stock");
      }
    } catch (error) {
      console.error("Error assigning stock:", error);
      setLoading(false);
      alert("Error assigning stock");
    }
  };

  // When a drug name is chosen, load the batches for that name
  const onDrugNameChange = (drugName) => {
    setFormData((f) => ({ ...f, drug_name: drugName, drug_id: "", batch_no: "" }));
    loadBatchesForDrugName(drugName);
  };

  // When a batch is chosen, set drug_id and batch_no and populate expiry_date from batch (optional)
  const onBatchSelect = (selectedDrugRowId) => {
    const batchRow = batches.find((b) => String(b.drug_row_id) === String(selectedDrugRowId));
    if (!batchRow) {
      setFormData((f) => ({ ...f, drug_id: "", batch_no: "" }));
      return;
    }
    setFormData((f) => ({
      ...f,
      drug_id: batchRow.drug_row_id,
      batch_no: batchRow.batch_id,
      expiry_date: batchRow.expiry_date || "",
    }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">📦 Assign Stock to Facilities</h1>
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
            <button onClick={() => router.push("/admin/dashboard")} className="text-left px-3 py-2 rounded-lg hover:bg-blue-100">📊 Dashboard Overview</button>
            <button onClick={() => router.push("/admin/facilities")} className="text-left px-3 py-2 rounded-lg hover:bg-blue-100">🏥 Manage Facilities</button>
            <button onClick={() => router.push("/admin/drugs")} className="text-left px-3 py-2 rounded-lg hover:bg-blue-100">💊 Manage Drugs</button>
            <button onClick={() => router.push("/admin/stock")} className="text-left px-3 py-2 rounded-lg bg-blue-100 font-semibold">📦 Assign Stock</button>
            <button onClick={() => router.push("/admin/reports")} className="text-left px-3 py-2 rounded-lg hover:bg-blue-100">📈 Reports</button>
          </nav>
        </aside>

        {/* Main Section */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Assign Stock to Facilities</h2>

          {/* Assign Stock Form */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md mb-8 max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">🧾 Assign New Stock</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facility */}
              <select value={formData.facility_id} onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })} required className="p-2 border rounded-lg">
                <option value="">Select Facility</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              {/* Drug name (aggregated, non-expired) */}
              <select value={formData.drug_name} onChange={(e) => onDrugNameChange(e.target.value)} required className="p-2 border rounded-lg">
                <option value="">Select Drug</option>
                {drugsAggregate.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.strength}) — {d.totalQty} units available
                  </option>
                ))}
              </select>

              {/* Batch Dropdown (populated after choosing drug name) */}
              <select value={formData.drug_id} onChange={(e) => onBatchSelect(e.target.value)} required className="p-2 border rounded-lg">
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b.drug_row_id} value={b.drug_row_id}>
                    {b.batch_id || "(no batch)"} — {b.quantity} units — exp {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString() : "—"}
                  </option>
                ))}
              </select>

              <input type="number" placeholder="Quantity to Assign" value={formData.quantity_assigned} onChange={(e) => setFormData({ ...formData, quantity_assigned: e.target.value })} required className="p-2 border rounded-lg" min="1" />

              <input type="date" placeholder="Expiry Date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className="p-2 border rounded-lg col-span-2" />

            </div>

            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-4 w-full hover:bg-blue-700 transition">
              {loading ? "Assigning..." : "Assign Stock"}
            </button>
          </form>

          {/* Assigned Stock Table */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4">📋 Assigned Stock</h3>

            {assignments.length === 0 ? (
              <p>No stock assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2 text-left">Facility</th>
                      <th className="border p-2 text-left">Drug</th>
                      <th className="border p-2 text-left">Batch</th>
                      <th className="border p-2 text-left">Qty</th>
                      <th className="border p-2 text-left">Expiry</th>
                      <th className="border p-2 text-left">Assigned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((a) => (
                      <tr key={a.id}>
                        <td className="border p-2">{facilities.find((f) => f.id === a.facility_id)?.name || a.facility_id}</td>
                        <td className="border p-2">{/* try to find drug name from raw rows */ (drugsRaw.find(r => r.id === a.drug_id)?.name) || a.drug_id}</td>
                        <td className="border p-2">{a.batch_no}</td>
                        <td className="border p-2">{a.quantity_assigned}</td>
                        <td className="border p-2">{a.expiry_date ? new Date(a.expiry_date).toLocaleDateString() : "—"}</td>
                        <td className="border p-2">{a.assigned_at ? new Date(a.assigned_at).toLocaleString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
