import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Eye, Zap, Shield, RefreshCw, Loader, AlertCircle } from 'lucide-react';

// --- 1. 初始模擬數據 (新增 weeklyReturn 欄位) ---
const initialActiveETFs = [
  { 
    id: 1, type: 'active', name: "主動群益台灣強棒", ticker: "00982A", fundManager: "群益證券投資信託股份有限公司", 
    ytdReturn: 22.88, weeklyReturn: 1.5, latestNav: 18.90, changeSinceLast: 1.50, 
    lastDividend: "NT$0.50 (季配)", exDate: "2025/08/01", changeStatus: "大幅度新增IC設計、網通股，強化主動選股優勢。", 
    holdings: [ { stock: "世界 (5347)", percent: 6.5, change: "+2.0%" }, { stock: "力旺 (3529)", percent: 5.9, change: "+1.5%" }, { stock: "環球晶 (6488)", percent: 4.1, change: "-0.8%" }, ], 
    performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 122.88 }, ] 
  },
  { 
    id: 2, type: 'active', name: "主動統一台股成長", ticker: "00981A", fundManager: "統一證券投資信託股份有限公司", 
    ytdReturn: 18.52, weeklyReturn: -0.8, latestNav: 35.60, changeSinceLast: 0.85, 
    lastDividend: "NT$1.20 (年配)", exDate: "2025/09/20", changeStatus: "小幅加碼AI伺服器供應鏈，保持高集中度持股。", 
    holdings: [ { stock: "台積電 (2330)", percent: 12.5, change: "+0.5%" }, { stock: "聯發科 (2454)", percent: 9.8, change: "-0.2%" }, { stock: "鴻海 (2317)", percent: 7.1, change: "+1.0%" }, ], 
    performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 118.52 }, ] 
  },
  { 
    id: 3, type: 'active', name: "主動野村臺灣優選", ticker: "00980A", fundManager: "野村證券投資信託股份有限公司", 
    ytdReturn: 12.35, weeklyReturn: 2.1, latestNav: 24.15, changeSinceLast: -0.25, 
    lastDividend: "NT$0.80 (季配)", exDate: "2025/10/10", changeStatus: "減持金融股比重，轉向景氣復甦的傳產領域。", 
    holdings: [ { stock: "富邦金 (2881)", percent: 8.2, change: "-1.0%" }, { stock: "國泰金 (2882)", percent: 7.5, change: "-0.5%" }, { stock: "台塑 (1301)", percent: 6.0, change: "+0.5%" }, ], 
    performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 112.35 }, ] 
  },
  { 
    id: 4, type: 'active', name: "主動野村台股50", ticker: "00985A", fundManager: "野村證券投資信託股份有限公司", 
    ytdReturn: 8.95, weeklyReturn: 0.5, latestNav: 15.20, changeSinceLast: 0.10, 
    lastDividend: "NT$0.35 (年配)", exDate: "2025/07/01", changeStatus: "新增大型風電與綠能供應鏈，注重ESG題材。", 
    holdings: [ { stock: "世紀鋼 (9958)", percent: 10.1, change: "+1.5%" }, { stock: "上緯投控 (3708)", percent: 8.5, change: "0.0%" }, { stock: "中興電 (1513)", percent: 7.2, change: "+0.8%" }, ], 
    performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 108.95 }, ] 
  },
  { 
    id: 5, type: 'active', name: "主動安聯台灣高息", ticker: "00984A", fundManager: "安聯證券投資信託股份有限公司", 
    ytdReturn: 5.10, weeklyReturn: -1.2, latestNav: 28.50, changeSinceLast: 0.05, 
    lastDividend: "NT$0.90 (季配)", exDate: "2025/11/01", changeStatus: "持股變動極小，維持高股息標的佈局，等待除權息旺季。", 
    holdings: [ { stock: "統一 (1216)", percent: 11.2, change: "0.0%" }, { stock: "台泥 (1101)", percent: 9.9, change: "-0.1%" }, { stock: "長榮 (2603)", percent: 6.5, change: "+0.1%" }, ], 
    performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 105.10 }, ] 
  },
];

const initialPassiveETFs = [
  { id: 101, type: 'passive', name: "元大台灣卓越50證券投資信託基金 (市值型)", ticker: "0050", ytdReturn: 20.15, weeklyReturn: 1.2, latestNav: 160.50, changeSinceLast: 1.50, lastDividend: "NT$3.50 (半年配)", exDate: "2025/07/19", index: "臺灣50指數", holdings: [{ stock: "台積電 (2330)", percent: 50.0, change: "N/A" }, { stock: "鴻海 (2317)", percent: 6.0, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 120.15 }, ] },
  { id: 102, type: 'passive', name: "復華台灣科技優息ETF基金 (高股息月配)", ticker: "00929", ytdReturn: 18.90, weeklyReturn: 0.9, latestNav: 21.30, changeSinceLast: 0.05, lastDividend: "NT$0.15 (月配)", exDate: "2025/10/25", index: "特選臺灣科技優息指數", holdings: [{ stock: "聯發科 (2454)", percent: 3.5, change: "N/A" }, { stock: "廣達 (2382)", percent: 2.8, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 118.90 }, ] },
  { id: 103, type: 'passive', name: "富邦台灣電子科技股指數型基金", ticker: "0052", ytdReturn: 25.40, weeklyReturn: 2.5, latestNav: 135.80, changeSinceLast: 2.10, lastDividend: "NT$2.00 (年配)", exDate: "2025/06/10", index: "臺灣電子指數", holdings: [{ stock: "台積電 (2330)", percent: 40.5, change: "N/A" }, { stock: "聯電 (2303)", percent: 5.0, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 125.40 }, ] },
  { id: 108, type: 'passive', name: "中信關鍵半導體ETF基金", ticker: "00891", ytdReturn: 28.01, weeklyReturn: 3.1, latestNav: 25.90, changeSinceLast: 0.90, lastDividend: "NT$0.40 (半年配)", exDate: "2025/06/20", index: "ICE FactSet臺灣指數公司半導體指數", holdings: [{ stock: "台積電 (2330)", percent: 25.0, change: "N/A" }, { stock: "聯發科 (2454)", percent: 12.0, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 128.01 }, ] },
  { id: 106, type: 'passive', name: "富邦MSCI台灣ETF基金", ticker: "006208", ytdReturn: 19.55, weeklyReturn: 1.1, latestNav: 95.60, changeSinceLast: 1.05, lastDividend: "NT$2.10 (年配)", exDate: "2025/07/25", index: "MSCI台灣指數", holdings: [{ stock: "台積電 (2330)", percent: 45.0, change: "N/A" }, { stock: "聯發科 (2454)", percent: 7.0, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 119.55 }, ] },
  { id: 107, type: 'passive', name: "元大台灣高股息低波動ETF基金", ticker: "00713", ytdReturn: 17.22, weeklyReturn: 0.2, latestNav: 55.40, changeSinceLast: 0.35, lastDividend: "NT$0.80 (季配)", exDate: "2025/11/01", index: "臺灣指數公司高股息低波動指數", holdings: [{ stock: "仁寶 (2324)", percent: 3.1, change: "N/A" }, { stock: "英業達 (2356)", percent: 2.9, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 117.22 }, ] },
  { id: 109, type: 'passive', name: "國泰永續高股息ETF基金", ticker: "00878", ytdReturn: 16.50, weeklyReturn: 0.1, latestNav: 22.10, changeSinceLast: 0.12, lastDividend: "NT$0.30 (季配)", exDate: "2025/11/16", index: "MSCI臺灣ESG永續高股息精選30指數", holdings: [{ stock: "仁寶 (2324)", percent: 4.5, change: "N/A" }, { stock: "大聯大 (3702)", percent: 4.1, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 116.50 }, ] },
  { id: 105, type: 'passive', name: "富邦富櫃50 ETF基金", ticker: "006201", ytdReturn: 15.85, weeklyReturn: 1.8, latestNav: 75.20, changeSinceLast: 0.88, lastDividend: "NT$1.50 (半年配)", exDate: "2025/08/15", index: "櫃買富櫃50指數", holdings: [{ stock: "世界 (5347)", percent: 7.5, change: "N/A" }, { stock: "頎邦 (6147)", percent: 4.2, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 115.85 }, ] },
  { id: 110, type: 'passive', name: "富邦台灣金融指數ETF基金", ticker: "0055", ytdReturn: 10.20, weeklyReturn: -0.5, latestNav: 32.50, changeSinceLast: 0.20, lastDividend: "NT$1.10 (年配)", exDate: "2025/05/01", index: "臺灣金融指數", holdings: [{ stock: "富邦金 (2881)", percent: 15.0, change: "N/A" }, { stock: "國泰金 (2882)", percent: 12.0, change: "N/A" }, ], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 110.20 }, ] },
  { id: 104, type: 'passive', name: "國泰20年期以上美國公債ETF基金", ticker: "00679B", ytdReturn: -5.10, weeklyReturn: 0.0, latestNav: 30.15, changeSinceLast: -0.15, lastDividend: "NT$0.25 (季配)", exDate: "2025/09/05", index: "彭博20年期以上美國公債指數", holdings: [], performanceData: [ { month: '4月', return: 100 }, { month: '9月', return: 94.90 }, ] },
];

// --- 2. 輔助函數：模擬 API 回傳格式的數據 (包含週績效變動) ---
const simulateAPIData = (data) => {
    return data.map(etf => {
        const randomChange = (Math.random() * 4 - 2) / 100; // 隨機在 -2% 到 +2% 之間
        const newYtdReturn = etf.ytdReturn * (1 + randomChange);
        
        // 模擬週績效變動 (假設週變動幅度較大)
        // 若原始沒有 weeklyReturn，預設為 0
        const currentWeekly = etf.weeklyReturn || 0;
        const newWeeklyReturn = currentWeekly + (Math.random() * 2 - 1); 

        const newNav = etf.latestNav * (1 + randomChange / 20);
        
        return { 
            ...etf, 
            ytdReturn: parseFloat(newYtdReturn.toFixed(2)),
            weeklyReturn: parseFloat(newWeeklyReturn.toFixed(2)), // 更新週績效
            latestNav: parseFloat(newNav.toFixed(2)),
            // 模擬更新持股變動狀態
            changeStatus: etf.type === 'active' ? (Math.random() > 0.5 ? '經理人加碼科技股' : '經理人減碼金融股') : etf.changeStatus,
        };
    });
};

// --- 3. 輔助組件: ETF 詳情彈窗 ---
const ETFDetailModal = ({ etf, onClose }) => {
  if (!etf) return null;

  const isPassive = etf.type === 'passive';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800 flex justify-between items-start">
            {etf.name} ({etf.ticker}) 
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition duration-150 p-1 ml-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </h2>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${isPassive ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} mt-2 inline-block`}>
                {isPassive ? '被動式 (指數追蹤)' : '主動式 (經理人操作)'}
            </span>
          {etf.fundManager && (
              <p className="text-sm text-indigo-700 font-bold mt-1 break-words">發行投信: {etf.fundManager}</p>
          )}
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* 績效走勢圖 */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600"/>近半年績效走勢 (模擬淨值指數)
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
                    <span className="font-medium">追蹤指數:</span>
                    <span className="text-md font-bold text-blue-700 break-words text-right max-w-[60%]">{etf.index || 'N/A'}</span>
                </p>
                <p className="flex justify-between border-b pb-1">
                    <span className="font-medium">最新淨值 (NAV):</span>
                    <span className="text-xl font-bold text-blue-700">NT${etf.latestNav.toFixed(2)}</span>
                </p>
                <p className="flex justify-between border-b pb-1">
                    <span className="font-medium">當日漲跌幅:</span>
                    <span className={`text-xl font-bold ${etf.changeSinceLast > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {etf.changeSinceLast.toFixed(2)}
                    </span>
                </p>
                <p className="flex justify-between border-b pb-1">
                    <span className="font-medium">今年以來報酬率 (YTD):</span>
                    <span className="text-xl font-bold text-red-600">{etf.ytdReturn.toFixed(2)}%</span>
                </p>
                <p className="flex justify-between border-b pb-1">
                    <span className="font-medium">近一週報酬率 (Weekly):</span>
                    <span className={`text-xl font-bold ${etf.weeklyReturn >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {etf.weeklyReturn ? etf.weeklyReturn.toFixed(2) : '0.00'}%
                    </span>
                </p>
                <p className="flex justify-between">
                    <span className="font-medium">上次配息/除息日:</span>
                    <span className="font-bold">{etf.lastDividend} ({etf.exDate})</span>
                </p>
            </div>
          </div>
        </div>

        {/* 持股明細異動 */}
        <div className="p-6 pt-0">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-t pt-4">
            {isPassive ? '十大持股 (被動追蹤)' : '十大持股與經理人異動分析'}
          </h3>
          {!isPassive && (
              <p className="text-sm text-gray-600 mb-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                **經理人操作策略變動:** {etf.changeStatus}
              </p>
          )}
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden border border-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    股票名稱 (代號)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                    持股比例 (%)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                    {isPassive ? '追蹤變動' : '相對上次異動 (%)'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {etf.holdings.map((holding, index) => (
                  <tr key={index} className="hover:bg-blue-50 transition duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {holding.stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                      {holding.percent.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={`font-semibold inline-flex items-center ${
                          isPassive ? 'text-gray-500' : holding.change.includes('+') ? 'text-red-600' : holding.change.includes('-') ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {holding.change}
                      </span>
                    </td>
                  </tr>
                ))}
                {etf.holdings.length === 0 && (
                    <tr><td colSpan="3" className="px-6 py-4 text-center text-gray-500">無公開持股資訊 (如債券型 ETF)</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. 輔助組件: 列表表格 (支援 timeRange 動態排序) ---
const ETFTableList = ({ title, data, type, openDetail, isLoading, isError, timeRange = 'year' }) => {
    // 根據 timeRange 決定要使用哪個欄位排序與顯示
    const metricKey = timeRange === 'week' ? 'weeklyReturn' : 'ytdReturn';
    const metricLabel = timeRange === 'week' ? '近一週績效' : '今年以來 (YTD)';
    
    // 定義高亮閾值：週績效波動較小，設 3% 為高標；年績效設 15%
    const highlightThreshold = timeRange === 'week' ? 3 : 15;

    // 自動根據 metricKey 排序
    const sortedData = useMemo(() => {
        let items = [...data].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
        if (type === 'active') return items.slice(0, 5);
        if (type === 'passive') return items.slice(0, 10);
        return items;
    }, [data, type, metricKey]);

    const IconComponent = type === 'active' ? Zap : Shield;
    const headerColor = type === 'active' ? 'bg-red-500' : 'bg-blue-500';
    
    // 根據載入狀態顯示內容
    let content;
    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-indigo-600">
                <Loader className="w-8 h-8 animate-spin" />
                <p className="mt-3 text-lg font-medium">正在從市場獲取最新數據...</p>
            </div>
        );
    } else if (isError) {
        content = (
             <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg text-red-600 border border-red-300">
                <AlertCircle className="w-8 h-8" />
                <p className="mt-3 text-lg font-medium">數據載入失敗。請檢查 API 連線設定或稍後再試。</p>
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
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[10rem]">
                                排名 / ETF 名稱 (代號)
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                                {metricLabel}
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider hidden sm:table-cell whitespace-nowrap">
                                最新淨值
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell whitespace-nowrap">
                                配息資訊
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                                詳情
                            </th>
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
                                        {type === 'active' && (
                                            <div className="text-xs text-indigo-700 mt-1 font-semibold break-words">發行: {etf.fundManager}</div>
                                        )}
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className={`inline-flex items-center text-lg font-bold p-1 rounded-md ${
                                        etf[metricKey] >= highlightThreshold ? 'text-white bg-green-500' : etf[metricKey] >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                                    }`}>
                                            {etf[metricKey]?.toFixed(2)}%
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700 hidden sm:table-cell">
                                    NT$ {etf.latestNav.toFixed(2)}
                                    <span className={`text-xs ml-2 ${etf.changeSinceLast > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {etf.changeSinceLast > 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5"/> : <TrendingDown className="w-3 h-3 inline mr-0.5"/>}
                                        ({etf.changeSinceLast.toFixed(2)})
                                    </span>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold hidden md:table-cell">
                                    {etf.lastDividend}
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => openDetail(etf)}
                                        className="p-2 bg-indigo-500 text-white rounded-full shadow-md hover:bg-indigo-600 transition duration-150 transform hover:scale-105"
                                        title="查看詳情"
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

// --- 5. 主應用程式組件 ---
const App = () => {
  const [selectedEtf, setSelectedEtf] = useState(null);
  const [activeETFs, setActiveETFs] = useState(initialActiveETFs);
  const [passiveETFs, setPassiveETFs] = useState(initialPassiveETFs);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  
  // 新增狀態: 控制主動式 ETF 的排序時間區間
  const [activeTimeRange, setActiveTimeRange] = useState('year'); // 'year' | 'week'

  // 模擬 API 數據抓取
  const fetchRealTimeData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    
    // 模擬 API Endpoint
    // const MOCK_API_ENDPOINT = "https://mockapi.twse.com.tw/etf_performance_v2";

    try {
      // 1. 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 1500)); 

      // 2. 更新狀態 (使用 functional updates 確保不依賴外部 state 變數)
      setActiveETFs(prevData => simulateAPIData(prevData));
      setPassiveETFs(prevData => simulateAPIData(prevData));

    } catch (error) {
      console.error("Failed to fetch ETF data:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []); // 空依賴陣列，因為使用了 setState 的 functional update

  useEffect(() => {
    fetchRealTimeData();
  }, []); // 僅在初次掛載時執行

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 font-inter">
      <header className="mb-8 p-4 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 border-b pb-2 text-center">
          台灣 ETF 雙榜單績效比較
        </h1>
        <p className="text-gray-600 text-center mb-4">
          同時追蹤主動式 (經理人操作) 與被動式 (指數追蹤) ETF 的年度與短期表現。
        </p>

        <div className="flex justify-center">
            <button
                onClick={fetchRealTimeData}
                disabled={isLoading}
                className={`flex items-center font-bold py-3 px-6 rounded-lg shadow-xl transition duration-300 transform hover:scale-105 ${
                    isLoading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                title="點擊獲取最新的市場數據"
            >
                {isLoading ? (
                    <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        數據連線中...
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        手動獲取最新數據 (模擬 API)
                    </>
                )}
            </button>
        </div>
        <p className="text-sm text-gray-500 mt-3 text-center">
            * 應用程式已內建自動排序機制，數據更新後排名會自動調整。
        </p>
      </header>
      
      {/* 主要內容區塊 */}
      <div className="mt-8 grid gap-8">
        
        {/* 主動式 ETF 區塊：包含切換開關 */}
        <div>
             {/* 切換控制閥 (Tab Switcher) */}
             <div className="flex justify-between items-end mb-2 px-2">
                <h3 className="text-lg font-semibold text-gray-500 hidden sm:block">
                    主動式基金排行
                </h3>
                <div className="bg-gray-200 p-1 rounded-lg inline-flex shadow-inner">
                    <button 
                        onClick={() => setActiveTimeRange('year')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${
                            activeTimeRange === 'year' 
                            ? 'bg-white text-red-600 shadow-md' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        年績效 (YTD)
                    </button>
                    <button 
                        onClick={() => setActiveTimeRange('week')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${
                            activeTimeRange === 'week' 
                            ? 'bg-white text-red-600 shadow-md' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        週績效 (1W)
                    </button>
                </div>
            </div>

            <ETFTableList 
                title={`主動式 ETF 前五名 (${activeTimeRange === 'year' ? '今年以來' : '近一週'})`}
                data={activeETFs}
                type="active"
                timeRange={activeTimeRange} // 傳入當前選定的時間區間
                openDetail={setSelectedEtf}
                isLoading={isLoading}
                isError={isError}
            />
        </div>

        {/* 被動式 ETF 區塊：目前固定顯示年績效 (也可仿照上方加入切換) */}
        <div>
            <div className="flex justify-between items-end mb-2 px-2">
                 <h3 className="text-lg font-semibold text-gray-500 hidden sm:block">被動式基金排行</h3>
            </div>
            <ETFTableList 
                title="被動式 ETF 績效前十名 (以 YTD 排序)"
                data={passiveETFs}
                type="passive"
                timeRange="year" // 被動式這裡先固定為 YTD，若需要也可加 state 控制
                openDetail={setSelectedEtf}
                isLoading={isLoading}
                isError={isError}
            />
        </div>
      </div>

      {/* 詳情彈窗 */}
      <ETFDetailModal etf={selectedEtf} onClose={() => setSelectedEtf(null)} />
    </div>
  );
};

export default App;