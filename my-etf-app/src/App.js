import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, TrendingDown, Minus, Info, X, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// 模擬的 ETF 數據 (包含更多歷史資料以供圖表使用)
const etfData = [
  { 
    id: '0050', 
    name: '元大台灣50', 
    price: 135.5, 
    change: +1.2, 
    volume: '15,230',
    description: '追蹤臺灣50指數，涵蓋臺灣市場市值前50大上市公司。',
    history: [
      { date: '2023-10', price: 125.0 }, { date: '2023-11', price: 128.5 }, { date: '2023-12', price: 130.2 }, { date: '2024-01', price: 129.5 }, { date: '2024-02', price: 133.0 }, { date: '2024-03', price: 135.5 }
    ]
  },
  { 
    id: '0056', 
    name: '元大高股息', 
    price: 34.2, 
    change: -0.15, 
    volume: '28,450',
    description: '從臺灣50指數與臺灣中型100指數中，挑選未來一年預測現金股利殖利率最高的30檔股票。',
    history: [
      { date: '2023-10', price: 32.0 }, { date: '2023-11', price: 32.8 }, { date: '2023-12', price: 33.5 }, { date: '2024-01', price: 33.1 }, { date: '2024-02', price: 33.8 }, { date: '2024-03', price: 34.2 }
    ]
  },
  { 
    id: '00878', 
    name: '國泰永續高股息', 
    price: 20.8, 
    change: 0, 
    volume: '45,120',
    description: '追蹤MSCI臺灣ESG永續高股息精選30指數，結合ESG與高股息特性。',
    history: [
      { date: '2023-10', price: 19.5 }, { date: '2023-11', price: 19.8 }, { date: '2023-12', price: 20.2 }, { date: '2024-01', price: 20.0 }, { date: '2024-02', price: 20.5 }, { date: '2024-03', price: 20.8 }
    ]
  },
  { 
    id: '00929', 
    name: '復華台灣科技優息', 
    price: 18.5, 
    change: +0.3, 
    volume: '62,300',
    description: '聚焦臺灣科技產業，並納入收益平準金機制，追求穩定配息。',
    history: [
      { date: '2023-10', price: 17.0 }, { date: '2023-11', price: 17.5 }, { date: '2023-12', price: 18.1 }, { date: '2024-01', price: 17.8 }, { date: '2024-02', price: 18.2 }, { date: '2024-03', price: 18.5 }
    ]
  },
  { 
    id: '00919', 
    name: '群益台灣精選高息', 
    price: 22.1, 
    change: +0.25, 
    volume: '38,900',
    description: '精選臺灣上市上櫃股票中，兼具高股息與獲利能力的個股。',
    history: [
      { date: '2023-10', price: 20.0 }, { date: '2023-11', price: 20.8 }, { date: '2023-12', price: 21.5 }, { date: '2024-01', price: 21.2 }, { date: '2024-02', price: 21.8 }, { date: '2024-03', price: 22.1 }
    ]
  },
];

// 自定義的圖表 Tooltip 組件
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded shadow-lg">
        <p className="text-gray-300 mb-1">{`日期: ${label}`}</p>
        <p className="text-blue-400 font-bold">{`價格: ${payload[0].value} 元`}</p>
      </div>
    );
  }
  return null;
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(etfData);
  const [selectedEtf, setSelectedEtf] = useState(null); // 用於控制彈出視窗顯示哪個 ETF
  const [animateCards, setAnimateCards] = useState(false);

  // 處理搜尋功能
  useEffect(() => {
    const results = etfData.filter(etf =>
      etf.name.includes(searchTerm) || etf.id.includes(searchTerm)
    );
    setFilteredData(results);
  }, [searchTerm]);

  // 處理卡片動畫
  useEffect(() => {
    setAnimateCards(true);
    const timer = setTimeout(() => setAnimateCards(false), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 處理漲跌顏色和圖示
  const getTrendDetails = (change) => {
    if (change > 0) return { color: 'text-red-400', icon: <TrendingUp size={16} />, bgColor: 'bg-red-400/10' };
    if (change < 0) return { color: 'text-green-400', icon: <TrendingDown size={16} />, bgColor: 'bg-green-400/10' };
    return { color: 'text-gray-400', icon: <Minus size={16} />, bgColor: 'bg-gray-400/10' };
  };

  // 處理開啟彈出視窗
  const handleOpenModal = (etf) => {
    setSelectedEtf(etf);
    // 防止背景滾動
    document.body.style.overflow = 'hidden';
  };

  // 處理關閉彈出視窗
  const handleCloseModal = () => {
    setSelectedEtf(null);
    // 恢復背景滾動
    document.body.style.overflow = 'unset';
  };

  // 計算圖表所需的最小值和最大值，讓圖表看起來更生動
  const chartDomain = useMemo(() => {
    if (!selectedEtf) return [0, 0];
    const prices = selectedEtf.history.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // 設定上下邊界緩衝，讓線條不要貼底或貼頂
    return [min * 0.98, max * 1.02];
  }, [selectedEtf]);


  return (
    // 修改 1: 科技感底圖
    // 我們移除了 bg-gray-900，改用 style 添加一個深色的放射狀漸層背景
    <div 
      className="min-h-screen text-white p-4 sm:p-8 font-sans transition-all duration-300 ease-in-out"
      style={{
        background: 'radial-gradient(circle at center top, #1e293b 0%, #0f172a 60%, #020617 100%)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header 標題區 */}
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
            台灣 ETF 市場追蹤
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            即時掌握熱門 ETF 行情與趨勢分析
          </p>
        </header>

        {/* 搜尋框 */}
        <div className="relative mb-8 group">
          <input
            type="text"
            placeholder="輸入代號或名稱搜尋 ETF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 rounded-xl bg-gray-800/50 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 outline-none text-gray-100 placeholder-gray-500 backdrop-blur-sm group-hover:bg-gray-800/70"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-blue-400 transition-colors duration-300" size={20} />
        </div>

        {/* ETF 卡片列表 */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredData.map((etf, index) => {
            const trend = getTrendDetails(etf.change);
            return (
              <div 
                key={etf.id} 
                className={`bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 backdrop-blur-md relative overflow-hidden group ${animateCards ? 'animate-pulse-subtle' : ''}`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* 卡片背景裝飾光暈 */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl transition-all duration-500 group-hover:bg-blue-500/20 group-hover:scale-150"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h2 className="text-xl font-bold mb-1 flex items-center">
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-sm mr-2 font-mono">{etf.id}</span>
                      {etf.name}
                    </h2>
                  </div>
                  {/* 分析按鈕 */}
                  <button 
                    onClick={() => handleOpenModal(etf)}
                    className="text-gray-400 hover:text-blue-400 p-2 rounded-full hover:bg-blue-400/10 transition-all duration-300 group/btn"
                    title="查看詳情與趨勢"
                  >
                    {/* 修改 2: 白色分析眼睛 */}
                    {/* 在 Eye 組件上添加 className="text-white" */}
                    <Eye size={20} className="text-white transition-transform duration-300 group-hover/btn:scale-110" />
                  </button>
                </div>
                
                <div className="flex items-end justify-between relative z-10">
                  <div>
                    <p className="text-gray-400 text-xs mb-1">成交價</p>
                    <p className={`text-3xl font-extrabold tracking-wider ${trend.color}`}>
                      {etf.price.toFixed(2)}
                    </p>
                  </div>
                  <div className={`flex flex-col items-end ${trend.color}`}>
                     <div className={`flex items-center px-2 py-1 rounded-lg ${trend.bgColor} mb-1`}>
                        {trend.icon}
                        <span className="ml-1 font-bold">{Math.abs(etf.change).toFixed(2)}</span>
                     </div>
                    <p className="text-gray-400 text-xs">漲跌幅</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-between text-sm text-gray-500 relative z-10">
                  <span>成交量: {etf.volume} 張</span>
                  <span className="flex items-center text-blue-400/70"><Info size={14} className="mr-1"/> 即時數據</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 無搜尋結果提示 */}
        {filteredData.length === 0 && (
          <div className="text-center text-gray-500 mt-12 p-8 bg-gray-800/30 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
            <Info size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-xl">沒有找到符合 "{searchTerm}" 的 ETF</p>
            <p className="text-sm mt-2">請嘗試其他關鍵字</p>
          </div>
        )}
      </div>

      {/* 彈出視窗 (Modal) */}
      {selectedEtf && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
          <div 
            className="bg-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-zinc-700 overflow-hidden transform transition-all duration-300 ease-in-out scale-100 opacity-100"
            onClick={(e) => e.stopPropagation()} // 防止點擊視窗內容關閉
          >
            {/* 修改 3: 岩石灰視窗 */}
            {/* 上面的 div 將 bg-gray-800 改成了 bg-zinc-800，邊框也改為 border-zinc-700 */}
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-700 bg-zinc-800/50">
              <div>
                <h3 className="text-2xl font-bold flex items-center">
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-sm mr-3 font-mono">{selectedEtf.id}</span>
                  {selectedEtf.name}
                </h3>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white hover:bg-zinc-700/50 p-2 rounded-full transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              {/* 簡介 */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-blue-300">ETF 簡介</h4>
                <p className="text-gray-300 leading-relaxed bg-zinc-700/30 p-4 rounded-xl border border-zinc-700/50">
                  {selectedEtf.description}
                </p>
              </div>

              {/* 價格趨勢圖表 */}
              <div>
                 <h4 className="text-lg font-semibold mb-4 text-blue-300 flex items-center justify-between">
                  <span>近半年價格趨勢</span>
                  {(() => {
                      const trend = getTrendDetails(selectedEtf.change);
                      return (
                        <span className={`text-xl font-bold flex items-center ${trend.color}`}>
                          {trend.icon} {selectedEtf.price}
                        </span>
                      );
                  })()}
                </h4>
                <div className="w-full h-[250px] sm:h-[300px] bg-zinc-900/50 rounded-xl p-2 border border-zinc-700/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={selectedEtf.history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                       {/* 這裡是你截圖斷掉的地方，請從這裡開始覆蓋/補上 */}
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    tick={{fontSize: 12}}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    tick={{fontSize: 12}}
                    tickMargin={10}
                    axisLine={false}
                    domain={chartDomain}
                    tickFormatter={(value) => `${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff30', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#60a5fa" 
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#1e3a8a', stroke: '#60a5fa', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#60a5fa', stroke: 'white', strokeWidth: 2 }}
                    fill="url(#colorPrice)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
  );
}

export default App; 