import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, Zap, Shield, RefreshCw, Loader, AlertCircle, Activity, BarChart2 } from 'lucide-react';

// --- 自定義 UI 組件：科技感卡片 ---
const TechCard = ({ children, className = "" }) => (
  <div className={`bg-slate-900/80 backdrop-blur-md border border-slate-700/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-xl ${className}`}>
    {children}
  </div>
);

// --- 自定義 UI 組件：霓虹標籤 ---
const NeonBadge = ({ type, text }) => {
  const styles = type === 'passive' 
    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
    : 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]';
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${styles}`}>
      {text}
    </span>
  );
};

// --- 1. 輔助組件: ETF 詳情彈窗 ---
const ETFDetailModal = ({ etf, onClose }) => {
  useEffect(() => {
    if (etf) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [etf]);

  if (!etf) return null;
  const isPassive = etf.type === 'passive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* 背景遮罩：深色模糊 */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"></div>
        
        {/* 彈窗本體 */}
        <div 
            className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 rounded-2xl shadow-2xl flex flex-col text-slate-200"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 標題區 */}
            <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-900/95 backdrop-blur z-20 flex justify-between items-start">
                <div>
                    <div className="flex items-baseline gap-3">
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            {etf.name}
                        </h2>
                        <span className="text-slate-400 font-mono text-lg">({etf.ticker})</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                        <NeonBadge type={etf.type} text={isPassive ? '被動式 (指數追蹤)' : '主動式 (經理人操作)'} />
                        {etf.fundManager && (
                            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
                                {etf.fundManager}
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-white hover:bg-slate-800 transition p-2 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            {/* 內容區 */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
                {/* 走勢圖 */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-4 flex items-center uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4 mr-2"/> 績效走勢模擬 (YTD)
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={etf.performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
                                    itemStyle={{ color: '#22d3ee' }}
                                    formatter={(value) => [`${value.toFixed(2)}`, '淨值指數']} 
                                    labelFormatter={(label) => `月份: ${label}`}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="return" 
                                    stroke="#22d3ee" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#0f172a', stroke: '#22d3ee', strokeWidth: 2, r: 4 }} 
                                    activeDot={{ r: 6, fill: '#22d3ee' }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 關鍵數據 */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                    <h3 className="text-sm font-semibold text-indigo-400 mb-4 flex items-center uppercase tracking-wider">
                        <Activity className="w-4 h-4 mr-2"/> 關鍵指標
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                            <span className="text-slate-400 text-sm">最新淨值 (NAV)</span>
                            <span className="text-2xl font-mono font-bold text-white">
                                NT$ <span className="text-cyan-400">{etf.latestNav.toFixed(2)}</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                                <p className="text-slate-500 text-xs mb-1">今年以來 (YTD)</p>
                                <p className={`text-lg font-mono font-bold ${etf.ytdReturn >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {etf.ytdReturn >= 0 ? '+' : ''}{etf.ytdReturn.toFixed(2)}%
                                </p>
                            </div>
                            <div className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                                <p className="text-slate-500 text-xs mb-1">近一週 (Weekly)</p>
                                <p className={`text-lg font-mono font-bold ${etf.weeklyReturn >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {etf.weeklyReturn !== undefined ? (etf.weeklyReturn >= 0 ? '+' : '') + etf.weeklyReturn.toFixed(2) : '0.00'}%
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm pt-2">
                             <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span className="text-slate-500">成立日期</span>
                                <span className="text-slate-300 font-mono">{etf.foundedDate || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 py-2">
                                <span className="text-slate-500">配息頻率</span>
                                <span className="text-slate-300">{etf.dividendFreq || "N/A"}</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-slate-500">保管銀行</span>
                                <span className="text-slate-300">{etf.custodianBank || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 持股明細 */}
            <div className="p-6 pt-0">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <BarChart2 className="w-5 h-5 mr-2 text-slate-400"/>
                    {isPassive ? '指數成分股' : '經理人配置'}
                </h3>
                
                <div className="overflow-hidden rounded-lg border border-slate-700">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">股票名稱</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">持股比例</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">模擬變動</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-900 divide-y divide-slate-800">
                          {etf.holdings && etf.holdings.length > 0 ? (
                            etf.holdings.map((holding, index) => (
                              <tr key={index} className="hover:bg-slate-800/50 transition duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                                  {holding.stock}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 text-right font-mono">
                                  {holding.percent}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                                  <span className={`${
                                    holding.change.includes("🔺") || holding.change.includes("新")
                                      ? "text-red-400"
                                      : holding.change.includes("🔻")
                                      ? "text-emerald-400"
                                      : "text-slate-500"
                                  }`}>
                                    {holding.change}
                                  </span>
                                </td>
                              </tr>
                            ))
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
    </div>
  );
};

// --- 2. 輔助組件: 列表表格 ---
const ETFTableList = ({ title, data, type, openDetail, isLoading, isError, timeRange = 'year' }) => {
    const metricKey = timeRange === 'week' ? 'weeklyReturn' : 'ytdReturn';
    const metricLabel = timeRange === 'week' ? '近一週 (1W)' : '今年以來 (YTD)';
    const highlightThreshold = timeRange === 'week' ? 3 : 15;

    const sortedData = useMemo(() => {
        let items = [...data].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
        if (type === 'active') return items.slice(0, 5);
        if (type === 'passive') return items.slice(0, 10);
        return items;
    }, [data, type, metricKey]);

    const IconComponent = type === 'active' ? Zap : Shield;
    // 調整標題顏色：主動式用霓虹紅/橙，被動式用霓虹青/藍
    const accentColorClass = type === 'active' ? 'text-rose-400' : 'text-cyan-400';
    const gradientHeader = type === 'active' 
        ? 'bg-gradient-to-r from-rose-900/80 to-slate-900' 
        : 'bg-gradient-to-r from-cyan-900/80 to-slate-900';
    
    let content;
    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-12 text-cyan-500">
                <Loader className="w-10 h-10 animate-spin mb-4" />
                <p className="text-lg font-medium tracking-wider animate-pulse">SYSTEM LOADING...</p>
            </div>
        );
    } else if (isError) {
        content = (
             <div className="flex flex-col items-center justify-center p-8 text-rose-500 border border-rose-900/50 bg-rose-950/20 rounded-lg">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="text-lg font-bold">DATA CONNECTION FAILED</p>
                <p className="text-sm opacity-70">請檢查 etf_data.json 源文件</p>
            </div>
        );
    } else if (sortedData.length === 0) {
        content = (
            <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-lg border-dashed">
                <p>No Data Available</p>
            </div>
        );
    } else {
        content = (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 text-xs uppercase tracking-widest">
                            <th className="px-6 py-4 text-left font-semibold">排名 / 名稱</th>
                            <th className="px-6 py-4 text-right font-semibold">{metricLabel}</th>
                            <th className="px-6 py-4 text-right font-semibold hidden sm:table-cell">最新淨值</th>
                            <th className="px-6 py-4 text-center font-semibold">分析</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {sortedData.map((etf, index) => (
                            <tr key={etf.id || etf.ticker} className="group hover:bg-slate-800/40 transition duration-200">
                                <td className="px-6 py-4 align-top"> 
                                    <div className="flex items-start">
                                        {/* 排名徽章 */}
                                        <div className={`
                                            flex items-center justify-center w-8 h-8 rounded bg-slate-800 font-mono font-bold text-lg mr-4 border border-slate-700
                                            ${index < 3 ? 'text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]' : 'text-slate-500'}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                                                {etf.name}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-1 flex items-center">
                                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300/70 border border-slate-700/50">
                                                    {etf.ticker}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className={`font-mono text-base font-bold ${
                                        (etf[metricKey] || 0) >= highlightThreshold 
                                            ? 'text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]' // 高亮紅 (台股紅漲)
                                            : (etf[metricKey] || 0) >= 0 
                                                ? 'text-red-400' 
                                                : 'text-emerald-400' // 綠跌
                                    }`}>
                                        {etf[metricKey] >= 0 ? '+' : ''}{(etf[metricKey] !== undefined ? etf[metricKey] : 0).toFixed(2)}%
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-400 font-mono hidden sm:table-cell">
                                    {etf.latestNav ? etf.latestNav.toFixed(2) : 'N/A'}
                                </td>
                                
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => openDetail(etf)}
                                        className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30 rounded-lg transition-all transform hover:scale-110"
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
        <TechCard className="mb-10 overflow-hidden">
            <div className={`p-4 sm:p-6 border-b border-slate-700/50 flex items-center ${gradientHeader}`}>
                <div className={`p-2 rounded-lg bg-slate-900/50 mr-4 border border-slate-700 ${accentColorClass}`}>
                    <IconComponent className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                    {title}
                </h2>
            </div>
            {content}
        </TechCard>
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
  const [passiveTimeRange, setPassiveTimeRange] = useState('year'); 

  const fetchRealData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    
    try {
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

  // 切換按鈕的樣式生成器
  const getToggleClass = (isActive) => `
    px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-all border
    ${isActive 
        ? 'bg-slate-700 text-white border-slate-500 shadow-inner' 
        : 'text-slate-500 border-transparent hover:text-slate-300'}
  `;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500 selection:text-white pb-20">
      {/* 裝飾性背景光暈 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Header 區域 */}
        <header className="mb-10 flex flex-col items-center text-center">
            <div className="inline-block mb-4 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-900/10 text-cyan-400 text-xs font-mono tracking-widest uppercase">
                Taiwan ETF Monitor v2.0
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-400 mb-4 tracking-tight drop-shadow-lg">
                ETF 績效觀測站
            </h1>
            <p className="text-slate-400 max-w-2xl text-sm md:text-base leading-relaxed mb-8">
                即時追蹤台灣市場主動與被動式 ETF 表現。數據來源為自動化串接 MoneyDJ，
                <span className="text-cyan-400"> 每日 AI 運算更新</span>。
            </p>

            <button
                onClick={fetchRealData}
                disabled={isLoading}
                className={`
                    group relative overflow-hidden rounded-full px-8 py-3 font-bold transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]
                    ${isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 text-white hover:bg-cyan-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'}
                `}
            >
                <div className="relative z-10 flex items-center">
                    {isLoading ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />}
                    <span>{isLoading ? 'SYNCING DATA...' : 'REFRESH DATA'}</span>
                </div>
            </button>
        </header>
        
        <div className="grid lg:grid-cols-2 gap-8">
            {/* --- 主動式區塊 --- */}
            <div>
                <div className="flex justify-between items-end mb-4 px-1">
                    <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest flex items-center">
                        <span className="w-2 h-2 bg-rose-500 rounded-full mr-2 animate-pulse"></span>
                        Active Funds
                    </h3>
                    <div className="bg-slate-900 p-1 rounded-lg inline-flex border border-slate-800">
                        <button onClick={() => setActiveTimeRange('year')} className={getToggleClass(activeTimeRange === 'year')}>YTD</button>
                        <button onClick={() => setActiveTimeRange('week')} className={getToggleClass(activeTimeRange === 'week')}>1W</button>
                    </div>
                </div>

                <ETFTableList 
                    title={`主動式精選 (${activeTimeRange === 'year' ? 'YTD' : '1 Week'})`}
                    data={activeETFs} 
                    type="active" 
                    timeRange={activeTimeRange}
                    openDetail={setSelectedEtf} 
                    isLoading={isLoading} 
                    isError={isError}
                />
            </div>

            {/* --- 被動式區塊 --- */}
            <div>
                <div className="flex justify-between items-end mb-4 px-1">
                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2 animate-pulse"></span>
                        Passive Indices
                    </h3>
                    <div className="bg-slate-900 p-1 rounded-lg inline-flex border border-slate-800">
                        <button onClick={() => setPassiveTimeRange('year')} className={getToggleClass(passiveTimeRange === 'year')}>YTD</button>
                        <button onClick={() => setPassiveTimeRange('week')} className={getToggleClass(passiveTimeRange === 'week')}>1W</button>
                    </div>
                </div>

                <ETFTableList 
                    title={`指數追蹤榜 (${passiveTimeRange === 'year' ? 'YTD' : '1 Week'})`}
                    data={passiveETFs} 
                    type="passive" 
                    timeRange={passiveTimeRange} 
                    openDetail={setSelectedEtf} 
                    isLoading={isLoading} 
                    isError={isError}
                />
            </div>
        </div>
        
        <footer className="text-center text-slate-600 text-xs mt-12 font-mono">
            SYSTEM STATUS: ONLINE • DATA PROVIDER: MONEYDJ • TW STOCK MARKET
        </footer>
      </div>
      
      <ETFDetailModal etf={selectedEtf} onClose={() => setSelectedEtf(null)} />
    </div>
  );
};

export default App;