import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBeverages, createBeverage, updateBeverage, deleteBeverage } from '../api/client';
import Modal from './Modal';

function BeverageModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', quantity: 0, pricePerUnit: 0 });

  const { data: beverages, isLoading } = useQuery({
    queryKey: ['beverages'],
    queryFn: getBeverages,
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: createBeverage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beverages'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => updateBeverage(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beverages'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBeverage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beverages'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', quantity: 0, pricePerUnit: 0 });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (beverage) => {
    setFormData({
      name: beverage.name,
      quantity: beverage.quantity,
      pricePerUnit: beverage.pricePerUnit,
    });
    setEditingId(beverage.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this beverage?')) {
      deleteMutation.mutate(id);
    }
  };

  const totalItems = beverages?.reduce((sum, b) => sum + b.quantity, 0) || 0;
  const totalValue = beverages?.reduce((sum, b) => sum + (b.quantity * b.pricePerUnit), 0) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fridge Inventory">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg">
          <div>
            <div className="text-sm font-medium text-red-300">Total Items</div>
            <div className="text-3xl font-bold text-white">{totalItems}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-red-300">Total Value</div>
            <div className="text-3xl font-bold text-white">€{totalValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-gray-900/50 rounded-lg">
            <h3 className="text-white font-semibold">
              {editingId ? 'Edit Beverage' : 'Add New Beverage'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Coca-Cola"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Price/Unit (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerUnit}
                  onChange={(e) => setFormData({ ...formData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
          >
            + Add Beverage
          </button>
        )}

        {/* Beverage List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : beverages?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No beverages in inventory. Add one to get started!
            </div>
          ) : (
            beverages?.map((beverage) => (
              <div
                key={beverage.id}
                className="flex items-center justify-between p-4 bg-gray-800/80 border border-gray-700/50 rounded-lg hover:bg-gray-800 hover:border-red-500/50 transition-all"
              >
                <div className="flex-1">
                  <div className="font-bold text-lg text-white">{beverage.name}</div>
                  <div className="text-sm font-medium text-gray-200 mt-1">
                    <span className="text-red-400">{beverage.quantity}</span> units · <span className="text-green-400">€{beverage.pricePerUnit.toFixed(2)}</span>/unit
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(beverage)}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(beverage.id)}
                    disabled={deleteMutation.isPending}
                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

export default BeverageModal;
