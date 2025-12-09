
import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime

def get_baidu_hot_searches():
    """
    爬取百度 PC 端热搜榜单的关键词和热度指数。
    """
    # 百度热搜榜的 URL
    url = "https://top.baidu.com/board?platform=pc"
    
    # 模拟浏览器访问（非常重要，避免被百度拦截）
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    print(f"正在请求百度热搜榜 URL: {url}...")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status() # 检查请求是否成功

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 百度热搜榜的列表项通常在一个特定的 div/section 下
        # 这里的 class/tag 可能会随着百度网页的改动而变化
        # 我们寻找包含所有热搜条目的主要容器
        hot_list = soup.find_all('div', class_='content-wrapper_86o2n')
        
        if not hot_list:
            print("错误：未找到热搜列表容器。百度网页结构可能已更改。")
            return []

        search_results = []
        
        # 遍历所有热搜条目
        for item in hot_list:
            # 提取排名
            rank_tag = item.find('div', class_='index_1Ew56')
            rank = rank_tag.text if rank_tag else "N/A"
            
            # 提取关键词/标题
            title_tag = item.find('div', class_='c-single-text-ellipsis')
            title = title_tag.text.strip() if title_tag else "N/A"
            
            # 提取热度指数
            heat_tag = item.find('div', class_='hot-index_1Bl15')
            # 百度热度指数通常带有 '万' 字，需要清洗
            heat = heat_tag.text.replace('万', '0000').strip() if heat_tag else "N/A"

            search_results.append({
                "排名": rank,
                "热搜词": title,
                "热度指数": heat,
                "获取时间": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            })
            
        return search_results

    except requests.exceptions.RequestException as e:
        print(f"请求失败，请检查网络连接或 URL: {e}")
        return []


if __name__ == "__main__":
    hot_data = get_baidu_hot_searches()
    
    if hot_data:
        # 将结果转换为 DataFrame 并打印
        df = pd.DataFrame(hot_data)
        print("\n" + "="*40)
        print("百度热搜词榜单 (Top 10):")
        print("="*40)
        print(df.head(10).to_string(index=False))
        
        # 导出到 CSV
        filename = f"baidu_hot_searches_{datetime.now().strftime('%Y%m%d')}.csv"
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n数据已保存到 {filename}")

