import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, Zap, Shield, RefreshCw, Loader, AlertCircle, Activity, BarChart2 } from 'lucide-react';

// --- 自定義 UI 組件：科技感卡片 (修改：岩石灰底+淡藍漸層) ---
const TechCard = ({ children, className = "" }) => (
  // 使用從深岩灰到極淡藍色的漸層，加上模糊和淡藍色邊框
  <div className={`bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-blue-950/30 backdrop-blur-md border border-blue-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-2xl ${className}`}>
    {children}
  </div>
);

// --- 自定義 UI 組件：霓虹標籤 (修改：配色調淡更專業) ---
const NeonBadge = ({ type, text }) => {
  // Passive 改用 Sky Blue, Active 改用 Red，移除過強的陰影
  const styles = type === 'passive' 
    ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' 
    : 'bg-red-500/10 text-red-400 border-red-500/30';
  
  return (
    <span className={`px-4 py-2 rounded-full text-base font-mono font-bold border ${styles}`}>
      {text}
    </span>
  );
};

// --- 1. 輔助組件: ETF 詳情彈窗 (修改：配合卡片風格) ---
const ETFDetailModal = ({ etf, onClose }) => {
  useEffect(() => {
    if (etf) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [etf]);

  if (!etf) return null;
  const isPassive = etf.type === 'passive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* 背景遮罩 - 加深一點以凸顯彈窗 */}
        <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-sm transition-opacity"></div>
        
        {/* 彈窗本體 - 使用與 TechCard 相同的淡藍漸層風格 */}
        <div 
            className="bg-gradient-to-br from-slate-800/95 to-blue-950/50 border border-blue-500/20 w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 rounded-3xl shadow-2xl flex flex-col text-slate-200"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 標題區 - 背景稍微加深 */}
            <div className="p-8 border-b border-blue-500/20 sticky top-0 bg-slate-900/95 backdrop-blur z-20 flex justify-between items-start">
                <div>
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-4xl font-bold text-white tracking-tight">
                            {etf.name}
                        </h2>
                        <span className="text-slate-400 font-mono text-2xl">({etf.ticker})</span>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        <NeonBadge type={etf.type} text={isPassive ? '被動式 (指數追蹤)' : '主動式 (經理人操作)'} />
                        {etf.fundManager && (
                            <span className="text-base text-slate-400 bg-slate-800/50 px-3 py-1.5 rounded border border-blue-500/20">
                                {etf.fundManager}
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition p-2 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            {/* 內容區 */}
            <div className="p-8 grid md:grid-cols-2 gap-8">
                {/* 走勢圖 - 內部區塊底色調淡 */}
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-blue-500/10">
                    {/* 配色改為 Sky Blue */}
                    <h3 className="text-lg font-semibold text-sky-400 mb-6 flex items-center uppercase tracking-wider">
                        <TrendingUp className="w-6 h-6 mr-3"/> 績效走勢模擬 (今年以來)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={etf.performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" tick={{fontSize: 16}} tickLine={false} axisLine={false} dy={10} />
                                <YAxis domain={['auto', 'auto']} stroke="#94a3b8" tick={{fontSize: 16}} tickLine={false} axisLine={false} dx={-10}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', fontSize: '16px' }}
                                    itemStyle={{ color: '#38bdf8' }} // Sky-400
                                    formatter={(value) => [`${value.toFixed(2)}`, '淨值指數']} 
                                    labelFormatter={(label) => `月份: ${label}`}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="return" 
                                    stroke="#38bdf8" // Sky-400
                                    strokeWidth={4} 
                                    dot={{ fill: '#0f172a', stroke: '#38bdf8', strokeWidth: 3, r: 6 }} 
                                    activeDot={{ r: 8, fill: '#38bdf8' }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 關鍵數據 */}
                <div className="bg-slate-800/30 p-6 rounded-2xl border border-blue-500/10 flex flex-col justify-center">
                    {/* 配色改為較淡的 Indigo */}
                    <h3 className="text-lg font-semibold text-indigo-300 mb-6 flex items-center uppercase tracking-wider">
                        <Activity className="w-6 h-6 mr-3"/> 關鍵指標
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-4 bg-slate-800/40 rounded-xl border border-blue-500/10">
                            <span className="text-slate-400 text-lg">最新淨值 (NAV)</span>
                            <span className="text-4xl font-mono font-bold text-white">
                                NT$ <span className="text-sky-400">{etf.latestNav.toFixed(2)}</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-800/40 rounded-xl border border-blue-500/10">
                                <p className="text-slate-500 text-base mb-2">今年以來 (YTD)</p>
                                {/* 漲跌顏色改用標準 Red/Emerald */}
                                <p className={`text-3xl font-mono font-bold ${etf.ytdReturn >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {etf.ytdReturn >= 0 ? '+' : ''}{etf.ytdReturn.toFixed(2)}%
                                </p>
                            </div>
                            <div className="p-4 bg-slate-800/40 rounded-xl border border-blue-500/10">
                                <p className="text-slate-500 text-base mb-2">近一週 (Weekly)</p>
                                <p className={`text-3xl font-mono font-bold ${etf.weeklyReturn >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {etf.weeklyReturn !== undefined ? (etf.weeklyReturn >= 0 ? '+' : '') + etf.weeklyReturn.toFixed(2) : '0.00'}%
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 text-lg pt-4">
                             <div className="flex justify-between border-b border-slate-700/50 pb-3">
                                <span className="text-slate-500">成立日期</span>
                                <span className="text-slate-300 font-mono">{etf.foundedDate || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700/50 py-3">
                                <span className="text-slate-500">配息頻率</span>
                                <span className="text-slate-300">{etf.dividendFreq || "N/A"}</span>
                            </div>
                            <div className="flex justify-between pt-3">
                                <span className="text-slate-500">保管銀行</span>
                                <span className="text-slate-300">{etf.custodianBank || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 持股明細 */}
            <div className="p-8 pt-0">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <BarChart2 className="w-6 h-6 mr-3 text-slate-400"/>
                    {isPassive ? '指數成分股' : '經理人配置'}
                </h3>
                
                <div className="overflow-hidden rounded-xl border border-blue-500/20">
                    <table className="min-w-full divide-y divide-slate-700/50">
                        <thead className="bg-slate-800/60">
                            <tr>
                                <th className="px-8 py-4 text-left text-base font-semibold text-slate-400 uppercase tracking-wider">股票名稱</th>
                                <th className="px-8 py-4 text-right text-base font-semibold text-slate-400 uppercase tracking-wider">持股比例</th>
                                <th className="px-8 py-4 text-right text-base font-semibold text-slate-400 uppercase tracking-wider">模擬變動</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-900/40 divide-y divide-slate-700/50">
                          {etf.holdings && etf.holdings.length > 0 ? (
                            etf.holdings.map((holding, index) => (
                              <tr key={index} className="hover:bg-slate-800/50 transition duration-150">
                                <td className="px-8 py-5 whitespace-nowrap text-lg font-medium text-slate-200">
                                  {holding.stock}
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-lg text-slate-400 text-right font-mono">
                                  {holding.percent}%
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-lg text-right font-mono">
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
                              <td colSpan="3" className="px-8 py-10 text-center text-slate-500 italic text-lg">
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

// --- 2. 輔助組件: 列表表格 (修改：配色與漸層調淡) ---
const ETFTableList = ({ title, data, type, openDetail, isLoading, isError, timeRange = 'year' }) => {
    const metricKey = timeRange === 'week' ? 'weeklyReturn' : 'ytdReturn';
    const highlightThreshold = timeRange === 'week' ? 3 : 15;

    const sortedData = useMemo(() => {
        let items = [...data].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
        if (type === 'active') return items.slice(0, 5);
        if (type === 'passive') return items.slice(0, 10);
        return items;
    }, [data, type, metricKey]);

    const IconComponent = type === 'active' ? Zap : Shield;
    // 配色改為 Red / Sky Blue
    const accentColorClass = type === 'active' ? 'text-red-400' : 'text-sky-400';
    // 標題漸層調淡，使其更融合新的卡片背景
    const gradientHeader = type === 'active' 
        ? 'bg-gradient-to-r from-red-900/30 to-transparent' 
        : 'bg-gradient-to-r from-sky-900/30 to-transparent';
    
    let content;
    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-16 text-sky-500">
                <Loader className="w-12 h-12 animate-spin mb-6" />
                <p className="text-2xl font-medium tracking-wider animate-pulse">系統載入中...</p>
            </div>
        );
    } else if (isError) {
        content = (
             <div className="flex flex-col items-center justify-center p-12 text-red-500 border border-red-900/30 bg-red-950/20 rounded-xl">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-2xl font-bold">數據連線失敗</p>
                <p className="text-lg opacity-70 mt-2">請檢查數據源文件 (etf_data.json)</p>
            </div>
        );
    } else if (sortedData.length === 0) {
        content = (
            <div className="p-12 text-center text-slate-500 border border-slate-700/50 rounded-xl border-dashed text-xl">
                <p>目前無可用數據</p>
            </div>
        );
    } else {
        content = (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50 text-slate-400 text-base uppercase tracking-widest">
                            <th className="px-8 py-5 text-left font-semibold">排名 / 名稱</th>
                            <th className="px-8 py-5 text-right font-semibold">
                                {timeRange === 'week' ? '近一週 (1W)' : '今年以來 (YTD)'}
                            </th>
                            <th className="px-8 py-5 text-right font-semibold hidden sm:table-cell">最新淨值</th>
                            <th className="px-8 py-5 text-center font-semibold">分析</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                        {sortedData.map((etf, index) => (
                            <tr key={etf.id || etf.ticker} className="group hover:bg-slate-800/30 transition duration-200">
                                <td className="px-8 py-6 align-top"> 
                                    <div className="flex items-start">
                                        {/* 排名徽章 - 邊框調淡 */}
                                        <div className={`
                                            flex items-center justify-center w-10 h-10 rounded-md bg-slate-800/50 font-mono font-bold text-2xl mr-6 border border-slate-700/50
                                            ${index < 3 ? 'text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'text-slate-500'}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors">
                                                {etf.name}
                                            </div>
                                            <div className="text-base text-slate-500 font-mono mt-2 flex items-center">
                                                <span className="bg-slate-800/50 px-2 py-0.5 rounded text-sky-300/70 border border-slate-700/50">
                                                    {etf.ticker}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                    <span className={`font-mono text-2xl font-bold ${
                                        (etf[metricKey] || 0) >= highlightThreshold 
                                            ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]'
                                            : (etf[metricKey] || 0) >= 0 
                                                ? 'text-red-400' 
                                                : 'text-emerald-400'
                                    }`}>
                                        {etf[metricKey] >= 0 ? '+' : ''}{(etf[metricKey] !== undefined ? etf[metricKey] : 0).toFixed(2)}%
                                    </span>
                                </td>
                                
                                <td className="px-8 py-6 whitespace-nowrap text-right text-lg text-slate-400 font-mono hidden sm:table-cell">
                                    {etf.latestNav ? etf.latestNav.toFixed(2) : 'N/A'}
                                </td>
                                
                                <td className="px-8 py-6 whitespace-nowrap text-center">
                                    {/* 按鈕改用 Sky Blue */}
                                    <button 
                                        onClick={() => openDetail(etf)}
                                        className="p-3 text-sky-400 hover:text-sky-300 hover:bg-sky-900/20 rounded-xl transition-all transform hover:scale-110"
                                    >
                                        <Eye className="w-6 h-6" />
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
        <TechCard className="mb-12 overflow-hidden">
            <div className={`p-6 sm:p-8 border-b border-slate-700/30 flex items-center ${gradientHeader}`}>
                <div className={`p-3 rounded-xl bg-slate-900/30 mr-6 border border-slate-700/50 ${accentColorClass}`}>
                    <IconComponent className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-wide">
                    {title}
                </h2>
            </div>
            {content}
        </TechCard>
    );
};

// --- 3. 主應用程式 (背景替換、配色專業化) ---
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

  // 切換按鈕樣式 (調淡)
  const getToggleClass = (isActive) => `
    px-6 py-2 rounded-lg text-lg font-bold font-mono transition-all border
    ${isActive 
        ? 'bg-slate-700/50 text-white border-slate-500/50 shadow-inner' 
        : 'text-slate-500 border-transparent hover:text-slate-300'}
  `;

  return (
    // 基底改為更深沉專業的 Gray-900 岩石灰
    <div className="min-h-screen bg-gray-900 text-slate-200 font-sans selection:bg-sky-500 selection:text-white pb-24">
      {/* --- 全新金融科技背景 (岩石灰底+專業感) --- */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {/* 1. 基底漸層：從深岩灰到純黑，製造穩重感 */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-900 to-black"></div>
          
          {/* 2. 抽象幾何紋理：使用低調的立方體/網格紋理，增加金融數據感 (透明度極低) */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>

          {/* 3. 極淡的專業光暈：使用 Sky Blue 和深藍，而非之前的霓虹色，且模糊度極高，僅作為環境光 */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-600/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-6 sm:px-8 pt-12">
        {/* Header 區域 */}
        <header className="mb-16 flex flex-col items-center text-center">
            {/* Badge 改用 Sky Blue */}
            <div className="inline-block mb-6 px-4 py-2 rounded-full border border-sky-500/20 bg-sky-900/10 text-sky-400 text-base font-mono tracking-[0.1em]">
                台灣 ETF 觀測站 v2.0
            </div>
            {/* 標題漸層改為更專業的白到天藍 */}
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-slate-300 mb-6 tracking-tight drop-shadow-2xl">
                ETF 績效觀測站
            </h1>
            <p className="text-slate-400 max-w-3xl text-sm md:text-base leading-relaxed mb-10">
                即時追蹤台灣市場主動與被動式 ETF 表現。數據來源為自動化串接 MoneyDJ，
                {/* 強調色改為 Sky Blue */}
                <span className="text-sky-400 font-semibold"> 每日 AI 運算更新</span>。
            </p>

            <button
                onClick={fetchRealData}
                disabled={isLoading}
                // 按鈕改為 Sky Blue，陰影調淡
                className={`
                    group relative overflow-hidden rounded-full px-10 py-4 text-lg font-bold transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.2)]
                    ${isLoading ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-500 hover:shadow-[0_0_30px_rgba(14,165,233,0.4)]'}
                `}
            >
                <div className="relative z-10 flex items-center">
                    {isLoading ? <Loader className="w-6 h-6 mr-3 animate-spin" /> : <RefreshCw className="w-6 h-6 mr-3 group-hover:rotate-180 transition-transform duration-500" />}
                    <span>{isLoading ? '數據同步中...' : '重新讀取數據'}</span>
                </div>
            </button>
        </header>
        
        <div className="grid xl:grid-cols-2 gap-12">
            {/* --- 主動式區塊 --- */}
            <div>
                <div className="flex justify-between items-end mb-6 px-2">
                    {/* 標題顏色改為 Red-400 */}
                    <h3 className="text-lg font-bold text-red-400 uppercase tracking-widest flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]"></span>
                        主動式基金排行
                    </h3>
                    <div className="bg-slate-900/50 p-1.5 rounded-xl inline-flex border border-slate-700/50">
                        <button onClick={() => setActiveTimeRange('year')} className={getToggleClass(activeTimeRange === 'year')}>今年以來</button>
                        <button onClick={() => setActiveTimeRange('week')} className={getToggleClass(activeTimeRange === 'week')}>近一週</button>
                    </div>
                </div>

                <ETFTableList 
                    title={`主動式精選 (${activeTimeRange === 'year' ? '今年以來' : '近一週'})`}
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
                <div className="flex justify-between items-end mb-6 px-2">
                    {/* 標題顏色改為 Sky-400 */}
                    <h3 className="text-lg font-bold text-sky-400 uppercase tracking-widest flex items-center">
                        <span className="w-3 h-3 bg-sky-500 rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(14,165,233,0.4)]"></span>
                        被動式指數排行
                    </h3>
                    <div className="bg-slate-900/50 p-1.5 rounded-xl inline-flex border border-slate-700/50">
                        <button onClick={() => setPassiveTimeRange('year')} className={getToggleClass(passiveTimeRange === 'year')}>今年以來</button>
                        <button onClick={() => setPassiveTimeRange('week')} className={getToggleClass(passiveTimeRange === 'week')}>近一週</button>
                    </div>
                </div>

                <ETFTableList 
                    title={`指數追蹤榜 (${passiveTimeRange === 'year' ? '今年以來' : '近一週'})`}
                    data={passiveETFs} 
                    type="passive" 
                    timeRange={passiveTimeRange} 
                    openDetail={setSelectedEtf} 
                    isLoading={isLoading} 
                    isError={isError}
                />
            </div>
        </div>

        {/* --- 投資警語區塊 (背景調淡) --- */}
        <div className="mt-16 p-6 bg-slate-900/40 rounded-2xl border border-red-500/20 text-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <h4 className="text-red-400 font-bold text-lg mb-3 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                投資警語
            </h4>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                本網站所提供之資訊僅供參考，不構成任何投資建議或要約。投資人應自行判斷投資風險，並承擔投資結果。
                基金之過去績效不代表未來表現，本網站不保證資訊之正確性、完整性或即時性。
                投資一定有風險，基金投資有賺有賠，申購前應詳閱公開說明書。
            </p>
        </div>
        
        {/* --- 頁尾 --- */}
        <footer className="text-center text-slate-500 text-base mt-16 font-mono mb-8">
            系統狀態：<span className="text-sky-400">連線中</span> • 數據來源：MoneyDJ • 台灣證券交易所
        </footer>
      </div>
      
      <ETFDetailModal etf={selectedEtf} onClose={() => setSelectedEtf(null)} />
    </div>
  );
};

export default App;