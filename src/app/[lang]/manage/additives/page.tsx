'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import ConfirmModal from '@/components/ConfirmModal';
import { getDictionary } from '@/lib/get-dictionary';

interface FoodAdditive {
  name: string;
  category: string;
  weight: number;
  regex: string;
}

export default function ManageAdditives() {
  // Hooks
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || 'pt';

  // State
  const [additives, setAdditives] = useState<FoodAdditive[]>([]);
  const [loading, setLoading] = useState(true);
  const [dict, setDict] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; order: 'asc' | 'desc' }>({
    key: 'name',
    order: 'asc'
  });
  const [formData, setFormData] = useState<FoodAdditive>({
    name: '',
    category: '',
    weight: 0,
    regex: '',
  });

  // Derived values
  const t = dict?.pages?.additives || {};

  // Sort handler
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort additives based on sortConfig
  const sortedAdditives = [...additives].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof FoodAdditive];
    const bValue = b[sortConfig.key as keyof FoodAdditive];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.order === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Render sort icon
  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig.key !== column) return <span className="ml-1 opacity-30 text-[10px]">↕</span>;
    return sortConfig.order === 'asc' 
      ? <span className="ml-1 text-primary text-[10px]">▲</span> 
      : <span className="ml-1 text-primary text-[10px]">▼</span>;
  };

  // Effects
  useEffect(() => {
    async function init() {
      try {
        const dictionary = await getDictionary(lang as 'pt' | 'en');
        setDict(dictionary);
        await fetchAdditives();
      } catch (error) {
        console.error('Init error:', error);
        toast.error(t.initError || 'Failed to initialize page');
      }
    }
    init();
  }, [lang]);

  // Data fetching
  async function fetchAdditives() {
    try {
      setLoading(true);
      const res = await fetch('/api/additives');
      if (!res.ok) throw new Error(t.fetchError || 'Failed to fetch additives');
      const data = await res.json();
      setAdditives(data);
    } catch (error) {
      console.error('Error fetching additives:', error);
      toast.error(t.loadError || 'Failed to load additives');
    } finally {
      setLoading(false);
    }
  }

  // Event handlers
  const handleAdd = () => {
    setIsAdding(true);
    setIsEditing(null);
    setFormData({
      name: '',
      category: '',
      weight: 0,
      regex: '',
    });
  };

  const handleEdit = (additive: FoodAdditive) => {
    setIsEditing(additive.name);
    setIsAdding(false);
    setFormData({
      name: additive.name,
      category: additive.category,
      weight: additive.weight,
      regex: additive.regex,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({
      name: '',
      category: '',
      weight: 0,
      regex: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitPromise = async () => {
      if (isAdding) {
        // Create new additive
        const res = await fetch('/api/additives', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || t.createError || 'Failed to create additive');
        }
        await fetchAdditives();
        setIsAdding(false);
        return t.createSuccess || 'Additive created successfully!';
      } else if (isEditing) {
        // Update existing additive
        const res = await fetch(`/api/additives/${encodeURIComponent(isEditing)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formData.category,
            weight: formData.weight,
            regex: formData.regex,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || t.updateError || 'Failed to update additive');
        }
        await fetchAdditives();
        setIsEditing(null);
        return t.updateSuccess || 'Additive updated successfully!';
      }
    };

    toast.promise(submitPromise(), {
      loading: isAdding 
        ? (t.createLoading || 'Creating additive...')
        : (t.updateLoading || 'Updating additive...'),
      success: (message) => {
        setFormData({
          name: '',
          category: '',
          weight: 0,
          regex: '',
        });
        return message;
      },
      error: (err) => err.message,
    });
  };

  const confirmDeletion = (name: string) => {
    setItemToDelete(name);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const deletePromise = async () => {
      const res = await fetch(`/api/additives/${encodeURIComponent(itemToDelete)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || t.deleteError || 'Failed to delete additive');
      }
      setAdditives(prev => prev.filter(a => a.name !== itemToDelete));
      return res;
    };

    toast.promise(deletePromise(), {
      loading: t.deleteLoading || 'Deleting additive...',
      success: () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
        return t.deleteSuccess || 'Additive deleted successfully!';
      },
      error: (err) => {
        setShowDeleteModal(false);
        return `${t.deleteError || 'Failed to delete'}: ${err.message}`;
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-text-main/60 hover:text-text-main mb-2 text-sm"
          >
            ← {t.back || 'Back'}
          </button>
          <h1 className="text-2xl font-bold text-text-main">
            {t.title || 'Manage Food Additives'}
          </h1>
        </div>
        {!isAdding && !isEditing && (
          <button
            onClick={handleAdd}
            className="bg-primary text-white px-4 py-2 rounded-theme text-sm hover:opacity-90 transition"
          >
            + {t.addNew || 'Add New'}
          </button>
        )}
      </div>

      {/* Form Section */}
      {(isAdding || isEditing) && (
        <div className="bg-card shadow rounded-theme p-6 mb-6">
          <h2 className="text-xl font-semibold text-text-main mb-4">
            {isAdding ? (t.addNewAdditive || 'Add New Additive') : (t.edit || 'Edit Additive')}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-main/70 mb-1">
                {t.name || 'Name'} {isEditing && `(${t.readOnly || 'read-only'})`}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isEditing !== null}
                required
                className="w-full px-4 py-2 border border-text-main/20 rounded-theme bg-background text-text-main disabled:bg-text-main/5 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main/70 mb-1">
                {t.category || 'Category'}
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-2 border border-text-main/20 rounded-theme bg-background text-text-main"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main/70 mb-1">
                {t.weight || 'Weight'}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-2 border border-text-main/20 rounded-theme bg-background text-text-main"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main/70 mb-1">
                {t.regex || 'Regex Pattern'}
              </label>
              <input
                type="text"
                value={formData.regex}
                onChange={(e) => setFormData({ ...formData, regex: e.target.value })}
                required
                placeholder={t.regexPlaceholder || "e.g., E\\d{3}|sodium benzoate"}
                className="w-full px-4 py-2 border border-text-main/20 rounded-theme bg-background text-text-main"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-theme hover:opacity-90 transition"
              >
                {isAdding ? (t.create || 'Create') : (t.update || 'Update')}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-text-main/10 text-text-main px-6 py-2 rounded-theme hover:bg-text-main/20 transition"
              >
                {t.cancel || 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-card shadow rounded-theme overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-text-main/5 border-b border-text-main/10">
            <tr>
              <th 
                className="px-6 py-3 text-text-main/70 font-bold cursor-pointer hover:bg-text-main/5 transition" 
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  {t.name || 'Name'}
                  <SortIcon column="name" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-text-main/70 font-bold cursor-pointer hover:bg-text-main/5 transition" 
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  {t.category || 'Category'}
                  <SortIcon column="category" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-text-main/70 font-bold cursor-pointer hover:bg-text-main/5 transition" 
                onClick={() => handleSort('weight')}
              >
                <div className="flex items-center">
                  {t.weight || 'Weight'}
                  <SortIcon column="weight" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-text-main/70 font-bold cursor-pointer hover:bg-text-main/5 transition" 
                onClick={() => handleSort('regex')}
              >
                <div className="flex items-center">
                  {t.regex || 'Regex'}
                  <SortIcon column="regex" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-text-main/70 font-bold">{t.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-text-main/10">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : sortedAdditives.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-text-main/60">
                  {t.noAdditives || 'No additives found. Click "Add New" to create one.'}
                </td>
              </tr>
            ) : (
              sortedAdditives.map((additive) => (
                <tr key={additive.name} className="hover:bg-text-main/5 transition-colors bg-card">
                  <td className="px-6 py-4 font-medium text-text-main">{additive.name}</td>
                  <td className="px-6 py-4 text-text-main/70">{additive.category}</td>
                  <td className="px-6 py-4 text-text-main/70">{additive.weight}</td>
                  <td className="px-6 py-4 text-text-main/70 font-mono text-sm">
                    {additive.regex}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => handleEdit(additive)}
                        disabled={isAdding || isEditing !== null}
                        className="text-primary hover:opacity-80 hover:underline font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.edit || 'Edit'}
                      </button>
                      <button
                        onClick={() => confirmDeletion(additive.name)}
                        disabled={isAdding || isEditing !== null}
                        className="text-red-500/70 hover:text-red-600 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t.delete || 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title={t.confirmDeleteTitle || 'Delete Additive'}
        message={(t.confirmDeleteMessage || `Are you sure you want to delete "{name}"? This action cannot be undone.`).replace('{name}', itemToDelete || '')}
        variant="danger"
        confirmLabel={t.delete || 'Delete'}
        dict={dict}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </div>
  );
}


