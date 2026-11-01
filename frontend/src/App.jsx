import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  
  // Sale Form State
  const [saleQty, setSaleQty] = useState(1)
  const [soldBy, setSoldBy] = useState('Mummy')
  const [salePrice, setSalePrice] = useState(0)

  // बैकएंड से सामान मंगाना
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/products/?search=${search}`)
      setProducts(response.data)
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  // जब भी सर्च बदले, डेटा मंगाओ
  useEffect(() => {
    fetchProducts()
  }, [search])

  // सेल की एंट्री बैकएंड पर भेजना
  const handleSale = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://localhost:8000/sales/', {
        product_id: selectedItem.id,
        quantity_sold: parseInt(saleQty),
        sold_price: parseFloat(salePrice),
        sold_by: soldBy
      })
      alert('✅ Sale Successfully Recorded!')
      setSelectedItem(null)
      fetchProducts() // स्टॉक अपडेट करने के लिए लिस्ट रिफ्रेश करें
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.detail || error.message))
    }
  }

  // जब किसी आइटम पर 'Sell' क्लिक हो
  const openSaleModal = (item) => {
    setSelectedItem(item)
    setSaleQty(1)
    setSalePrice(item.selling_price)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Shree Siddhivinayak Kitchen Gallery</h1>
            <p className="text-gray-500 mt-1">Point of Sale & Inventory Dashboard</p>
          </div>
        </header>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input 
            type="text" 
            placeholder="Search items by name or company..." 
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling Price (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.company_name}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.item_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.current_stock > item.reorder_level ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.current_stock} pcs
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{item.selling_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => openSaleModal(item)}
                      disabled={item.current_stock === 0}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sale Entry Modal (Popup) */}
        {selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Record Sale</h2>
              <div className="mb-4">
                <p className="font-semibold">{selectedItem.company_name} - {selectedItem.item_name}</p>
                <p className="text-sm text-gray-500">Available Stock: {selectedItem.current_stock}</p>
              </div>
              
              <form onSubmit={handleSale}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sold By</label>
                  <select 
                    value={soldBy} 
                    onChange={(e) => setSoldBy(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-blue-500"
                  >
                    <option value="Mummy">Mummy</option>
                    <option value="Jija ji">Jija ji</option>
                  </select>
                </div>
                
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={selectedItem.current_stock}
                      value={saleQty} 
                      onChange={(e) => setSaleQty(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (₹)</label>
                    <input 
                      type="number" 
                      value={salePrice} 
                      onChange={(e) => setSalePrice(e.target.value)}
                      className="w-full p-2 border rounded"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setSelectedItem(null)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Confirm Sale</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App