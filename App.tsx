import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { extractTransactionsFromImage } from './services/geminiService';
import TransactionTable from './components/TransactionTable';
import { Transaction, TransactionType } from './types';

const App: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setTransactions([]); // Clear previous results

    try {
      const extractedData = await extractTransactionsFromImage(file);
      setTransactions(extractedData);
      if (extractedData.length === 0) {
        setError("未能從圖片中識別出任何交易。請確保圖片清晰並包含可讀的文字。(No transactions found)");
      }
    } catch (err: any) {
      setError(err.message || "發生錯誤，請稍後再試。");
    } finally {
      setIsProcessing(false);
      // Reset input value to allow uploading the same file again if needed
      event.target.value = '';
    }
  };

  const downloadCSV = useCallback(() => {
    if (transactions.length === 0) return;

    // Requirement update: The user explicitly requested to reverse the extracted order 
    // (reversing the order found in the image), instead of sorting by date.
    const sortedTransactions = [...transactions].reverse();

    // Header per requirement: Date; Income (+); Expense (-); Description
    // Requirement says: "15/12/2025; 退款(+的數字; 消費(-的數字); 交易說明"
    // Expense column should not have negative sign.
    const header = "日期;退款(+);消費(-);交易說明";
    
    const rows = sortedTransactions.map(t => {
      // Logic: 
      // If income: put amount in Refund col.
      // If expense: put absolute amount in Expense col (no negative sign).
      
      const refundVal = t.type === TransactionType.INCOME ? `+${t.amount}` : '';
      const expenseVal = t.type === TransactionType.EXPENSE ? `-${t.amount}` : '';
      
      // Sanitize description to prevent CSV breakage (remove semicolons or newlines)
      const safeDesc = t.description.replace(/;/g, ',').replace(/\n/g, ' ');

      return `${t.date};${refundVal};${expenseVal};${safeDesc}`;
    });

    const csvContent = [header, ...rows].join('\n');
    
    // Add BOM for Excel utf-8 compatibility
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ledger_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [transactions]);

  const removeTransaction = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 space-y-4">
        <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg mb-2">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          智能帳目識別 (Smart Ledger OCR)
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          上傳您的收據、發票或銀行月結單圖片。AI 將自動識別日期、名目及金額，並整理成 CSV 表格供您下載。
        </p>
      </div>

      {/* Upload Area */}
      <div className="w-full max-w-2xl">
        <label
          className={`
            relative flex flex-col items-center justify-center w-full h-64 
            border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300
            ${isProcessing 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50 hover:shadow-md'
            }
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 mb-4 text-blue-600 animate-spin" />
                <p className="text-lg font-medium text-blue-700">正在分析圖片...</p>
                <p className="text-sm text-blue-500 mt-2">Gemini AI 正在識別日期、價錢和名目</p>
              </>
            ) : (
              <>
                <div className="p-4 bg-blue-100 text-blue-600 rounded-full mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="mb-2 text-lg font-semibold text-gray-700">
                  點擊上傳圖片 (Click to upload)
                </p>
                <p className="text-sm text-gray-500">
                  支援 JPG, PNG, WEBP
                </p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isProcessing}
          />
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 w-full max-w-2xl p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {transactions.length > 0 && (
        <div className="w-full mt-10 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 px-1">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              識別結果 ({transactions.length})
            </h2>
            <div className="flex gap-3">
               <button
                onClick={() => setTransactions([])}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                重新開始
              </button>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                下載 CSV
              </button>
            </div>
          </div>
          
          <TransactionTable transactions={transactions} onDelete={removeTransaction} />
          
          <p className="mt-4 text-xs text-gray-400 text-center">
            * 提示：請檢查內容是否正確。匯出格式為：日期; 退款(+); 消費(-); 交易說明
          </p>
        </div>
      )}
    </div>
  );
};

export default App;