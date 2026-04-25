import React from 'react';
import { Card } from './index';

/**
 * ResponsiveTable component
 * @param {Array} columns - Array of { key, label, render }
 * @param {Array} data - Array of objects
 * @param {Function} renderActions - Function(item) to render actions
 * @param {string} mobileLabelField - The key to use as the card title on mobile
 */
const ResponsiveTable = ({ 
  columns, 
  data, 
  renderActions,
  mobileLabelField,
  emptyMessage = "No data available."
}) => {
  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 transition-colors">
              {columns.map(col => (
                <th key={col.key} className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40">
                  {col.label}
                </th>
              ))}
              {renderActions && (
                <th className="py-5 px-6 text-[10px] font-black uppercase tracking-widest text-navy/40 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                {columns.map(col => (
                  <td key={col.key} className="py-4 px-6">
                    {col.render ? col.render(item[col.key], item) : (
                      <span className="text-sm font-bold text-navy">{item[col.key]}</span>
                    )}
                  </td>
                ))}
                {renderActions && (
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-3">
                      {renderActions(item)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="py-12 text-center text-sm font-bold text-navy/40">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View (Cards) */}
      <div className="md:hidden space-y-4 px-4 pb-4">
        {data.map((item, idx) => (
          <Card key={item.id || idx} className="p-5 border-gray-100 bg-white shadow-xl space-y-4">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest mb-1">
                    {columns[0].label}
                  </p>
                  <h4 className="text-lg font-black text-navy">
                    {item[mobileLabelField || columns[0].key]}
                  </h4>
               </div>
               {renderActions && (
                 <div className="flex gap-2">
                   {renderActions(item)}
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              {columns.slice(1).map(col => (
                <div key={col.key} className="space-y-1">
                  <p className="text-[9px] font-black text-navy/30 uppercase tracking-widest">{col.label}</p>
                  <div className="text-sm font-bold text-navy">
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
        {data.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
             <p className="text-sm font-bold text-navy/40">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponsiveTable;
