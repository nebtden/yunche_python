import requests
import json
import time
from django.conf import settings

import logging
import urllib.parse



class Didi:
    def __init__(self):
        self.url = settings.DIDI['url']
        self.key = settings.DIDI['key']
        self.secret = settings.DIDI['secret']
        self.customerKey = settings.DIDI['customerKey']
        self.channel = settings.DIDI['channel']
        self.ttid = settings.DIDI['ttid']



    def test(self):
        logger = logging.getLogger('mytest')
        logger.setLevel(logging.DEBUG)
        logging.basicConfig(filename='logs.log',
                            format='%(asctime)s - %(pathname)s[line:%(lineno)d] - %(levelname)s: %(message)s',
                            level=logging.DEBUG)

        url = settings.DIDI['url'] # django api路径
        logger = logging.getLogger(__name__)
        logger.warning('Somthing goes wrong!')
        logger.warning(url)

        parms = {
            'name': '客户端',  # 发送给服务器的内容
        }

        headers = {  # 请求头 是浏览器正常的就行 就这里弄了一天 - -！
            'User-agent': 'none/ofyourbusiness',
            'Spam': 'Eggs'
        }

        resp = requests.get(url, data=parms, headers=headers)  # 发送请求
        resp.encoding = 'utf-8'
        # Decoded text returned by the request
        text = resp.text
        # print(text)
        return text

    # 生成系统参数,不需要登陆
    def  genPlatParams(self ,ttid, app_key, api, api_version, user_id, token):
        aPlatParams = {}
        aPlatParams['ttid'] = ttid
        aPlatParams['api'] = api
        aPlatParams['apiVersion'] = api_version
        aPlatParams['appKey'] = app_key
        aPlatParams['timestamp'] = (time.time() * 1000)
        aPlatParams['userRole'] = 1
        aPlatParams['appVersion'] = '1.0.0'
        aPlatParams['osType'] = 3
        aPlatParams['osVersion'] = 'ttid_server'
        aPlatParams['hwId'] = 'ttid_server'
        aPlatParams['mobileType'] = 'ttid_server'
        aPlatParams['token'] = token
        aPlatParams['userId'] = user_id
        aPlatParams['userRole'] = 1
        return aPlatParams


    def login(self,params):
        params['customerKey'] = self.customerKey
        params['privilegeId'] = 3236
        aPlatParams = self.genPlatParams(self.ttid, self.key, 'lj.nbs.u.loginbyTp', '1.0.0',1,'')
        result = self.request(aPlatParams, params, self.secret)
        return result
        
    
    def request(self,aPlatParams,params,secret):
        aPlatParams['sign'] = 'aaaa';

        url = self.url
        url += '?'+urllib.parse.urlencode(aPlatParams)
 
        headers = {  # 请求头 是浏览器正常的就行 就这里弄了一天 - -！
            'User-agent': 'none/ofyourbusiness',
            'Spam': 'Eggs'
        }
        postData = json.dumps(aPlatParams)
        resp = requests.get(url, data=postData, headers=headers)  # 发送请求
        text = resp.text
        return text
