// src/components/TaxonomyFilterBar.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { ChevronDown, X } from './Icons';

const TaxonomyFilterBar = ({ 
  selectedTaxonomies, 
  onTaxonomyChange,
  targetOrganizationType = null, // Filter to specific org types
  className = ''
}) => {
  const [taxonomyTree, setTaxonomyTree] = useState([]);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaxonomies();
  }, [targetOrganizationType]);

  const fetchTaxonomies = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('organization_taxonomies')
        .select('*')
        .eq('is_active', true)
        .order('level, sort_order');

      if (targetOrganizationType) {
        query = query.eq('organization_type', targetOrganizationType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Build hierarchical tree
      const tree = buildTaxonomyTree(data || []);
      setTaxonomyTree(tree);
    } catch (err) {
      console.error('Error fetching taxonomies:', err);
    } finally {
      setLoading(false);
    }
  };

  const buildTaxonomyTree = (taxonomies) => {
    const taxonomyMap = {};
    const roots = [];
    
    // First pass: create lookup map
    taxonomies.forEach(taxonomy => {
      taxonomyMap[taxonomy.code] = { ...taxonomy, children: [] };
    });
    
    // Second pass: build tree structure
    taxonomies.forEach(taxonomy => {
      if (taxonomy.parent_code && taxonomyMap[taxonomy.parent_code]) {
        taxonomyMap[taxonomy.parent_code].children.push(taxonomyMap[taxonomy.code]);
      } else {
        roots.push(taxonomyMap[taxonomy.code]);
      }
    });
    
    return roots;
  };

  const toggleNode = (nodeCode) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeCode)) {
        newSet.delete(nodeCode);
      } else {
        newSet.add(nodeCode);
      }
      return newSet;
    });
  };

  const handleTaxonomyToggle = (taxonomyCode) => {
    const isSelected = selectedTaxonomies.includes(taxonomyCode);
    if (isSelected) {
      onTaxonomyChange(selectedTaxonomies.filter(code => code !== taxonomyCode));
    } else {
      onTaxonomyChange([...selectedTaxonomies, taxonomyCode]);
    }
  };

  const renderTaxonomyNode = (node, depth = 0) => {
    const isExpanded = expandedNodes.has(node.code);
    const isSelected = selectedTaxonomies.includes(node.code);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.code} className={`ml-${depth * 4}`}>
        <div className="flex items-center gap-2 py-1">
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.code)}
              className="p-1 hover:bg-slate-100 rounded"
            >
              <ChevronDown 
                size={16} 
                className={`transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
          )}
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleTaxonomyToggle(node.code)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">{node.display_name}</span>
          </label>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTaxonomyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="animate-pulse bg-slate-200 h-32 rounded"></div>;
  }

  return (
    <div className={`bg-white border border-slate-200 rounded-lg p-4 ${className}`}>
      <h4 className="font-medium text-slate-800 mb-3">Organization Types</h4>
      <div className="max-h-64 overflow-y-auto space-y-1">
        {taxonomyTree.map(node => renderTaxonomyNode(node))}
      </div>
      
      {selectedTaxonomies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            {selectedTaxonomies.map(code => {
              const taxonomy = findTaxonomyByCode(taxonomyTree, code);
              return taxonomy ? (
                <span 
                  key={code}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {taxonomy.display_name}
                  <button
                    onClick={() => handleTaxonomyToggle(code)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const findTaxonomyByCode = (tree, code) => {
  for (const node of tree) {
    if (node.code === code) return node;
    if (node.children) {
      const found = findTaxonomyByCode(node.children, code);
      if (found) return found;
    }
  }
  return null;
};

export default TaxonomyFilterBar;