'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useProducts } from '../../hooks/use-products';
import { useInventoryStore } from '../../store/inventory-store';
import { Product, RecipeItem } from '../../types/product';
import { convertToBase64, validateImageFile } from '../../utils/image-utils';
import { Save, X, Plus, Upload, Image as ImageIcon, Coffee, Trash2, AlertCircle, Edit } from 'lucide-react';
import { convertToInventoryUnit, formatInventoryQuantity, areUnitsCompatible } from '../../utils/unit-converter';

export default function ProductsPage() {
  const { products, categories, addProduct, updateProduct, addCategory, deleteProduct, isProductAvailable, refetch } = useProducts();
  const { inventory, fetchInventory } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', description: '', price: 0, categoryID: ''
  });
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  
  // Edit Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Partial<Product>>({
    name: '', description: '', price: 0, categoryID: ''
  });
  const [editRecipe, setEditRecipe] = useState<RecipeItem[]>([]);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isEditDragging, setIsEditDragging] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // New Category State
  const [newCategoryData, setNewCategoryData] = useState({ name: '', description: '' });
  
  // Image Upload State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recipe Builder State
  const [selectedInventoryID, setSelectedInventoryID] = useState<string>('');
  const [recipeQuantity, setRecipeQuantity] = useState<number>(1);
  const [recipeUnit, setRecipeUnit] = useState<string>('units');
  
  // Edit Recipe Builder State
  const [editSelectedInventoryID, setEditSelectedInventoryID] = useState<string>('');
  const [editRecipeQuantity, setEditRecipeQuantity] = useState<number>(1);
  const [editRecipeUnit, setEditRecipeUnit] = useState<string>('units');

  // Initialize inventory on mount
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setImagePreview(base64);
      setNewProduct({ ...newProduct, image: base64 });
    } catch (error) {
      console.error('Error converting image:', error);
      alert('Failed to process image');
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Add recipe item
  const handleAddRecipeItem = () => {
    if (!selectedInventoryID || recipeQuantity <= 0) {
      alert('Please select an inventory item and enter a quantity');
      return;
    }

    // Check if already in recipe
    if (recipe.find(r => r.inventoryID === selectedInventoryID)) {
      alert('This inventory item is already in the recipe');
      return;
    }

    setRecipe([...recipe, { 
      inventoryID: selectedInventoryID, 
      quantity: recipeQuantity,
      unit: recipeUnit
    }]);
    setSelectedInventoryID('');
    setRecipeQuantity(1);
    setRecipeUnit('units');
  };

  // Remove recipe item
  const handleRemoveRecipeItem = (inventoryID: string) => {
    setRecipe(recipe.filter(r => r.inventoryID !== inventoryID));
  };

  // Handle add product
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.categoryID) {
      alert('Please fill in required fields');
      return;
    }

    let finalCategoryID = newProduct.categoryID;

    // Handle creation of new category if selected
    if (newProduct.categoryID === 'new') {
      if (!newCategoryData.name) {
        alert('Please enter the name for the new category.');
        return;
      }
      
      const newCategoryID = `cat_${Date.now()}`;
      await addCategory({
        categoryID: newCategoryID,
        name: newCategoryData.name,
        description: newCategoryData.description || ''
      });
      
      finalCategoryID = newCategoryID;
    }
    
    const product: Product = {
      productID: `p_${Date.now()}`,
      name: newProduct.name!,
      description: newProduct.description || '',
      price: Number(newProduct.price),
      categoryID: finalCategoryID!,
      recipe: recipe.length > 0 ? recipe : undefined,
      image: newProduct.image
    };

    await addProduct(product, recipe);
    setIsModalOpen(false);
    
    // Reset States
    setNewProduct({ name: '', description: '', price: 0, categoryID: '' });
    setNewCategoryData({ name: '', description: '' });
    setRecipe([]);
    setImagePreview(null);
    setSelectedInventoryID('');
    setRecipeQuantity(1);
    setRecipeUnit('units');
    
    refetch();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      categoryID: product.categoryID,
      image: product.image
    });
    setEditRecipe(product.recipe ? [...product.recipe] : []);
    setEditImagePreview(product.image || null);
    setIsEditModalOpen(true);
  };

  const handleEditFileSelect = async (file: File) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      const base64 = await convertToBase64(file);
      setEditImagePreview(base64);
      setEditProduct({ ...editProduct, image: base64 });
    } catch (error) {
      console.error('Error converting image:', error);
      alert('Failed to process image');
    }
  };

  const handleEditDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsEditDragging(true);
  };

  const handleEditDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsEditDragging(false);
  };

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsEditDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleEditFileSelect(file);
    }
  };

  const handleEditFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleEditFileSelect(file);
    }
  };

  const handleAddEditRecipeItem = () => {
    if (!editSelectedInventoryID || editRecipeQuantity <= 0) {
      alert('Please select an inventory item and enter a quantity');
      return;
    }

    // Check if already in recipe
    if (editRecipe.find(r => r.inventoryID === editSelectedInventoryID)) {
      alert('This inventory item is already in the recipe');
      return;
    }

    setEditRecipe([...editRecipe, { 
      inventoryID: editSelectedInventoryID, 
      quantity: editRecipeQuantity,
      unit: editRecipeUnit
    }]);
    setEditSelectedInventoryID('');
    setEditRecipeQuantity(1);
    setEditRecipeUnit('units');
  };

  const handleRemoveEditRecipeItem = (inventoryID: string) => {
    setEditRecipe(editRecipe.filter(r => r.inventoryID !== inventoryID));
  };

  const handleUpdateProduct = async () => {
    if (!editProduct.name || !editProduct.price || !editProduct.categoryID || !editingProduct) {
      alert('Please fill in required fields');
      return;
    }

    let finalCategoryID = editProduct.categoryID;

    // Handle creation of new category if selected
    if (editProduct.categoryID === 'new') {
      if (!newCategoryData.name) {
        alert('Please enter the name for the new category.');
        return;
      }
      
      const newCategoryID = `cat_${Date.now()}`;
      await addCategory({
        categoryID: newCategoryID,
        name: newCategoryData.name,
        description: newCategoryData.description || ''
      });
      
      finalCategoryID = newCategoryID;
    }
    
    const updatedProduct: Product = {
      ...editingProduct,
      name: editProduct.name!,
      description: editProduct.description || '',
      price: Number(editProduct.price),
      categoryID: finalCategoryID!,
      recipe: editRecipe.length > 0 ? editRecipe : undefined,
      image: editProduct.image
    };

    await updateProduct(updatedProduct, editRecipe);
    setIsEditModalOpen(false);
    
    // Reset States
    setEditingProduct(null);
    setEditProduct({ name: '', description: '', price: 0, categoryID: '' });
    setNewCategoryData({ name: '', description: '' });
    setEditRecipe([]);
    setEditImagePreview(null);
    setEditSelectedInventoryID('');
    setEditRecipeQuantity(1);
    setEditRecipeUnit('units');
    
    refetch();
  };

  const getInventoryItemName = (inventoryID: string) => {
    const item = inventory.find(i => i.inventoryID === inventoryID);
    return item?.name || 'Unknown';
  };

  const getInventoryItemUnit = (inventoryID: string) => {
    const item = inventory.find(i => i.inventoryID === inventoryID);
    return item?.unit || 'units';
  };

  const getInventoryItem = (inventoryID: string) => {
    return inventory.find(i => i.inventoryID === inventoryID);
  };

  const formatRecipeItem = (recipeItem: RecipeItem) => {
    const inventoryItem = getInventoryItem(recipeItem.inventoryID);
    if (!inventoryItem) {
      return `${recipeItem.quantity} ${recipeItem.unit || 'units'}`;
    }

    const recipeUnit = recipeItem.unit || 'units';
    const inventoryUnit = inventoryItem.unit || 'units';
    
    // If units are the same, just show the quantity
    if (recipeUnit.toLowerCase() === inventoryUnit.toLowerCase()) {
      return `${recipeItem.quantity} ${recipeUnit}`;
    }

    // If units are compatible, show conversion
    if (areUnitsCompatible(recipeUnit, inventoryUnit)) {
      const converted = convertToInventoryUnit(recipeItem.quantity, recipeUnit, inventoryItem);
      if (converted !== null) {
        const roundedConverted = Math.round(converted * 100) / 100;
        return `${recipeItem.quantity} ${recipeUnit} (${roundedConverted} ${inventoryUnit})`;
      }
    }

    return `${recipeItem.quantity} ${recipeUnit}`;
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await deleteProduct(product.productID);
        refetch();
      } catch (error) {
        alert('Failed to delete product. Please try again.');
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-coffee-900">Menu Products</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-coffee-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-coffee-50 border-b border-coffee-200 text-xs uppercase text-coffee-500 font-semibold tracking-wider">
              <th className="p-4">Image</th>
              <th className="p-4">Product Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Recipe</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-coffee-100">
            {products.map(product => {
              const catName = categories.find(c => c.categoryID === product.categoryID)?.name || 'Unknown';
              const available = isProductAvailable(product);
              const recipeCount = product.recipe?.length || 0;
              
              return (
                <tr key={product.productID} className="hover:bg-coffee-50 transition-colors">
                  <td className="p-4">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-coffee-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-coffee-100 rounded-lg flex items-center justify-center border border-coffee-200">
                        <ImageIcon size={24} className="text-coffee-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium text-coffee-900">{product.name}</p>
                      <p className="text-xs text-coffee-500">{product.description}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-coffee-600">
                    <span className="bg-coffee-100 px-2 py-1 rounded text-xs">{catName}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-coffee-700">${product.price.toFixed(2)}</td>
                  <td className="p-4 text-sm">
                    {recipeCount > 0 ? (
                      <div>
                        <span className="text-coffee-700 font-medium">{recipeCount} ingredient{recipeCount !== 1 ? 's' : ''}</span>
                        {product.recipe && (
                          <div className="mt-1 space-y-1">
                            {product.recipe.slice(0, 2).map((item, idx) => (
                              <p key={idx} className="text-xs text-coffee-500">
                                {getInventoryItemName(item.inventoryID)}: {formatRecipeItem(item)}
                              </p>
                            ))}
                            {product.recipe.length > 2 && (
                              <p className="text-xs text-coffee-400">+{product.recipe.length - 2} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-coffee-400 text-xs">No recipe</span>
                    )}
                  </td>
                  <td className="p-4">
                    {available ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-coffee-700 bg-coffee-100 px-2 py-1 rounded-full border border-coffee-200">
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-1 rounded-full border border-red-100">
                        <AlertCircle size={12} />
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-2 rounded-lg transition-colors"
                        title="Edit Product"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-2 rounded-lg transition-colors"
                        title="Delete Product"
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
        {products.length === 0 && (
          <div className="text-center py-8">
            <Coffee className="mx-auto text-coffee-300 mb-2" size={32} />
            <p className="text-coffee-400 text-sm">No products found</p>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50 sticky top-0">
              <h3 className="font-bold text-lg text-coffee-900">Add New Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-coffee-400 hover:text-coffee-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Name</label>
                <input 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="e.g., Latte, Americano"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Price</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Category</label>
                <select 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={newProduct.categoryID}
                  onChange={e => setNewProduct({...newProduct, categoryID: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.categoryID} value={c.categoryID}>{c.name}</option>)}
                  <option value="new" className="font-bold text-coffee-700 bg-coffee-50">+ Create New Category</option>
                </select>

                {/* Inline Category Creation */}
                {newProduct.categoryID === 'new' && (
                  <div className="bg-coffee-50 p-3 rounded-lg border border-coffee-200 space-y-3 animate-fade-in mt-2">
                    <p className="text-xs font-bold text-coffee-700 uppercase tracking-wide">New Category Details</p>
                    <div>
                      <input 
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-coffee-500 outline-none"
                        placeholder="Category Name (e.g., Hot Beverages, Pastries)"
                        value={newCategoryData.name}
                        onChange={e => setNewCategoryData({...newCategoryData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <input 
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-coffee-500 outline-none"
                        placeholder="Description (optional)"
                        value={newCategoryData.description}
                        onChange={e => setNewCategoryData({...newCategoryData, description: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Description</label>
                <textarea 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  rows={3}
                  value={newProduct.description}
                  onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>

              {/* Recipe Builder */}
              <div className="border-t border-coffee-100 pt-4 space-y-4">
                <h4 className="text-sm font-bold text-coffee-800 uppercase tracking-wide">Recipe (Ingredients Required)</h4>
                <p className="text-xs text-coffee-500">Add inventory items needed to make this product. Specify the quantity and unit of measurement. When sold, inventory will be automatically consumed.</p>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={selectedInventoryID}
                      onChange={e => {
                        setSelectedInventoryID(e.target.value);
                        // Auto-set unit based on inventory item if available
                        if (e.target.value) {
                          const inv = inventory.find(i => i.inventoryID === e.target.value);
                          if (inv?.unit) {
                            setRecipeUnit(inv.unit);
                          }
                        }
                      }}
                    >
                      <option value="">Select Inventory Item</option>
                      {inventory.map(inv => (
                        <option key={inv.inventoryID} value={inv.inventoryID}>
                          {inv.name} ({formatInventoryQuantity(inv)} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-32 border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={recipeQuantity}
                      onChange={e => setRecipeQuantity(parseFloat(e.target.value) || 0)}
                      placeholder="Quantity"
                    />
                    <select 
                      className="flex-1 border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={recipeUnit}
                      onChange={e => setRecipeUnit(e.target.value)}
                    >
                      <optgroup label="Liquid">
                        <option value="ml">Milliliters (ml)</option>
                        <option value="l">Liters (l)</option>
                        <option value="fl oz">Fluid Ounces (fl oz)</option>
                        <option value="cups">Cups</option>
                        <option value="tbsp">Tablespoons (tbsp)</option>
                        <option value="tsp">Teaspoons (tsp)</option>
                        <option value="oz">Ounces (oz)</option>
                      </optgroup>
                      <optgroup label="Weight">
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="oz">Ounces (oz)</option>
                        <option value="lbs">Pounds (lbs)</option>
                      </optgroup>
                      <optgroup label="Volume (Dry)">
                        <option value="cups">Cups</option>
                        <option value="tbsp">Tablespoons (tbsp)</option>
                        <option value="tsp">Teaspoons (tsp)</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="units">Units</option>
                        <option value="pieces">Pieces</option>
                        <option value="bags">Bags</option>
                        <option value="boxes">Boxes</option>
                        <option value="scoops">Scoops</option>
                        <option value="shots">Shots</option>
                      </optgroup>
                    </select>
                    <button
                      onClick={handleAddRecipeItem}
                      className="bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                </div>

                {recipe.length > 0 && (
                  <div className="bg-coffee-50 rounded-lg p-4 border border-coffee-200">
                    <p className="text-xs font-bold text-coffee-700 uppercase tracking-wide mb-2">Recipe Items</p>
                    <div className="space-y-2">
                      {recipe.map((item, idx) => {
                        const invItem = getInventoryItem(item.inventoryID);
                        return (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-coffee-200">
                          <div>
                            <span className="text-sm text-coffee-700">
                              {getInventoryItemName(item.inventoryID)}: {formatRecipeItem(item)}
                            </span>
                            {invItem && (
                              <p className="text-xs text-coffee-500 mt-0.5">
                                Available: {formatInventoryQuantity(invItem)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveRecipeItem(item.inventoryID)}
                            className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-1 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">Product Image</label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging 
                      ? 'border-coffee-500 bg-coffee-50' 
                      : 'border-coffee-300 hover:border-coffee-400'
                  }`}
                >
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg border border-coffee-200"
                      />
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setNewProduct({ ...newProduct, image: undefined });
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove Image
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-sm text-coffee-600 hover:text-coffee-700"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <Upload className="text-coffee-400" size={32} />
                      </div>
                      <div>
                        <p className="text-sm text-coffee-600 mb-1">
                          Drag and drop an image here, or{' '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-coffee-600 hover:text-coffee-700 font-medium underline"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-coffee-400">Supports: JPG, PNG, GIF (Max 5MB)</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
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
                onClick={handleAddProduct}
                className="px-4 py-2 rounded-lg bg-coffee-600 text-white hover:bg-coffee-700 transition-colors shadow-sm font-medium flex items-center gap-2"
              >
                <Save size={18} />
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-coffee-100 flex justify-between items-center bg-coffee-50 sticky top-0">
              <h3 className="font-bold text-lg text-coffee-900">Edit Product</h3>
              <button onClick={() => {
                setIsEditModalOpen(false);
                setEditingProduct(null);
                setEditProduct({ name: '', description: '', price: 0, categoryID: '' });
                setEditRecipe([]);
                setEditImagePreview(null);
                setNewCategoryData({ name: '', description: '' });
              }} className="text-coffee-400 hover:text-coffee-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Name</label>
                <input 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 focus:border-coffee-500 outline-none"
                  value={editProduct.name}
                  onChange={e => setEditProduct({...editProduct, name: e.target.value})}
                  placeholder="e.g., Latte, Americano"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Price</label>
                <input 
                  type="number"
                  step="0.01"
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={editProduct.price}
                  onChange={e => setEditProduct({...editProduct, price: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Category</label>
                <select 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  value={editProduct.categoryID}
                  onChange={e => setEditProduct({...editProduct, categoryID: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.categoryID} value={c.categoryID}>{c.name}</option>)}
                  <option value="new" className="font-bold text-coffee-700 bg-coffee-50">+ Create New Category</option>
                </select>

                {/* Inline Category Creation */}
                {editProduct.categoryID === 'new' && (
                  <div className="bg-coffee-50 p-3 rounded-lg border border-coffee-200 space-y-3 animate-fade-in mt-2">
                    <p className="text-xs font-bold text-coffee-700 uppercase tracking-wide">New Category Details</p>
                    <div>
                      <input 
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-coffee-500 outline-none"
                        placeholder="Category Name (e.g., Hot Beverages, Pastries)"
                        value={newCategoryData.name}
                        onChange={e => setNewCategoryData({...newCategoryData, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <input 
                        className="w-full border border-coffee-300 rounded-lg p-2 text-sm focus:ring-1 focus:ring-coffee-500 outline-none"
                        placeholder="Description (optional)"
                        value={newCategoryData.description}
                        onChange={e => setNewCategoryData({...newCategoryData, description: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-1">Description</label>
                <textarea 
                  className="w-full border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                  rows={3}
                  value={editProduct.description}
                  onChange={e => setEditProduct({...editProduct, description: e.target.value})}
                />
              </div>

              {/* Recipe Builder */}
              <div className="border-t border-coffee-100 pt-4 space-y-4">
                <h4 className="text-sm font-bold text-coffee-800 uppercase tracking-wide">Recipe (Ingredients Required)</h4>
                <p className="text-xs text-coffee-500">Add inventory items needed to make this product. Specify the quantity and unit of measurement. When sold, inventory will be automatically consumed.</p>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={editSelectedInventoryID}
                      onChange={e => {
                        setEditSelectedInventoryID(e.target.value);
                        // Auto-set unit based on inventory item if available
                        if (e.target.value) {
                          const inv = inventory.find(i => i.inventoryID === e.target.value);
                          if (inv?.unit) {
                            setEditRecipeUnit(inv.unit);
                          }
                        }
                      }}
                    >
                      <option value="">Select Inventory Item</option>
                      {inventory.map(inv => (
                        <option key={inv.inventoryID} value={inv.inventoryID}>
                          {inv.name} ({formatInventoryQuantity(inv)} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="w-32 border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={editRecipeQuantity}
                      onChange={e => setEditRecipeQuantity(parseFloat(e.target.value) || 0)}
                      placeholder="Quantity"
                    />
                    <select 
                      className="flex-1 border border-coffee-300 rounded-lg p-2 focus:ring-2 focus:ring-coffee-500 outline-none"
                      value={editRecipeUnit}
                      onChange={e => setEditRecipeUnit(e.target.value)}
                    >
                      <optgroup label="Liquid">
                        <option value="ml">Milliliters (ml)</option>
                        <option value="l">Liters (l)</option>
                        <option value="fl oz">Fluid Ounces (fl oz)</option>
                        <option value="cups">Cups</option>
                        <option value="tbsp">Tablespoons (tbsp)</option>
                        <option value="tsp">Teaspoons (tsp)</option>
                        <option value="oz">Ounces (oz)</option>
                      </optgroup>
                      <optgroup label="Weight">
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="oz">Ounces (oz)</option>
                        <option value="lbs">Pounds (lbs)</option>
                      </optgroup>
                      <optgroup label="Volume (Dry)">
                        <option value="cups">Cups</option>
                        <option value="tbsp">Tablespoons (tbsp)</option>
                        <option value="tsp">Teaspoons (tsp)</option>
                      </optgroup>
                      <optgroup label="Other">
                        <option value="units">Units</option>
                        <option value="pieces">Pieces</option>
                        <option value="bags">Bags</option>
                        <option value="boxes">Boxes</option>
                        <option value="scoops">Scoops</option>
                        <option value="shots">Shots</option>
                      </optgroup>
                    </select>
                    <button
                      onClick={handleAddEditRecipeItem}
                      className="bg-coffee-600 hover:bg-coffee-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                </div>

                {editRecipe.length > 0 && (
                  <div className="bg-coffee-50 rounded-lg p-4 border border-coffee-200">
                    <p className="text-xs font-bold text-coffee-700 uppercase tracking-wide mb-2">Recipe Items</p>
                    <div className="space-y-2">
                      {editRecipe.map((item, idx) => {
                        const invItem = getInventoryItem(item.inventoryID);
                        return (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-coffee-200">
                          <div>
                            <span className="text-sm text-coffee-700">
                              {getInventoryItemName(item.inventoryID)}: {formatRecipeItem(item)}
                            </span>
                            {invItem && (
                              <p className="text-xs text-coffee-500 mt-0.5">
                                Available: {formatInventoryQuantity(invItem)}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveEditRecipeItem(item.inventoryID)}
                            className="text-coffee-600 hover:text-coffee-800 hover:bg-coffee-100 p-1 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-coffee-800 mb-2">Product Image</label>
                <div
                  onDragOver={handleEditDragOver}
                  onDragLeave={handleEditDragLeave}
                  onDrop={handleEditDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isEditDragging 
                      ? 'border-coffee-500 bg-coffee-50' 
                      : 'border-coffee-300 hover:border-coffee-400'
                  }`}
                >
                  {editImagePreview ? (
                    <div className="space-y-3">
                      <img 
                        src={editImagePreview} 
                        alt="Preview" 
                        className="max-h-48 mx-auto rounded-lg border border-coffee-200"
                      />
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditImagePreview(null);
                            setEditProduct({ ...editProduct, image: undefined });
                            if (editFileInputRef.current) editFileInputRef.current.value = '';
                          }}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Remove Image
                        </button>
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="text-sm text-coffee-600 hover:text-coffee-700"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center">
                        <Upload className="text-coffee-400" size={32} />
                      </div>
                      <div>
                        <p className="text-sm text-coffee-600 mb-1">
                          Drag and drop an image here, or{' '}
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="text-coffee-600 hover:text-coffee-700 font-medium underline"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-coffee-400">Supports: JPG, PNG, GIF (Max 5MB)</p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileInputChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-coffee-100 bg-coffee-50 flex justify-end gap-3 sticky bottom-0">
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                  setEditProduct({ name: '', description: '', price: 0, categoryID: '' });
                  setEditRecipe([]);
                  setEditImagePreview(null);
                  setNewCategoryData({ name: '', description: '' });
                }}
                className="px-4 py-2 rounded-lg text-coffee-600 hover:bg-coffee-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProduct}
                className="px-4 py-2 rounded-lg bg-coffee-600 text-white hover:bg-coffee-700 transition-colors shadow-sm font-medium flex items-center gap-2"
              >
                <Save size={18} />
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
