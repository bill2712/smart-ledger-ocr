import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (index: number) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onDelete }) => {
  if (transactions.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white mt-8">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">日期 (Date)</th>
              <th className="px-6 py-4 font-medium">類型 (Type)</th>
              <th className="px-6 py-4 font-medium">說明 (Description)</th>
              <th className="px-6 py-4 font-medium text-right">退款/收入 (+)</th>
              <th className="px-6 py-4 font-medium text-right">消費/支出 (-)</th>
              <th className="px-6 py-4 font-medium text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((t, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                  {t.date}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {t.type === TransactionType.INCOME ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        退款
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        消費
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700 max-w-xs truncate" title={t.description}>
                  {t.description}
                </td>
                <td className="px-6 py-4 text-right font-medium text-emerald-600">
                  {t.type === TransactionType.INCOME ? `+${t.amount.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium text-rose-600">
                  {t.type === TransactionType.EXPENSE ? `-${t.amount.toFixed(2)}` : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                    <button 
                        onClick={() => onDelete(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete row"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
