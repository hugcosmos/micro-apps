import ipaddress
import logging
import os
import re
import subprocess
import threading
import time
from urllib.parse import quote
try:
    from flask import Flask, render_template_string, Response, abort # type: ignore
except ModuleNotFoundError as exc:
    if exc.name != "flask":
        raise
    raise RuntimeError(
        "Flask is not installed. Install it with: python -m pip install Flask"
    ) from exc

# 书籍目录固定在脚本所在目录，避免从其他工作目录启动时扫描错位置
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BOOKS_FOLDER = os.path.join(SCRIPT_DIR, "KindleBooks")
ALLOWED_EXTENSIONS = {'mobi', 'epub', 'azw3', 'pdf', 'txt'}
HOST = '0.0.0.0'
PORT = 5000
CHUNK_SIZE = 1024 * 1024  # 1MB分块

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 200 * 1024 * 1024  # 200MB限制

# 当前扫描到的书籍列表
books_list = []
books_signature = None
books_lock = threading.Lock()

FAVICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="#27ae60"/>
<path d="M14 15h15c5 0 8 3 8 8v27c0-4-3-7-8-7H14z" fill="#fff"/>
<path d="M50 15H35c-5 0-8 3-8 8v27c0-4 3-7 8-7h15z" fill="#eaf7ef"/>
<path d="M32 22v29" fill="none" stroke="#1e8449" stroke-width="2"/>
<path d="M18 22h8M18 28h8M38 22h8M38 28h8" fill="none" stroke="#a9dfbf" stroke-linecap="round" stroke-width="2"/>
</svg>"""

class WerkzeugAddressFilter(logging.Filter):
    def filter(self, record):
        message = record.getMessage()
        if " * Running on " in message:
            record.msg = "\n".join(
                line for line in message.splitlines()
                if " * Running on " not in line
            )
            record.args = ()
        return True

# 获取局域网 IPv4 地址，优先使用 Mac 的 en* 物理网络接口，避免选择 VPN 接口
def get_local_ip():
    try:
        result = subprocess.run(
            ["ifconfig"], check=True, capture_output=True, text=True, timeout=3
        )
    except (OSError, subprocess.SubprocessError):
        return None

    private_networks = (
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
    )
    ignored_interfaces = (
        "lo", "utun", "awdl", "llw", "gif", "stf", "bridge", "ap",
        "vmnet", "vmenet", "anpi", "tun", "tap", "ppp",
    )
    candidates = []
    interface = None

    for line in result.stdout.splitlines():
        interface_match = re.match(r"^([^\s:]+): flags=", line)
        if interface_match:
            interface = interface_match.group(1)
            continue
        if not interface or interface.startswith(ignored_interfaces):
            continue

        address_match = re.match(r"^\s+inet (\d+(?:\.\d+){3})\b", line)
        if not address_match:
            continue
        address = ipaddress.ip_address(address_match.group(1))
        if any(address in network for network in private_networks):
            priority = 0 if interface.startswith("en") else 1
            candidates.append((priority, address))

    if not candidates:
        return None
    return str(min(candidates, key=lambda candidate: candidate[0])[1])

# 刷新书籍列表
def init_books_list():
    global books_list, books_signature
    with books_lock:
        if not os.path.exists(BOOKS_FOLDER):
            os.makedirs(BOOKS_FOLDER)

        # 严格排序，手动分配后台ID（0开始）
        file_list = sorted(os.listdir(BOOKS_FOLDER), key=lambda x: x.lower())
        updated_books = []
        updated_signature = []
        current_id = 0
        for file in file_list:
            if '.' in file and file.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS:
                file_path = os.path.join(BOOKS_FOLDER, file)
                if os.path.isfile(file_path):
                    file_stat = os.stat(file_path)
                    file_size = file_stat.st_size / (1024*1024)
                    updated_books.append({
                        'id': current_id,          # 后台固定ID（不显示）
                        'name': file,              # 仅显示文件名
                        'download_name': quote(file, safe=''),
                        'size': f"{file_size:.2f} MB",
                        'path': file_path,
                        'size_bytes': file_stat.st_size
                    })
                    updated_signature.append(
                        (file, file_stat.st_size, file_stat.st_mtime_ns)
                    )
                    current_id += 1

        updated_signature = tuple(updated_signature)
        if books_signature is not None and updated_signature != books_signature:
            previous_files = {
                name: (size, modified)
                for name, size, modified in books_signature
            }
            current_files = {
                name: (size, modified)
                for name, size, modified in updated_signature
            }
            added = sorted(current_files.keys() - previous_files.keys())
            removed = sorted(previous_files.keys() - current_files.keys())
            changed = sorted(
                name for name in previous_files.keys() & current_files.keys()
                if previous_files[name] != current_files[name]
            )

            print("\n📚 书籍目录已更新", flush=True)
            print(f"  目录：{BOOKS_FOLDER}", flush=True)
            print(f"  书籍总数：{len(updated_books)} 本", flush=True)
            if added:
                print(f"  新增：{'、'.join(added)}", flush=True)
            if removed:
                print(f"  移除：{'、'.join(removed)}", flush=True)
            if changed:
                print(f"  文件变化：{'、'.join(changed)}", flush=True)

        books_list = updated_books
        books_signature = updated_signature


def watch_books_folder():
    while True:
        time.sleep(2)
        init_books_list()

# 分块传输文件
def stream_file(file_path):
    try:
        with open(file_path, 'rb') as f:
            while True:
                chunk = f.read(CHUNK_SIZE)
                if not chunk:
                    break
                yield chunk
                time.sleep(0.001)
    except Exception as e:
        raise Exception(f"读取文件失败: {str(e)}")

# 美化后的HTML模板（无任何ID显示）
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="30">
    <title>Kindle 书籍库</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background-color: #f5f5f5; 
            padding: 20px; 
            color: #333;
        }
        .container { 
            max-width: 700px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #2c3e50; 
            margin-bottom: 25px; 
            text-align: center;
            font-size: 24px;
        }
        .header-info {
            text-align: center;
            margin-bottom: 30px;
            color: #666;
            font-size: 14px;
        }
        .book-card { 
            padding: 20px; 
            margin: 15px 0; 
            border: 1px solid #eee; 
            border-radius: 8px; 
            background: #fafafa;
        }
        .book-name { 
            font-size: 18px; 
            margin-bottom: 10px; 
            color: #2c3e50;
        }
        .book-size { 
            font-size: 14px; 
            color: #7f8c8d; 
            margin-bottom: 15px;
        }
        .download-btn { 
            display: inline-block;
            background: #27ae60; 
            color: white; 
            padding: 10px 25px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-size: 16px;
            transition: background 0.2s;
        }
        .download-btn:hover { 
            background: #219653; 
        }
        .no-books {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 16px;
        }
    </style>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
</head>
<body>
    <div class="container">
        <h1> Kindle 书籍库</h1>
        <div class="header-info">
            共 {{ total }} 本电子书 | 每 30 秒自动刷新 |
            <a href="/" style="color:#27ae60;">立即刷新</a>
        </div>
        
        {% if books %}
            {% for book in books %}
            <div class="book-card">
                <div class="book-name">{{ book.name }}</div>
                <div class="book-size">文件大小: {{ book.size }}</div>
                <a href="/download/{{ book.download_name }}" class="download-btn">下载到 Kindle</a>
            </div>
            {% endfor %}
        {% else %}
            <div class="no-books">暂无可用的电子书</div>
        {% endif %}
    </div>
</body>
</html>
"""

# 主页 - 每次访问时刷新书籍列表
@app.route('/favicon.svg')
@app.route('/favicon.ico')
def favicon():
    response = Response(FAVICON_SVG, mimetype='image/svg+xml')
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response


@app.route('/')
def index():
    init_books_list()
    total_books = len(books_list)
    local_ip = get_local_ip()
    response = app.make_response(render_template_string(
        HTML_TEMPLATE,
        books=books_list,
        total=total_books,
        local_ip=local_ip
    ))
    response.headers['Cache-Control'] = 'no-store'
    return response

# 下载路由 - 根据文件名匹配当前书单
@app.route('/download/<path:file_name>')
def download_file(file_name):
    try:
        init_books_list()
        
        # 校验当前书单
        if not books_list:
            abort(404, description="当前没有可下载的书籍")
        
        # 按文件名匹配，避免书单变化后旧链接指向其他书籍
        book = next((item for item in books_list if item['name'] == file_name), None)
        if book is None:
            abort(404, description="找不到这本书，书单可能已经更新")
        file_path = book['path']
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            abort(404, description=f"文件 {file_name} 已被移动或删除")
        
        # 分块传输响应
        extension = os.path.splitext(file_name)[1].lower()
        ascii_filename = f"book{extension}"
        headers = {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': f"attachment; filename=\"{ascii_filename}\"; filename*=UTF-8''{quote(file_name, safe='')}",
            'Content-Length': str(book['size_bytes']),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache'
        }
        
        return Response(stream_file(file_path), headers=headers)
    
    except Exception as e:
        if getattr(e, 'code', None) is not None:
            raise
        abort(500, description=f"下载失败：{str(e)}")

# 错误处理（简洁提示，不暴露ID）
@app.errorhandler(404)
def page_not_found(e):
    return """
    <div style="text-align:center; margin-top:50px; font-family:Arial;">
        <h1 style="color:#e74c3c;">下载失败</h1>
        <p style="color:#666; font-size:16px;">{}</p>
        <a href="/" style="margin-top:20px; display:inline-block; color:#27ae60; text-decoration:none;">返回书籍列表</a>
    </div>
    """.format(e.description), 404

@app.errorhandler(500)
def internal_server_error(e):
    return """
    <div style="text-align:center; margin-top:50px; font-family:Arial;">
        <h1 style="color:#e74c3c;">服务器错误</h1>
        <p style="color:#666; font-size:16px;">{}</p>
        <a href="/" style="margin-top:20px; display:inline-block; color:#27ae60; text-decoration:none;">返回书籍列表</a>
    </div>
    """.format(e.description), 500

if __name__ == '__main__':
    # 初始化后台固定ID列表
    init_books_list()
    
    # 控制台仍打印ID对照表（供你排查用，用户看不到）
    local_ip = get_local_ip()
    print("="*60)
    print("✅ Kindle书籍服务器（美化版）启动成功")
    if local_ip:
        print(f" 访问地址：http://{local_ip}:{PORT}")
    else:
        print(" 未检测到局域网 IPv4 地址，请检查网络连接及 ifconfig 输出")
    print(f" 书籍目录：{os.path.abspath(BOOKS_FOLDER)}")
    print(f" 书籍总数：{len(books_list)} 本")
    print("="*60)
    print(" 【后台ID对照表（仅开发者可见）】")
    for book in books_list:
        print(f"   ID{book['id']} → {book['name']} ({book['size']})")
    print("="*60)
    
    # 保留请求日志和开发服务器警告，但只打印上面筛选出的局域网访问地址
    logging.getLogger("werkzeug").addFilter(WerkzeugAddressFilter())
    threading.Thread(
        target=watch_books_folder,
        name="books-folder-watcher",
        daemon=True
    ).start()
    app.run(host=HOST, port=PORT, debug=False, threaded=True)
