import { useState, useEffect } from 'react'
import axios from 'axios'
import { ShoppingCart, Package, FileText, Search, AlertCircle, CheckCircle2, Folder, ArrowLeft, Trash2 } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState('pos') // 'pos', 'inventory', 'history'

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar Architecture */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold tracking-wider text-blue-400">KITCHEN GALLERY</h1>
          <p className="text-xs text-gray-400 mt-1">POS & Inventory System</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton 
            active={activeTab === 'pos'} 
            icon={<ShoppingCart size={20} />} 
            text="Point of Sale (Billing)" 
            onClick={() => setActiveTab('pos')} 
          />
          <SidebarButton 
            active={activeTab === 'inventory'} 
            icon={<Package size={20} />} 
            text="Stock & Inventory" 
            onClick={() => setActiveTab('inventory')} 
          />
          <SidebarButton 
            active={activeTab === 'history'} 
            icon={<FileText size={20} />} 
            text="Sales History" 
            onClick={() => setActiveTab('history')} 
          />
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
          v1.0.0 | Admin Logged In
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center px-8 justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {activeTab === 'pos' ? 'Billing Terminal' : activeTab === 'inventory' ? 'Inventory Management' : 'Sales Reports'}
          </h2>
        </header>

        {/* Dynamic Section Rendering */}
        <div className="flex-1 overflow-auto p-8">
          {activeTab === 'pos' && <PosSection />}
          {activeTab === 'inventory' && <InventorySection />}
          {activeTab === 'history' && <HistorySection />}
        </div>
      </main>
    </div>
  )
}

// ==========================================
// 1. POS / BILLING SECTION COMPONENT
// ==========================================
function PosSection() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [saleQty, setSaleQty] = useState(1)
  const [soldBy, setSoldBy] = useState('Suman')
  const [salePrice, setSalePrice] = useState(0)
  const [notification, setNotification] = useState('')

  useEffect(() => {
    axios.get(`http://localhost:8000/products/?search=${search}`).then(res => setProducts(res.data))
  }, [search])

  const handleSale = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/sales/', {
        product_id: selectedItem.id,
        quantity_sold: parseInt(saleQty),
        sold_price: parseFloat(salePrice),
        sold_by: soldBy
      })
      setNotification(`✅ Successfully sold ${selectedItem.item_name}!`)
      setSelectedItem(null)
      setTimeout(() => setNotification(''), 3000)
      // Refresh list
      axios.get(`http://localhost:8000/products/?search=${search}`).then(res => setProducts(res.data))
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.detail || error.message))
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {notification && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center gap-2">
          <CheckCircle2 size={20} /> {notification}
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Search items to bill..." 
          className="w-full focus:outline-none text-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{item.company_name}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${item.current_stock > item.reorder_level ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                Stock: {item.current_stock}
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">{item.item_name}</h3>
            <p className="text-lg font-bold text-gray-900 mb-4">₹{item.selling_price}</p>
            <button 
              onClick={() => { setSelectedItem(item); setSaleQty(1); setSalePrice(item.selling_price); }}
              disabled={item.current_stock === 0}
              className="w-full bg-gray-900 text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} /> Bill Item
            </button>
          </div>
        ))}
      </div>

      {/* Sale Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-1">Record Sale</h2>
            <p className="text-gray-500 mb-6 border-b pb-4">{selectedItem.company_name} - {selectedItem.item_name}</p>
            
            <form onSubmit={handleSale} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sold By</label>
                <select 
                  value={soldBy} onChange={(e) => setSoldBy(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Suman">Suman</option>
                  <option value="Radhey">Radhey</option>
                </select>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number" min="1" max={selectedItem.current_stock}
                    value={saleQty} onChange={(e) => setSaleQty(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final Price (₹)</label>
                  <input 
                    type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setSelectedItem(null)} className="px-5 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Confirm & Sell</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// // ==========================================
// // 2. INVENTORY SECTION COMPONENT
// // ==========================================
// function InventorySection() {
//   const [inventory, setInventory] = useState([])

//   useEffect(() => {
//     axios.get('http://localhost:8000/products/').then(res => setInventory(res.data))
//   }, [])

//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
//       <table className="min-w-full divide-y divide-gray-200">
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
//             <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
//             <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Stock</th>
//             <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cost Price (₹)</th>
//             <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y divide-gray-200">
//           {inventory.map((item) => (
//             <tr key={item.id} className="hover:bg-gray-50">
//               <td className="px-6 py-4">
//                 <div className="font-medium text-gray-900">{item.item_name}</div>
//                 <div className="text-xs text-gray-500">{item.company_name}</div>
//               </td>
//               <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
//               <td className="px-6 py-4 text-sm font-bold text-gray-900">{item.current_stock}</td>
//               <td className="px-6 py-4 text-sm text-gray-600">₹{item.cost_price}</td>
//               <td className="px-6 py-4 text-sm">
//                 {item.current_stock <= item.reorder_level ? (
//                   <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium w-max">
//                     <AlertCircle size={14} /> Low Stock
//                   </span>
//                 ) : (
//                   <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium w-max">
//                     In Stock
//                   </span>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   )
// }

// ==========================================
// 2. INVENTORY SECTION COMPONENT
// ==========================================
function InventorySection() {
  const [inventory, setInventory] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchItem, setSearchItem] = useState('')

  useEffect(() => {
    // limit=1000 लगाया है ताकि कोई भी सामान छुप न जाए
    axios.get('http://localhost:8000/products/?limit=1000').then(res => setInventory(res.data))
  }, [])

  // Category Stats (कार्ड्स के लिए डेटा बनाना)
  const categories = [...new Set(inventory.map(item => item.category))]
  const categoryStats = categories.map(cat => {
    const items = inventory.filter(i => i.category === cat)
    return {
      name: cat,
      totalProducts: items.length,
      totalStock: items.reduce((sum, i) => sum + i.current_stock, 0)
    }
  })

  // Filter Logic: सर्च और सेलेक्ट की गई कैटेगरी के हिसाब से
  const displayedItems = inventory.filter(item => {
    const matchSearch = item.item_name.toLowerCase().includes(searchItem.toLowerCase()) || 
                        item.company_name.toLowerCase().includes(searchItem.toLowerCase())
    const matchCategory = selectedCategory ? item.category === selectedCategory : true
    
    return matchSearch && matchCategory
  })

  return (
    <div className="space-y-6">
      {/* Top Search & Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        {selectedCategory && (
          <button 
            onClick={() => { setSelectedCategory(null); setSearchItem(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
          >
            <ArrowLeft size={18} /> Back
          </button>
        )}
        
        <div className="flex-1 flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder={selectedCategory ? `Search in ${selectedCategory}...` : "Search any item directly..."}
            className="w-full bg-transparent focus:outline-none text-gray-700 text-sm"
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
          />
        </div>
      </div>

      {/* Conditional UI: Categories Grid OR Items Table */}
      {!selectedCategory && searchItem === '' ? (
        
        // 📁 CATEGORY CARDS VIEW
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoryStats.map((cat, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedCategory(cat.name)}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-blue-300 cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Folder size={24} fill="currentColor" className="opacity-20 absolute" />
                <Folder size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{cat.name}</h3>
              <div className="flex justify-between text-sm text-gray-500 mt-4 border-t pt-3">
                <span className="flex items-center gap-1 font-medium"><Package size={14} /> {cat.totalProducts} Items</span>
                <span className="font-bold text-gray-700">Stock: {cat.totalStock}</span>
              </div>
            </div>
          ))}
        </div>

      ) : (
        
        // 📋 ITEMS LISTING (TABLE) VIEW
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800">
              {selectedCategory ? `Category: ${selectedCategory}` : 'Search Results'}
            </h3>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {displayedItems.length} items found
            </span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                {!selectedCategory && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>}
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cost Price (₹)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{item.item_name}</div>
                    <div className="text-xs font-medium text-gray-500">{item.company_name}</div>
                  </td>
                  {!selectedCategory && (
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-xs font-bold">{item.category}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-sm font-black text-gray-900">{item.current_stock}</td>
                  <td className="px-6 py-4 text-sm font-bold text-green-700">₹{item.cost_price}</td>
                  <td className="px-6 py-4 text-sm">
                    {item.current_stock <= item.reorder_level ? (
                      <span className="flex items-center gap-1 text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold w-max">
                        <AlertCircle size={14} /> Low Stock
                      </span>
                    ) : (
                      <span className="text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold w-max">
                        In Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {displayedItems.length === 0 && (
                 <tr><td colSpan={selectedCategory ? "4" : "5"} className="px-6 py-12 text-center text-gray-500 font-medium">No items found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ==========================================
// 3. SALES HISTORY SECTION COMPONENT
// ==========================================
function HistorySection() {
  const [sales, setSales] = useState([])
  const [productMap, setProductMap] = useState({})
  
  // Filter States
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterDay, setFilterDay] = useState('')
  const [filterSeller, setFilterSeller] = useState('')

  const fetchData = () => {
    axios.get('http://localhost:8000/sales/?limit=1000').then(res => setSales(res.data))
    axios.get('http://localhost:8000/products/?limit=1000').then(res => {
      const pMap = {}
      res.data.forEach(p => { 
        pMap[p.id] = { name: p.item_name, mrp: p.selling_price, cost: p.cost_price } 
      })
      setProductMap(pMap)
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 👈 नया: सेल डिलीट करने का फंक्शन
  const handleDeleteSale = async (saleId) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this sale? The quantity will be automatically added back to your stock.");
    if (isConfirmed) {
      try {
        await axios.delete(`http://localhost:8000/sales/${saleId}`);
        fetchData(); // डेटाबेस से नई लिस्ट मंगाओ ताकि पेज अपडेट हो जाए
      } catch (error) {
        alert('❌ Error deleting sale: ' + (error.response?.data?.detail || error.message));
      }
    }
  }

  // Dropdown Options
  const years = [...new Set(sales.map(s => {
    const y = new Date(s.sale_date).getFullYear()
    return isNaN(y) ? null : y
  }))].filter(Boolean).sort((a,b) => b-a)
  
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const days = Array.from({length: 31}, (_, i) => i + 1)
  const sellers = [...new Set(sales.map(s => (s.sold_by || 'Unknown').trim()))].sort()

  // Filtering Logic
  const filteredSales = sales.filter(sale => {
    if (!sale.sale_date) return false;
    const d = new Date(sale.sale_date);
    const matchYear = filterYear ? d.getFullYear() == filterYear : true
    const matchMonth = filterMonth ? (d.getMonth() + 1) == filterMonth : true
    const matchDay = filterDay ? d.getDate() == filterDay : true
    const sellerName = (sale.sold_by || "Unknown").trim().toLowerCase()
    const filterName = filterSeller.trim().toLowerCase()
    const matchSeller = filterSeller ? sellerName === filterName : true
    return matchYear && matchMonth && matchDay && matchSeller
  })

  // Date & Time Formatters
  const formatCustomDate = (isoString) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${day}-${month}`;
  }

  const formatCustomTime = (isoString) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Year</label>
          <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="p-2 border border-gray-200 rounded-lg bg-gray-50 min-w-[110px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Month</label>
          <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="p-2 border border-gray-200 rounded-lg bg-gray-50 min-w-[120px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All</option>
            {months.map(m => {
                const monthName = new Date(2000, m-1, 1).toLocaleString('en-US', {month: 'short'})
                return <option key={m} value={m}>{monthName}</option>
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Day</label>
          <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="p-2 border border-gray-200 rounded-lg bg-gray-50 min-w-[90px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All</option>
            {days.map(d => <option key={d} value={d}>{String(d).padStart(2, '0')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sold By</label>
          <select value={filterSeller} onChange={e => setFilterSeller(e.target.value)} className="p-2 border border-gray-200 rounded-lg bg-gray-50 min-w-[150px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Sellers</option>
            {sellers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        <div className="ml-auto">
           <button 
              onClick={() => { setFilterYear(''); setFilterMonth(''); setFilterDay(''); setFilterSeller(''); }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg font-medium transition"
           >
             Clear Filters
           </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sold By</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">MRP (₹)</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Sold At (₹)</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Profit (₹)</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSales.map((sale) => {
              const product = productMap[sale.product_id] || { name: 'Unknown Product', mrp: 0, cost: 0 };
              const profit = sale.sold_price - (product.cost * sale.quantity_sold);

              return (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="text-sm font-bold text-gray-800">{formatCustomDate(sale.sale_date)}</div>
                    <div className="text-xs text-gray-500">{formatCustomTime(sale.sale_date)}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-bold text-blue-700">{product.name}</div>
                    <div className="text-xs text-gray-400">ID: #{sale.product_id}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md text-xs font-bold border border-purple-200">
                      {sale.sold_by}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900">{sale.quantity_sold}</td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-500">₹{product.mrp}</td>
                  <td className="px-5 py-4 text-sm font-bold text-blue-600">₹{sale.sold_price}</td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-extrabold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profit >= 0 ? '+' : '-'}₹{Math.abs(profit).toFixed(2)}
                    </span>
                  </td>
                  {/* 👈 Delete Button Column */}
                  <td className="px-5 py-4 text-center">
                    <button 
                      onClick={() => handleDeleteSale(sale.id)}
                      className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Sale & Restore Stock"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredSales.length === 0 && (
               <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-500">No sales match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ==========================================
// UTILITY COMPONENTS
// ==========================================
function SidebarButton({ active, icon, text, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </button>
  )
}