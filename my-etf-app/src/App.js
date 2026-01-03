import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Eye, Zap, Shield, RefreshCw, Loader, AlertCircle, X, Landmark } from 'lucide-react';

// ==========================================
// 主題色設定 (方便統一管理)
// ==========================================
const THEME = {
    bgMain: "bg-slate-950",         // 整體最底層背景
    bgCard: "bg-slate-900/80",      // 卡片背景 (帶透明度)
    bgCardHover: "hover:bg-slate-800/50", // 卡片行 Hover
    borderSubtle: "border-slate-800", // 細微邊框
    textPrimary: "text-slate-100",    // 主要文字 (接近白)
    textSecondary: "text-slate-400",  // 次要文字 (灰)
    accentGold: "text-amber-400",     // 金色強調
    borderGold: "border-amber-500/30",// 金色邊框
    upRed: "text-[#ff4d4f]",          // 上漲紅 (更專業的紅)
    bgUpRed: "bg-[#ff4d4f]/10",       // 上漲紅背景
    downGreen: "text-[#52c41a]",      // 下跌綠 (更專業的綠)
    bgDownGreen: "bg-[#52c41a]/10",   // 下跌綠背景
};

// 輔助函式：決定漲跌顏色 class
const getTrendClass = (value) => {
    if (value === undefined || value === null) return THEME.textSecondary;
    // 台灣習慣：>=0 為紅，<0 為綠
    return value >= 0 ? THEME.upRed : THEME.downGreen;
};

// 輔助函式：決定漲跌背景/文字組合 class (用於標籤)
const getTrendBadgeClass = (value) => {
    if (value === undefined || value === null) return `${THEME.textSecondary} bg-slate-800`;
    return value >= 0 ? `${THEME.upRed} ${THEME.bgUpRed}` : `${THEME.downGreen} ${THEME.bgDownGreen}`;
};

// 輔助組件：漲跌箭頭
const TrendIcon = ({ value, className = "w-4 h-4 ml-1" }) => {
    if (value === undefined || value === null) return null;
    return value >= 0 ? <TrendingUp className={className} /> : <TrendingDown className={className} />;
}


// --- 1. 輔助組件: ETF 詳情彈窗 (高端金融版) ---
const ETFDetailModal = ({ etf, onClose }) => {
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

  // 自定義 Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
          const data = payload[0].payload;
          const trendClass = getTrendClass(data.return);
          return (
              <div className={`${THEME.bgCard} border ${THEME.borderGold} p-3 rounded-lg shadow-xl backdrop-blur-md`}>
                  <p className={`${THEME.textSecondary} text-sm mb-1`}>{label}</p>
                  <p className={`${THEME.textPrimary} font-bold flex items-center`}>
                      淨值指數:
                      <span className={`ml-2 font-mono text-lg ${trendClass}`}>
                          {data.return.toFixed(2)}
                      </span>
                  </p>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* 背景遮罩 (深色模糊) */}
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity"></div>
        
        {/* 彈窗本體 (深色玻璃擬態) */}
        <div 
            className={`${THEME.bgCard} border ${THEME.borderSubtle} rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 transform transition-all scale-100 flex flex-col text-slate-200`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* 標題區 */}
            <div className={`p-6 border-b ${THEME.borderSubtle} sticky top-0 ${THEME.bgCard} backdrop-blur-md z-20 flex justify-between items-start`}>
                <div>
                    <div className="flex items-baseline gap-3">
                        <h2 className={`text-3xl font-extrabold ${THEME.accentGold} tracking-tight`}>
                            {etf.ticker}
                        </h2>
                        <span className="text-xl font-semibold text-slate-300">{etf.name}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${isPassive ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}>
                            {isPassive ? '被動式 (指數追蹤)' : '主動式 (經理人操作)'}
                        </span>
                        {etf.fundManager && (
                            <span className="text-sm text-slate-400 flex items-center">
                                <Landmark className="w-4 h-4 mr-1 text-slate-500"/> {etf.fundManager}
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition duration-200 p-2 rounded-full"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* 內容區 */}
            <div className="p-6 grid md:grid-cols-12 gap-6">
                {/* 左側：走勢圖與關鍵數據 */}
                <div className="md:col-span-8 space-y-6">
                     {/* 走勢圖 */}
                    <div className={`p-5 rounded-xl border ${THEME.borderSubtle} ${THEME.bgCardHover} transition-colors`}>
                        <h3 className={`text-lg font-bold ${THEME.textPrimary} mb-4 flex items-center`}>
                            <TrendingUp className={`w-5 h-5 mr-2 ${THEME.accentGold}`}/>近半年淨值走勢 (YTD模擬)
                        </h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={etf.performanceData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                    <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                                    <ReferenceLine y={100} stroke="#64748b" strokeDasharray="3 3" strokeWidth={1}/>
                                    <Line type="monotone" dataKey="return" stroke="#d4af37" strokeWidth={3} dot={{ stroke: '#d4af37', strokeWidth: 2, r: 4, fill: '#1e293b' }} activeDot={{ r: 6, fill: '#d4af37' }} fill="url(#colorReturn)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                     {/* 持股明細表格 */}
                    <div className={`p-5 rounded-xl border ${THEME.borderSubtle} ${THEME.bgCardHover}`}>
                        <h3 className={`text-lg font-bold ${THEME.textPrimary} mb-4 flex items-center justify-between`}>
                            <span>{isPassive ? '指數成分股 (權重)' : '經理人最新持股'}</span>
                        </h3>
                        
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-800">
                                <thead>
                                    <tr className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-4 py-3 text-left">股票名稱</th>
                                        <th className="px-4 py-3 text-right">持股比例</th>
                                        <th className="px-4 py-3 text-right">變動狀態</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                {etf.holdings && etf.holdings.length > 0 ? (
                                    etf.holdings.map((holding, index) => {
                                        // 解析變動狀態以應用顏色
                                        let changeColorClass = THEME.textSecondary;
                                        if (holding.change.includes("🔺") || holding.change.includes("新")) changeColorClass = THEME.upRed;
                                        else if (holding.change.includes("🔻")) changeColorClass = THEME.downGreen;

                                        return (
                                        <tr key={index} className={`hover:bg-slate-800/40 transition duration-150`}>
                                            <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${THEME.textPrimary}`}>
                                                {holding.stock}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 text-right font-mono">
                                                {holding.percent}%
                                            </td>
                                            <td className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${changeColorClass}`}>
                                                {holding.change}
                                            </td>
                                        </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-slate-500 italic">
                                        暫無持股資料
                                    </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 右側：關鍵資訊卡片 */}
                <div className="md:col-span-4">
                    <div className={`p-5 rounded-xl border ${THEME.borderGold} bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg sticky top-24`}>
                        <h3 className={`text-lg font-bold ${THEME.accentGold} mb-5 flex items-center`}>
                            <Shield className="w-5 h-5 mr-2"/>關鍵績效指標
                        </h3>
                        
                        {/* 重點摘要：最新淨值 */}
                        <div className="mb-6 text-center p-4 rounded-lg bg-slate-950/50 border border-slate-800">
                            <p className="text-sm text-slate-400 mb-1">最新淨值 (NAV)</p>
                            <p className={`text-3xl font-black font-mono ${THEME.textPrimary} flex justify-center items-baseline`}>
                                <span className="text-lg mr-1 text-slate-500">NT$</span>
                                {etf.latestNav.toFixed(2)}
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* YTD */}
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <span className="text-slate-400">今年以來 (YTD)</span>
                                <div className={`flex items-center font-bold font-mono text-xl ${getTrendClass(etf.ytdReturn)}`}>
                                    {etf.ytdReturn.toFixed(2)}%
                                    <TrendIcon value={etf.ytdReturn} />
                                </div>
                            </div>
                             {/* Weekly */}
                            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                                <span className="text-slate-400">近一週 (Weekly)</span>
                                <div className={`flex items-center font-bold font-mono text-xl ${getTrendClass(etf.weeklyReturn)}`}>
                                    {etf.weeklyReturn !== undefined ? etf.weeklyReturn.toFixed(2) : '0.00'}%
                                    <TrendIcon value={etf.weeklyReturn} />
                                </div>
                            </div>

                            {/* 基本資料 */}
                            <div className="pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">成立日期</span>
                                    <span className="text-slate-300">{etf.foundedDate || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">配息頻率</span>
                                    <span className="text-slate-300">{etf.dividendFreq || "N/A"}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">保管銀行</span>
                                    <span className="text-slate-300 truncate max-w-[150px]" title={etf.custodianBank}>{etf.custodianBank || "N/A"}</span>
                                </div>
                            </div>
                        </div>

                         <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center">
                            <span className="text-xs text-slate-500">數據狀態</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300`}>
                                {etf.changeStatus || '自動更新'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`p-4 border-t ${THEME.borderSubtle} flex justify-end ${THEME.bgCard} backdrop-blur-md sticky bottom-0 rounded-b-2xl`}>
                <button
                    onClick={onClose}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                    關閉視窗
                </button>
            </div>
        </div>
    </div>
  );
};

// --- 2. 輔助組件: 列表表格 (高端金融版) ---
const ETFTableList = ({ title, data, type, openDetail, isLoading, isError, timeRange, setTimeRange }) => {
    const metricKey = timeRange === 'week' ? 'weeklyReturn' : 'ytdReturn';
    
    const sortedData = useMemo(() => {
        let items = [...data].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
        if (type === 'active') return items.slice(0, 5);
        if (type === 'passive') return items.slice(0, 10);
        return items;
    }, [data, type, metricKey]);

    const IconComponent = type === 'active' ? Zap : Shield;
    // 使用金色作為強調色，不再使用大面積紅藍
    const accentColorClass = THEME.accentGold; 
    
    let content;
    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-dashed border-slate-700 text-slate-400">
                <Loader className={`w-10 h-10 animate-spin ${THEME.accentGold}`} />
                <p className="mt-4 text-lg font-medium tracking-wide">正在同步最新市場數據...</p>
            </div>
        );
    } else if (isError) {
        content = (
             <div className={`flex flex-col items-center justify-center p-12 rounded-xl border ${THEME.borderSubtle} bg-red-950/20 text-red-400`}>
                <AlertCircle className="w-10 h-10 mb-3" />
                <p className="text-lg font-bold">數據載入異常</p>
                <p className="text-sm opacity-80 mt-1">請檢查後端數據源或網路連線。</p>
            </div>
        );
    } else if (sortedData.length === 0) {
        content = (
            <div className={`p-12 rounded-xl border ${THEME.borderSubtle} bg-slate-800/50 text-center text-slate-400 italic`}>
                <p>目前無相關 ETF 數據可顯示。</p>
            </div>
        );
    } else {
        content = (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800">
                    {/* 表頭 */}
                    <thead>
                        <tr className="bg-slate-900/80 text-slate-500 text-xs uppercase tracking-wider font-semibold text-right">
                            <th className="px-6 py-4 text-left min-w-[12rem]">排名 / 名稱</th>
                            <th className="px-6 py-4">
                                {/* 在表頭直接切換按鈕 */}
                                <div className="flex justify-end items-center space-x-2">
                                     <button onClick={() => setTimeRange('year')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${timeRange === 'year' ? `${THEME.bgCard} ${THEME.accentGold} shadow-sm border ${THEME.borderGold}` : 'text-slate-500 hover:text-slate-300'}`}>YTD</button>
                                     <span className="text-slate-700">|</span>
                                     <button onClick={() => setTimeRange('week')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${timeRange === 'week' ? `${THEME.bgCard} ${THEME.accentGold} shadow-sm border ${THEME.borderGold}` : 'text-slate-500 hover:text-slate-300'}`}>1W</button>
                                </div>
                            </th>
                            <th className="px-6 py-4 hidden sm:table-cell">最新淨值</th>
                            <th className="px-6 py-4 text-center">分析</th>
                        </tr>
                    </thead>
                    {/* 表格內容 */}
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                        {sortedData.map((etf, index) => {
                            const performaceValue = etf[metricKey] !== undefined ? etf[metricKey] : 0;
                            const trendClass = getTrendClass(performaceValue);
                            const trendBadgeClass = getTrendBadgeClass(performaceValue);
                            
                            return (
                            <tr key={etf.id || etf.ticker} className={`hover:bg-slate-800/60 transition duration-200 group`}>
                                {/* 排名與名稱 */}
                                <td className="px-6 py-4 whitespace-nowrap align-middle">
                                    <div className="flex items-center">
                                        <div className={`text-2xl font-black italic mr-4 w-8 text-center ${index < 3 ? THEME.accentGold : 'text-slate-600'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className={`text-base font-bold ${THEME.textPrimary} group-hover:${THEME.accentGold} transition-colors`}>{etf.ticker}</div>
                                            <div className={`text-xs ${THEME.textSecondary} truncate max-w-[180px] sm:max-w-xs`} title={etf.name}>{etf.name}</div>
                                        </div>
                                    </div>
                                </td>
                                
                                {/* 績效表現 (重點設計) */}
                                <td className="px-6 py-4 whitespace-nowrap text-right align-middle">
                                    <div className="flex flex-col items-end">
                                         <span className={`inline-flex items-center text-lg font-black font-mono px-2.5 py-1 rounded-lg ${trendBadgeClass}`}>
                                            {performaceValue > 0 ? '+' : ''}{performaceValue.toFixed(2)}%
                                            <TrendIcon value={performaceValue} />
                                        </span>
                                    </div>
                                </td>
                                
                                {/* 最新淨值 */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium font-mono text-slate-300 hidden sm:table-cell align-middle">
                                    <span className="text-slate-600 mr-1">$</span>
                                    {etf.latestNav ? etf.latestNav.toFixed(2) : 'N/A'}
                                </td>
                                
                                {/* 操作按鈕 */}
                                <td className="px-6 py-4 whitespace-nowrap text-center align-middle">
                                    <button 
                                        onClick={() => openDetail(etf)}
                                        className={`p-2.5 rounded-full ${THEME.bgCard} border ${THEME.borderSubtle} text-slate-400 hover:${THEME.accentGold} hover:border-amber-500/50 hover:bg-slate-800 transition-all duration-200 hover:scale-110 hover:shadow-lg shadow-black/20`}
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className={`mb-8 p-1 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl shadow-black/40`}>
            <div className={`${THEME.bgCard} rounded-xl p-6 backdrop-blur-md border-t border-slate-700/50`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-bold ${THEME.textPrimary} flex items-center tracking-wide`}>
                        <div className={`p-2 rounded-lg ${THEME.bgCard} border ${THEME.borderGold} mr-3 shadow-md shadow-amber-900/20`}>
                            <IconComponent className={`w-5 h-5 ${accentColorClass}`} />
                        </div>
                        {title}
                    </h2>
                </div>
                {content}
            </div>
        </div>
    );
};

// --- 3. 主應用程式 (高端金融版) ---
const App = () => {
  const [selectedEtf, setSelectedEtf] = useState(null);
  const [activeETFs, setActiveETFs] = useState([]);
  const [passiveETFs, setPassiveETFs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const [activeTimeRange, setActiveTimeRange] = useState('year'); 
  const [passiveTimeRange, setPassiveTimeRange] = useState('year'); 

  // 模擬數據 (用於開發預覽，實際使用時請註解掉下面這段，打開 fetch)
  /*
  useEffect(() => {
        const mockData = [
            { ticker: 'TQQQ', name: '三倍做多納斯達克', type: 'active', ytdReturn: 45.23, weeklyReturn: -2.15, latestNav: 120.50, performanceData: [{month:'1月', return:100}, {month:'2月', return:110}, {month:'3月', return:105}, {month:'4月', return:125}, {month:'5月', return:145.23}], holdings: [{stock:'AAPL', percent:12, change:'🔺增持'}, {stock:'MSFT', percent:10, change:'無變動'}] },
            { ticker: 'SOXL', name: '三倍做多半導體', type: 'active', ytdReturn: 68.12, weeklyReturn: 5.4, latestNav: 88.90, performanceData: [{month:'1月', return:100}, {month:'3月', return:130}, {month:'5月', return:168.12}] },
            { ticker: 'NVDA', name: '輝達單一股票', type: 'active', ytdReturn: 120.5, weeklyReturn: 1.2, latestNav: 950.00, performanceData: []},
            { ticker: 'MSTR', name: '微策略', type: 'active', ytdReturn: -15.3, weeklyReturn: -8.5, latestNav: 1200.00, performanceData: []},
            { ticker: 'VT', name: 'Vanguard全世界股票', type: 'passive', ytdReturn: 8.5, weeklyReturn: 0.5, latestNav: 105.20, performanceData: [{month:'1月', return:100}, {month:'5月', return:108.5}] },
            { ticker: 'VTI', name: 'Vanguard整體股市', type: 'passive', ytdReturn: 10.2, weeklyReturn: -0.2, latestNav: 220.15, performanceData: [] },
            { ticker: 'QQQ', name: '納斯達克100指數', type: 'passive', ytdReturn: 15.6, weeklyReturn: 1.1, latestNav: 450.10, performanceData: [] },
        ];
        setActiveETFs(mockData.filter(item => item.type === 'active'));
        setPassiveETFs(mockData.filter(item => item.type === 'passive'));
  }, []);
  const fetchRealData = () => { console.log("Refreshing..."); };
  */

  // --- 真實數據 Fetch (正式上線用這個) ---
  const fetchRealData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await fetch(`${process.env.PUBLIC_URL}/etf_data.json?t=${new Date().getTime()}`);
      if (!response.ok) throw new Error('無法讀取數據檔案');
      const data = await response.json();
      setActiveETFs(data.filter(item => item.type === 'active'));
      setPassiveETFs(data.filter(item => item.type === 'passive'));
    } catch (error) {
      console.error("Fetch Error:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => { fetchRealData(); }, [fetchRealData]);
  // ------------------------------------


  return (
    // 設定最外層背景為深色漸層
    <div className={`min-h-screen ${THEME.bgMain} bg-gradient-to-br from-slate-950 via-[#0a0f1d] to-slate-900 p-4 sm:p-8 font-inter text-slate-200`}>
      
      {/* Header */}
      <header className="mb-10 text-center relative">
        {/* 背景裝飾光暈 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-24 bg-amber-500/10 blur-[60px] -z-10"></div>
        
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-amber-200 to-amber-400">
            台灣 ETF 雙榜單績效儀表板
          </span>
        </h1>
        <p className={`text-lg ${THEME.textSecondary} max-w-2xl mx-auto leading-relaxed`}>
          專業追蹤主動式策略與被動式指數，掌握市場脈動。
          <span className="block text-xs mt-2 opacity-50">數據來源：MoneyDJ 真實數據 (Python 自動化爬蟲)</span>
        </p>

        <div className="mt-8 flex justify-center">
            <button
                onClick={fetchRealData}
                disabled={isLoading}
                className={`group relative flex items-center font-bold py-3 px-8 rounded-full shadow-xl transition-all duration-300 overflow-hidden ${
                    isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : `${THEME.bgCard} border ${THEME.borderGold} ${THEME.accentGold} hover:shadow-amber-500/30 hover:scale-105`
                }`}
            >
                {/* 按鈕滑光效果 */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-amber-400/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                
                <span className="relative flex items-center">
                {isLoading ? (
                    <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        數據同步中...
                    </>
                ) : (
                    <>
                        <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                        獲取最新報價
                    </>
                )}
                </span>
            </button>
        </div>
      </header>
      
      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-2">
        {/* --- 主動式區塊 --- */}
        <ETFTableList 
            title="主動式基金 (經理人策略) TOP 5"
            data={activeETFs} 
            type="active" 
            timeRange={activeTimeRange}
            setTimeRange={setActiveTimeRange}
            openDetail={setSelectedEtf} 
            isLoading={isLoading} 
            isError={isError}
        />

        {/* --- 被動式區塊 --- */}
        <ETFTableList 
            title="被動式指數 (市場追蹤) TOP 10"
            data={passiveETFs} 
            type="passive" 
            timeRange={passiveTimeRange} 
            setTimeRange={setPassiveTimeRange}
            openDetail={setSelectedEtf} 
            isLoading={isLoading} 
            isError={isError}
        />
      </div>

      {/* Footer */}
      <footer className="text-center text-slate-600 text-sm mt-12 pb-4">
        © {new Date().getFullYear()} ETF Dashboard Pro. All market data is for reference only.
      </footer>

      <ETFDetailModal etf={selectedEtf} onClose={() => setSelectedEtf(null)} />
    </div>
  );
};

export default App;