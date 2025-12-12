'use client';

import React, { useState } from 'react';
import { useSuppliers } from '../../hooks/use-suppliers';
import { useProducts } from '../../hooks/use-products';
import { Supplier } from '../../types/supplier';
import { User, Mail, Phone, Plus, X, Box, Edit, Trash2 } from 'lucide-react';

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, refetch: refetchSuppliers } = useSuppliers();
  const { products } = useProducts();
  
  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewProductsSupplierId, setViewProductsSupplierId] = useState<string | null>(null);
  
  // Add Form State
  const [newSupplier, setNewSupplier] = useState({ name: '', contactInfo: '' });
  
  // Edit Form State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editSupplier, setEditSupplier] = useState({ name: '', contactInfo: '' });

  const handleAddSupplier = async () => {
    if (!newSupplier.name) return;
    const supplier: Supplier = {
      supplierID: `s_${Date.now()}`,
      name: newSupplier.name,
      contactInfo: newSupplier.contactInfo
    };
    await addSupplier(supplier);
    setNewSupplier({ name: '', contactInfo: '' });
    setIsAddModalOpen(false);
    refetchSuppliers();
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditSupplier({ name: supplier.name, contactInfo: supplier.contactInfo });
    setIsEditModalOpen(true);
  };

  const handleUpdateSupplier = async () => {
    if (!editSupplier.name || !editingSupplier) return;
    const updatedSupplier: Supplier = {
      ...editingSupplier,
      name: editSupplier.name,
      contactInfo: editSupplier.contactInfo
    };
    await updateSupplier(updatedSupplier);
    setEditingSupplier(null);
    setEditSupplier({ name: '', contactInfo: '' });
    setIsEditModalOpen(false);
    refetchSuppliers();
  };

  const getSupplierProducts = (id: string) => products.filter(p => p.supplierID === id);

  const handleDeleteSupplier = async (supplier: Supplier) => {
    const productsCount = getSupplierProducts(supplier.supplierID).length;
    if (productsCount > 0) {
      alert(`Cannot delete supplier "${supplier.name}" because it has ${productsCount} associated product(s). Please remove or reassign the products first.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${supplier.name}"? This action cannot be undone.`)) {
      try {
        await deleteSupplier(supplier.supplierID);
        refetchSuppliers();
      } catch (error) {
        alert('Failed to delete supplier. Please try again.');
        console.error('Error deleting supplier:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-coffee-900">Suppliers</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-coffee-50 border-b border-coffee-100">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-coffee-900">Supplier</th>
              <th className="p-4 text-left text-sm font-semibold text-coffee-900">Contact Info</th>
              <th className="p-4 text-left text-sm font-semibold text-coffee-900">ID</th>
              <th className="p-4 text-right text-sm font-semibold text-coffee-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-100">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center">
                  <User className="mx-auto text-coffee-300 mb-2" size={32} />
                  <p className="text-coffee-400 text-sm">No suppliers found</p>
                </td>
              </tr>
            ) : (
              suppliers.map(supplier => (
                <tr key={supplier.supplierID} className="hover:bg-coffee-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-coffee-100 flex items-center justify-center text-coffee-600">
                        <User size={20} />
                      </div>
                      <span className="font-medium text-coffee-900">{supplier.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-coffee-700">
                      <Mail size={16} className="text-coffee-400" />
                      <span>{supplier.contactInfo}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-coffee-500 uppercase tracking-wide">{supplier.supplierID}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setViewProductsSupplierId(supplier.supplierID)}
                        className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-2 rounded-lg transition-colors"
                        title="View Products"
                      >
                        <Box size={18} />
                      </button>
                      <button
                        onClick={() => handleEditSupplier(supplier)}
                        className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-2 rounded-lg transition-colors"
                        title="Edit Supplier"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier)}
                        className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-2 rounded-lg transition-colors"
                        title="Delete Supplier"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
             <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50">
               <h3 className="font-bold text-lg text-coffee-900">Add New Supplier</h3>
               <button onClick={() => setIsAddModalOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                 <X size={20} />
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-coffee-800 mb-1">Company Name</label>
                 <input 
                   className="w-full border border-coffee-200 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                   value={newSupplier.name}
                   onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                   placeholder="e.g. Bean Brothers Co."
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-coffee-800 mb-1">Contact Info</label>
                 <input 
                   className="w-full border border-coffee-200 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                   value={newSupplier.contactInfo}
                   onChange={e => setNewSupplier({...newSupplier, contactInfo: e.target.value})}
                   placeholder="Email or Phone"
                 />
               </div>
             </div>
             <div className="p-6 border-t border-coffee-100 bg-coffee-50 flex justify-end gap-3">
               <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-coffee-600 hover:bg-coffee-100 rounded-lg">Cancel</button>
               <button onClick={handleAddSupplier} className="px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700">Save Supplier</button>
             </div>
           </div>
        </div>
      )}

      {/* Edit Supplier Modal */}
      {isEditModalOpen && editingSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
             <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50">
               <h3 className="font-bold text-lg text-coffee-900">Edit Supplier</h3>
               <button onClick={() => {
                 setIsEditModalOpen(false);
                 setEditingSupplier(null);
                 setEditSupplier({ name: '', contactInfo: '' });
               }} className="text-coffee-400 hover:text-coffee-600">
                 <X size={20} />
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-coffee-800 mb-1">Company Name</label>
                 <input 
                   className="w-full border border-coffee-200 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                   value={editSupplier.name}
                   onChange={e => setEditSupplier({...editSupplier, name: e.target.value})}
                   placeholder="e.g. Bean Brothers Co."
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-coffee-800 mb-1">Contact Info</label>
                 <input 
                   className="w-full border border-coffee-200 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                   value={editSupplier.contactInfo}
                   onChange={e => setEditSupplier({...editSupplier, contactInfo: e.target.value})}
                   placeholder="Email or Phone"
                 />
               </div>
             </div>
             <div className="p-6 border-t border-coffee-100 bg-coffee-50 flex justify-end gap-3">
               <button onClick={() => {
                 setIsEditModalOpen(false);
                 setEditingSupplier(null);
                 setEditSupplier({ name: '', contactInfo: '' });
               }} className="px-4 py-2 text-coffee-600 hover:bg-coffee-100 rounded-lg">Cancel</button>
               <button onClick={handleUpdateSupplier} className="px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700">Update Supplier</button>
             </div>
           </div>
        </div>
      )}

      {/* View Products Modal */}
      {viewProductsSupplierId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in flex flex-col max-h-[80vh]">
             <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50">
               <h3 className="font-bold text-lg text-coffee-900">
                 Products by {suppliers.find(s => s.supplierID === viewProductsSupplierId)?.name}
               </h3>
               <button onClick={() => setViewProductsSupplierId(null)} className="text-coffee-400 hover:text-coffee-600">
                 <X size={20} />
               </button>
             </div>
             <div className="p-6 overflow-y-auto">
                {getSupplierProducts(viewProductsSupplierId).length > 0 ? (
                  <ul className="space-y-3">
                    {getSupplierProducts(viewProductsSupplierId).map(p => (
                      <li key={p.productID} className="flex items-center gap-3 p-3 bg-coffee-50 rounded-lg border border-coffee-100">
                        <div className="p-2 bg-white rounded-full text-coffee-500"><Box size={20}/></div>
                        <div>
                          <p className="font-medium text-coffee-900">{p.name}</p>
                          <p className="text-xs text-coffee-500">Price: ${p.price.toFixed(2)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <Box className="mx-auto text-coffee-300 mb-2" size={32} />
                    <p className="text-coffee-400 text-sm">No products linked to this supplier</p>
                  </div>
                )}
             </div>
             <div className="p-4 border-t border-coffee-100 bg-coffee-50 flex justify-end">
               <button onClick={() => setViewProductsSupplierId(null)} className="px-4 py-2 bg-coffee-600 text-white rounded-lg hover:bg-coffee-700">Close</button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}

