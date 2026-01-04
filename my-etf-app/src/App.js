import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, Zap, Shield, RefreshCw, Loader, AlertCircle, Activity, BarChart2 } from 'lucide-react';

// --- 自定義 UI 組件：輕盈科技卡片 ---
const TechCard = ({ children, className = "" }) => (
  <div className={`bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl ${className}`}>
    {children}
  </div>
);

// --- 自定義 UI 組件：膠囊標籤 (通用) ---
const NeonBadge = ({ type, text }) => {
  const styles = type === 'passive' 
    ? 'bg-sky-50 text-sky-600 border-sky-200' 
    : 'bg-rose-50 text-rose-600 border-rose-200';
  
  return (
    <span className={`px-4 py-2 rounded-full text-sm font-mono font-bold border ${styles}`}>
      {text}
    </span>
  );
};

// --- 1. 輔助組件: ETF 詳情彈窗 (修改：背景色 #656565) ---
const ETFDetailModal = ({ etf, onClose }) => {
  useEffect(() => {
    if (etf) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [etf]);

  if (!etf) return null;
  const isPassive = etf.type === 'passive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
        
        {/* 彈窗本體 - 指定色號 #656565 */}
        <div 
            className="bg-[#656565] border border-gray-500 w-full max-w-5xl max-h-[90vh] overflow-y-auto relative z-10 rounded-3xl shadow-2xl flex flex-col text-white"
            onClick={(e) => e.stopPropagation()}
        >
            {/* 標題區 */}
            <div className="p-8 border-b border-white/10 sticky top-0 bg-[#656565]/95 backdrop-blur z-20 flex justify-between items-start">
                <div>
                    <div className="flex items-baseline gap-4">
                        <h2 className="text-4xl font-bold text-white tracking-tight">
                            {etf.name}
                        </h2>
                        <span className="text-gray-300 font-mono text-2xl">({etf.ticker})</span>
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                        {/* 這裡的 Badge 為了配合深底色，稍微調整一下樣式 */}
                        <span className={`px-4 py-2 rounded-full text-sm font-mono font-bold border ${isPassive ? 'bg-sky-900/30 text-sky-300 border-sky-400/30' : 'bg-rose-900/30 text-rose-300 border-rose-400/30'}`}>
                            {isPassive ? '被動式 (指數追蹤)' : '主動式 (經理人操作)'}
                        </span>
                        
                        {etf.fundManager && (
                            <span className="text-sm font-medium text-gray-300 bg-white/10 px-3 py-1.5 rounded border border-white/10">
                                {etf.fundManager}
                            </span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="text-gray-400 hover:text-white hover:bg-white/20 transition p-2 rounded-full"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
            </div>

            {/* 內容區 */}
            <div className="p-8 grid md:grid-cols-2 gap-8">
                {/* 走勢圖 */}
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                    <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center uppercase tracking-wider">
                        <TrendingUp className="w-6 h-6 mr-3 text-[#FFC709]"/> 績效走勢模擬 (今年以來)
                    </h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={etf.performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#888" vertical={false} />
                                <XAxis dataKey="month" stroke="#ccc" tick={{fontSize: 14}} tickLine={false} axisLine={false} dy={10} />
                                <YAxis domain={['auto', 'auto']} stroke="#ccc" tick={{fontSize: 14}} tickLine={false} axisLine={false} dx={-10}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#656565', borderColor: '#999', color: '#fff', fontSize: '14px' }}
                                    itemStyle={{ color: '#FFC709' }}
                                    formatter={(value) => [`${value.toFixed(2)}`, '淨值指數']} 
                                    labelFormatter={(label) => `月份: ${label}`}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="return" 
                                    stroke="#FFC709" 
                                    strokeWidth={3} 
                                    dot={{ fill: '#656565', stroke: '#FFC709', strokeWidth: 2, r: 5 }} 
                                    activeDot={{ r: 7, fill: '#FFC709' }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 關鍵數據 */}
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-gray-200 mb-6 flex items-center uppercase tracking-wider">
                        <Activity className="w-6 h-6 mr-3 text-[#63BFF4]"/> 關鍵指標
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-gray-300 text-lg">最新淨值 (NAV)</span>
                            <span className="text-4xl font-mono font-bold text-white">
                                NT$ <span className="text-[#63BFF4]">{etf.latestNav.toFixed(2)}</span>
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-gray-400 text-base mb-2">今年以來 (YTD)</p>
                                <p className={`text-3xl font-mono font-bold ${etf.ytdReturn >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {etf.ytdReturn >= 0 ? '+' : ''}{etf.ytdReturn.toFixed(2)}%
                                </p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-gray-400 text-base mb-2">近一週 (Weekly)</p>
                                <p className={`text-3xl font-mono font-bold ${etf.weeklyReturn >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {etf.weeklyReturn !== undefined ? (etf.weeklyReturn >= 0 ? '+' : '') + etf.weeklyReturn.toFixed(2) : '0.00'}%
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 text-lg pt-4">
                             <div className="flex justify-between border-b border-white/10 pb-3">
                                <span className="text-gray-400">成立日期</span>
                                <span className="text-gray-200 font-mono">{etf.foundedDate || "N/A"}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 py-3">
                                <span className="text-gray-400">配息頻率</span>
                                <span className="text-gray-200">{etf.dividendFreq || "N/A"}</span>
                            </div>
                            <div className="flex justify-between pt-3">
                                <span className="text-gray-400">保管銀行</span>
                                <span className="text-gray-200">{etf.custodianBank || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 持股明細 */}
            <div className="p-8 pt-0">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <BarChart2 className="w-6 h-6 mr-3 text-gray-400"/>
                    {isPassive ? '指數成分股' : '經理人配置'}
                </h3>
                
                <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-black/30">
                            <tr>
                                <th className="px-8 py-4 text-left text-base font-semibold text-gray-400 uppercase tracking-wider">股票名稱</th>
                                <th className="px-8 py-4 text-right text-base font-semibold text-gray-400 uppercase tracking-wider">持股比例</th>
                                <th className="px-8 py-4 text-right text-base font-semibold text-gray-400 uppercase tracking-wider">模擬變動</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white/5 divide-y divide-white/5">
                          {etf.holdings && etf.holdings.length > 0 ? (
                            etf.holdings.map((holding, index) => (
                              <tr key={index} className="hover:bg-white/10 transition duration-150">
                                <td className="px-8 py-5 whitespace-nowrap text-lg font-medium text-white">
                                  {holding.stock}
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-lg text-gray-300 text-right font-mono">
                                  {holding.percent}%
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-lg text-right font-mono">
                                  <span className={`${
                                    holding.change.includes("🔺") || holding.change.includes("新")
                                      ? "text-rose-400"
                                      : holding.change.includes("🔻")
                                      ? "text-emerald-400"
                                      : "text-gray-500"
                                  }`}>
                                    {holding.change}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="px-8 py-10 text-center text-gray-500 italic text-lg">
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
    const highlightThreshold = timeRange === 'week' ? 3 : 15;

    const sortedData = useMemo(() => {
        let items = [...data].sort((a, b) => (b[metricKey] || 0) - (a[metricKey] || 0));
        if (type === 'active') return items.slice(0, 5);
        if (type === 'passive') return items.slice(0, 10);
        return items;
    }, [data, type, metricKey]);

    const IconComponent = type === 'active' ? Zap : Shield;
    
    // 主動式使用指定黃色，被動式保持藍色系
    const accentColorClass = type === 'active' ? 'text-[#FFC709]' : 'text-sky-500';
    
    let content;
    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                <Loader className="w-12 h-12 animate-spin mb-6" />
                <p className="text-2xl font-medium tracking-wider animate-pulse">數據同步中...</p>
            </div>
        );
    } else if (isError) {
        content = (
             <div className="flex flex-col items-center justify-center p-12 text-rose-500 border border-rose-100 bg-rose-50 rounded-xl">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-2xl font-bold">連線失敗</p>
                <p className="text-lg opacity-70 mt-2">請確認 etf_data.json 是否存在</p>
            </div>
        );
    } else if (sortedData.length === 0) {
        content = (
            <div className="p-12 text-center text-slate-400 border border-slate-200 rounded-xl border-dashed text-xl">
                <p>目前無可用數據</p>
            </div>
        );
    } else {
        content = (
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-slate-100 text-slate-500 text-base uppercase tracking-widest">
                            <th className="px-8 py-5 text-left font-semibold">排名 / 名稱</th>
                            <th className="px-8 py-5 text-right font-semibold">
                                {timeRange === 'week' ? '近一週 (1W)' : '今年以來 (YTD)'}
                            </th>
                            <th className="px-8 py-5 text-right font-semibold hidden sm:table-cell">最新淨值</th>
                            <th className="px-8 py-5 text-center font-semibold">分析</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {sortedData.map((etf, index) => (
                            <tr key={etf.id || etf.ticker} className="group hover:bg-slate-50 transition duration-200">
                                <td className="px-8 py-6 align-top"> 
                                    <div className="flex items-start">
                                        <div className={`
                                            flex items-center justify-center w-10 h-10 rounded-md bg-slate-100 font-mono font-bold text-2xl mr-6 border border-slate-200
                                            ${index < 3 ? 'text-amber-500 border-amber-200 bg-amber-50' : 'text-slate-400'}
                                        `}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-700 group-hover:text-sky-600 transition-colors">
                                                {etf.name}
                                            </div>
                                            <div className="text-base text-slate-400 font-mono mt-2 flex items-center">
                                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200">
                                                    {etf.ticker}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                    <span className={`font-mono text-2xl font-bold ${
                                        (etf[metricKey] || 0) >= highlightThreshold 
                                            ? 'text-rose-500' 
                                            : (etf[metricKey] || 0) >= 0 
                                                ? 'text-rose-500' 
                                                : 'text-emerald-500' 
                                    }`}>
                                        {etf[metricKey] >= 0 ? '+' : ''}{(etf[metricKey] !== undefined ? etf[metricKey] : 0).toFixed(2)}%
                                    </span>
                                </td>
                                
                                <td className="px-8 py-6 whitespace-nowrap text-right text-lg text-slate-600 font-mono hidden sm:table-cell">
                                    {etf.latestNav ? etf.latestNav.toFixed(2) : 'N/A'}
                                </td>
                                
                                <td className="px-8 py-6 whitespace-nowrap text-center">
                                    <button 
                                        onClick={() => openDetail(etf)}
                                        className="p-3 text-sky-500 hover:text-white hover:bg-sky-500 rounded-xl transition-all shadow-sm hover:shadow-md transform hover:-translate-y-1"
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
            <div className={`p-6 sm:p-8 border-b border-slate-100 flex items-center`}>
                <div className={`p-3 rounded-xl bg-white mr-6 border border-slate-100 shadow-sm ${accentColorClass}`}>
                    <IconComponent className="w-8 h-8" />
                </div>
                {/* 修改點：主動式標題用指定黃色 #FFC709
                   注意：因為 #FFC709 是亮黃色，在白底上可能對比度不足，這裡加上了文字陰影增強可讀性 
                */}
                <h2 
                    className="text-3xl font-bold tracking-wide drop-shadow-sm"
                    style={{ color: type === 'active' ? '#FFC709' : '#1e293b' }} 
                >
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

  useEffect(() => {
    fetchRealData();
  }, [fetchRealData]); 

  // --- 修改點：按鈕樣式 ---
  // isWeekButton: 用來判斷是否為「近一週」按鈕
  // isActive: 是否被選中
  const getToggleClass = (isActive, isWeekButton) => {
      // 基礎樣式
      let base = "px-6 py-2 rounded-lg text-lg font-bold font-mono transition-all border ";
      
      if (isActive) {
          // 如果是「近一週」按鈕且被選中，使用指定色 #63BFF4
          if (isWeekButton) {
              return base + "bg-[#63BFF4] text-white border-[#63BFF4] shadow-sm";
          }
          // 其他按鈕(今年以來)被選中時的樣式 (維持灰色或預設)
          return base + "bg-slate-600 text-white border-slate-600 shadow-sm";
      } else {
          // 未選中狀態
          return base + "text-slate-400 border-transparent hover:text-slate-600";
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-sky-100 selection:text-sky-700 pb-24">
      {/* 淺色科技背景 */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-slate-50"></div>
          <div className="absolute inset-0 bg-[url('https://img.freepik.com/free-vector/white-abstract-background-design_23-2148825582.jpg')] bg-cover bg-center opacity-40 mix-blend-multiply"></div>
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-sky-200/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-100/40 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-6 sm:px-8 pt-12">
        {/* Header 區域 */}
        <header className="mb-16 flex flex-col items-center text-center">
            <div className="inline-block mb-6 px-4 py-2 rounded-full border border-slate-200 bg-white/50 text-slate-500 text-base font-mono tracking-[0.1em] backdrop-blur-sm shadow-sm">
                台灣 ETF 觀測站 v2.0
            </div>
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 via-sky-600 to-cyan-500 mb-6 tracking-tight drop-shadow-sm">
                ETF 績效觀測站
            </h1>
            <p className="text-slate-500 max-w-3xl text-sm md:text-base leading-relaxed mb-10">
                即時追蹤台灣市場主動與被動式 ETF 表現。數據來源為自動化串接 MoneyDJ，
                <span className="text-sky-600 font-bold"> 每日 AI 運算更新</span>。
            </p>

            <button
                onClick={fetchRealData}
                disabled={isLoading}
                className={`
                    group relative overflow-hidden rounded-full px-10 py-4 text-lg font-bold transition-all duration-300 shadow-lg shadow-sky-500/20
                    ${isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600 hover:shadow-sky-500/40'}
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
                    <h3 className="text-lg font-bold text-[#FFC709] uppercase tracking-widest flex items-center drop-shadow-sm">
                        <span className="w-3 h-3 bg-[#FFC709] rounded-full mr-3 animate-pulse"></span>
                        主動式基金排行
                    </h3>
                    <div className="bg-slate-200/50 p-1.5 rounded-xl inline-flex border border-slate-200">
                        {/* 傳入 false 表示這是「今年以來」按鈕 */}
                        <button onClick={() => setActiveTimeRange('year')} className={getToggleClass(activeTimeRange === 'year', false)}>今年以來</button>
                        {/* 傳入 true 表示這是「近一週」按鈕 -> 會變 #63BFF4 */}
                        <button onClick={() => setActiveTimeRange('week')} className={getToggleClass(activeTimeRange === 'week', true)}>近一週</button>
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
                    <h3 className="text-lg font-bold text-sky-500 uppercase tracking-widest flex items-center">
                        <span className="w-3 h-3 bg-sky-500 rounded-full mr-3 animate-pulse"></span>
                        被動式指數排行
                    </h3>
                    <div className="bg-slate-200/50 p-1.5 rounded-xl inline-flex border border-slate-200">
                        <button onClick={() => setPassiveTimeRange('year')} className={getToggleClass(passiveTimeRange === 'year', false)}>今年以來</button>
                        <button onClick={() => setPassiveTimeRange('week')} className={getToggleClass(passiveTimeRange === 'week', true)}>近一週</button>
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

        {/* --- 投資警語區塊 --- */}
        <div className="mt-16 p-6 bg-white/60 rounded-2xl border border-rose-200 text-center shadow-sm">
            <h4 className="text-rose-500 font-bold text-lg mb-3 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                投資警語
            </h4>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                本網站所提供之資訊僅供參考，不構成任何投資建議或要約。投資人應自行判斷投資風險，並承擔投資結果。
                基金之過去績效不代表未來表現，本網站不保證資訊之正確性、完整性或即時性。
                投資一定有風險，基金投資有賺有賠，申購前應詳閱公開說明書。
            </p>
        </div>
        
        <footer className="text-center text-slate-400 text-base mt-16 font-mono mb-8">
            系統狀態：<span className="text-sky-500">連線中</span> • 數據來源：MoneyDJ • 台灣證券交易所
        </footer>
      </div>
      
      <ETFDetailModal etf={selectedEtf} onClose={() => setSelectedEtf(null)} />
    </div>
  );
};

export default App;