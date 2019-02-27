from django.shortcuts import render
from django.http import HttpResponseRedirect,HttpResponse,request
from common  import mobile as m

# Create your views here.


# 用户主页
def index(request):
    return render(request, 'users/index.html', {
        'foo': 'bar',
    })


# 发送号码
def mobile_send(request):
    result = m.send('13365802535')
    return  HttpResponse(result)
    # return HttpResponse('users')


# 绑定号码
def mobile_bind(request):
    return HttpResponse('users')


# 绑定号码的主页
def mobile(request):
    return render(request, 'users/mobile.html', {
        'users': {
            'mobile':13365802535
        },
    })