'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSuppliers } from '../../hooks/use-suppliers';
import { useInventoryStore } from '../../store/inventory-store';
import { InventoryItem } from '../../types/product';
import { Save, X, Plus, Edit, Trash2, Package } from 'lucide-react';
import { formatInventoryQuantity } from '../../utils/unit-converter';

export default function InventoryPage() {
  const { suppliers, addSupplier } = useSuppliers();
  const { inventory, fetchInventory, updateStock, setStock, deleteInventoryItem, getInventoryItem } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);

  // Form State
  const [newInventory, setNewInventory] = useState<Partial<InventoryItem>>({
    name: '', description: '', supplierID: '', categoryID: ''
  });
  const [initialStock, setInitialStock] = useState<number>(0);
  const [stockUnit, setStockUnit] = useState<string>('units');
  const [baseUnit, setBaseUnit] = useState<string>('');
  const [piecesPerUnit, setPiecesPerUnit] = useState<number>(1);
  const [reorderPoint, setReorderPoint] = useState<number>(10);
  
  // Inline New Supplier State
  const [newSupplierData, setNewSupplierData] = useState({ name: '', contactInfo: '' });
  
  // Stock Adjustment State
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');

  // Initialize inventory store on mount
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleAddInventory = async () => {
    if (!newInventory.name || !newInventory.supplierID) {
      alert('Please fill in required fields (Name and Supplier)');
      return;
    }

    let finalSupplierID = newInventory.supplierID;

    // Handle creation of new supplier if selected
    if (newInventory.supplierID === 'new') {
      if (!newSupplierData.name) {
        alert('Please enter the name for the new supplier.');
        return;
      }
      
      const newSupplierID = `s_${Date.now()}`;
      await addSupplier({
        supplierID: newSupplierID,
        name: newSupplierData.name,
        contactInfo: newSupplierData.contactInfo
      });
      
      finalSupplierID = newSupplierID;
    }
    
    const inventoryItem: InventoryItem = {
      inventoryID: `inv_${Date.now()}`,
      name: newInventory.name!,
      description: newInventory.description || '',
      supplierID: finalSupplierID,
      categoryID: newInventory.categoryID || '',
      quantity: Math.round(Math.max(0, initialStock) * 100) / 100, // Round to 2 decimal places
      unit: stockUnit,
      baseUnit: baseUnit || undefined,
      piecesPerUnit: baseUnit && piecesPerUnit > 0 ? piecesPerUnit : undefined,
      reorderPoint: reorderPoint,
      lastUpdated: new Date().toISOString()
    };

    const { addInventoryItem } = useInventoryStore.getState();
    await addInventoryItem(inventoryItem);
    setIsModalOpen(false);
    
    // Reset States
    setNewInventory({ name: '', description: '', supplierID: '', categoryID: '' });
    setNewSupplierData({ name: '', contactInfo: '' });
    setInitialStock(0);
    setStockUnit('units');
    setBaseUnit('');
    setPiecesPerUnit(1);
    setReorderPoint(10);
    
    fetchInventory();
  };

  const handleOpenAdjustModal = (item: InventoryItem) => {
    setSelectedInventory(item);
    setAdjustmentType('add');
    setAdjustmentQuantity(0);
    setAdjustmentReason('');
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async () => {
    if (!selectedInventory) return;
    
    const currentStock = selectedInventory.quantity || 0;

    if (adjustmentType === 'add') {
      await updateStock(selectedInventory.inventoryID, adjustmentQuantity);
    } else if (adjustmentType === 'remove') {
      await updateStock(selectedInventory.inventoryID, -adjustmentQuantity);
    } else if (adjustmentType === 'set') {
      await setStock(selectedInventory.inventoryID, adjustmentQuantity, adjustmentReason);
    }

    setIsAdjustModalOpen(false);
    setSelectedInventory(null);
    fetchInventory();
  };

  const getSupplierName = (supplierID: string) => {
    const supplier = suppliers.find(s => s.supplierID === supplierID);
    return supplier?.name || 'Unknown';
  };

  const handleDeleteInventory = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      try {
        await deleteInventoryItem(item.inventoryID);
        fetchInventory();
      } catch (error) {
        alert('Failed to delete inventory item. Please try again.');
        console.error('Error deleting inventory item:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-coffee-900">Inventory Management</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Inventory Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-coffee-50 border-b border-coffee-200 text-xs uppercase text-coffee-500 font-semibold tracking-wider">
              <th className="p-4">Name</th>
              <th className="p-4">Description</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Stock Level</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-100">
            {inventory.map(item => {
              const stock = item.quantity || 0;
              const unit = item.unit || 'units';
              const reorderPointValue = item.reorderPoint || 10;
              
              let status = 'in-stock';
              let statusText = 'In Stock';
              let statusColor = 'text-coffee-700';
              let statusBg = 'bg-coffee-100';
              let statusBorder = 'border-coffee-200';
              
              if (stock === 0) {
                status = 'out-of-stock';
                statusText = 'Out of Stock';
                statusColor = 'text-red-700';
                statusBg = 'bg-red-50';
                statusBorder = 'border-red-100';
              } else if (stock < reorderPointValue) {
                status = 'low-stock';
                statusText = 'Low Stock';
                statusColor = 'text-orange-700';
                statusBg = 'bg-orange-50';
                statusBorder = 'border-orange-100';
              }
              
              return (
                <tr key={item.inventoryID} className="hover:bg-coffee-50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-coffee-900">{item.name}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs text-coffee-500">{item.description || '-'}</p>
                  </td>
                  <td className="p-4 text-sm text-coffee-600">
                    <span className="bg-coffee-100 px-2 py-1 rounded text-xs">{getSupplierName(item.supplierID)}</span>
                  </td>
                  <td className="p-4 text-sm">
                    <div>
                      <span className={`font-bold ${status === 'out-of-stock' ? 'text-red-700' : status === 'low-stock' ? 'text-orange-700' : 'text-coffee-700'}`}>
                        {formatInventoryQuantity(item)}
                      </span>
                      {reorderPointValue > 0 && (
                        <p className="text-xs text-coffee-500 mt-1">Reorder: {reorderPointValue} {unit}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusColor} ${statusBg} px-2 py-1 rounded-full border ${statusBorder}`}>
                      {statusText}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAdjustModal(item)}
                        className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-2 rounded-lg transition-colors"
                        title="Edit/Adjust Stock"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteInventory(item)}
                        className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-2 rounded-lg transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {inventory.length === 0 && (
          <div className="text-center py-8">
            <Package className="mx-auto text-coffee-300 mb-2" size={32} />
            <p className="text-coffee-400 text-sm">No inventory items found</p>
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50 sticky top-0">
              <h3 className="font-bold text-lg text-coffee-900">Add Inventory Item</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Name *</label>
                <input 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none"
                  value={newInventory.name}
                  onChange={e => setNewInventory({...newInventory, name: e.target.value})}
                  placeholder="e.g., Milk, Sugar, Coffee Beans"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Description</label>
                <textarea 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  rows={2}
                  value={newInventory.description}
                  onChange={e => setNewInventory({...newInventory, description: e.target.value})}
                  placeholder="Optional description"
                />
              </div>
              
              <div className="border-t border-b border-coffee-100 py-3 my-2">
                <label className="block text-sm font-medium text-coffee-800 mb-1">Supplier *</label>
                <select 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none mb-2"
                  value={newInventory.supplierID}
                  onChange={e => setNewInventory({...newInventory, supplierID: e.target.value})}
                >
                  <option value="">Select Existing Supplier</option>
                  {suppliers.map(s => <option key={s.supplierID} value={s.supplierID}>{s.name}</option>)}
                  <option value="new" className="font-bold text-coffee-700 bg-coffee-50">+ Create New Supplier</option>
                </select>

                {/* Inline Supplier Creation */}
                {newInventory.supplierID === 'new' && (
                  <div className="bg-coffee-50 p-3 rounded-lg border border-coffee-200 space-y-3 animate-fade-in mt-2">
                    <p className="text-xs font-bold text-coffee-700 uppercase tracking-wide">New Supplier Details</p>
                    <div>
                      <input 
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-coffee-500 outline-none"
                        placeholder="Supplier Company Name"
                        value={newSupplierData.name}
                        onChange={e => setNewSupplierData({...newSupplierData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <input 
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-coffee-500 outline-none"
                        placeholder="Contact Info (Email/Phone)"
                        value={newSupplierData.contactInfo}
                        onChange={e => setNewSupplierData({...newSupplierData, contactInfo: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Information */}
              <div className="border-t border-coffee-100 pt-4 space-y-4">
                <h4 className="text-sm font-bold text-coffee-800 uppercase tracking-wide">Stock Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-coffee-800 mb-1">Initial Stock Quantity</label>
                    <input 
                      type="number"
                      min="0"
                      className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={initialStock}
                      onChange={e => setInitialStock(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-coffee-800 mb-1">Unit of Measurement</label>
                    <select 
                      className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={stockUnit}
                      onChange={e => setStockUnit(e.target.value)}
                    >
                      <option value="units">Units</option>
                      <option value="cups">Cups</option>
                      <option value="bags">Bags</option>
                      <option value="lbs">Lbs</option>
                      <option value="kg">Kg</option>
                      <option value="oz">Oz</option>
                      <option value="pieces">Pieces</option>
                      <option value="boxes">Boxes</option>
                      <option value="ml">Milliliters (ml)</option>
                      <option value="l">Liters (l)</option>
                      <option value="fl oz">Fluid Ounces (fl oz)</option>
                      <option value="tbsp">Tablespoons (tbsp)</option>
                      <option value="tsp">Teaspoons (tsp)</option>
                      <option value="g">Grams (g)</option>
                    </select>
                  </div>
                </div>
                
                {/* Base Unit and Conversion */}
                <div className="bg-coffee-50 p-4 rounded-lg border border-coffee-200 space-y-3">
                  <p className="text-xs font-bold text-coffee-700 uppercase tracking-wide">Unit Conversion (Optional)</p>
                  <p className="text-xs text-coffee-600">Use this if your inventory unit contains multiple base units (e.g., 1 bag = 100 pieces)</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-coffee-800 mb-1">Base Unit</label>
                      <select 
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
                        value={baseUnit}
                        onChange={e => setBaseUnit(e.target.value)}
                      >
                        <option value="">None (1:1 conversion)</option>
                        <option value="pieces">Pieces</option>
                        <option value="units">Units</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="g">Grams (g)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-coffee-800 mb-1">
                        {baseUnit ? `${baseUnit.charAt(0).toUpperCase() + baseUnit.slice(1)} per ${stockUnit}` : 'Conversion Factor'}
                      </label>
                      <input 
                        type="number"
                        min="1"
                        step="0.01"
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-coffee-500 outline-none"
                        value={piecesPerUnit}
                        onChange={e => setPiecesPerUnit(parseFloat(e.target.value) || 1)}
                        disabled={!baseUnit}
                        placeholder={baseUnit ? `e.g., 100` : 'N/A'}
                      />
                      {baseUnit && (
                        <p className="text-xs text-coffee-500 mt-1">1 {stockUnit} = {piecesPerUnit} {baseUnit}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-coffee-800 mb-1">Reorder Point (Low Stock Alert)</label>
                  <input 
                    type="number"
                    min="0"
                    className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                    value={reorderPoint}
                    onChange={e => setReorderPoint(parseFloat(e.target.value) || 0)}
                    placeholder="Alert when stock falls below this amount"
                  />
                  <p className="text-xs text-coffee-500 mt-1">System will alert when stock falls below this quantity</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-coffee-100 bg-coffee-50 flex justify-end gap-3 sticky bottom-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-coffee-600 hover:bg-coffee-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddInventory}
                className="px-4 py-2 rounded-lg bg-coffee-600 text-white hover:bg-coffee-700 transition-colors shadow-sm font-medium flex items-center gap-2"
              >
                <Save size={18} />
                Save Inventory Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustModalOpen && selectedInventory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50">
              <h3 className="font-bold text-lg text-coffee-900">Adjust Stock - {selectedInventory.name}</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-coffee-50 p-4 rounded-lg border border-coffee-200">
                <p className="text-sm text-coffee-600 mb-1">Current Stock</p>
                <p className="text-2xl font-bold text-coffee-900">
                  {formatInventoryQuantity(selectedInventory)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Adjustment Type</label>
                <select 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={adjustmentType}
                  onChange={e => setAdjustmentType(e.target.value as 'add' | 'remove' | 'set')}
                >
                  <option value="add">Add Stock (Receiving)</option>
                  <option value="remove">Remove Stock (Waste/Sold)</option>
                  <option value="set">Set Stock (Manual Adjustment)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">
                  {adjustmentType === 'add' ? 'Quantity to Add' : adjustmentType === 'remove' ? 'Quantity to Remove' : 'New Stock Quantity'}
                </label>
                <input 
                  type="number"
                  min="0"
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={adjustmentQuantity}
                  onChange={e => setAdjustmentQuantity(parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity"
                />
                {adjustmentType === 'set' && (
                  <p className="text-xs text-coffee-500 mt-1">
                    This will set the stock to exactly {adjustmentQuantity} {selectedInventory.unit || 'units'}
                  </p>
                )}
                {adjustmentType === 'add' && adjustmentQuantity > 0 && (
                  <p className="text-xs text-coffee-600 mt-1">
                    New stock will be: {Math.round(((selectedInventory.quantity || 0) + adjustmentQuantity) * 100) / 100} {selectedInventory.unit || 'units'}
                  </p>
                )}
                {adjustmentType === 'remove' && adjustmentQuantity > 0 && (
                  <p className="text-xs text-coffee-600 mt-1">
                    New stock will be: {Math.round(Math.max(0, (selectedInventory.quantity || 0) - adjustmentQuantity) * 100) / 100} {selectedInventory.unit || 'units'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Reason (Optional)</label>
                <input 
                  type="text"
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={adjustmentReason}
                  onChange={e => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Received shipment, Waste, Inventory count"
                />
              </div>
            </div>

            <div className="p-6 border-t border-coffee-100 bg-coffee-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 rounded-lg text-coffee-600 hover:bg-coffee-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleAdjustStock}
                disabled={adjustmentQuantity <= 0}
                className="px-4 py-2 rounded-lg bg-coffee-600 text-white hover:bg-coffee-700 transition-colors shadow-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
