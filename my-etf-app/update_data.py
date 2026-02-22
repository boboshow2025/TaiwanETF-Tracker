import pandas as pd
import requests
import json
import os
import time
import urllib3
import warnings
from io import StringIO
import re
import math 
import yfinance as yf

# --- 1. 基礎設定 ---
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
warnings.simplefilter(action='ignore', category=FutureWarning)

# 設定要抓取的 ETF 清單
target_etfs = [
    # --- 主動式 ETF (Active) ---
    {"id": 1, "ticker": "00981A", "name": "主動統一台股成長", "type": "active", "manager": "統一投信"}, 
    {"id": 2, "ticker": "00980A", "name": "主動野村臺灣優選", "type": "active", "manager": "野村投信"}, 
    {"id": 4, "ticker": "00985A", "name": "主動野村台股50", "type": "active", "manager": "野村投信"}, 
    {"id": 5, "ticker": "00984A", "name": "主動安聯台灣高息", "type": "active", "manager": "安聯投信"}, 
    {"id": 7, "ticker": "00992A", "name": "主動群益科技創新", "type": "active", "manager": "群益投信"},
    {"id": 6, "ticker": "00999", "name": "主動富邦新星爆發", "type": "active", "manager": "富邦投信"},
    {"id": 8, "ticker": "00994A", "name": "主動第一金台股趨勢優選", "type": "active", "manager": "第一金投信"},
    {"id": 9, "ticker": "00995A", "name": "主動中信台灣卓越", "type": "active", "manager": "中國信託投信"},
    {"id": 10, "ticker": "00993A", "name": "主動安聯台灣", "type": "active", "manager": "安聯投信"},
    
    # 新增的清單
    {"id": 20, "ticker": "00982A", "name": "主動群益台灣強棒", "type": "active", "manager": "群益投信"},
    {"id": 21, "ticker": "00986A", "name": "主動台新龍頭成長", "type": "active", "manager": "台新投信"},
    {"id": 22, "ticker": "00987A", "name": "主動台新科技高息", "type": "active", "manager": "台新投信"},
    {"id": 23, "ticker": "00983A", "name": "主動中信ARK創新", "type": "active", "manager": "中信投信"},
    {"id": 24, "ticker": "00988A", "name": "主動統一全球創新", "type": "active", "manager": "統一投信"},
    {"id": 25, "ticker": "00989A", "name": "主動摩根美國科技", "type": "active", "manager": "摩根投信"},
    {"id": 26, "ticker": "00990A", "name": "主動元大AI新經濟", "type": "active", "manager": "元大投信"},
    {"id": 27, "ticker": "00991A", "name": "主動復華未來50", "type": "active", "manager": "復華投信"},

    # --- 被動式 ETF (Passive) ---
    {"id": 3, "ticker": "0050", "name": "元大台灣50", "type": "passive", "index": "台灣50指數"}, 
    {"id": 101, "ticker": "00878", "name": "國泰永續高股息", "type": "passive", "index": "ESG永續高股息"},
    {"id": 102, "ticker": "0056", "name": "元大高股息", "type": "passive", "index": "臺灣高股息指數"},
    {"id": 103, "ticker": "00929", "name": "復華台灣科技優息", "type": "passive", "index": "科技優息指數"},
    {"id": 108, "ticker": "00891", "name": "中信關鍵半導體", "type": "passive", "index": "ICE半導體指數"},
    {"id": 109, "ticker": "0052", "name": "富邦科技", "type": "passive", "index": "資訊科技指數"},
    {"id": 111, "ticker": "006208", "name": "富邦台50", "type": "passive", "index": "台灣50指數"},
    {"id": 112, "ticker": "00636", "name": "國泰中國A50", "type": "passive", "index":"富時中國A50指數"},
    {"id": 113, "ticker": "00646", "name": "元大S&P500", "type": "passive", "index": "S&P500指數"},
    {"id": 114, "ticker": "00738U", "name": "園大道瓊白銀", "type": "passive", "index": "道瓊白銀ER指數"},
    {"id": 115, "ticker": "00919", "name": "群益台灣精選高息", "type": "passive", "index": "特選臺灣精選高息指數"},
    {"id": 116, "ticker": "00918", "name": "元大台灣高息低波", "type": "passive", "index": "高息低波指數"},
    {"id": 110, "ticker": "00679B", "name": "元大美債20年", "type": "passive", "index": "美債20年指數"}
]

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.moneydj.com/'
}

# --- 工具函式 ---

def get_number_from_text(text):
    """從字串中提取浮點數，並過濾 NaN、千分位逗號、百分比符號"""
    try:
        if pd.isna(text) or text == "" or str(text).strip() == "-":
            return None
        clean_text = re.sub(r'[%, ]', '', str(text)) # 移除 %, 逗號, 空格
        val = float(clean_text)
        if math.isnan(val) or math.isinf(val): return 0.0
        return val
    except:
        return None

# --- 3. 新增：讀取舊資料 ---
def load_previous_data():
    """讀取現有的 public/etf_data.json 以便比對持股"""
    path = 'public/etf_data.json'
    if os.path.exists(path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []
    return []

# --- 4. 新增：計算持股變化 ---
def compare_holdings(new_holdings, old_holdings):
    """
    比對新舊持股，計算增減
    new_holdings: [{"stock": "台積電", "percent": 50.0}, ...]
    old_holdings: 同上，來自上次存檔
    """
    # 將舊持股轉為字典以便查詢: {'台積電': 50.0, '聯發科': 10.0}
    old_map = {item['stock']: item['percent'] for item in old_holdings}
    
    processed_holdings = []
    
    for stock in new_holdings:
        name = stock['stock']
        curr_pct = stock['percent']
        
        # 預設變化字串
        change_str = "-"
        change_val = 0.0
        
        if name in old_map:
            old_pct = old_map[name]
            diff = curr_pct - old_pct
            
            # 設定門檻，微小誤差忽略
            if abs(diff) > 0.001:
                if diff > 0:
                    change_str = f"🔺{diff:.2f}%" # 增加
                else:
                    change_str = f"🔻{abs(diff):.2f}%" # 減少
                change_val = diff
        else:
            change_str = "🆕新進" # 舊資料沒有，新資料有
            change_val = curr_pct
            
        processed_holdings.append({
            "stock": name,
            "percent": curr_pct,
            "change": change_str,      # 顯示用的字串 (e.g., 🔺0.5%)
            "changeVal": change_val    # 數值，方便以後排序用
        })
        
    return processed_holdings

# --- 1. 抓取基本資料 (成立日期、配息頻率) [新增功能] ---
def fetch_basic_profile(ticker_id):
    """抓取 Basic0004 頁面的基本資料"""
    url = f"https://www.moneydj.com/ETF/X/Basic/Basic0004.xdjhtm?etfid={ticker_id}"
    
    profile = {
        "foundedDate": "N/A",      # 成立日期
        "dividendFreq": "N/A",     # 配息頻率
        "managerFee": "N/A",       # 經理費
        "custodian": "N/A"         # 保管銀行
    }
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10, verify=False)
        resp.encoding = 'utf-8'
        
        if "查無" in resp.text:
            return profile

        tables = pd.read_html(StringIO(resp.text))
        
        for table in tables:
            # 遍歷表格中的每一個 row
            for index, row in table.iterrows():
                row_list = [str(x).strip() for x in row]
                
                for i, cell_text in enumerate(row_list):
                    # 1. 抓取成立日期
                    if "成立日期" in cell_text:
                        if i + 1 < len(row_list):
                            raw_date = row_list[i+1]
                            # 使用 Regex 提取 YYYY/MM/DD，過濾掉後面括號文字 e.g. (已成立1年)
                            match = re.search(r'\d{4}/\d{2}/\d{2}', raw_date)
                            if match:
                                profile["foundedDate"] = match.group(0)
                            else:
                                profile["foundedDate"] = raw_date
                    
                    # 2. 抓取配息頻率
                    elif "配息頻率" in cell_text:
                        if i + 1 < len(row_list):
                            profile["dividendFreq"] = row_list[i+1]

                    # 3. 抓取保管銀行
                    elif "保管機構" in cell_text or "保管銀行" in cell_text:
                         if i + 1 < len(row_list):
                            profile["custodian"] = row_list[i+1]
        
        # 除錯印出
        if profile["foundedDate"] != "N/A":
            print(f"      📝 基本資料: 成立 {profile['foundedDate']}, 配息 {profile['dividendFreq']}")
        return profile

    except Exception as e:
        # print(f"      ⚠️ 基本資料抓取失敗: {e}") # 除錯用，不想洗版可註解
        return profile

# --- 2. 抓取淨值 (NAV) ---
def fetch_nav(ticker_id):
    urls = [
        f"https://www.moneydj.com/ETF/X/Basic/Basic0003.xdjhtm?etfid={ticker_id}", 
        f"https://www.moneydj.com/ETF/X/Basic/Basic0004.xdjhtm?etfid={ticker_id}"
    ]
    
    for url in urls:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10, verify=False)
            resp.encoding = 'utf-8'
            if "查無" in resp.text: continue
            
            tables = pd.read_html(StringIO(resp.text))
            for table in tables:
                for index, row in table.iterrows():
                    row_str = "".join([str(x) for x in row])
                    if "淨值" in row_str:
                        for cell in row:
                            val = get_number_from_text(cell)
                            # 淨值過濾器 (5 ~ 2000)
                            if val and 5.0 < val < 2000.0:
                                return val
        except:
            continue
    return 0.0

# --- 3. 抓取績效 ---
def fetch_performance_metrics(ticker_id):
    url_0008 = f"https://www.moneydj.com/ETF/X/Basic/Basic0008.xdjhtm?etfid={ticker_id}"
    data = {"ytd": 0.0, "weekly": 0.0}
    
    try:
        resp = requests.get(url_0008, headers=HEADERS, timeout=10, verify=False)
        resp.encoding = 'utf-8'
        tables = pd.read_html(StringIO(resp.text))
        target_table = None
        
        for table in tables:
            cols = "".join([str(c) for c in table.columns])
            if "一週" in cols and ("六個月" in cols or "成立" in cols or "三個月" in cols):
                target_table = table
                break
        
        if target_table is not None:
            row_idx = -1
            for idx, row in target_table.iterrows():
                row_str = str(row[0])
                if "淨值" in row_str or "市價" in row_str: 
                    row_idx = idx
                    break
            
            if row_idx == -1 and len(target_table) > 0: row_idx = 0

            if row_idx != -1:
                # 抓週績效
                if "一週" in target_table.columns:
                    val = get_number_from_text(target_table.loc[row_idx, "一週"])
                    if val is not None: data["weekly"] = val
                
                # 抓 YTD
                if "今年以來" in target_table.columns:
                    val = get_number_from_text(target_table.loc[row_idx, "今年以來"])
                    if val is not None: data["ytd"] = val
                elif "成立日" in target_table.columns: # 針對新 ETF
                    val = get_number_from_text(target_table.loc[row_idx, "成立日"])
                    if val is not None: data["ytd"] = val
                elif "成立至今" in target_table.columns:
                     val = get_number_from_text(target_table.loc[row_idx, "成立至今"])
                     if val is not None: data["ytd"] = val
                     
                print(f"      📈 績效數據: 週 {data['weekly']}%, YTD/成立 {data['ytd']}%")
                return data
    except Exception:
        pass

    # 備用：Basic0006
    url_0006 = f"https://www.moneydj.com/ETF/X/Basic/Basic0006.xdjhtm?etfid={ticker_id}"
    try:
        resp = requests.get(url_0006, headers=HEADERS, timeout=10, verify=False)
        resp.encoding = 'utf-8'
        clean_text = re.sub(r'<[^>]+>', ' ', resp.text)
        
        match_week = re.search(r'週.*?(-?\d+\.\d+)%', clean_text)
        if match_week: data["weekly"] = float(match_week.group(1))
        
        match_ytd = re.search(r'今年以來.*?(-?\d+\.\d+)%', clean_text)
        if match_ytd: data["ytd"] = float(match_ytd.group(1))
    except:
        pass
        
    return data

# --- 4. 抓取持股 ---
def fetch_holdings(ticker_id):
    # 手動注入 (如果需要特定 ETF 的數據可保留，不需要可註解)
    if "00984A" in ticker_id:
        return [{"stock": "台積電(2330)", "percent": 5.03, "change": "-"}, {"stock": "富邦金(2881)", "percent": 3.81, "change": "-"}, {"stock": "國泰金(2882)", "percent": 3.76, "change": "-"}, {"stock": "中信金(2891)", "percent": 3.53, "change": "-"}, {"stock": "廣達(2382)", "percent": 3.32, "change": "-"}]

    url = f"https://www.moneydj.com/ETF/X/Basic/Basic0007.xdjhtm?etfid={ticker_id}"
    print(f"   🔍 正在抓取: {ticker_id}")
    
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10, verify=False)
        resp.encoding = 'utf-8'
        tables = pd.read_html(StringIO(resp.text))
        target_table = None
        for table in tables:
            cols = "".join([str(c) for c in table.columns])
            if ("名稱" in cols or "股票" in cols or "個股" in cols) and ("比" in cols or "%" in cols):
                target_table = table
                break
        
        if target_table is None:
            # print(f"      ❌ 找不到持股表格")
            return []

        holdings = []
        target_table.columns = [str(c).strip() for c in target_table.columns]
        
        name_col = next((c for c in target_table.columns if "名稱" in c or "股票" in c or "個股" in c), None)
        percent_col = next((c for c in target_table.columns if "%" in c or "比" in c), None)

        if name_col and percent_col:
            for index, row in target_table.head(10).iterrows():
                name = str(row[name_col])
                pct = str(row[percent_col])
                if name == "nan" or name == "": continue
                val = get_number_from_text(pct)
                if val is None: val = 0.0
                holdings.append({"stock": name, "percent": val, "change": "-"})
        
        print(f"      ✅ 抓到 {len(holdings)} 檔持股")
        return holdings
    except:
        return []

 # --- 5. 新增：抓取真實歷史股價 (Yahoo Finance) ---
def fetch_real_chart(ticker_id):
    """
    嘗試從 Yahoo Finance 抓取近 6 個月的歷史股價
    回傳格式: [{"month": "12/01", "return": 15.2}, ...]
    """
    try:
        # 下載歷史資料，period="6mo" 代表半年
        # interval="1wk" 代表以「週」為單位 (避免數據點太多 JSON 檔案太大)
        df = yf.Ticker(ticker_id).history(period="6mo", interval="1wk")
        
        if df.empty or len(df) < 2:
            return None # 抓不到資料，回傳 None 讓主程式切換回模擬模式

        chart_data = []
        for date, row in df.iterrows():
            # 格式化日期，例如 "01/05"
            date_str = date.strftime('%m/%d')
            # 取收盤價 (Close)
            price = row['Close']
            
            # 這裡我們直接存「股價(NAV)」，前端顯示會更直觀
            chart_data.append({
                "month": date_str, 
                "return": round(price, 2)
            })
            
        return chart_data
    except Exception as e:
        print(f"      ⚠️ Yahoo Finance 抓取失敗: {e}")
        return None       

# --- 主程式 ---
print(f"🚀 開始執行...並進行持股比對")

# 1. 先讀取舊資料 (歷史紀錄)
previous_data_list = load_previous_data()
# 建立快速查詢表: { "00981A": [持股list], "0050": [持股list] }
previous_map = { item['ticker']: item.get('holdings', []) for item in previous_data_list }

output_data = []

for etf in target_etfs:
    raw_ticker = etf['ticker'].replace(".TW", "")
    target_id = f"{raw_ticker}.TW"
    
    print(f"\n[{etf['id']}] 處理中: {etf['name']}")
    
    # 抓取各項資料
    # 注意：這裡 fetch_holdings 抓回來的是「純淨值」，change 還是 "-"
    holdings_raw = fetch_holdings(target_id) 
    nav = fetch_nav(target_id)
    perf = fetch_performance_metrics(target_id)
    profile = fetch_basic_profile(target_id)
    
    # ★★★ 關鍵步驟：進行持股比對 ★★★
    # 從舊資料中找出這檔 ETF 上次的持股
    old_holdings_for_this_etf = previous_map.get(etf['ticker'], [])
    # 計算變化
    holdings_with_change = compare_holdings(holdings_raw, old_holdings_for_this_etf)
    
    ytd = perf["ytd"]
    weekly = perf["weekly"]
    
    status = "MoneyDJ 真實數據"
    if nav == 0 and ytd == 0: status = "查無數據"


    # --- 走勢圖邏輯 (升級版) ---
    chart_data = []
    
    # 1. 優先嘗試抓取「真實」歷史股價
    real_chart = fetch_real_chart(target_id)
    
    if real_chart:
        print(f"      📈 成功抓取真實走勢圖 ({len(real_chart)} 點)")
        chart_data = real_chart
        # 如果有真實股價，我們把最新的股價也更新一下 NAV (通常 Yahoo 更新稍慢，但可作參考)
        # nav = real_chart[-1]['return'] 
    
    # 2. 如果抓不到 (例如昨天才上市，Yahoo還沒建檔)，則使用「模擬」算法
    elif ytd != 0:
        print(f"      🧪 使用模擬走勢圖")
        start_val = nav / (1 + ytd/100) # 反推期初淨值
        steps = 5
        for i in range(steps + 1):
            # 線性插值
            val = start_val + (nav - start_val) * (i/steps)
            # 產生 T-5, T-4 這種標籤
            chart_data.append({"month": f"T-{steps-i}", "return": round(val, 2)})

    # 組裝最終資料

    final_data = {
        **etf,
        "ytdReturn": ytd,
        "weeklyReturn": weekly,
        "latestNav": nav,
        "changeSinceLast": 0,
        "lastDividend": "N/A",
        "exDate": "N/A",
        "fundManager": etf.get("manager", "N/A"),
        "changeStatus": status,
        "holdings": holdings_with_change,  # <--- 這裡放入計算好變化的持股
        "performanceData": chart_data,
        "foundedDate": profile["foundedDate"],
        "dividendFreq": profile["dividendFreq"],
        "custodianBank": profile["custodian"]
    }
    output_data.append(final_data)
    time.sleep(1.0)

# --- 數據清理工具 ---
def clean_data(data):
    if isinstance(data, list):
        return [clean_data(item) for item in data]
    elif isinstance(data, dict):
        return {k: clean_data(v) for k, v in data.items()}
    elif isinstance(data, float):
        if math.isnan(data) or math.isinf(data):
            return 0.0
        return data
    else:
        return data

cleaned_output = clean_data(output_data)

# --- 存檔 ---
if not os.path.exists('public'):
    os.makedirs('public')

file_path = 'public/etf_data.json'
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(cleaned_output, f, ensure_ascii=False, indent=2)

print(f"\n🎉 更新完成！持股變化已計算完畢。")