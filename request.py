import requests
import json
import logging
logger = logging.getLogger('mytest')
logger.setLevel(logging.DEBUG)
logging.basicConfig(filename='log.log',format='%(asctime)s - %(pathname)s[line:%(lineno)d] - %(levelname)s: %(message)s',
                    level=logging.DEBUG)

url = 'http://www.baidu.com'  # django api路径

parms = {
    'name': '客户端',  # 发送给服务器的内容
}

headers = {  # 请求头 是浏览器正常的就行 就这里弄了一天 - -！
    'User-agent': 'none/ofyourbusiness',
    'Spam': 'Eggs'
}

resp = requests.get(url, data=parms, headers=headers)  # 发送请求

# Decoded text returned by the request
text = resp.text
print(text)
# print(json.loads(text))
