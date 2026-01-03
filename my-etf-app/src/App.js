import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, Zap, Shield, RefreshCw, Loader, AlertCircle } from 'lucide-react';

// --- 1. 輔助組件: ETF 詳情彈窗 (已修復捲動與顯示) ---
const ETFDetailModal = ({ etf, onClose }) => {
  // 鎖定背景捲動
  useEffect(() => {
    if (etf) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [etf]);

  if (!etf) return null;
  const isPassive = etf.type === 'passive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm"></div>
        
        {/* 彈窗本體 */}
        <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 transform transition-all duration-300 scale-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 標題區 */}
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-20 flex justify-between items-start shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        {etf.name} <span className="text-gray-500 text-lg">({etf.ticker})</span>
                    </h2>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${isPassive ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} mt-2 inline-block`}>
                        {isPassive ? '被動式 (指數追蹤)' : '主動式 (經理人操作)'}
                    </span>
                    {etf.fundManager && (
                        <p className="text-sm text-indigo-700 font-bold mt-1">發行投信: {etf.fundManager}</p>
                    )}
                </div>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-red-500 transition duration-150 p-2 rounded-full hover:bg-gray-100"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            {/* 內容區 */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* 走勢圖 */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-600"/>近半年績效走勢 (YTD模擬)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={etf.performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis dataKey="month" stroke="#6b7280" />
                                <YAxis domain={['auto', 'auto']} stroke="#6b7280" />
                                <Tooltip formatter={(value) => [`${value.toFixed(2)}`, '淨值指數']} labelFormatter={(label) => `月份: ${label}`}/>
                                <Line type="monotone" dataKey="return" stroke="#10b981" strokeWidth={3} dot={{ stroke: '#10b981', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 關鍵數據 */}
                <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-indigo-600"/>關鍵資訊
                    </h3>
                    <div className="space-y-3 text-gray-700">
                        <p className="flex justify-between border-b pb-1">
                            <span className="font-medium">最新淨值 (NAV):</span>
                            <span className="text-xl font-bold text-blue-700">NT${etf.latestNav.toFixed(2)}</span>
                        </p><div className="flex justify-between items-center py-1 border-b border-gray-100">
        <span className="text-gray-500">成立日期:</span>
        <span className="font-medium text-gray-800">
            {etf.foundedDate || "N/A"}
        </span>
    </div>

    <div className="flex justify-between items-center py-1 border-b border-gray-100">
        <span className="text-gray-500">配息頻率:</span>
        <span className="font-medium text-gray-800">
            {etf.dividendFreq || "N/A"}
        </span>
    </div>

    <div className="flex justify-between items-center py-1 border-b border-gray-100">
        <span className="text-gray-500">保管銀行:</span>
        <span className="font-medium text-gray-800">
            {etf.custodianBank || "N/A"}
        </span>
    </div>
                        <p className="flex justify-between border-b pb-1">
                            <span className="font-medium">今年以來報酬 (YTD):</span>
                            <span className={`text-xl font-bold ${etf.ytdReturn >= 0 ? 'text-red-600' : 'text-green-600'}`}>{etf.ytdReturn.toFixed(2)}%</span>
                        </p>
                        <p className="flex justify-between border-b pb-1">
                            <span className="font-medium">近一週報酬 (Weekly):</span>
                            <span className={`text-xl font-bold ${etf.weeklyReturn >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {etf.weeklyReturn !== undefined ? etf.weeklyReturn.toFixed(2) : '0.00'}%
                            </span>
                        </p>
                        <p className="flex justify-between">
                            <span className="font-medium">數據狀態:</span>
                            <span className="font-bold text-gray-500 text-sm">{etf.changeStatus || '自動更新'}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* 持股明細 */}
            <div className="p-6 pt-0">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-t pt-4">
                    {isPassive ? '十大持股 (指數權重)' : '經理人最新持股配置'}
                </h3>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden border border-gray-200">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">股票名稱</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">持股比例 (%)</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">漲跌模擬</th>
                            </tr>
                        </thead>
<tbody className="bg-white divide-y divide-gray-200">
  {etf.holdings && etf.holdings.length > 0 ? (
    // 這裡直接開始 map，不要加 {}
    etf.holdings.map((holding, index) => (
      <tr key={index} className="hover:bg-blue-50 transition duration-150">
        
        {/* 第一欄：股票名稱 */}
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {holding.stock}
        </td>

        {/* 第二欄：持股權重 */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {holding.percent}%
        </td>

        {/* 第三欄：增減變化 */}
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <span
            className={`font-semibold ${
              holding.change.includes("🔺") || holding.change.includes("新")
                ? "text-red-600"
                : holding.change.includes("🔻")
                ? "text-green-600"
                : "text-gray-400"
            }`}
          >
            {holding.change}
          </span>
        </td>
        
      </tr>
    ))
  ) : (
    // 如果沒有持股資料顯示這行
    <tr>
      <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
        暫無持股資料
      </td>
    </tr>
  )}
</tbody>

</table>
      </div>

      {/* 底部關閉按鈕區塊 (如果原本有的話) */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
        >
          關閉
        </button>
      </div>

    </div>
  </div>
</div>
);
};

// --- 2. 輔助組件: 列表表格 ---
const ETFTableList = ({ title, data, type, openDetail, isLoading, isError, timeRange = 'year' }) => {
    const metricKey = timeRange === 'week' ? 'weeklyReturn' : 'ytdReturn';
    const metricLabel = timeRange === 'week' ? '近一週績效' : '今年以來 (YTD)';
    const highlightThreshold = timeRange === 'week' ? 3 : 15;

    const sortedData = useMemo(() => {
        let items = [...data].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
        if (type === 'active') return items.slice(0, 5);
        if (type === 'passive') return items.slice(0, 10);
        return items;
    }, [data, type, metricKey]);

    const IconComponent = type === 'active' ? Zap : Shield;
    const headerColor = type === 'active' ? 'bg-red-500' : 'bg-blue-500';
    
    let content;
    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-indigo-600">
                <Loader className="w-8 h-8 animate-spin" />
                <p className="mt-3 text-lg font-medium">正在讀取最新市場數據...</p>
            </div>
        );
    } else if (isError) {
        content = (
             <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg text-red-600 border border-red-300">
                <AlertCircle className="w-8 h-8" />
                <p className="mt-3 text-lg font-medium">數據載入失敗。</p>
                <p className="text-sm">請確認 python 腳本是否已執行並產生 etf_data.json。</p>
            </div>
        );
    } else if (sortedData.length === 0) {
        content = (
            <div className="p-8 bg-yellow-50 rounded-lg text-yellow-800 border border-yellow-300 text-center">
                <p>目前無 {type === 'active' ? '主動式' : '被動式'} ETF 數據可顯示。</p>
            </div>
        );
    } else {
        content = (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                    <thead className={`${headerColor} text-white`}>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[10rem]">排名 / 名稱</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">{metricLabel}</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">最新淨值</th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider">詳情</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedData.map((etf, index) => (
                            <tr key={etf.id} className="hover:bg-gray-50 transition duration-150">
                                <td className="px-6 py-4 min-w-[10rem] align-top"> 
                                    <div className="text-xl font-bold text-gray-900 mb-1 inline-block w-6 text-center align-top">{index + 1}</div>
                                    <div className="inline-block ml-4 max-w-[calc(100%-2.5rem)]">
                                        <div className="text-sm font-medium text-gray-900 break-words">{etf.name}</div>
                                        <div className="text-xs text-gray-500 font-mono bg-gray-100 inline-block px-1 rounded whitespace-nowrap">{etf.ticker}</div>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className={`inline-flex items-center text-lg font-bold p-1 rounded-md ${
                                        (etf[metricKey] || 0) >= highlightThreshold ? 'text-white bg-green-500' : (etf[metricKey] || 0) >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                                    }`}>
                                            {(etf[metricKey] !== undefined ? etf[metricKey] : 0).toFixed(2)}%
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 hidden sm:table-cell">
                                    NT$ {etf.latestNav.toFixed(2)}
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => openDetail(etf)}
                                        className="p-2 bg-indigo-500 text-white rounded-full shadow-md hover:bg-indigo-600 transition duration-150 transform hover:scale-105"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="mb-10 p-4 sm:p-6 bg-white rounded-xl shadow-2xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center border-b pb-3">
                <IconComponent className={`w-6 h-6 mr-3 ${type === 'active' ? 'text-red-500' : 'text-blue-500'}`} />
                {title}
            </h2>
            {content}
        </div>
    );
};

// --- 3. 主應用程式 ---
const App = () => {
  const [selectedEtf, setSelectedEtf] = useState(null);
  const [activeETFs, setActiveETFs] = useState([]);
  const [passiveETFs, setPassiveETFs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [activeTimeRange, setActiveTimeRange] = useState('year'); 

  // 從 public 資料夾讀取 Python 產生的 JSON
  const fetchRealData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      // 加上時間戳記避免快取
      const response = await fetch(`${process.env.PUBLIC_URL}/etf_data.json?t=${new Date().getTime()}`);
      
      if (!response.ok) {
        throw new Error('無法讀取數據檔案');
      }

      const data = await response.json();

      const activeData = data.filter(item => item.type === 'active');
      const passiveData = data.filter(item => item.type === 'passive');

      setActiveETFs(activeData);
      setPassiveETFs(passiveData);

    } catch (error) {
      console.error("Fetch Error:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]); 

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 border-b pb-2 text-center">
          台灣 ETF 雙榜單績效比較
        </h1>
        <p className="text-gray-600 text-center mb-4">
          數據來源：Python 自動化爬蟲 (MoneyDJ 真實數據)
        </p>

        <div className="flex justify-center">
            <button
                onClick={fetchRealData}
                disabled={isLoading}
                className={`flex items-center font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 transform hover:scale-105 ${
                    isLoading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
                {isLoading ? (
                    <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        更新中...
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        重新讀取最新數據
                    </>
                )}
            </button>
        </div>
      </header>
      
      <div className="mt-8 grid gap-8">
        <div>
             <div className="flex justify-between items-end mb-2 px-2">
                <h3 className="text-lg font-semibold text-gray-500 hidden sm:block">主動式基金排行</h3>
                <div className="bg-gray-200 p-1 rounded-lg inline-flex shadow-inner">
                    <button onClick={() => setActiveTimeRange('year')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTimeRange === 'year' ? 'bg-white text-red-600 shadow-md' : 'text-gray-500'}`}>年績效 (YTD)</button>
                    <button onClick={() => setActiveTimeRange('week')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTimeRange === 'week' ? 'bg-white text-red-600 shadow-md' : 'text-gray-500'}`}>週績效 (1W)</button>
                </div>
            </div>

            <ETFTableList 
                title={`主動式 ETF 前五名 (${activeTimeRange === 'year' ? '今年以來' : '近一週'})`}
                data={activeETFs} type="active" timeRange={activeTimeRange}
                openDetail={setSelectedEtf} isLoading={isLoading} isError={isError}
            />
        </div>

        <div>
            <ETFTableList 
                title="被動式 ETF 績效前十名 (以 YTD 排序)"
                data={passiveETFs} type="passive" timeRange="year" 
                openDetail={setSelectedEtf} isLoading={isLoading} isError={isError}
            />
        </div>
      </div>
      <ETFDetailModal etf={selectedEtf} onClose={() => setSelectedEtf(null)} />
    </div>
  );
};

export default App;