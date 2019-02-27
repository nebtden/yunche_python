# 短信发送模块
import random
import requests
import json
import urllib
my_test  = 1

def send(moblie):
        config = {
            'api_send_url': 'http://smssh1.253.com/msg/send/json',
            'api_account': 'N9778747',
            'api_password': 'pZuq7xvtj'
        }
        headers = {
            'Content-Type': 'application/json; charset=utf-8'
        }
        code = random.randint(100000,999999)
        code = str(code)

        content = '【云车驾到】您的绑定验证码是：' + code + ',有效时间3分钟，请验证后立即删除，不要泄露。'

        postArr = {
            'account':config['api_account'],
            'password':config['api_password'],
            'msg': content,
            'phone':moblie,
            'report':True
        }
        postArr = json.dumps(postArr)

        resp = requests.post(config['api_send_url'], data=postArr, headers=headers)  # 发送请求
        return resp